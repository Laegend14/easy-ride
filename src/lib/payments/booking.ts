import "server-only";
import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { OnchainEconomicActions } from "@/lib/agent/onchain-economic-actions";
import { isEscrowConfigured } from "@/lib/contracts/escrow-client";
import { fundEscrowFromUser } from "@/lib/payments/escrow-funding";
import { getOnchainBalance } from "@/lib/circle/balance";
import { notify, NOTIFY } from "@/lib/notifications/notify";
import { checkRateLimit, LIMITS } from "@/lib/security/rate-limit";

/** Headroom (USDC) kept aside for gas on top of the fare during preflight. */
const GAS_HEADROOM_USDC = 0.1;

export interface BookingSummary {
  bookingId: string;
  provider: string;
  fareCents: number;
  status: string;
  escrowFunded: boolean;
  onchain: boolean;
}

export interface SettlementSummary {
  bookingId: string;
  status: string;
  settled: boolean;
  onchain: boolean;
}

type Supa = Awaited<ReturnType<typeof createClient>>;

async function addEvent(
  supabase: Supa,
  bookingId: string,
  status: string,
  detail: string,
) {
  await supabase.from("ride_lifecycle_events").insert({
    ride_booking_id: bookingId,
    status,
    detail,
  });
}

/**
 * Provider Selected -> Escrow Created -> Rider Funds Escrow.
 *
 * The payment is REAL and rider-funded: the operator opens the escrow on-chain
 * (rider = the user's wallet, driver = operator), then the user's own Easy Ride
 * Balance debits the fare into the escrow contract via Circle. Both on-chain
 * steps must succeed; on any failure we hard-fail and persist nothing (no charge,
 * no fake booking). The booking id is pre-generated so it can key the on-chain
 * escrow before any DB row exists.
 */
export async function bookSelectedRide(rideRequestId: string): Promise<
  { error: string } | { summary: BookingSummary }
