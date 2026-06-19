import "server-only";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";

export interface SavingsSummary {
  savingsCents: number;
  ridesOptimized: number;
}

/**
 * Savings the AI delivered: per completed ride, the gap between the priciest
 * option the agent saw and the fare it actually booked. Read-only.
 */
export async function getSavings(): Promise<SavingsSummary> {
  const supabase = createClient(await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { savingsCents: 0, ridesOptimized: 0 };

  // Completed/settled bookings with their request id + booked fare.
  const { data: bookings } = await supabase
    .from("ride_bookings")
    .select("ride_request_id, fare_cents, status")
    .eq("user_id", user.id)
    .in("status", ["COMPLETED", "SETTLED"]);

  if (!bookings || bookings.length === 0) {
    return { savingsCents: 0, ridesOptimized: 0 };
  }

  const requestIds = [...new Set(bookings.map((b) => b.ride_request_id).filter(Boolean))];
  const { data: quotes } = await supabase
    .from("ride_quotes")
    .select("ride_request_id, fare_cents")
    .in("ride_request_id", requestIds);

  // Max fare seen per request.
  const maxByRequest = new Map<string, number>();
  for (const q of quotes ?? []) {
    const cur = maxByRequest.get(q.ride_request_id) ?? 0;
    if (q.fare_cents > cur) maxByRequest.set(q.ride_request_id, q.fare_cents);
  }

  let savingsCents = 0;
  let ridesOptimized = 0;
  for (const b of bookings) {
    const max = b.ride_request_id ? maxByRequest.get(b.ride_request_id) : undefined;
    if (max && max > b.fare_cents) {
      savingsCents += max - b.fare_cents;
      ridesOptimized += 1;
    }
  }

  return { savingsCents, ridesOptimized };
}
