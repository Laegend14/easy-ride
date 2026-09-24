// Stripe Payment Service for Easy Ride:
// 1. Authorize payment hold on ride booking
// 2. Capture payment on ride completion
// 3. Release / cancel hold on ride cancellation

import Stripe from "stripe";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "";

const stripe = STRIPE_SECRET_KEY
  ? new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: "2025-02-24.acacia" as any,
    })
  : null;

export interface PaymentHoldResult {
  paymentIntentId: string;
  clientSecret: string | null;
  status: "requires_capture" | "succeeded" | "mock_authorized";
}

/**
 * Creates a pre-authorization hold for a ride fare.
 * Funds are reserved but not charged until ride completion.
 */
export async function createRidePaymentHold(params: {
  amountCents: number;
  riderEmail?: string;
  bookingId: string;
  description: string;
}): Promise<PaymentHoldResult> {
  if (!stripe) {
    console.log(`[Stripe Mock] Created pre-authorization hold of $${(params.amountCents / 100).toFixed(2)} for booking ${params.bookingId}`);
    return {
      paymentIntentId: `pi_mock_${params.bookingId}`,
      clientSecret: `mock_secret_${params.bookingId}`,
      status: "mock_authorized",
    };
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: params.amountCents,
      currency: "usd",
      capture_method: "manual", // Pre-authorization hold
      description: params.description,
      metadata: {
        bookingId: params.bookingId,
        riderEmail: params.riderEmail || "",
      },
    });

    return {
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      status: paymentIntent.status as any,
    };
  } catch (err) {
    console.error("[Stripe Error] Payment hold failed:", err);
    throw new Error("Card payment authorization failed. Please try another payment method.");
  }
}

/**
 * Captures the previously held funds upon ride completion.
 */
export async function captureRidePayment(paymentIntentId: string): Promise<{ success: boolean; txId: string }> {
  if (!stripe || paymentIntentId.startsWith("pi_mock_")) {
    console.log(`[Stripe Mock] Captured payment for ${paymentIntentId}`);
    return { success: true, txId: `ch_mock_${Date.now()}` };
  }

  try {
    const paymentIntent = await stripe.paymentIntents.capture(paymentIntentId);
    return {
      success: paymentIntent.status === "succeeded",
      txId: paymentIntent.latest_charge as string || paymentIntent.id,
    };
  } catch (err) {
    console.error("[Stripe Error] Capture failed:", err);
    throw new Error("Failed to capture card payment.");
  }
}

/**
 * Cancels the authorization hold and releases funds back to the rider.
 */
export async function cancelRidePaymentHold(paymentIntentId: string): Promise<{ success: boolean }> {
  if (!stripe || paymentIntentId.startsWith("pi_mock_")) {
    console.log(`[Stripe Mock] Cancelled authorization hold for ${paymentIntentId}`);
    return { success: true };
  }

  try {
    await stripe.paymentIntents.cancel(paymentIntentId);
    return { success: true };
  } catch (err) {
    console.error("[Stripe Error] Cancel hold failed:", err);
    return { success: false };
  }
}