> {
  const supabase = createClient(await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in." };

  const rl = checkRateLimit(user.id, "booking", LIMITS.booking);
  if (!rl.ok) return { error: rl.error };

  // Load request (owner) + selected quote.
  const { data: req } = await supabase
    .from("ride_requests")
    .select("id, user_id")
    .eq("id", rideRequestId)
    .single();
  if (!req || req.user_id !== user.id) return { error: "Ride not found." };

  const { data: quote } = await supabase
    .from("ride_quotes")
    .select("id, provider, product_name, fare_cents, eta_minutes")
    .eq("ride_request_id", rideRequestId)
    .eq("is_selected", true)
    .single();
  if (!quote) return { error: "No selected ride to book." };

  // Prevent double-booking the same request.
  const { data: existing } = await supabase
    .from("ride_bookings")
    .select("id")
    .eq("ride_request_id", rideRequestId)
    .maybeSingle();
  if (existing) return { error: "This ride is already booked." };

  // Real payments are required — never fall back to a DB-only "secured" state.
  if (!isEscrowConfigured()) {
    return { error: "Payments are temporarily unavailable. Please try again shortly." };
  }

  // The rider/payer is the user's own wallet (their Easy Ride Balance).
  const { data: wallet } = await supabase
    .from("wallets")
    .select("circle_wallet_id, address, status")
    .eq("user_id", user.id)
    .single();
  if (!wallet?.circle_wallet_id || !wallet.address || wallet.status !== "active") {
    return { error: "Your Easy Ride Balance isn’t ready yet. Please try again shortly." };
  }

  // Preflight: the user must hold the fare plus a little gas headroom.
  const balance = await getOnchainBalance();
  const fareUsdc = quote.fare_cents / 100;
  if (!balance || balance.usdc < fareUsdc + GAS_HEADROOM_USDC) {
    return {
      error:
        "You don’t have enough in your Easy Ride Balance for this ride. Add funds and try again.",
    };
  }

  // Escrow key = pre-generated booking id, so the on-chain escrow is opened and
  // funded BEFORE any DB row exists. If either step fails we persist nothing.
  const bookingId = randomUUID();
  const economics = new OnchainEconomicActions();
  let txCreate: string;
  let txFund: string;
  try {
    txCreate = (await economics.createEscrow(bookingId, quote.fare_cents, wallet.address)).txHash;
    txFund = (
      await fundEscrowFromUser({
        walletId: wallet.circle_wallet_id,
        rideId: bookingId,
        amountCents: quote.fare_cents,
      })
    ).txHash;
  } catch (err) {
    console.error("[bookSelectedRide] on-chain escrow failed:", err);
    return {
      error:
        "We couldn’t secure your Protected Payment. Your balance was not charged — please try again.",
    };
  }

  // On-chain escrow is funded with the user's money. Persist the booking.
  const { data: booking, error: bErr } = await supabase
    .from("ride_bookings")
    .insert({
      id: bookingId,
      ride_request_id: rideRequestId,
      user_id: user.id,
      selected_quote_id: quote.id,
      provider: quote.provider,
      fare_cents: quote.fare_cents,
      eta_minutes: quote.eta_minutes,
      status: "ESCROW_FUNDED",
      booked_at: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (bErr || !booking) {
    console.error("[bookSelectedRide] booking persist failed after funding:", bErr);
    return {
      error:
        "Your Protected Payment was secured but we couldn’t finish booking. Please contact support.",
    };
  }

  await addEvent(supabase, bookingId, "PROVIDER_SELECTED", `Selected ${quote.provider}`);
  await addEvent(supabase, bookingId, "ACCEPTED", "Booking confirmed");

  const { data: escrow } = await supabase
    .from("escrows")
    .insert({
      user_id: user.id,
      ride_booking_id: bookingId,
      amount_cents: quote.fare_cents,
      status: "funded",
      onchain_escrow_id: bookingId,
      tx_hash_create: txCreate,
      tx_hash_fund: txFund,
    })
    .select("id")
    .single();

  await addEvent(supabase, bookingId, "ESCROW_FUNDED", "Protected Payment secured");

  await supabase.from("transactions").insert({
    user_id: user.id,
    ride_booking_id: bookingId,
    escrow_id: escrow?.id ?? null,
    type: "ride_payment",
    status: "pending",
    amount_cents: quote.fare_cents,
    description: `Protected payment for ${quote.provider}`,
    tx_hash: txFund,
  });

  await notify(supabase, user.id, NOTIFY.rideBooked(quote.provider, bookingId));
  await notify(supabase, user.id, NOTIFY.driverAssigned(quote.provider, bookingId));

  return {
    summary: {
      bookingId,
      provider: quote.provider,
      fareCents: quote.fare_cents,
      status: "ESCROW_FUNDED",
      escrowFunded: true,
      onchain: true,
    },
  };
}

/**
 * Ride Completes -> Settlement. Releases the rider's protected payment to the
 * driver (operator) on-chain. The release is required: if it fails we revert the
 * booking so it can be retried, and never mark the ride settled without it.
 */
export async function settleRide(bookingId: string): Promise<
  { error: string } | { summary: SettlementSummary }
> {
  const supabase = createClient(await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in." };

  const rl = checkRateLimit(user.id, "booking", LIMITS.booking);
  if (!rl.ok) return { error: rl.error };

  const { data: booking } = await supabase
    .from("ride_bookings")
    .select("id, user_id, status, provider")
    .eq("id", bookingId)
    .single();
  if (!booking || booking.user_id !== user.id) return { error: "Booking not found." };
  if (booking.status === "SETTLED") return { error: "This ride is already settled." };

  const { data: escrow } = await supabase
    .from("escrows")
    .select("id, onchain_escrow_id")
    .eq("ride_booking_id", bookingId)
    .maybeSingle();

  if (!escrow?.onchain_escrow_id || !isEscrowConfigured()) {
    return { error: "This ride has no Protected Payment to settle." };
  }
  const onchainKey = escrow.onchain_escrow_id;

  // In progress -> completed
  await supabase.from("ride_bookings").update({ status: "IN_PROGRESS" }).eq("id", bookingId);
  await addEvent(supabase, bookingId, "IN_PROGRESS", "Ride in progress");

  let txSettle: string;
  try {
    const economics = new OnchainEconomicActions();
    // Mark complete (best-effort lifecycle marker); release works from Funded or
    // Completed, so a skipped/duplicate complete never blocks settlement.
    try {
      await economics.completeRide(onchainKey);
    } catch (e) {
      console.warn("[settleRide] completeRide skipped:", e);
    }
    txSettle = (await economics.releasePayment(onchainKey)).txHash;
  } catch (err) {
    console.error("[settleRide] release failed:", err);
    await supabase.from("ride_bookings").update({ status: "ESCROW_FUNDED" }).eq("id", bookingId);
    return { error: "We couldn’t release your payment just yet. Please try again." };
  }

  await supabase
    .from("escrows")
    .update({ status: "released", tx_hash_settle: txSettle })
    .eq("id", escrow.id);
  await supabase
    .from("transactions")
    .update({ status: "completed", type: "settlement", tx_hash: txSettle })
    .eq("ride_booking_id", bookingId)
    .eq("type", "ride_payment");

  await addEvent(supabase, bookingId, "COMPLETED", "You’ve arrived");
  await supabase
    .from("ride_bookings")
    .update({ status: "SETTLED", completed_at: new Date().toISOString() })
    .eq("id", bookingId);
  await addEvent(supabase, bookingId, "SETTLED", "Payment settled");

  await notify(supabase, user.id, NOTIFY.settlementComplete(booking.provider, bookingId));

  return { summary: { bookingId, status: "SETTLED", settled: true, onchain: true } };
}
