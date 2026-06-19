import "server-only";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { getCircleClient } from "./client";

export interface OnchainBalance {
  /** USDC balance as a decimal number (e.g. 40 = $40.00). */
  usdc: number;
  /** Circle token id for the USDC token held (used for withdrawals). */
  tokenId: string | null;
  walletId: string;
  address: string | null;
}

/**
 * Reads the user's REAL on-chain USDC balance from their Circle wallet on Arc
 * Testnet. This is the authoritative Easy Ride Balance — no local ledger.
 * Prefers the standard ERC-20 USDC token; falls back to native USDC.
 */
export async function getOnchainBalance(): Promise<OnchainBalance | null> {
  const supabase = createClient(await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: wallet } = await supabase
    .from("wallets")
    .select("circle_wallet_id, address")
    .eq("user_id", user.id)
    .single();
  if (!wallet?.circle_wallet_id) return null;

  try {
    const res = await getCircleClient().getWalletTokenBalance({
      id: wallet.circle_wallet_id,
      includeAll: true,
    });
    const balances = res.data?.tokenBalances ?? [];
    const usdcTokens = balances.filter((b) => b.token?.symbol === "USDC");
    // Prefer ERC-20 USDC (standard token) over native gas USDC.
    const chosen =
      usdcTokens.find((b) => b.token?.isNative === false) ?? usdcTokens[0] ?? null;

    return {
      usdc: chosen ? parseFloat(chosen.amount) : 0,
      tokenId: chosen?.token?.id ?? null,
      walletId: wallet.circle_wallet_id,
      address: wallet.address,
    };
  } catch (err) {
    console.error("[getOnchainBalance] read failed:", err);
    return {
      usdc: 0,
      tokenId: null,
      walletId: wallet.circle_wallet_id,
      address: wallet.address,
    };
  }
}
