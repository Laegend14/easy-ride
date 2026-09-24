import { Resend } from "resend";

const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
const rawFrom = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
const FROM_EMAIL = rawFrom.includes("<") ? rawFrom : `Easy Ride <${rawFrom}>`;

function getResendClient(): Resend | null {
  if (!RESEND_API_KEY) return null;
  return new Resend(RESEND_API_KEY);
}

export interface ReceiptEmailParams {
  toEmail: string;
  riderName: string;
  bookingId: string;
  provider: string;
  fareDollars: string;
  savingsDollars: string;
  origin: string;
  destination: string;
  date: string;
}

export interface BookingEmailParams {
  toEmail: string;
  riderName: string;
  bookingId: string;
  provider: string;
  fareDollars: string;
  origin: string;
  destination: string;
  etaMinutes: number;
}

export interface DepositEmailParams {
  toEmail: string;
  riderName: string;
  amountDollars: string;
  paymentRail: string;
  transactionRef: string;
  date: string;
}

export interface RecoveryEmailParams {
  toEmail: string;
  riderName: string;
  originalProvider: string;
  newProvider: string;
  fareDollars: string;
  reasoning: string;
}

/**
 * Universal safe email sender that handles Resend sandbox/free-tier constraints gracefully.
 */
async function sendEmailSafely(params: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ success: boolean; id?: string }> {
  const client = getResendClient();
  if (!client) {
    console.log(`[Resend Mock] Email queued for ${params.to}: ${params.subject}`);
    return { success: true, id: `mock-${Date.now()}` };
  }

  const primaryRecipient = params.to || "mueabraham16@gmail.com";

  try {
    const { data, error } = await client.emails.send({
      from: FROM_EMAIL,
      to: [primaryRecipient],
      subject: params.subject,
      html: params.html,
    });

    if (error) {
      const errorMsg = error.message || "";
      // If restricted to sending only to the account owner email in free sandbox
      if (
        (errorMsg.includes("testing emails to your own email address") ||
          error.name === "validation_error" ||
          error.name === "forbidden") &&
        primaryRecipient !== "mueabraham16@gmail.com"
      ) {
        console.warn(
          `[Resend Fallback] Free sandbox recipient constraint detected for ${primaryRecipient}. Rerouting to verified owner mueabraham16@gmail.com...`
        );
        const fallback = await client.emails.send({
          from: FROM_EMAIL,
          to: ["mueabraham16@gmail.com"],
          subject: `[Dev Route: ${primaryRecipient}] ${params.subject}`,
          html: `
            <div style="background:#fef3c7;color:#92400e;padding:12px 16px;border-radius:8px;margin-bottom:16px;font-family:sans-serif;font-size:13px;border:1px solid #fde68a;">
              <strong>Developer Testing Notice:</strong> This message was targeted for rider <code>${primaryRecipient}</code> and delivered to your verified Resend account.
            </div>
            ${params.html}
          `,
        });

        if (!fallback.error) {
          console.log(`[Resend] Successfully delivered to owner via fallback (id: ${fallback.data?.id})`);
          return { success: true, id: fallback.data?.id };
        }
      }

      console.warn("[Resend Warning] Send error:", error);
      return { success: false };
    }

    console.log(`[Resend] Email delivered to ${primaryRecipient} (id: ${data?.id})`);
    return { success: true, id: data?.id };
  } catch (err: any) {
    console.warn("[Resend Exception] Error sending email:", err?.message || err);
    return { success: false };
  }
}

/**
 * Sends a digital ride receipt upon ride settlement.
 */
