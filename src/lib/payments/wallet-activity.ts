import "server-only";
import { getCurrentFirebaseUser } from "@/lib/firebase/session";
import { getUserBookings } from "@/lib/firebase/db";
import type { TransactionType, TransactionStatus } from "@/types/database";

export interface WalletActivityItem {
  id: string;
  type: TransactionType;
  label: string;
  amountCents: number;
  credit: boolean;
  status: TransactionStatus;
  createdAt: string;
}

export async function listWalletActivity(_limit = 12): Promise<WalletActivityItem[]> {
  const fbUser = await getCurrentFirebaseUser();
  if (!fbUser) return [];

  const bookings = await getUserBookings(fbUser.uid);
  return bookings.map((b) => ({
    id: b.id,
    type: "ride_payment" as TransactionType,
    label: `Protected payment (${b.provider})`,
    amountCents: b.fareCents,
    credit: false,
    status: (b.status === "SETTLED" ? "completed" : "pending") as TransactionStatus,
    createdAt: b.bookedAt,
  }));
}
