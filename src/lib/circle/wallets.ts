import "server-only";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { serverEnv } from "@/lib/env";
import type { WalletStatus } from "@/types/database";
import { getCircleClient } from "./client";

export type WalletSummary = {
  status: WalletStatus;
  balanceCents: number;
};

export type WalletDetails = {
  status: WalletStatus;
  balanceCents: number;
  address: string | null;
  network: string;
  paymentRef: string | null;
};

/** Read-only balance summary for display (no provisioning side effects). */
export async function getWalletSummary(): Promise<WalletSummary | null> {
  const supabase = createClient(await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: wallet } = await supabase
    .from("wallets")
    .select("status, balance_cents")
    .eq("user_id", user.id)
    .single();
  if (!wallet) return null;
  return { status: wallet.status, balanceCents: wallet.balance_cents };
}

/** Technical details — ONLY for Settings → Advanced. */
export async function getWalletDetails(): Promise<WalletDetails | null> {
  const supabase = createClient(await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: wallet } = await supabase
    .from("wallets")
    .select("status, balance_cents, address, blockchain, circle_wallet_id")
    .eq("user_id", user.id)
    .single();
  if (!wallet) return null;
  return {
    status: wallet.status,
    balanceCents: wallet.balance_cents,
    address: wallet.address,
    network: wallet.blockchain,
    paymentRef: wallet.circle_wallet_id,
  };
}

/**
 * Ensures the signed-in user has a live Circle wallet (their "Easy Ride
 * Balance"). Idempotent: returns immediately if already active; otherwise
 * creates the wallet in the shared set and activates the row via RPC.
 * Never throws — on Circle failure it leaves the row provisioning so the
 * caller can render a "setting up" state and retry on next load.
 */
export async function ensureWallet(): Promise<WalletSummary | null> {
  const supabase = createClient(await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: wallet } = await supabase
    .from("wallets")
    .select("status, balance_cents, circle_wallet_id")
    .eq("user_id", user.id)
    .single();

  if (!wallet) return null;

  // Fast path — already provisioned.
  if (wallet.status === "active" && wallet.circle_wallet_id) {
    return { status: "active", balanceCents: wallet.balance_cents };
  }
  // Don't auto-provision suspended/failed wallets.
  if (wallet.status !== "provisioning") {
    return { status: wallet.status, balanceCents: wallet.balance_cents };
  }

  try {
    const circle = getCircleClient();
    const res = await circle.createWallets({
      blockchains: ["ARC-TESTNET"],
      count: 1,
      walletSetId: serverEnv.circleWalletSetId,
      accountType: "EOA",
      metadata: [{ refId: user.id }],
    });

    const created = res.data?.wallets?.[0];
    if (!created) throw new Error("Circle returned no wallet");

    const { error: rpcError } = await supabase.rpc("activate_wallet", {
      p_circle_wallet_id: created.id,
      p_wallet_set_id: created.walletSetId ?? serverEnv.circleWalletSetId,
      p_address: created.address ?? null,
      p_blockchain: created.blockchain ?? "ARC-TESTNET",
    });
    if (rpcError) throw rpcError;

    return { status: "active", balanceCents: wallet.balance_cents };
  } catch (err) {
    console.error("[ensureWallet] provisioning failed:", err);
    return { status: "provisioning", balanceCents: wallet.balance_cents };
  }
}
