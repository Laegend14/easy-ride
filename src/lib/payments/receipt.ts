import "server-only";
import { getCurrentFirebaseUser } from "@/lib/firebase/session";
import { getRideBooking, getRideRequest } from "@/lib/firebase/db";
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
  const fbUser = await getCurrentFirebaseUser();
  if (!fbUser) return null;

  const booking = await getRideBooking(bookingId);
  if (!booking || booking.userId !== fbUser.uid) return null;

  const req = booking.rideRequestId ? await getRideRequest(booking.rideRequestId) : null;

  // Determine receipt type.
  let receiptType: ReceiptType = "ride";
  if (booking.status === "REFUNDED") {
    receiptType = "refund";
  } else if (booking.status === "SETTLED" || booking.status === "COMPLETED") {
    receiptType = "settlement";
  }

  const fare = booking.fareCents;
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
  const addRecord = (label: string, hash: string | null | undefined) => {
    if (hash) paymentRecords.push({ label, shortId: shortHash(hash), url: arcTxUrl(hash) });
  };
  addRecord("Protected Payment opened", booking.txHashCreate);
  addRecord("Funds secured from your balance", booking.txHashFund);
  if (receiptType === "refund") {
    addRecord("Refunded to your balance", booking.txHashSettle);
  } else {
    addRecord("Released to provider", booking.txHashSettle);
  }

  return {
    receiptNo: receiptNumber(booking.id),
    receiptType,
    issuedAt: booking.completedAt ?? booking.bookedAt ?? booking.createdAt,
    provider: booking.provider,
    status: booking.status as RideStatus,
    originAddress: req?.originAddress ?? null,
    destinationAddress: req?.destinationAddress ?? null,
    fareCents: fare,
    lineItems,
    totalCents,
    totalLabel,
    paymentMethod: "Easy Ride Balance · Protected Payment",
    paymentRecords,
  };
}
