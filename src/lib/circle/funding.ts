import "server-only";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { getCircleClient } from "./client";
import { getOnchainBalance } from "./balance";
import { checkRateLimit, LIMITS } from "@/lib/security/rate-limit";

export interface FundingResult {
  message: string;
}

/**
 * Add funds — REAL on-chain. On Arc Testnet this requests USDC from the Circle
 * faucet into the user's wallet. There is no local balance ledger; the displayed
 * balance is read live from chain. The faucet has a per-wallet rate limit, which
 * we surface honestly.
 */
export async function addFunds(): Promise<
  { error: string } | { result: FundingResult }
> {
  const supabase = createClient(await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in." };

  const rl = checkRateLimit(user.id, "addFunds", LIMITS.addFunds);
  if (!rl.ok) return { error: rl.error };

  const { data: wallet } = await supabase
    .from("wallets")
    .select("id, address")
    .eq("user_id", user.id)
    .single();
  if (!wallet?.address) {
    return { error: "Your balance isn’t ready yet. Try again shortly." };
  }

  try {
    await getCircleClient().requestTestnetTokens({
      address: wallet.address,
      blockchain: "ARC-TESTNET",
      usdc: true,
      native: true,
    });
  } catch (err) {
    const msg = (err as Error).message || "";
    if (/rate limit/i.test(msg) || /forbidden/i.test(msg)) {
      return {
        error:
          "The testnet faucet is rate-limited right now. It allows one top-up per wallet every so often — please try again later.",
      };
    }
    return { error: "Couldn’t add funds right now. Please try again." };
  }

  // Record the deposit (the on-chain amount is set by the faucet).
  await supabase.from("transactions").insert({
    user_id: user.id,
    wallet_id: wallet.id,
    type: "deposit",
    status: "completed",
    amount_cents: 0,
    description: "Added to Easy Ride Balance (testnet faucet)",
  });

  return {
    result: {
      message: "Funds requested. Your balance updates on-chain in a few moments.",
    },
  };
}

/**
 * Withdraw — REAL on-chain. Sends USDC out of the user's Circle wallet to a
 * destination address via createTransaction. Amount is in dollars (USDC).
 */
export async function withdrawFunds(
  amountUsdc: number,
  destinationAddress: string,
): Promise<{ error: string } | { result: FundingResult & { txId: string } }> {
  if (!Number.isFinite(amountUsdc) || amountUsdc <= 0) {
    return { error: "Enter an amount greater than zero." };
  }
  if (!/^0x[a-fA-F0-9]{40}$/.test(destinationAddress)) {
    return { error: "Enter a valid destination address (0x…)." };
  }

  const supabase = createClient(await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in." };

  const rl = checkRateLimit(user.id, "withdraw", LIMITS.withdraw);
  if (!rl.ok) return { error: rl.error };

  const balance = await getOnchainBalance();
  if (!balance || !balance.tokenId) {
    return { error: "Your balance isn’t ready yet." };
  }
  if (amountUsdc > balance.usdc) {
    return { error: "You can’t withdraw more than your balance." };
  }

  let txId: string;
  try {
    const res = await getCircleClient().createTransaction({
      walletId: balance.walletId,
      tokenId: balance.tokenId,
      amount: [String(amountUsdc)],
      destinationAddress,
      fee: { type: "level", config: { feeLevel: "MEDIUM" } },
    });
    txId = res.data?.id ?? "";
    if (!txId) throw new Error("No transaction id returned");
  } catch (err) {
    console.error("[withdrawFunds] transfer failed:", err);
    return { error: "Couldn’t process your withdrawal. Please try again." };
  }

  const { data: walletRow } = await supabase
    .from("wallets")
    .select("id")
    .eq("user_id", user.id)
    .single();

  await supabase.from("transactions").insert({
    user_id: user.id,
    wallet_id: walletRow?.id ?? null,
    type: "withdrawal",
    status: "pending",
    amount_cents: Math.round(amountUsdc * 100),
    description: "Withdrawn from Easy Ride Balance",
    tx_hash: txId,
  });

  return {
    result: {
      txId,
      message: "Withdrawal sent. It will confirm on-chain shortly.",
    },
  };
}
