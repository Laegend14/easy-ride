import { ShieldCheck, Loader2, Sparkles } from "lucide-react";
import { getWalletSummary } from "@/lib/circle/wallets";
import { getOnchainBalance } from "@/lib/circle/balance";
import { getSavings } from "@/lib/payments/savings";
import { listWalletActivity } from "@/lib/payments/wallet-activity";
import { GlassCard } from "@/components/ui/glass-card";
import { FundControls } from "@/components/wallet/fund-controls";
import { ActivityList } from "@/components/wallet/activity-list";

function usd(amount: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    amount,
  );
}

export default async function BalancePage() {
  const [wallet, balance, savings, activity] = await Promise.all([
    getWalletSummary(),
    getOnchainBalance(),
    getSavings(),
    listWalletActivity(),
  ]);
  const isActive = wallet?.status === "active";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Balance</h1>
        <p className="mt-1 text-muted">
          Your protected balance for rides and settlements.
        </p>
      </div>

      {/* Balance hero — read live from chain */}
      <GlassCard gradientBorder className="aurora-mesh">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted">Easy Ride Balance</span>
          {isActive ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-teal/15 px-3 py-1 text-xs font-medium text-teal">
              <ShieldCheck className="h-3.5 w-3.5" />
              Active · Protected
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-muted">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Setting up…
            </span>
          )}
        </div>
        <div className="mt-3 font-display text-5xl font-bold tracking-tight">
          {usd(balance?.usdc ?? 0)}
        </div>
        <p className="mt-2 text-sm text-muted">Updated live from your account.</p>
      </GlassCard>

      {/* Savings */}
      <GlassCard className="flex items-center gap-4">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-brand text-white">
          <Sparkles className="h-6 w-6" />
        </span>
        <div className="flex-1">
          <div className="font-display text-2xl font-bold tracking-tight text-gradient">
            {usd((savings.savingsCents ?? 0) / 100)}
          </div>
          <p className="text-sm text-muted">
            {savings.ridesOptimized > 0
              ? `Your AI saved you this much across ${savings.ridesOptimized} ride${savings.ridesOptimized === 1 ? "" : "s"}.`
              : "Your AI will show savings here as you ride."}
          </p>
        </div>
      </GlassCard>

      {/* Add / Withdraw — real on-chain */}
      <GlassCard>
        <FundControls defaultDestination={balance?.address ?? undefined} />
      </GlassCard>

      {/* Recent activity */}
      <div>
        <h2 className="mb-3 font-display text-lg font-semibold">Recent activity</h2>
        <ActivityList items={activity} />
      </div>
    </div>
  );
}
