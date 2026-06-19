import "server-only";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import type { TransactionType, TransactionStatus } from "@/types/database";

export interface WalletActivityItem {
  id: string;
  type: TransactionType;
  label: string;
  amountCents: number;
  /** true = money into the balance (deposit/refund), shown +green. */
  credit: boolean;
  status: TransactionStatus;
  createdAt: string;
}

const LABELS: Record<TransactionType, string> = {
  deposit: "Added funds",
  withdrawal: "Withdrawal",
  ride_payment: "Ride payment",
  refund: "Refund",
  settlement: "Ride settled",
};

const CREDIT: Record<TransactionType, boolean> = {
  deposit: true,
  refund: true,
  withdrawal: false,
  ride_payment: false,
  settlement: false,
};

export async function listWalletActivity(limit = 12): Promise<WalletActivityItem[]> {
  const supabase = createClient(await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("transactions")
    .select("id, type, status, amount_cents, description, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []).map((t) => ({
    id: t.id,
    type: t.type,
    label: LABELS[t.type as TransactionType] ?? "Transaction",
    amountCents: t.amount_cents,
    credit: CREDIT[t.type as TransactionType] ?? false,
    status: t.status,
    createdAt: t.created_at,
  }));
}
