import "server-only";
import { getCurrentFirebaseUser } from "@/lib/firebase/session";
import {
  getRideBooking,
  saveRideBooking,
  getRideRequest,
  getAgentPreferences,
  type RideBookingRecord,
} from "@/lib/firebase/db";
import { createDefaultRegistry } from "@/lib/providers";
import type { RideSearchParams } from "@/lib/providers";
import { RideAgent, MockEconomicActions } from "@/lib/agent";
import { OnchainEconomicActions } from "@/lib/agent/onchain-economic-actions";
import {
  isEscrowConfigured,
  getOperatorAddress,
} from "@/lib/contracts/escrow-client";
import { notify, NOTIFY } from "@/lib/notifications/notify";
import { checkRateLimit, LIMITS } from "@/lib/security/rate-limit";
import { randomUUID } from "node:crypto";
import { sendRecoveryEmail } from "@/lib/resend/client";

export interface RecoveryResult {
  recovered: boolean;
  refunded: boolean;
  newBookingId?: string;
  provider?: string;
  reasoning: string;
  onchain: boolean;
}

/**
 * Driver Cancels -> Detect -> Preserve Escrow -> Find Alternative -> Transfer
 * Escrow (reassign in place) -> Continue Ride; or refund the rider if nothing
 * fits.
 */
export async function recoverRide(
  originalBookingId: string,
  recoveryAction?: "rebook" | "refund",
): Promise<{ error: string } | { result: RecoveryResult }> {
  const fbUser = await getCurrentFirebaseUser();
  if (!fbUser) return { error: "Please sign in." };

  const rl = checkRateLimit(fbUser.uid, "booking", LIMITS.booking);
  if (!rl.ok) return { error: rl.error };

  const original = await getRideBooking(originalBookingId);
  if (!original || original.userId !== fbUser.uid) return { error: "Ride not found." };
  if (["SETTLED", "CANCELLED", "REFUNDED"].includes(original.status)) {
    return { error: "This ride can no longer be changed." };
  }

  const onchainKey = original.escrowId;
  const req = original.rideRequestId ? await getRideRequest(original.rideRequestId) : null;
  const userPrefs = await getAgentPreferences(fbUser.uid);

  const prefs = {
    optimizationGoal: (userPrefs?.optimizationGoal as any) ?? ("balanced" as const),
    dailyBudgetCents: userPrefs?.dailyBudgetCents ?? 5000,
    maxRideCents: userPrefs?.maxRideCents ?? 2000,
    evPreferred: userPrefs?.evPreferred ?? false,
    premiumPreferred: userPrefs?.premiumPreferred ?? false,
    sharedRideAllowed: userPrefs?.sharedRideAllowed ?? true,
  };

  const params: RideSearchParams = {
    origin: { address: req?.originAddress ?? "Current location" },
    destination: { address: req?.destinationAddress ?? "Destination" },
    sharedAllowed: prefs.sharedRideAllowed,
  };

  const agent = new RideAgent(createDefaultRegistry(), new MockEconomicActions());
  const plan = await agent.recoverFromCancellation(
    params,
    original.provider,
    original.fareCents,
    prefs,
  );

  const shouldRebook = recoveryAction !== "refund" && !!plan.selected;

  // ---- No affordable alternative or user requested refund -> REFUND the rider ----
  if (!shouldRebook || !plan.selected) {
    if (onchainKey && isEscrowConfigured()) {
      try {
        await new OnchainEconomicActions().issueRefund(onchainKey);
      } catch (err) {
        console.error("[recoverRide] on-chain refund failed:", err);
      }
    }

    await saveRideBooking({
      ...original,
      status: "REFUNDED",
      completedAt: new Date().toISOString(),
    });

    await notify(null, fbUser.uid, NOTIFY.driverCancelled(original.provider, originalBookingId));
    await notify(null, fbUser.uid, NOTIFY.refundIssued(originalBookingId));

    return {
      result: {
        recovered: false,
        refunded: true,
        onchain: Boolean(onchainKey && isEscrowConfigured()),
        reasoning:
          "Your driver cancelled and no alternative fit your budget right now. Your Protected Payment has been refunded.",
      },
    };
  }

  // ---- Alternative found -> REASSIGN escrow ----
  if (onchainKey && isEscrowConfigured()) {
    try {
      const driver = await getOperatorAddress();
      await new OnchainEconomicActions().reassignEscrow(onchainKey, driver);
    } catch (err) {
      console.error("[recoverRide] on-chain reassign failed:", err);
    }
  }

  await saveRideBooking({
    ...original,
    status: "CANCELLED",
  });

  const newBookingId = randomUUID();
  const newBooking: RideBookingRecord = {
    id: newBookingId,
    rideRequestId: original.rideRequestId,
    userId: fbUser.uid,
    provider: plan.selected.provider,
    fareCents: plan.selected.fareCents,
    etaMinutes: plan.selected.etaMinutes,
    status: "ESCROW_FUNDED",
    escrowId: onchainKey,
    txHashCreate: original.txHashCreate,
    txHashFund: original.txHashFund,
    isReassignment: true,
    previousBookingId: originalBookingId,
    bookedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };

  await saveRideBooking(newBooking);

  await notify(null, fbUser.uid, NOTIFY.driverCancelled(original.provider, originalBookingId));
  await notify(
    null,
    fbUser.uid,
    NOTIFY.alternativeFound(plan.selected.provider, newBookingId),
  );

  // Send autonomous recovery notice email via Resend
  const recipientEmail = fbUser.email || "mueabraham16@gmail.com";
  sendRecoveryEmail({
    toEmail: recipientEmail,
    riderName: fbUser.displayName || recipientEmail.split("@")[0] || "Valued Rider",
    originalProvider: original.provider,
    newProvider: plan.selected.provider,
    fareDollars: `$${(plan.selected.fareCents / 100).toFixed(2)}`,
    reasoning: plan.reasoning,
  }).catch((err) => console.warn("[Resend] Recovery email error:", err));

  return {
    result: {
      recovered: true,
      refunded: false,
      onchain: Boolean(onchainKey && isEscrowConfigured()),
      newBookingId: newBooking.id,
      provider: plan.selected.provider,
      reasoning: plan.reasoning,
    },
  };
}
