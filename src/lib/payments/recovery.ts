import "server-only";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { createDefaultRegistry } from "@/lib/providers";
import type { RideSearchParams } from "@/lib/providers";
import { RideAgent, MockEconomicActions, prefsFromRow } from "@/lib/agent";
import { OnchainEconomicActions } from "@/lib/agent/onchain-economic-actions";
import {
  isEscrowConfigured,
  getOperatorAddress,
} from "@/lib/contracts/escrow-client";
import { notify, NOTIFY } from "@/lib/notifications/notify";
import { checkRateLimit, LIMITS } from "@/lib/security/rate-limit";

export interface RecoveryResult {
  recovered: boolean;
  refunded: boolean;
  newBookingId?: string;
  provider?: string;
  reasoning: string;
  onchain: boolean;
}

type Supa = Awaited<ReturnType<typeof createClient>>;

async function addEvent(supabase: Supa, bookingId: string, status: string, detail: string) {
  await supabase.from("ride_lifecycle_events").insert({
    ride_booking_id: bookingId,
    status,
    detail,
  });
}

/**
 * Driver Cancels -> Detect -> Preserve Escrow -> Find Alternative -> Transfer
 * Escrow (reassign in place) -> Continue Ride; or refund the rider if nothing
 * fits. The money movements are REAL on-chain and required: the alternative is
 * found first (read-only), then the on-chain refund/reassign runs and must
 * succeed BEFORE any DB state changes, so a failed chain call leaves the ride
 * intact and retryable instead of recording a fake outcome.
 */
