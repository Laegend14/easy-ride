import "server-only";
import type { NotificationType } from "@/types/database";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { getUserProfile } from "@/lib/firebase/db";

export interface NotifyInput {
  type: NotificationType;
  title: string;
  body?: string;
  rideBookingId?: string | null;
}

/**
 * Best-effort notification insert. Runs under the user's session and
 * never throws — a notification failure must not break a payment/ride flow.
 */
export async function notify(
  _supabaseOrStub: any,
  userId: string,
  input: NotifyInput,
): Promise<void> {
  try {
    // Respect the user's ride-update preference (savings_report is gated elsewhere).
    if (input.type !== "savings_report") {
      const prof = await getUserProfile(userId);
      if (prof && prof.notifyRideUpdates === false) return;
    }

    const db = getAdminFirestore();
    if (db) {
      await db.collection("notifications").add({
        userId,
        type: input.type,
        title: input.title,
        body: input.body ?? null,
        rideBookingId: input.rideBookingId ?? null,
        isRead: false,
        createdAt: new Date().toISOString(),
      });
    }
  } catch (err) {
    console.warn("[notify] failed to write notification:", err);
  }
}

/** Consistent, Web2-first builders for the spec's notification events. */
export const NOTIFY = {
  rideBooked: (provider: string, bookingId: string): NotifyInput => ({
    type: "ride_booked",
    title: "Ride booked",
    body: `Your ride with ${provider} is confirmed.`,
    rideBookingId: bookingId,
  }),
  driverAssigned: (provider: string, bookingId: string): NotifyInput => ({
    type: "driver_assigned",
    title: "Driver assigned",
    body: `Your ${provider} driver is on the way.`,
    rideBookingId: bookingId,
  }),
  driverCancelled: (provider: string, bookingId: string): NotifyInput => ({
    type: "driver_cancelled",
    title: "Driver cancelled",
    body: `${provider} cancelled — your payment stayed protected.`,
    rideBookingId: bookingId,
  }),
  alternativeFound: (provider: string, bookingId: string): NotifyInput => ({
    type: "alternative_found",
    title: "Alternative found",
    body: `Your agent rebooked you with ${provider}.`,
    rideBookingId: bookingId,
  }),
  settlementComplete: (provider: string, bookingId: string): NotifyInput => ({
    type: "settlement_complete",
    title: "Settlement complete",
    body: `Your protected payment was released to ${provider}.`,
    rideBookingId: bookingId,
  }),
  refundIssued: (bookingId: string): NotifyInput => ({
    type: "refund_issued",
    title: "Refund issued",
    body: "Your protected payment was refunded in full.",
    rideBookingId: bookingId,
  }),
};
