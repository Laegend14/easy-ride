import "server-only";
import { getCurrentFirebaseUser } from "@/lib/firebase/session";
import { getUserWallet } from "@/lib/firebase/db";
import { getCircleClient } from "./client";
import { getOnchainBalance } from "./balance";
import { checkRateLimit, LIMITS } from "@/lib/security/rate-limit";
import { sendDepositConfirmationEmail } from "@/lib/resend/client";

export interface FundingResult {
  message: string;
}

/**
 * Add funds — REAL on-chain. On Arc Testnet this requests USDC from the Circle
 * faucet into the user's wallet.
 */
export async function addFunds(): Promise<
  { error: string } | { result: FundingResult }
> {
  const fbUser = await getCurrentFirebaseUser();
  if (!fbUser) return { error: "Please sign in." };

  const rl = checkRateLimit(fbUser.uid, "addFunds", LIMITS.addFunds);
  if (!rl.ok) return { error: rl.error };

  const wallet = await getUserWallet(fbUser.uid);
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

  // Send deposit notification email via Resend
  const targetEmail = fbUser.email || "mueabraham16@gmail.com";
  sendDepositConfirmationEmail({
    toEmail: targetEmail,
    riderName: fbUser.displayName || targetEmail.split("@")[0] || "Valued Rider",
    amountDollars: "10.00",
    paymentRail: "Circle Arc Testnet Faucet (USDC)",
    transactionRef: wallet.address.slice(0, 10) + "..." + wallet.address.slice(-6),
    date: new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
  }).catch((err) => console.warn("[Resend] Faucet email error:", err));

  return {
    result: {
      message: "Funds requested. Your balance updates on-chain in a few moments.",
    },
  };
}

/**
 * Withdraw — REAL on-chain. Sends USDC out of the user's Circle wallet.
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

  const fbUser = await getCurrentFirebaseUser();
  if (!fbUser) return { error: "Please sign in." };

  const rl = checkRateLimit(fbUser.uid, "withdraw", LIMITS.withdraw);
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

  return {
    result: {
      txId,
      message: "Withdrawal sent. It will confirm on-chain shortly.",
    },
  };
}
