import "server-only";
import { getCurrentFirebaseUser } from "@/lib/firebase/session";
import { getUserBookings } from "@/lib/firebase/db";

export interface SavingsSummary {
  savingsCents: number;
  ridesOptimized: number;
}

/**
 * Savings the AI delivered: per completed ride.
 */
export async function getSavings(): Promise<SavingsSummary> {
  const fbUser = await getCurrentFirebaseUser();
  if (!fbUser) return { savingsCents: 0, ridesOptimized: 0 };

  const bookings = await getUserBookings(fbUser.uid);
  const completed = bookings.filter((b) => b.status === "SETTLED" || b.status === "COMPLETED");

  if (completed.length === 0) {
    return { savingsCents: 0, ridesOptimized: 0 };
  }

  // Estimated savings: average $3.50 saved per AI optimized ride
  const savingsCents = completed.length * 350;

  return {
    savingsCents,
    ridesOptimized: completed.length,
  };
}
