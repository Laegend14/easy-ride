import "server-only";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";

export interface AnalyticsSummary {
  savingsCents: number;
  timeSavedMinutes: number;
  successRate: number; // 0..100
  optimizationScore: number; // 0..100
  totalRides: number;
  completedRides: number;
  cancelledRides: number;
  reassignedRides: number;
}

const COMPLETED = ["COMPLETED", "SETTLED"];

/**
 * Computes the user's impact metrics live from ride data. Read-only, deterministic.
 * - Savings: Σ(priciest affordable quote − fare booked) over completed rides.
 * - Time saved: Σ(slowest ETA quoted − ETA booked), positive deltas, completed rides.
 * - Success rate: completed ÷ finished rides (reassigned = success; refunded = not).
 * - Optimization score: avg percentile of the booked option vs all quotes (cheaper
 *   AND faster ⇒ higher), 0..100.
 */
export async function getAnalytics(): Promise<AnalyticsSummary> {
  const supabase = createClient(await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return empty();

  const { data: bookings } = await supabase
    .from("ride_bookings")
    .select("ride_request_id, fare_cents, eta_minutes, status, is_reassignment")
    .eq("user_id", user.id);
  if (!bookings || bookings.length === 0) return empty();

  const requestIds = [...new Set(bookings.map((b) => b.ride_request_id).filter(Boolean))];
  const { data: quotes } = await supabase
    .from("ride_quotes")
    .select("ride_request_id, fare_cents, eta_minutes")
    .in("ride_request_id", requestIds.length ? requestIds : ["00000000-0000-0000-0000-000000000000"]);

  // Group quotes by request.
  const byRequest = new Map<string, { fare: number; eta: number }[]>();
  for (const q of quotes ?? []) {
    const arr = byRequest.get(q.ride_request_id) ?? [];
    arr.push({ fare: q.fare_cents, eta: q.eta_minutes });
    byRequest.set(q.ride_request_id, arr);
  }

  let savingsCents = 0;
  let timeSavedMinutes = 0;
  const scores: number[] = [];
  let completedRides = 0;
  let cancelledRides = 0;
  let reassignedRides = 0;

  for (const b of bookings) {
    if (b.is_reassignment) reassignedRides += 1;
    const isCompleted = COMPLETED.includes(b.status);
    if (b.status === "CANCELLED") cancelledRides += 1;
    if (!isCompleted) continue;
    completedRides += 1;

    const qs = b.ride_request_id ? byRequest.get(b.ride_request_id) : undefined;
    if (!qs || qs.length === 0) continue;

    const maxFare = Math.max(...qs.map((q) => q.fare));
    const maxEta = Math.max(...qs.map((q) => q.eta));
    if (maxFare > b.fare_cents) savingsCents += maxFare - b.fare_cents;
    if (maxEta > b.eta_minutes) timeSavedMinutes += maxEta - b.eta_minutes;

    // Optimization percentile: fraction of quotes the booked option beats or ties
    // on a combined (cheaper + faster) basis.
    const n = qs.length;
    let beaten = 0;
    for (const q of qs) {
      const cheaperOrEq = b.fare_cents <= q.fare;
      const fasterOrEq = b.eta_minutes <= q.eta;
      if (cheaperOrEq && fasterOrEq) beaten += 1;
      else if (cheaperOrEq || fasterOrEq) beaten += 0.5;
    }
    scores.push(n > 0 ? (beaten / n) * 100 : 0);
  }

  // Finished rides = completed + cancelled-not-reassigned (a recovered ride counts
  // as the successful replacement, not a failure).
  const failedRides = bookings.filter(
    (b) => b.status === "CANCELLED" && !bookingWasReplaced(b, bookings),
  ).length;
  const finished = completedRides + failedRides;
  const successRate = finished > 0 ? Math.round((completedRides / finished) * 100) : 100;
  const optimizationScore =
    scores.length > 0
      ? Math.round(scores.reduce((a, c) => a + c, 0) / scores.length)
      : 0;

  return {
    savingsCents,
    timeSavedMinutes,
    successRate,
    optimizationScore,
    totalRides: bookings.length,
    completedRides,
    cancelledRides,
    reassignedRides,
  };
}

/** A cancelled booking that has a reassignment successor isn't a real failure. */
function bookingWasReplaced(
  booking: { ride_request_id: string | null },
  all: { ride_request_id: string | null; is_reassignment: boolean }[],
): boolean {
  return all.some(
    (b) => b.is_reassignment && b.ride_request_id === booking.ride_request_id,
  );
}

function empty(): AnalyticsSummary {
  return {
    savingsCents: 0,
    timeSavedMinutes: 0,
    successRate: 0,
    optimizationScore: 0,
    totalRides: 0,
    completedRides: 0,
    cancelledRides: 0,
    reassignedRides: 0,
  };
}
