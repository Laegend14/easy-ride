"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Car,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  RotateCcw,
  RefreshCw,
  Clock,
  ArrowRight,
  MapPin,
  Sparkles,
  Zap,
  ExternalLink,
} from "lucide-react";
import { type RideHistoryItem, type RideCategory } from "@/lib/payments/ride-status";
import { cn } from "@/lib/utils";

interface RideHistorySliderProps {
  rides: RideHistoryItem[];
}

const CATEGORY_STYLES: Record<
  RideCategory,
  { label: string; icon: typeof CheckCircle2; bg: string; text: string; border: string }
> = {
  active: {
    label: "In Progress",
    icon: ShieldCheck,
    bg: "bg-teal/15",
    text: "text-teal",
    border: "border-teal/30",
  },
  completed: {
    label: "Completed",
    icon: CheckCircle2,
    bg: "bg-emerald-500/15",
    text: "text-emerald-400",
    border: "border-emerald-500/30",
  },
  cancelled: {
    label: "Cancelled",
    icon: XCircle,
    bg: "bg-rose-500/15",
    text: "text-rose-400",
    border: "border-rose-500/30",
  },
  refunded: {
    label: "Refunded",
    icon: RotateCcw,
    bg: "bg-amber-400/15",
    text: "text-amber-400",
    border: "border-amber-400/30",
  },
  reassigned: {
    label: "Rebooked",
    icon: RefreshCw,
    bg: "bg-violet/15",
    text: "text-violet",
    border: "border-violet/30",
  },
};

