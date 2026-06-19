"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldCheck, CheckCircle2, AlertCircle, RefreshCw, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { StatusTimeline } from "./status-timeline";
import { MockMap } from "./mock-map";
import {
  completeTrip,
  simulateCancellation,
  refreshRideStatus,
  type BookingState,
  type RecoveryState,
} from "@/app/(app)/ride/actions";
import type { RideStatusView } from "@/lib/payments/ride-status";

const INITIAL: BookingState = { error: null };
const INITIAL_RECOVERY: RecoveryState = { error: null };

export function LiveStatus({ initial }: { initial: RideStatusView }) {
  const router = useRouter();
  const [view, setView] = useState(initial);
  const [trip, tripAction, settling] = useActionState(completeTrip, INITIAL);
  const [recovery, recoverAction, recovering] = useActionState(
    simulateCancellation,
    INITIAL_RECOVERY,
  );
  const [cancellationTriggered, setCancellationTriggered] = useState(false);

  // Poll for status updates while the ride is active.
  useEffect(() => {
    if (!view.isActive) return;
    let alive = true;
    const id = setInterval(async () => {
      const next = await refreshRideStatus(view.booking.id);
      if (alive && next) setView(next);
    }, 4000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [view.isActive, view.booking.id]);

  // Reflect a settlement triggered from this page immediately.
  useEffect(() => {
    if (trip.status && trip.bookingId === view.booking.id) {
      refreshRideStatus(view.booking.id).then((next) => next && setView(next));
    }
  }, [trip.status, trip.bookingId, view.booking.id]);

  // After a recovery, refresh this (now-cancelled) ride so the timeline updates.
  useEffect(() => {
    if (recovery.recovered || recovery.refunded) {
      refreshRideStatus(view.booking.id).then((next) => next && setView(next));
    }
  }, [recovery.recovered, recovery.refunded, view.booking.id]);

  const settled = view.booking.status === "SETTLED";
  const cancelled = view.booking.status === "CANCELLED";

  return (
    <GlassCard gradientBorder className="space-y-5">
      <div className="flex items-center gap-2">
        {settled ? (
          <CheckCircle2 className="h-5 w-5 text-teal" />
        ) : (
          <ShieldCheck className="h-5 w-5 text-teal" />
        )}
        <span className="font-display text-lg font-semibold">Ride status</span>
        {view.isActive ? (
          <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-teal/15 px-3 py-1 text-xs font-medium text-teal">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-teal" />
            Live
          </span>
        ) : null}
      </div>

      <MockMap
        originAddress={view.booking.originAddress}
        originLat={view.booking.originLat}
        originLng={view.booking.originLng}
        destinationAddress={view.booking.destinationAddress}
        destinationLat={view.booking.destinationLat}
        destinationLng={view.booking.destinationLng}
        status={view.booking.status}
        provider={view.booking.provider}
      />

      <StatusTimeline
        currentStatus={view.booking.status}
        events={view.events}
        pending={settling}
      />

      {trip.error ? (
        <div className="flex items-start gap-2 rounded-xl border border-[#ff6e84]/30 bg-[#ff6e84]/10 px-3 py-2.5 text-sm text-[#ff9bab]">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{trip.error}</span>
        </div>
      ) : null}

      {/* Recovery outcome banner */}
      {recovery.recovered ? (
        <div className="space-y-3 rounded-2xl border border-teal/30 bg-teal/10 p-4">
          <p className="text-sm text-foreground">{recovery.reasoning}</p>
          {recovery.newBookingId ? (
            <Button
              type="button"
              variant="gradient"
              size="md"
              className="w-full"
              onClick={() => router.push(`/ride/${recovery.newBookingId}`)}
            >
              Track your new ride
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : null}
        </div>
      ) : recovery.refunded ? (
        <div className="rounded-2xl border border-[#ff6e84]/30 bg-[#ff6e84]/10 p-4 text-sm text-[#ff9bab]">
          {recovery.reasoning}
        </div>
      ) : null}

      {recovery.error ? (
        <div className="flex items-start gap-2 rounded-xl border border-[#ff6e84]/30 bg-[#ff6e84]/10 px-3 py-2.5 text-sm text-[#ff9bab]">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{recovery.error}</span>
        </div>
      ) : null}

      {/* Controls */}
      {view.isActive && !recovery.recovered && !recovery.refunded ? (
        <div className="space-y-3">
          {cancellationTriggered ? (
            <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4 animate-fade-in">
              <p className="text-sm font-medium text-foreground">
                Driver has cancelled. How would you like your AI Agent to proceed?
              </p>
              <div className="flex flex-col sm:flex-row gap-2.5">
                <form action={recoverAction} className="flex-1" onSubmit={() => setCancellationTriggered(false)}>
                  <input type="hidden" name="bookingId" value={view.booking.id} />
                  <input type="hidden" name="action" value="rebook" />
                  <Button
                    type="submit"
                    variant="gradient"
                    size="md"
                    disabled={recovering}
                    className="w-full"
                  >
                    Find new ride
                  </Button>
                </form>

                <form action={recoverAction} className="flex-1" onSubmit={() => setCancellationTriggered(false)}>
                  <input type="hidden" name="bookingId" value={view.booking.id} />
                  <input type="hidden" name="action" value="refund" />
                  <Button
                    type="submit"
                    variant="glass"
                    size="md"
                    disabled={recovering}
                    className="w-full text-[#ff9bab] hover:text-[#ff9bab]/90"
                  >
                    Refund balance
                  </Button>
                </form>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setCancellationTriggered(false)}
                className="w-full text-xs text-muted"
              >
                Back to active ride
              </Button>
            </div>
          ) : (
            <>
              <form action={tripAction}>
                <input type="hidden" name="bookingId" value={view.booking.id} />
                <Button type="submit" variant="glass" size="md" disabled={settling || recovering} className="w-full">
                  {settling ? "Advancing your trip…" : "Simulate ride completion"}
                </Button>
              </form>
              <Button
                type="button"
                variant="ghost"
                size="md"
                onClick={() => setCancellationTriggered(true)}
                disabled={settling || recovering}
                className="w-full"
              >
                <RefreshCw className={recovering ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
                {recovering ? "Recovering your ride…" : "Simulate driver cancellation"}
              </Button>
            </>
          )}
        </div>
      ) : settled ? (
        <p className="text-sm text-teal">
          Trip complete. Your Protected Payment was released and a digital receipt
          saved to Activity.
        </p>
      ) : cancelled && !recovery.recovered && !recovery.refunded ? (
        <p className="text-sm text-muted">This ride was cancelled.</p>
      ) : null}
    </GlassCard>
  );
}
