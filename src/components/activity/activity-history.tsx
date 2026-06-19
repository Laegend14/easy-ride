"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Car,
  CheckCircle2,
  XCircle,
  RotateCcw,
  RefreshCw,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { GlassCard } from "@/components/ui/glass-card";
import type { RideCategory, RideHistoryItem } from "@/lib/payments/ride-status";

type Filter = "all" | RideCategory;

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
  { key: "refunded", label: "Refunded" },
  { key: "reassigned", label: "Rebooked" },
];

const CATEGORY_META: Record<
  RideCategory,
  { label: string; icon: typeof Car; tint: string }
> = {
  active: { label: "In progress", icon: ShieldCheck, tint: "text-teal" },
  completed: { label: "Completed", icon: CheckCircle2, tint: "text-teal" },
  cancelled: { label: "Cancelled", icon: XCircle, tint: "text-[#ff9bab]" },
  refunded: { label: "Refunded", icon: RotateCcw, tint: "text-[#f6c177]" },
  reassigned: { label: "Rebooked", icon: RefreshCw, tint: "text-violet" },
};

function usd(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    cents / 100,
  );
}

export function ActivityHistory({ items }: { items: RideHistoryItem[] }) {
  const [filter, setFilter] = useState<Filter>("all");

  const counts = useMemo(() => {
    const c: Record<Filter, number> = {
      all: items.length,
      active: 0,
      completed: 0,
      cancelled: 0,
      refunded: 0,
      reassigned: 0,
    };
    for (const it of items) c[it.category] += 1;
    return c;
  }, [items]);

  const filtered = filter === "all" ? items : items.filter((i) => i.category === filter);

  return (
    <div className="space-y-5">
      {/* Filter tabs */}
      <div className="-mx-1 flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((f) => {
          const active = filter === f.key;
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm transition",
                active
                  ? "bg-gradient-brand text-white shadow-lg shadow-indigo/20"
                  : "glass text-muted hover:text-foreground",
              )}
            >
              {f.label}
              <span
                className={cn(
                  "rounded-full px-1.5 text-xs",
                  active ? "bg-white/20" : "bg-white/10",
                )}
              >
                {counts[f.key]}
              </span>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <GlassCard className="py-12 text-center text-sm text-muted">
          No {filter === "all" ? "" : FILTERS.find((f) => f.key === filter)?.label.toLowerCase() + " "}
          rides yet.
        </GlassCard>
      ) : (
        <motion.div
          key={filter}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="space-y-3"
        >
          {filtered.map((r) => {
            const meta = CATEGORY_META[r.category];
            const Icon = meta.icon;
            return (
              <Link key={r.id} href={`/ride/${r.id}`} className="block">
                <GlassCard className="flex items-center gap-4 transition hover:bg-white/[0.07]">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-brand text-white">
                    <Car className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-foreground">{r.provider}</div>
                    <div className={cn("flex items-center gap-1.5 text-sm", meta.tint)}>
                      <Icon className="h-3.5 w-3.5" />
                      {meta.label}
                    </div>
                  </div>
                  <div className="font-display text-lg font-semibold">
                    {usd(r.fareCents)}
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted" />
                </GlassCard>
              </Link>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
