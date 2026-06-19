"use client";

import { Check, Loader2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LifecycleEvent } from "@/lib/payments/ride-status";
import type { RideStatus } from "@/types/database";

// The canonical 8-state lifecycle (spec order), with Web2-first labels.
const STAGES: { status: RideStatus; label: string }[] = [
  { status: "REQUESTED", label: "Requested" },
  { status: "SEARCHING", label: "Comparing rides" },
  { status: "PROVIDER_SELECTED", label: "Provider selected" },
  { status: "ACCEPTED", label: "Booking confirmed" },
  { status: "ESCROW_FUNDED", label: "Protected Payment secured" },
  { status: "IN_PROGRESS", label: "On the way" },
  { status: "COMPLETED", label: "Arrived" },
  { status: "SETTLED", label: "Settled" },
];

const ORDER = STAGES.map((s) => s.status);

function fmtTime(iso: string): string {
  // Stable HH:MM display without locale surprises.
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

export function StatusTimeline({
  currentStatus,
  events,
  pending = false,
}: {
  currentStatus: RideStatus;
  events: LifecycleEvent[];
  pending?: boolean;
}) {
  const cancelled = currentStatus === "CANCELLED";
  const currentIdx = ORDER.indexOf(currentStatus);

  // Map status -> the latest event for its detail/time.
  const lastByStatus = new Map<string, LifecycleEvent>();
  for (const e of events) lastByStatus.set(e.status, e);

  if (cancelled) {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-[#ff6e84]/30 bg-[#ff6e84]/10 p-4">
        <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#ff9bab]" />
        <div>
          <p className="font-medium text-[#ff9bab]">Ride cancelled</p>
          <p className="text-sm text-muted">
            Your Protected Payment is safe. Your agent can find an alternative.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ol className="relative space-y-5 pl-2">
      {STAGES.map((stage, i) => {
        const done = i < currentIdx;
        const active = i === currentIdx;
        const ev = lastByStatus.get(stage.status);
        const reached = done || active;
        const isLast = i === STAGES.length - 1;

        return (
          <li key={stage.status} className="relative flex gap-4">
            {/* connector line */}
            {!isLast ? (
              <span
                className={cn(
                  "absolute left-[13px] top-7 h-[calc(100%+4px)] w-px",
                  done ? "bg-gradient-to-b from-indigo to-violet/40" : "bg-white/10",
                )}
              />
            ) : null}

            <span
              className={cn(
                "z-10 grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs",
                reached ? "bg-gradient-brand text-white" : "bg-white/10 text-muted",
              )}
            >
              {active && pending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : reached ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                i + 1
              )}
            </span>

            <div className="flex-1 pb-1">
              <div className="flex items-center justify-between gap-3">
                <span
                  className={cn(
                    "text-sm",
                    active ? "font-medium text-foreground" : reached ? "text-foreground/80" : "text-muted/60",
                  )}
                >
                  {stage.label}
                </span>
                {ev ? (
                  <span className="font-mono text-xs text-muted/70">
                    {fmtTime(ev.createdAt)}
                  </span>
                ) : null}
              </div>
              {ev?.detail && reached ? (
                <p className="mt-0.5 text-xs text-muted">{ev.detail}</p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
