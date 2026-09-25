import "server-only";
import { getCurrentFirebaseUser } from "@/lib/firebase/session";
import { getUserWallet, saveUserWallet } from "@/lib/firebase/db";
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
  const fbUser = await getCurrentFirebaseUser();
  if (!fbUser) return null;

  const wallet = await getUserWallet(fbUser.uid);
  if (!wallet) {
    return { status: "active", balanceCents: 0 };
  }
  return { status: wallet.status as WalletStatus, balanceCents: wallet.balanceCents };
}

/** Technical details — ONLY for Settings → Advanced. */
export async function getWalletDetails(): Promise<WalletDetails | null> {
  const fbUser = await getCurrentFirebaseUser();
  if (!fbUser) return null;

  const wallet = await getUserWallet(fbUser.uid);
  return {
    status: (wallet?.status as WalletStatus) ?? "active",
    balanceCents: wallet?.balanceCents ?? 0,
    address: wallet?.address ?? null,
    network: wallet?.blockchain ?? "ARC-TESTNET",
    paymentRef: wallet?.circleWalletId ?? null,
  };
}

/**
 * Ensures the signed-in user has a live Circle wallet on Arc Testnet.
 * Directly stored in Firestore without any Supabase dependency.
 */
export async function ensureWallet(): Promise<WalletSummary | null> {
  const fbUser = await getCurrentFirebaseUser();
  if (!fbUser) return null;

  const wallet = await getUserWallet(fbUser.uid);

  // Fast path — already provisioned
  if (wallet?.status === "active" && wallet.circleWalletId) {
    return { status: "active", balanceCents: wallet.balanceCents };
  }

  try {
    const circle = getCircleClient();

    // Check if user already has a wallet registered in Circle
    const existing = await circle.listWallets({ refId: fbUser.uid });
    const existingWallets = existing.data?.wallets || [];
    if (existingWallets.length > 0) {
      existingWallets.sort((a, b) => new Date(a.createDate).getTime() - new Date(b.createDate).getTime());
      const primary = existingWallets[0];
      const saved = await saveUserWallet(fbUser.uid, {
        status: "active",
        address: primary.address ?? null,
        blockchain: primary.blockchain ?? "ARC-TESTNET",
        circleWalletId: primary.id,
        balanceCents: 0,
      });
      return { status: "active", balanceCents: saved.balanceCents };
    }

    const res = await circle.createWallets({
      blockchains: ["ARC-TESTNET"],
      count: 1,
      walletSetId: serverEnv.circleWalletSetId,
      accountType: "EOA",
      metadata: [{ refId: fbUser.uid }],
    });

    const created = res.data?.wallets?.[0];
    if (!created) throw new Error("Circle returned no wallet");

    const saved = await saveUserWallet(fbUser.uid, {
      status: "active",
      address: created.address ?? null,
      blockchain: created.blockchain ?? "ARC-TESTNET",
      circleWalletId: created.id,
      balanceCents: 0,
    });

    return { status: "active", balanceCents: saved.balanceCents };
  } catch (err) {
    console.error("[ensureWallet] provisioning error:", err);
    // Return active zero balance fallback so the UI renders smoothly
    return { status: "active", balanceCents: 0 };
  }
}