export async function sendReceiptEmail(params: ReceiptEmailParams): Promise<{ success: boolean; id?: string }> {
  return sendEmailSafely({
    to: params.toEmail,
    subject: `Your Easy Ride Digital Receipt: ${params.provider} (${params.fareDollars})`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; background: #0b0b14; color: #f5f5fa; border-radius: 20px; border: 1px solid rgba(255, 255, 255, 0.1);">
        <div style="text-align: center; margin-bottom: 28px;">
          <div style="display: inline-block; padding: 8px 16px; border-radius: 999px; background: rgba(20, 184, 166, 0.15); border: 1px solid rgba(20, 184, 166, 0.3); color: #14b8a6; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 12px;">
            Ride Complete & Settled
          </div>
          <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.02em;">
            Easy<span style="background: linear-gradient(135deg, #14b8a6, #6366f1, #a855f7); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Ride</span>
          </h1>
          <p style="color: #a1a1b5; font-size: 14px; margin-top: 6px;">Official Smart Escrow Digital Receipt</p>
        </div>

        <div style="background: #12121f; padding: 24px; border-radius: 16px; border: 1px solid rgba(255, 255, 255, 0.08); margin-bottom: 24px;">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255, 255, 255, 0.08); padding-bottom: 14px; margin-bottom: 14px;">
            <span style="color: #a1a1b5; font-size: 14px;">Fleet Provider</span>
            <strong style="color: #ffffff; font-size: 15px;">${params.provider}</strong>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255, 255, 255, 0.08); padding-bottom: 14px; margin-bottom: 14px;">
            <span style="color: #a1a1b5; font-size: 14px;">Total Fare Paid</span>
            <strong style="color: #14b8a6; font-size: 22px; font-weight: 800;">${params.fareDollars}</strong>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255, 255, 255, 0.08); padding-bottom: 14px; margin-bottom: 14px;">
            <span style="color: #a1a1b5; font-size: 14px;">AI Multi-Fleet Savings</span>
            <strong style="color: #a855f7; font-size: 15px;">${params.savingsDollars}</strong>
          </div>

          <div style="padding-top: 6px; font-size: 13px; color: #cbd5e1; line-height: 1.6;">
            <p style="margin: 6px 0;"><strong>Pickup:</strong> ${params.origin}</p>
            <p style="margin: 6px 0;"><strong>Destination:</strong> ${params.destination}</p>
            <p style="margin: 8px 0 0 0; color: #64748b; font-size: 12px;">Trip Date: ${params.date} • Reference ID: ${params.bookingId.slice(0, 12)}</p>
          </div>
        </div>

        <div style="padding: 16px; border-radius: 12px; background: rgba(99, 102, 241, 0.08); border: 1px solid rgba(99, 102, 241, 0.2); margin-bottom: 24px;">
          <p style="margin: 0; font-size: 12px; color: #a1a1b5; line-height: 1.5;">
            <strong style="color: #ffffff;">🔒 Smart Escrow Protection:</strong> Your payment was securely locked in smart escrow and was only released upon verified arrival at your destination.
          </p>
        </div>

        <p style="font-size: 11px; text-align: center; color: #64748b; margin: 0;">
          Easy Ride Inc. • Multi-Fleet Autonomous Mobility • Sent via Resend
        </p>
      </div>
    `,
  });
}

/**
 * Sends a booking confirmation email when a ride is dispatched.
 */
export async function sendBookingConfirmationEmail(params: BookingEmailParams): Promise<{ success: boolean; id?: string }> {
  return sendEmailSafely({
    to: params.toEmail,
    subject: `⚡ Ride Confirmed with ${params.provider} — ETA ~${params.etaMinutes} mins`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; background: #0b0b14; color: #f5f5fa; border-radius: 20px; border: 1px solid rgba(255, 255, 255, 0.1);">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="display: inline-block; padding: 6px 14px; border-radius: 999px; background: rgba(99, 102, 241, 0.15); border: 1px solid rgba(99, 102, 241, 0.3); color: #818cf8; font-size: 12px; font-weight: 700; text-transform: uppercase;">
            Dispatched & Escrow Locked
          </div>
          <h1 style="color: #ffffff; margin: 12px 0 0 0; font-size: 24px; font-weight: 800;">
            Easy<span style="background: linear-gradient(135deg, #14b8a6, #6366f1, #a855f7); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Ride</span>
          </h1>
        </div>

        <p style="color: #a1a1b5; font-size: 15px;">Hi ${params.riderName}, your driver from <strong>${params.provider}</strong> is en route!</p>
        
        <div style="background: #12121f; padding: 20px; border-radius: 14px; border: 1px solid rgba(255, 255, 255, 0.08); margin: 20px 0;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
            <span style="color: #a1a1b5;">Fleet Provider:</span>
            <strong style="color: #ffffff;">${params.provider}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
            <span style="color: #a1a1b5;">Locked Fare:</span>
            <strong style="color: #14b8a6; font-size: 18px;">${params.fareDollars}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
            <span style="color: #a1a1b5;">Estimated Arrival:</span>
            <strong style="color: #a855f7;">~${params.etaMinutes} mins</strong>
          </div>
          <div style="border-top: 1px solid rgba(255, 255, 255, 0.08); padding-top: 12px; margin-top: 12px; font-size: 13px; color: #cbd5e1;">
            <p style="margin: 4px 0;"><strong>Pickup:</strong> ${params.origin}</p>
            <p style="margin: 4px 0;"><strong>Drop-off:</strong> ${params.destination}</p>
          </div>
        </div>

        <div style="background: rgba(20, 184, 166, 0.08); border: 1px solid rgba(20, 184, 166, 0.2); padding: 14px; border-radius: 12px; margin-bottom: 20px;">
          <p style="margin: 0; font-size: 12px; color: #a1a1b5; line-height: 1.5;">
            🛡️ <strong>Autonomous Protection Active:</strong> If this driver cancels, Easy Ride AI automatically finds and dispatches the fastest replacement driver without charging you twice.
          </p>
        </div>

        <p style="font-size: 11px; text-align: center; color: #64748b; margin: 0;">
          Easy Ride Inc. • Booking ID: ${params.bookingId.slice(0, 12)}
        </p>
      </div>
    `,
  });
}

/**
 * Sends a wallet deposit confirmation email (Stripe or on-chain).
 */
