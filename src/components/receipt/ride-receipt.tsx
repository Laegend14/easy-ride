"use client";

import { MapPin, Navigation, Printer, CheckCircle2, RotateCcw, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import type { RideReceipt, ReceiptType } from "@/lib/payments/receipt";

function usd(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    cents / 100,
  );
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

const TYPE_META: Record<
  ReceiptType,
  { title: string; chip: string; chipClass: string; icon: typeof CheckCircle2 }
> = {
  settlement: {
    title: "Settlement Receipt",
    chip: "Paid",
    chipClass: "bg-teal/15 text-teal",
    icon: CheckCircle2,
  },
  refund: {
    title: "Refund Receipt",
    chip: "Refunded",
    chipClass: "bg-[#f6c177]/15 text-[#f6c177]",
    icon: RotateCcw,
  },
  ride: {
    title: "Ride Receipt",
    chip: "Protected",
    chipClass: "bg-indigo/15 text-indigo",
    icon: ShieldCheck,
  },
};

export function RideReceipt({ receipt }: { receipt: RideReceipt }) {
  const meta = TYPE_META[receipt.receiptType];
  const Icon = meta.icon;

  return (
    <div className="space-y-4">
      <GlassCard className="receipt-sheet space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Easy Ride Logo" className="h-9 w-9 rounded-xl object-cover" />
            <div>
              <div className="font-display font-semibold tracking-tight">
                Easy<span className="text-gradient">Ride</span>
              </div>
              <div className="text-xs text-muted">Digital Receipt</div>
            </div>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${meta.chipClass}`}
          >
            <Icon className="h-3.5 w-3.5" />
            {meta.chip}
          </span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <div>
            <div className="font-display text-lg font-semibold">{meta.title}</div>
            <div className="text-muted">No. {receipt.receiptNo}</div>
          </div>
          <div className="text-right text-muted">{fmtDate(receipt.issuedAt)}</div>
        </div>

        {/* Route */}
        <div className="rounded-2xl bg-white/[0.03] p-4">
          <div className="mb-2 text-sm font-medium text-foreground">{receipt.provider}</div>
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <Navigation className="mt-0.5 h-4 w-4 shrink-0 text-teal" />
              <span className="text-muted">{receipt.originAddress ?? "Pickup"}</span>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-violet" />
              <span className="text-muted">
                {receipt.destinationAddress ?? "Destination"}
              </span>
            </div>
          </div>
        </div>

        {/* Line items */}
        <div className="space-y-2">
          {receipt.lineItems.map((li, i) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <span className="text-muted">{li.label}</span>
              <span className={li.credit ? "text-teal" : "text-foreground"}>
                {li.credit ? "+" : ""}
                {usd(li.amountCents)}
              </span>
            </div>
          ))}
          <div className="my-1 border-t border-white/10" />
          <div className="flex items-center justify-between">
            <span className="font-medium text-foreground">{receipt.totalLabel}</span>
            <span className="font-display text-lg font-semibold">
              {usd(receipt.totalCents)}
            </span>
          </div>
        </div>

        {/* Payment method */}
        <div className="flex items-center justify-between rounded-xl bg-white/[0.03] px-4 py-3 text-sm">
          <span className="text-muted">Payment</span>
          <span className="text-foreground">{receipt.paymentMethod}</span>
        </div>

        {/* Verifiable Payment Records */}
        {receipt.paymentRecords && receipt.paymentRecords.length > 0 && (
          <div className="space-y-2 rounded-xl bg-white/[0.03] px-4 py-3 text-sm">
            <span className="text-xs font-semibold text-muted uppercase tracking-wider block">
              Payment verification
            </span>
            <div className="space-y-1.5 mt-1">
              {receipt.paymentRecords.map((rec, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="text-muted">{rec.label}</span>
                  <a
                    href={rec.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-teal hover:underline flex items-center gap-0.5"
                  >
                    {rec.shortId}
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-center text-xs text-muted/70">
          Thank you for riding with Easy Ride. Your payment is always protected.
        </p>
      </GlassCard>

      <div className="no-print">
        <Button
          type="button"
          variant="glass"
          size="md"
          className="w-full"
          onClick={() => window.print()}
        >
          <Printer className="h-4 w-4" />
          Print or save as PDF
        </Button>
      </div>
    </div>
  );
}
