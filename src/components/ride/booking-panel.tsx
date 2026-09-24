"use client";

import { useState, useActionState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ShieldCheck, CheckCircle2, AlertCircle, ArrowRight, CreditCard, Zap, Globe, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { PaymentTimeline } from "./payment-timeline";
import { bookRide, completeTrip, type BookingState, type RideOfferLite } from "@/app/(app)/ride/actions";

const INITIAL: BookingState = { error: null };

type PaymentRail = "stripe" | "crypto";

interface BookingPanelProps {
  rideRequestId: string;
  selectedOffer?: RideOfferLite;
}

export function BookingPanel({ rideRequestId, selectedOffer }: BookingPanelProps) {
  const [paymentRail, setPaymentRail] = useState<PaymentRail>("crypto");
  const [book, bookAction, booking] = useActionState(bookRide, INITIAL);
  const [trip, tripAction, settling] = useActionState(completeTrip, INITIAL);

  // Effective status: settlement state wins once started.
  const status = trip.status ?? book.status ?? "PROVIDER_SELECTED";
  const booked = Boolean(book.bookingId) && !book.error;
  const settled = trip.status === "SETTLED";

  const rawFareDollars = selectedOffer ? (selectedOffer.fareCents / 100).toFixed(2) : "0.00";
  const platformFee = 1.50; // $1.50 developer convenience fee
  const totalFare = selectedOffer ? ((selectedOffer.fareCents / 100) + platformFee).toFixed(2) : "0.00";

  if (!booked) {
    return (
      <GlassCard className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted">
            <ShieldCheck className="h-4 w-4 text-teal" />
            <span>Protected Payment Guarantee</span>
          </div>
          {selectedOffer && (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-teal/10 text-teal border border-teal/20">
              {selectedOffer.provider} selected
            </span>
          )}
        </div>

        {/* Payment Method Selector */}
        <div>
          <label className="text-xs font-semibold text-muted uppercase tracking-wider block mb-2">
            Select Payment Method
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setPaymentRail("crypto")}
              className={`p-3 rounded-xl border text-left transition flex items-center gap-2.5 ${
                paymentRail === "crypto"
                  ? "bg-teal/15 border-teal text-foreground shadow-sm"
                  : "bg-white/5 border-white/10 text-muted hover:border-white/20"
              }`}
            >
              <Zap className="w-4 h-4 text-teal shrink-0" />
              <div className="min-w-0">
                <p className="font-medium text-xs text-foreground flex items-center gap-1.5">
                  <span>Crypto Payment</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-teal/20 text-teal font-semibold uppercase">Multi-Chain</span>
                </p>
                <p className="text-[10px] text-muted truncate">Arc Testnet • Sepolia • Base • Arb</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setPaymentRail("stripe")}
              className={`p-3 rounded-xl border text-left transition flex items-center gap-2.5 ${
                paymentRail === "stripe"
                  ? "bg-teal/15 border-teal text-foreground shadow-sm"
                  : "bg-white/5 border-white/10 text-muted hover:border-white/20"
              }`}
            >
              <CreditCard className="w-4 h-4 text-teal shrink-0" />
              <div className="min-w-0">
                <p className="font-medium text-xs text-foreground">Card / Apple Pay</p>
                <p className="text-[10px] text-muted truncate">Stripe Secure Hold</p>
              </div>
            </button>
          </div>

          {paymentRail === "crypto" && (
            <div className="mt-2.5 p-2.5 rounded-xl bg-teal/5 border border-teal/15 flex items-start gap-2 text-xs">
              <Globe className="w-4 h-4 text-teal shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="text-foreground font-medium text-[11px]">Multi-Chain Deposit Ready</p>
                <p className="text-muted text-[10px]">
                  Settled on Arc Testnet with 1-second finality. Deposits accepted across Arc, Ethereum Sepolia, Base, and Arbitrum via Circle CCTP.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Fare and Platform Fee Breakdown */}
        {selectedOffer && (
          <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 space-y-1.5 text-xs">
            <div className="flex justify-between text-muted">
              <span>{selectedOffer.provider} Fare</span>
              <span>${rawFareDollars}</span>
            </div>
            <div className="flex justify-between text-muted">
              <span className="flex items-center gap-1">
                <span>Platform Dispatch Fee</span>
                <span className="text-[10px] text-teal">(Founder monetization)</span>
              </span>
              <span>${platformFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between pt-1.5 border-t border-white/10 text-sm font-semibold text-foreground">
              <span>Total Protected Hold</span>
              <span className="text-teal">${totalFare}</span>
            </div>
          </div>
        )}

        {book.error ? (
          <div className="flex items-start gap-2 rounded-xl border border-[#ff6e84]/30 bg-[#ff6e84]/10 px-3 py-2.5 text-sm text-[#ff9bab]">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{book.error}</span>
          </div>
        ) : null}

        <form action={bookAction}>
          <input type="hidden" name="rideRequestId" value={rideRequestId} />
          {selectedOffer && <input type="hidden" name="offerId" value={selectedOffer.offerId} />}
          <input type="hidden" name="paymentRail" value={paymentRail} />
          <Button type="submit" variant="gradient" size="md" disabled={booking} className="w-full">
            {booking ? "Securing your ride…" : `Book ${selectedOffer ? selectedOffer.provider : "this ride"} ($${totalFare})`}
          </Button>
        </form>
      </GlassCard>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <GlassCard gradientBorder className="space-y-5">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-teal" />
          <span className="font-display text-lg font-semibold">
            {settled ? "Ride settled" : "Ride booked"}
          </span>
        </div>

        <PaymentTimeline currentStatus={status} pending={settling} />

        {trip.error ? (
          <div className="flex items-start gap-2 rounded-xl border border-[#ff6e84]/30 bg-[#ff6e84]/10 px-3 py-2.5 text-sm text-[#ff9bab]">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{trip.error}</span>
          </div>
        ) : null}

        {!settled ? (
          <form action={tripAction}>
            <input type="hidden" name="bookingId" value={book.bookingId} />
            <Button type="submit" variant="glass" size="md" disabled={settling} className="w-full">
              {settling ? "Completing your trip…" : "Simulate ride completion"}
            </Button>
          </form>
        ) : (
          <p className="text-sm text-teal">
            Your Protected Payment was released to the provider. Digital receipt sent via Resend.
          </p>
        )}

        {book.bookingId ? (
          <Link
            href={`/ride/${book.bookingId}`}
            className="inline-flex items-center gap-1.5 text-sm text-muted transition hover:text-foreground"
          >
            View live ride status
            <ArrowRight className="h-4 w-4" />
          </Link>
        ) : null}
      </GlassCard>
    </motion.div>
  );
}
