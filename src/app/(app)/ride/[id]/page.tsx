import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Car, Receipt } from "lucide-react";
import { getRideStatus } from "@/lib/payments/ride-status";
import { LiveStatus } from "@/components/ride/live-status";

function usd(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    cents / 100,
  );
}

const STATUS_BADGE: Record<string, string> = {
  ACCEPTED: "Booked",
  ESCROW_FUNDED: "Payment secured",
  IN_PROGRESS: "On the way",
  COMPLETED: "Arrived",
  SETTLED: "Settled",
  CANCELLED: "Cancelled",
};

export default async function RideDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const view = await getRideStatus(id);
  if (!view) redirect("/activity");

  return (
    <div className="space-y-6">
      <Link
        href="/activity"
        className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Activity
      </Link>

      <div className="flex items-center gap-4">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-brand text-white">
          <Car className="h-6 w-6" />
        </span>
        <div className="flex-1">
          <h1 className="font-display text-2xl font-bold tracking-tight">
            {view.booking.provider}
          </h1>
          <p className="text-muted">
            {usd(view.booking.fareCents)} ·{" "}
            <span className="text-foreground/80">
              {STATUS_BADGE[view.booking.status] ?? view.booking.status}
            </span>
          </p>
          {view.booking.isReassignment ? (
            <span className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-violet/15 px-2.5 py-0.5 text-xs font-medium text-violet">
              Rebooked by your agent after a cancellation
            </span>
          ) : null}
        </div>
      </div>

      <LiveStatus initial={view} />

      <Link
        href={`/ride/${view.booking.id}/receipt`}
        className="inline-flex items-center gap-1.5 text-sm text-muted transition hover:text-foreground"
      >
        <Receipt className="h-4 w-4" />
        View receipt
      </Link>
    </div>
  );
}
