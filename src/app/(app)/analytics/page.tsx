import { Sparkles, Clock, CircleCheck, Gauge, TrendingUp } from "lucide-react";
import { getAnalytics } from "@/lib/analytics/metrics";
import { GlassCard } from "@/components/ui/glass-card";
import { StatCard } from "@/components/analytics/stat-card";

function usd(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    cents / 100,
  );
}

function fmtMinutes(min: number) {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

export default async function AnalyticsPage() {
  const a = await getAnalytics();
  const hasRides = a.totalRides > 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">
          Your <span className="text-gradient">impact</span>
        </h1>
        <p className="mt-1 text-muted">What your AI agent has done for you.</p>
      </div>

      {!hasRides ? (
        <GlassCard className="flex flex-col items-center py-16 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-white/5 text-muted">
            <TrendingUp className="h-7 w-7" />
          </span>
          <p className="mt-5 font-display text-lg font-semibold">No data yet</p>
          <p className="mt-1 max-w-xs text-sm text-muted">
            Take your first ride and your savings, time saved, and optimization
            score will appear here.
          </p>
        </GlassCard>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4">
            <StatCard
              icon={<Sparkles className="h-5 w-5" />}
              value={usd(a.savingsCents)}
              label="Money saved"
              sublabel="vs the priciest option"
            />
            <StatCard
              icon={<Clock className="h-5 w-5" />}
              value={fmtMinutes(a.timeSavedMinutes)}
              label="Time saved"
              sublabel="vs the slowest option"
            />
            <StatCard
              icon={<CircleCheck className="h-5 w-5" />}
              value={`${a.successRate}%`}
              label="Ride success rate"
              sublabel="trips completed"
            />
            <StatCard
              icon={<Gauge className="h-5 w-5" />}
              value={`${a.optimizationScore}/100`}
              label="Optimization score"
              sublabel="how well your agent chose"
            />
          </div>

          <GlassCard>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Summary label="Total rides" value={a.totalRides} />
              <Summary label="Completed" value={a.completedRides} />
              <Summary label="Rebooked" value={a.reassignedRides} />
              <Summary label="Cancelled" value={a.cancelledRides} />
            </div>
          </GlassCard>
        </>
      )}
    </div>
  );
}

function Summary({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="font-display text-2xl font-bold tracking-tight">{value}</div>
      <div className="text-xs text-muted">{label}</div>
    </div>
  );
}
