"use client";

import { useActionState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ShieldCheck, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { PaymentTimeline } from "./payment-timeline";
import { bookRide, completeTrip, type BookingState } from "@/app/(app)/ride/actions";

const INITIAL: BookingState = { error: null };

export function BookingPanel({ rideRequestId }: { rideRequestId: string }) {
  const [book, bookAction, booking] = useActionState(bookRide, INITIAL);
  const [trip, tripAction, settling] = useActionState(completeTrip, INITIAL);

  // Effective status: settlement state wins once started.
  const status = trip.status ?? book.status ?? "PROVIDER_SELECTED";
  const booked = Boolean(book.bookingId) && !book.error;
  const settled = trip.status === "SETTLED";

  if (!booked) {
    return (
      <GlassCard className="flex flex-col gap-3">
        <div className="flex items-center gap-2 text-sm text-muted">
          <ShieldCheck className="h-4 w-4 text-teal" />
          Protected Payment — you’re only charged when the ride completes.
        </div>
        {book.error ? (
          <div className="flex items-start gap-2 rounded-xl border border-[#ff6e84]/30 bg-[#ff6e84]/10 px-3 py-2.5 text-sm text-[#ff9bab]">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{book.error}</span>
          </div>
        ) : null}
        <form action={bookAction}>
          <input type="hidden" name="rideRequestId" value={rideRequestId} />
          <Button type="submit" variant="gradient" size="md" disabled={booking} className="w-full">
            {booking ? "Securing your ride…" : "Book this ride"}
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
            Your Protected Payment was released to the provider. Receipt saved to
            Activity.
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
