import "server-only";
import type { createClient } from "@/utils/supabase/server";
import type { NotificationType } from "@/types/database";

type Supa = Awaited<ReturnType<typeof createClient>>;

export interface NotifyInput {
  type: NotificationType;
  title: string;
  body?: string;
  rideBookingId?: string | null;
}

/**
 * Best-effort notification insert. Runs under the user's session (owner RLS) and
 * never throws — a notification failure must not break a payment/ride flow.
 */
export async function notify(
  supabase: Supa,
  userId: string,
  input: NotifyInput,
): Promise<void> {
  try {
    // Respect the user's ride-update preference (savings_report is gated elsewhere).
    if (input.type !== "savings_report") {
      const { data: prof } = await supabase
        .from("profiles")
        .select("notify_ride_updates")
        .eq("id", userId)
        .single();
      if (prof && prof.notify_ride_updates === false) return;
    }

    await supabase.from("notifications").insert({
      user_id: userId,
      type: input.type,
      title: input.title,
      body: input.body ?? null,
      ride_booking_id: input.rideBookingId ?? null,
    });
  } catch (err) {
    console.error("[notify] failed:", err);
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
