import "server-only";
import Stripe from "stripe";
import { getCurrentFirebaseUser } from "@/lib/firebase/session";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { sendDepositConfirmationEmail } from "@/lib/resend/client";

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not configured in .env.local");
  }
  return new Stripe(key, {
    apiVersion: "2025-02-24.acacia" as any,
  });
}

/**
 * Creates a REAL Stripe Checkout Session for topping up the Easy Ride Wallet.
 */
export async function createStripeCheckoutSession(amountDollars: number, originUrl: string): Promise<string> {
  const fbUser = await getCurrentFirebaseUser();
  if (!fbUser) throw new Error("Please sign in to top up your balance.");

  const stripe = getStripe();
  const amountCents = Math.round(amountDollars * 100);

  if (amountCents < 500) {
    throw new Error("Minimum deposit amount is $5.00 USD.");
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    customer_email: fbUser.email || undefined,
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: "Easy Ride Wallet Deposit",
            description: `Instant USD top-up for ride bookings & smart escrow (${fbUser.email})`,
          },
          unit_amount: amountCents,
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: `${originUrl}/dashboard?stripe_success=true&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${originUrl}/dashboard?stripe_cancel=true`,
    client_reference_id: fbUser.uid,
    metadata: {
      userId: fbUser.uid,
      amountCents: String(amountCents),
    },
  });

  if (!session.url) {
    throw new Error("Failed to generate Stripe checkout URL.");
  }

  return session.url;
}

/**
 * Verifies a completed Stripe Checkout session and securely records it in Firestore.
 * Prevents double-crediting via idempotency on session.id.
 */
export async function verifyAndCreditCheckout(sessionId: string): Promise<{ success: boolean; amountDollars?: number; alreadyProcessed?: boolean }> {
  const fbUser = await getCurrentFirebaseUser();
  if (!fbUser) return { success: false };

  const stripe = getStripe();
  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId);
  } catch (err: any) {
    console.error("[Stripe] Failed to retrieve session:", err.message);
    return { success: false };
  }

  if (session.payment_status !== "paid") {
    return { success: false };
  }

  const amountCents = session.amount_total || 0;
  const db = getAdminFirestore();
  const depositRef = db.collection("stripe_deposits").doc(session.id);
  const existing = await depositRef.get();

  if (existing.exists) {
    return { success: true, amountDollars: amountCents / 100, alreadyProcessed: true };
  }

  await depositRef.set({
    sessionId: session.id,
    userId: fbUser.uid,
    customerEmail: session.customer_details?.email || fbUser.email || "",
    amountCents,
    currency: session.currency || "usd",
    status: "paid",
    createdAt: new Date().toISOString(),
  });

  // Send deposit confirmation email via Resend
  const targetEmail = session.customer_details?.email || fbUser.email || "mueabraham16@gmail.com";
  sendDepositConfirmationEmail({
    toEmail: targetEmail,
    riderName: fbUser.displayName || targetEmail.split("@")[0] || "Valued Rider",
    amountDollars: (amountCents / 100).toFixed(2),
    paymentRail: "Stripe Checkout (Card)",
    transactionRef: session.id.slice(-12),
    date: new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
  }).catch((err) => console.warn("[Resend] Deposit email error:", err));

  return { success: true, amountDollars: amountCents / 100, alreadyProcessed: false };
}

/**
 * Retrieves the total verified real USD deposits made via Stripe by this user.
 */
export async function getVerifiedStripeDepositsTotal(userId: string): Promise<number> {
  try {
    const db = getAdminFirestore();
    const snap = await db
      .collection("stripe_deposits")
      .where("userId", "==", userId)
      .where("status", "==", "paid")
      .get();

    let totalCents = 0;
    snap.forEach((doc) => {
      const data = doc.data();
      totalCents += Number(data.amountCents || 0);
    });

    return totalCents / 100;
  } catch (err: any) {
    console.warn("[Stripe] Could not fetch stripe deposits:", err.message);
    return 0;
  }
}
