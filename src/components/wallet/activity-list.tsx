import {
  ArrowDownLeft,
  ArrowUpRight,
  Car,
  RotateCcw,
  CheckCircle2,
  Receipt,
} from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import type { WalletActivityItem } from "@/lib/payments/wallet-activity";
import type { TransactionType } from "@/types/database";

function usd(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    cents / 100,
  );
}

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

const ICON: Record<TransactionType, typeof Car> = {
  deposit: ArrowDownLeft,
  withdrawal: ArrowUpRight,
  ride_payment: Car,
  refund: RotateCcw,
  settlement: CheckCircle2,
};

export function ActivityList({ items }: { items: WalletActivityItem[] }) {
  if (items.length === 0) {
    return (
      <GlassCard className="flex flex-col items-center py-12 text-center">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/5 text-muted">
          <Receipt className="h-6 w-6" />
        </span>
        <p className="mt-4 text-sm text-muted">
          No activity yet. Add funds or take a ride to get started.
        </p>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((it) => {
        const Icon = ICON[it.type] ?? Receipt;
        return (
          <GlassCard key={it.id} className="flex items-center gap-3 py-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/5 text-foreground">
              <Icon className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="font-medium text-foreground">{it.label}</div>
              <div className="text-xs text-muted">{fmt(it.createdAt)}</div>
            </div>
            <div className={it.credit ? "font-medium text-teal" : "font-medium text-foreground"}>
              {it.credit ? "+" : "−"}
              {usd(it.amountCents)}
            </div>
          </GlassCard>
        );
      })}
    </div>
  );
}
