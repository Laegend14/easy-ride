import "server-only";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import type { RideStatus } from "@/types/database";
import { arcTxUrl, shortHash } from "@/lib/contracts/explorer";

export type ReceiptType = "ride" | "settlement" | "refund";

export interface ReceiptLineItem {
  label: string;
  amountCents: number;
  /** Negative-style item (refund back to rider). */
  credit?: boolean;
}

/** A verifiable payment record with a link to the public explorer. */
export interface PaymentRecord {
  label: string;
  shortId: string;
  url: string;
}

export interface RideReceipt {
  receiptNo: string;
  receiptType: ReceiptType;
  issuedAt: string;
  provider: string;
  status: RideStatus;
  originAddress: string | null;
  destinationAddress: string | null;
  fareCents: number;
  lineItems: ReceiptLineItem[];
  totalCents: number;
  totalLabel: string;
  paymentMethod: string;
  /** Verifiable on-chain payment records (empty if this ride wasn't on-chain). */
  paymentRecords: PaymentRecord[];
}

function receiptNumber(bookingId: string): string {
  return "ER-" + bookingId.replace(/-/g, "").slice(0, 8).toUpperCase();
}

/** Owner-checked receipt for a ride. Every ride resolves to a receipt. */
export async function getRideReceipt(bookingId: string): Promise<RideReceipt | null> {
  const supabase = createClient(await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: booking } = await supabase
    .from("ride_bookings")
    .select(
      "id, user_id, ride_request_id, provider, fare_cents, status, booked_at, completed_at, created_at",
    )
    .eq("id", bookingId)
    .single();
  if (!booking || booking.user_id !== user.id) return null;

  const { data: req } = booking.ride_request_id
    ? await supabase
        .from("ride_requests")
        .select("origin_address, destination_address")
        .eq("id", booking.ride_request_id)
        .single()
    : { data: null };

  const { data: escrow } = await supabase
    .from("escrows")
    .select("status, tx_hash_create, tx_hash_fund, tx_hash_settle")
    .eq("ride_booking_id", bookingId)
    .maybeSingle();

  const { data: txns } = await supabase
    .from("transactions")
    .select("type, status, amount_cents")
    .eq("ride_booking_id", bookingId);

  const hasType = (t: string) => (txns ?? []).some((x) => x.type === t);

  // Determine receipt type.
  let receiptType: ReceiptType = "ride";
  if (escrow?.status === "refunded" || hasType("refund")) {
    receiptType = "refund";
  } else if (booking.status === "SETTLED" || hasType("settlement")) {
    receiptType = "settlement";
  }

  const fare = booking.fare_cents;
  const lineItems: ReceiptLineItem[] = [
    { label: "Ride fare", amountCents: fare },
    { label: "Protected Payment hold", amountCents: fare },
  ];
  let totalCents = fare;
  let totalLabel = "Amount protected";

  if (receiptType === "settlement") {
    lineItems.push({ label: "Settlement to provider", amountCents: fare });
    totalLabel = "Total paid";
  } else if (receiptType === "refund") {
    lineItems.push({ label: "Refund to your balance", amountCents: fare, credit: true });
    totalCents = 0;
    totalLabel = "Net charged";
  }

  // Verifiable payment records — each links to the public explorer. Ordered as
  // the money moved: opened → secured (rider funded) → released/refunded.
  const paymentRecords: PaymentRecord[] = [];
  const addRecord = (label: string, hash: string | null) => {
    if (hash) paymentRecords.push({ label, shortId: shortHash(hash), url: arcTxUrl(hash) });
  };
  addRecord("Protected Payment opened", escrow?.tx_hash_create ?? null);
  addRecord("Funds secured from your balance", escrow?.tx_hash_fund ?? null);
  if (receiptType === "refund") {
    addRecord("Refunded to your balance", escrow?.tx_hash_settle ?? null);
  } else {
    addRecord("Released to provider", escrow?.tx_hash_settle ?? null);
  }

  return {
    receiptNo: receiptNumber(booking.id),
    receiptType,
    issuedAt: booking.completed_at ?? booking.booked_at ?? booking.created_at,
    provider: booking.provider,
    status: booking.status,
    originAddress: req?.origin_address ?? null,
    destinationAddress: req?.destination_address ?? null,
    fareCents: fare,
    lineItems,
    totalCents,
    totalLabel,
    paymentMethod: "Easy Ride Balance · Protected Payment",
    paymentRecords,
  };
}
