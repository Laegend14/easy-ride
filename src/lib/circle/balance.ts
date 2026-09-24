import "server-only";
import { getCurrentFirebaseUser } from "@/lib/firebase/session";
import { getUserWallet } from "@/lib/firebase/db";
import { getCircleClient } from "./client";
import { getVerifiedStripeDepositsTotal } from "@/lib/payments/stripe-checkout";

export interface OnchainBalance {
  /** USDC balance as a decimal number (e.g. 40 = $40.00). */
  usdc: number;
  /** Circle token id for the USDC token held (used for withdrawals). */
  tokenId: string | null;
  walletId: string;
  address: string | null;
  /** Breakdown for clarity */
  cryptoUsdc?: number;
  stripeUsd?: number;
}

/**
 * Reads the user's REAL balance:
 * 1. REAL on-chain crypto USDC from their Circle wallet on Arc Testnet (authoritative crypto balance)
 * 2. REAL verified Stripe card/Apple Pay deposits (authoritative fiat deposits)
 * Zero simulated numbers.
 */
export async function getOnchainBalance(): Promise<OnchainBalance | null> {
  const fbUser = await getCurrentFirebaseUser();
  if (!fbUser) return null;

  const [wallet, realStripeUsd] = await Promise.all([
    getUserWallet(fbUser.uid),
    getVerifiedStripeDepositsTotal(fbUser.uid),
  ]);

  if (!wallet?.circleWalletId) {
    return {
      usdc: realStripeUsd,
      cryptoUsdc: 0,
      stripeUsd: realStripeUsd,
      tokenId: null,
      walletId: "pending",
      address: wallet?.address ?? null,
    };
  }

  try {
    const res = await getCircleClient().getWalletTokenBalance({
      id: wallet.circleWalletId,
      includeAll: true,
    });
    const balances = res.data?.tokenBalances ?? [];
    const usdcTokens = balances.filter((b) => b.token?.symbol === "USDC");
    const chosen =
      usdcTokens.find((b) => b.token?.isNative === false) ?? usdcTokens[0] ?? null;

    const onchainAmount = chosen ? parseFloat(chosen.amount) : 0;
    const totalBalance = Math.round((onchainAmount + realStripeUsd) * 100) / 100;

    return {
      usdc: totalBalance,
      cryptoUsdc: onchainAmount,
      stripeUsd: realStripeUsd,
      tokenId: chosen?.token?.id ?? null,
      walletId: wallet.circleWalletId,
      address: wallet.address,
    };
  } catch (err) {
    console.warn("[getOnchainBalance] read fallback:", err);
    return {
      usdc: realStripeUsd,
      cryptoUsdc: 0,
      stripeUsd: realStripeUsd,
      tokenId: null,
      walletId: wallet.circleWalletId,
      address: wallet.address,
    };
  }
}