function formatUsd(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function RideHistorySlider({ rides }: RideHistorySliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const hasRides = rides && rides.length > 0;
  const currentRide = hasRides ? rides[currentIndex] : null;

  const handlePrev = () => {
    if (!hasRides) return;
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : rides.length - 1));
  };

  const handleNext = () => {
    if (!hasRides) return;
    setCurrentIndex((prev) => (prev < rides.length - 1 ? prev + 1 : 0));
  };

  return (
    <div className="space-y-3.5">
      {/* Header with Navigation Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-teal/10 border border-teal/20 flex items-center justify-center text-teal">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-display text-base font-bold text-foreground">
              Your Ride History
            </h2>
            <p className="text-[11px] text-muted">
              {hasRides
                ? `${rides.length} trip${rides.length === 1 ? "" : "s"} recorded`
                : "No past journeys"}
            </p>
          </div>
        </div>

        {/* Slider Controls (if multiple rides) or View All link */}
        <div className="flex items-center gap-2">
          {hasRides && rides.length > 1 && (
            <div className="flex items-center gap-1.5 bg-surface/60 border border-white/10 p-1 rounded-xl">
              <span className="text-[10px] font-semibold text-muted px-1.5">
                {currentIndex + 1} / {rides.length}
              </span>
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Previous ride"
                className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-foreground transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                aria-label="Next ride"
                className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-foreground transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {hasRides && (
            <Link
              href="/activity"
              className="text-xs font-semibold text-teal hover:text-teal/80 inline-flex items-center gap-1 ml-1"
            >
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      </div>

      {/* Main Slide Card Container */}
      {!currentRide ? (
        /* Empty State Card */
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-surface/60 backdrop-blur-xl p-8 text-center space-y-4 shadow-xl">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-teal/10 border border-teal/20 flex items-center justify-center text-teal shadow-lg shadow-teal/10">
            <Car className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="font-display font-bold text-base text-foreground">
              No rides booked yet
            </h3>
            <p className="text-xs text-muted leading-relaxed">
              Your journeys, live routes, price comparisons, and escrow receipts will appear here as you travel.
            </p>
          </div>
          <Link
            href="/ride"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-brand text-white font-bold text-xs shadow-lg shadow-indigo/25 hover:brightness-110 transition"
          >
            <Sparkles className="w-4 h-4" />
            Book your first ride
          </Link>
        </div>
      ) : (
        /* Large Interactive Ride History Card */
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-surface/70 backdrop-blur-xl shadow-2xl transition-all">
          {/* Ambient Card Glow */}
          <div className="pointer-events-none absolute -top-16 -right-16 w-56 h-56 rounded-full bg-teal/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-16 w-56 h-56 rounded-full bg-indigo/10 blur-3xl" />

          {/* Card Top: Provider, Status & Fare */}
          <div className="p-5 sm:p-6 border-b border-white/[0.08] relative z-10 flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-brand p-[1px] shadow-lg shadow-indigo/20 flex items-center justify-center shrink-0">
                <div className="w-full h-full rounded-[15px] bg-[#12121f] flex items-center justify-center">
                  <Car className="w-6 h-6 text-teal" />
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-lg font-bold text-foreground">
                    {currentRide.provider}
                  </h3>
                  {(() => {
                    const meta = CATEGORY_STYLES[currentRide.category] || CATEGORY_STYLES.completed;
                    const StatusIcon = meta.icon;
                    return (
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border",
                          meta.bg,
                          meta.text,
                          meta.border
                        )}
                      >
                        <StatusIcon className="w-3 h-3 shrink-0" />
                        {meta.label}
                      </span>
                    );
                  })()}
                </div>
                <p className="text-xs text-muted mt-0.5">
                  Booked on {formatDate(currentRide.createdAt)}
                </p>
              </div>
            </div>

            {/* Fare Display */}
            <div className="text-right shrink-0">
              <p className="font-display text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                {formatUsd(currentRide.fareCents)}
              </p>
              <span className="inline-block text-[10px] font-bold text-teal bg-teal/10 px-2 py-0.5 rounded-md mt-0.5">
                {currentRide.paymentMethod || "USDC Escrow"}
              </span>
            </div>
          </div>

          {/* Card Middle: Route Visualization (Origin to Destination) */}
          <div className="p-5 sm:p-6 relative z-10 space-y-4">
            <div className="rounded-2xl bg-black/40 border border-white/10 p-4 relative overflow-hidden">
              <div className="space-y-4 relative z-10">
                {/* Origin */}
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-teal/15 border border-teal/30 flex items-center justify-center text-teal shrink-0 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-teal" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted block">
                      Pickup Location
                    </span>
                    <p className="text-sm font-semibold text-foreground truncate">
                      {currentRide.pickupAddress || "Financial District, Market St"}
                    </p>
                  </div>
                </div>

                {/* Connector Dotted Line */}
                <div className="ml-3.5 -my-2 w-0.5 h-6 border-l-2 border-dashed border-teal/40" />

                {/* Destination */}
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-indigo/15 border border-indigo/30 flex items-center justify-center text-indigo shrink-0 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-indigo" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted block">
                      Drop-off Destination
                    </span>
                    <p className="text-sm font-semibold text-foreground truncate">
                      {currentRide.dropoffAddress || "SFO International Airport"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Ride Details / Feature Highlights */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 space-y-0.5">
                <span className="text-[10px] font-semibold text-muted flex items-center gap-1">
                  <Clock className="w-3 h-3 text-teal" /> Estimated Duration
                </span>
                <p className="text-xs font-bold text-foreground">
                  ~{currentRide.etaMinutes || 12} mins
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 space-y-0.5">
                <span className="text-[10px] font-semibold text-muted flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-indigo" /> Settlement
                </span>
                <p className="text-xs font-bold text-foreground">
                  Arc Testnet (1s)
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 space-y-0.5 col-span-2 sm:col-span-1">
                <span className="text-[10px] font-semibold text-muted flex items-center gap-1">
                  <Zap className="w-3 h-3 text-teal" /> AI Rate Optimization
                </span>
                <p className="text-xs font-bold text-teal">
                  Best price matched
                </p>
              </div>
            </div>
          </div>

          {/* Card Footer: View Trip Details Action */}
          <div className="p-4 sm:px-6 bg-white/[0.02] border-t border-white/[0.06] flex items-center justify-between text-xs relative z-10">
            <span className="text-muted text-[11px]">
              Ride ID: #{currentRide.id.slice(0, 10)}…
            </span>
            <Link
              href={`/ride/${currentRide.id}`}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-teal hover:text-white font-bold text-xs inline-flex items-center gap-1.5 transition"
            >
              <span>View Full Trip Details & Receipt</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* Pagination Dot Indicators (when multiple rides) */}
      {hasRides && rides.length > 1 && (
        <div className="flex items-center justify-center gap-1.5 pt-1">
          {rides.map((r, i) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setCurrentIndex(i)}
              aria-label={`Go to ride ${i + 1}`}
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                currentIndex === i ? "w-6 bg-teal" : "w-2 bg-white/20 hover:bg-white/40"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