export async function recoverRide(
  originalBookingId: string,
  recoveryAction?: "rebook" | "refund",
): Promise<{ error: string } | { result: RecoveryResult }> {
  const supabase = createClient(await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in." };

  const rl = checkRateLimit(user.id, "booking", LIMITS.booking);
  if (!rl.ok) return { error: rl.error };

  const { data: original } = await supabase
    .from("ride_bookings")
    .select("id, user_id, ride_request_id, provider, fare_cents, status")
    .eq("id", originalBookingId)
    .single();
  if (!original || original.user_id !== user.id) return { error: "Ride not found." };
  if (["SETTLED", "CANCELLED"].includes(original.status)) {
    return { error: "This ride can no longer be changed." };
  }

  const { data: escrow } = await supabase
    .from("escrows")
    .select("id, onchain_escrow_id, status, amount_cents")
    .eq("ride_booking_id", originalBookingId)
    .maybeSingle();

  if (!escrow?.onchain_escrow_id || !isEscrowConfigured()) {
    return { error: "This ride has no Protected Payment to recover." };
  }
  const onchainKey = escrow.onchain_escrow_id;

  // FIND ALTERNATIVE via the agent (read-only; cancelled provider excluded).
  const { data: req } = await supabase
    .from("ride_requests")
    .select("id, agent_id, origin_address, destination_address")
    .eq("id", original.ride_request_id)
    .single();

  const { data: agentRow } = req?.agent_id
    ? await supabase.from("agents").select("id").eq("id", req.agent_id).single()
    : { data: null };
  const { data: prefRow } = agentRow
    ? await supabase
        .from("agent_preferences")
        .select(
          "optimization_goal, daily_budget_cents, max_ride_cents, ev_preferred, premium_preferred, shared_ride_allowed",
        )
        .eq("agent_id", agentRow.id)
        .single()
    : { data: null };

  const prefs = prefRow
    ? prefsFromRow(prefRow)
    : {
        optimizationGoal: "balanced" as const,
        dailyBudgetCents: 5000,
        maxRideCents: 2000,
        evPreferred: false,
        premiumPreferred: false,
        sharedRideAllowed: true,
      };

  const params: RideSearchParams = {
    origin: { address: req?.origin_address ?? "Current location" },
    destination: { address: req?.destination_address ?? "Destination" },
    sharedAllowed: prefs.sharedRideAllowed,
  };

  // Mock economics here so the agent's internal reassign is a no-op; the real
  // on-chain move is done explicitly below against the original escrow key.
  const agent = new RideAgent(createDefaultRegistry(), new MockEconomicActions());
  const plan = await agent.recoverFromCancellation(
    params,
    original.provider,
    original.fare_cents,
    prefs,
  );

  const shouldRebook = recoveryAction !== "refund" && !!plan.selected;

  // ---- No affordable alternative or user requested refund -> REFUND the rider on-chain, then DB. ----
  if (!shouldRebook || !plan.selected) {
    try {
      await new OnchainEconomicActions().issueRefund(onchainKey);
    } catch (err) {
      console.error("[recoverRide] on-chain refund failed:", err);
      return {
        error:
          "We couldn’t refund your Protected Payment automatically. Please try again shortly.",
      };
    }

    await supabase
      .from("ride_bookings")
      .update({ status: "CANCELLED" })
      .eq("id", originalBookingId);
    await addEvent(supabase, originalBookingId, "CANCELLED", "Driver cancelled");
    await supabase.from("escrows").update({ status: "refunded" }).eq("id", escrow.id);
    await supabase
      .from("transactions")
      .update({ status: "completed", type: "refund" })
      .eq("ride_booking_id", originalBookingId)
      .eq("type", "ride_payment");

    await notify(supabase, user.id, NOTIFY.driverCancelled(original.provider, originalBookingId));
    await notify(supabase, user.id, NOTIFY.refundIssued(originalBookingId));

    return {
      result: {
        recovered: false,
        refunded: true,
        onchain: true,
        reasoning:
          "Your driver cancelled and no alternative fit your budget right now. Your Protected Payment has been refunded.",
      },
    };
  }

  // ---- Alternative found -> REASSIGN escrow on-chain, then DB. ----
  try {
    const driver = await getOperatorAddress(); // driver/payee stays the operator
    await new OnchainEconomicActions().reassignEscrow(onchainKey, driver);
  } catch (err) {
    console.error("[recoverRide] on-chain reassign failed:", err);
    return {
      error: "We couldn’t move your Protected Payment to a new ride. Please try again shortly.",
    };
  }

  // DETECT + mark the original cancelled (escrow preserved, now reassigned).
  await supabase
    .from("ride_bookings")
    .update({ status: "CANCELLED" })
    .eq("id", originalBookingId);
  await addEvent(supabase, originalBookingId, "CANCELLED", "Driver cancelled");

  // CONTINUE: create the replacement booking.
  const { data: newBooking, error: nbErr } = await supabase
    .from("ride_bookings")
    .insert({
      ride_request_id: original.ride_request_id,
      user_id: user.id,
      provider: plan.selected.provider,
      fare_cents: plan.selected.fareCents,
      eta_minutes: plan.selected.etaMinutes,
      status: "ESCROW_FUNDED",
      is_reassignment: true,
      previous_booking_id: originalBookingId,
      booked_at: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (nbErr || !newBooking) return { error: "Couldn't rebook your ride." };

  await addEvent(
    supabase,
    newBooking.id,
    "PROVIDER_SELECTED",
    `Rebooked with ${plan.selected.provider}`,
  );

  // Repoint the existing escrow to the new booking; keep the on-chain key.
  await supabase
    .from("escrows")
    .update({ status: "reassigned", ride_booking_id: newBooking.id })
    .eq("id", escrow.id);
  await supabase
    .from("transactions")
    .update({ ride_booking_id: newBooking.id })
    .eq("ride_booking_id", originalBookingId)
    .eq("type", "ride_payment");

  await addEvent(
    supabase,
    newBooking.id,
    "ESCROW_FUNDED",
    "Payment transferred — still protected",
  );

  // Record the agent's recovery decision.
  await supabase.from("agent_decisions").insert({
    agent_id: req?.agent_id ?? null,
    ride_request_id: original.ride_request_id,
    decision_type: "cancellation_recovered",
    reasoning: plan.reasoning,
    structured: {
      cancelledProvider: original.provider,
      newProvider: plan.selected.provider,
      previousBookingId: originalBookingId,
      newBookingId: newBooking.id,
    },
  });

  await notify(supabase, user.id, NOTIFY.driverCancelled(original.provider, originalBookingId));
  await notify(
    supabase,
    user.id,
    NOTIFY.alternativeFound(plan.selected.provider, newBooking.id),
  );

  return {
    result: {
      recovered: true,
      refunded: false,
      onchain: true,
      newBookingId: newBooking.id,
      provider: plan.selected.provider,
      reasoning: plan.reasoning,
    },
  };
}
