"use client";

import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type TimelineStage = {
  key: string;
  label: string;
};

export const BOOKING_STAGES: TimelineStage[] = [
  { key: "PROVIDER_SELECTED", label: "Provider selected" },
  { key: "ACCEPTED", label: "Booking confirmed" },
  { key: "ESCROW_FUNDED", label: "Protected Payment secured" },
  { key: "IN_PROGRESS", label: "On the way" },
  { key: "COMPLETED", label: "Arrived" },
  { key: "SETTLED", label: "Settled" },
];

const ORDER = BOOKING_STAGES.map((s) => s.key);

export function PaymentTimeline({
  currentStatus,
  pending = false,
}: {
  currentStatus: string;
  pending?: boolean;
}) {
  const currentIdx = ORDER.indexOf(currentStatus);

  return (
    <ol className="space-y-3">
      {BOOKING_STAGES.map((stage, i) => {
        const done = i < currentIdx;
        const active = i === currentIdx;
        return (
          <li key={stage.key} className="flex items-center gap-3">
            <span
              className={cn(
                "grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs",
                done || active ? "bg-gradient-brand text-white" : "bg-white/10 text-muted",
              )}
            >
              {active && pending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : done || active ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                i + 1
              )}
            </span>
            <span
              className={cn(
                "text-sm",
                active ? "font-medium text-foreground" : done ? "text-muted" : "text-muted/60",
              )}
            >
              {stage.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