export async function sendDepositConfirmationEmail(params: DepositEmailParams): Promise<{ success: boolean; id?: string }> {
  return sendEmailSafely({
    to: params.toEmail,
    subject: `Deposit Confirmed: +$${params.amountDollars} added to Easy Ride Wallet`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; background: #0b0b14; color: #f5f5fa; border-radius: 20px; border: 1px solid rgba(255, 255, 255, 0.1);">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="display: inline-block; padding: 6px 14px; border-radius: 999px; background: rgba(34, 197, 94, 0.15); border: 1px solid rgba(34, 197, 94, 0.3); color: #4ade80; font-size: 12px; font-weight: 700; text-transform: uppercase;">
            Deposit Confirmed
          </div>
          <h1 style="color: #ffffff; margin: 12px 0 0 0; font-size: 24px; font-weight: 800;">
            Easy<span style="background: linear-gradient(135deg, #14b8a6, #6366f1, #a855f7); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Ride</span>
          </h1>
        </div>

        <p style="color: #a1a1b5; font-size: 15px;">Hi ${params.riderName}, your deposit has been credited and is ready to use.</p>

        <div style="background: #12121f; padding: 20px; border-radius: 14px; border: 1px solid rgba(255, 255, 255, 0.08); margin: 20px 0;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 12px; align-items: center;">
            <span style="color: #a1a1b5;">Amount Credited:</span>
            <strong style="color: #22c55e; font-size: 24px; font-weight: 800;">+$${params.amountDollars}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
            <span style="color: #a1a1b5;">Payment Rail:</span>
            <strong style="color: #ffffff;">${params.paymentRail}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
            <span style="color: #a1a1b5;">Date & Time:</span>
            <span style="color: #cbd5e1;">${params.date}</span>
          </div>
          <div style="border-top: 1px solid rgba(255, 255, 255, 0.08); padding-top: 10px; margin-top: 10px;">
            <span style="color: #64748b; font-size: 12px;">Reference: ${params.transactionRef}</span>
          </div>
        </div>

        <p style="font-size: 13px; color: #a1a1b5; text-align: center; margin: 16px 0;">
          Your balance is immediately available for 1-tap bookings and smart escrow rides.
        </p>

        <p style="font-size: 11px; text-align: center; color: #64748b; margin-top: 24px;">
          Easy Ride Inc. • Instant Multi-Modal Wallet
        </p>
      </div>
    `,
  });
}

/**
 * Sends an autonomous recovery / rebooking email when a driver cancels.
 */
export async function sendRecoveryEmail(params: RecoveryEmailParams): Promise<{ success: boolean; id?: string }> {
  return sendEmailSafely({
    to: params.toEmail,
    subject: `⚡ Driver Cancelled — Easy Ride Rebooked You with ${params.newProvider}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; background: #0b0b14; color: #f5f5fa; border-radius: 20px; border: 1px solid rgba(255, 255, 255, 0.1);">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="display: inline-block; padding: 6px 14px; border-radius: 999px; background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.3); color: #f87171; font-size: 12px; font-weight: 700; text-transform: uppercase;">
            Autonomous Driver Reassignment
          </div>
          <h1 style="color: #ffffff; margin: 12px 0 0 0; font-size: 24px; font-weight: 800;">
            Easy<span style="background: linear-gradient(135deg, #14b8a6, #6366f1, #a855f7); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Ride</span>
          </h1>
        </div>

        <p style="color: #a1a1b5; font-size: 15px;">
          Hi ${params.riderName}, your original driver from <strong>${params.originalProvider}</strong> was unable to complete the trip.
        </p>

        <div style="background: rgba(20, 184, 166, 0.1); border: 1px solid #14b8a6; padding: 18px; border-radius: 14px; margin: 20px 0;">
          <p style="margin: 0; color: #14b8a6; font-weight: 700; font-size: 14px;">Autonomous Agent Resolution:</p>
          <p style="margin: 8px 0 0 0; color: #ffffff; font-size: 14px; line-height: 1.5;">${params.reasoning}</p>
        </div>

        <div style="background: #12121f; padding: 16px; border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.08); margin-bottom: 20px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="color: #a1a1b5;">New Provider:</span>
            <strong style="color: #ffffff;">${params.newProvider}</strong>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #a1a1b5;">Escrow Fare Transferred:</span>
            <strong style="color: #14b8a6;">${params.fareDollars}</strong>
          </div>
        </div>

        <p style="color: #a1a1b5; font-size: 13px; line-height: 1.5;">
          🔒 <strong>Zero Extra Fees:</strong> Your smart escrow funds were automatically transferred to your new driver. No cancellation fees, surge re-charges, or manual refund requests needed.
        </p>

        <p style="font-size: 11px; text-align: center; color: #64748b; margin-top: 24px;">
          Easy Ride Inc. • Autonomous Ride Protection
        </p>
      </div>
    `,
  });
}

