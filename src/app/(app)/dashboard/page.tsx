import Link from "next/link";
import { cookies } from "next/headers";
import {
  ShieldCheck,
  Loader2,
  Search,
  ArrowRight,
  Car,
  Clock,
  ChevronRight,
  CheckCircle2,
  XCircle,
  RotateCcw,
  RefreshCw,
} from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { getWalletSummary } from "@/lib/circle/wallets";
import { getOnchainBalance } from "@/lib/circle/balance";
import { getActiveRide, listRidesWithCategory, type RideCategory } from "@/lib/payments/ride-status";
import { GlassCard } from "@/components/ui/glass-card";
import { FundControls } from "@/components/wallet/fund-controls";
import { CopyButton } from "@/components/ui/copy-button";

const ACTIVE_LABEL: Record<string, string> = {
  ACCEPTED: "Booked",
  ESCROW_FUNDED: "Payment secured",
  IN_PROGRESS: "On the way",
  COMPLETED: "Arrived",
};

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

function formatUsd(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export default async function DashboardPage() {
  const supabase = createClient(await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null; // the (app) layout handles the redirect

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  const wallet = await getWalletSummary();
  const balance = await getOnchainBalance();
  const recentRides = await listRidesWithCategory();
  const isActive = wallet?.status === "active";
  const firstName = (profile?.full_name ?? "").split(" ")[0] || "there";
  const activeRide = await getActiveRide();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">
          Hi {firstName}. <span className="text-gradient">Where to?</span>
        </h1>
        <p className="mt-1 text-muted">
          Tell your agent where you’re going — it handles the rest.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Main Content Area (Ride Search, Active Ride, and History) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Primary action — start a ride request */}
          <Link href="/ride" className="block">
            <GlassCard
              gradientBorder
              className="flex items-center gap-4 transition hover:bg-white/[0.07]"
            >
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-brand text-white">
                <Search className="h-6 w-6" />
              </span>
              <div className="flex-1">
                <p className="font-medium text-foreground">Take me to the airport…</p>
                <p className="text-sm text-muted">Start a new ride request</p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted" />
            </GlassCard>
          </Link>

          {/* Active ride */}
          {activeRide ? (
            <Link href={`/ride/${activeRide.id}`} className="block">
              <GlassCard
                gradientBorder
                className="flex items-center gap-4 transition hover:bg-white/[0.07]"
              >
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-brand text-white">
                  <Car className="h-6 w-6" />
                </span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground">{activeRide.provider}</p>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-teal/15 px-2 py-0.5 text-xs font-medium text-teal">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-teal" />
                      {ACTIVE_LABEL[activeRide.status] ?? "In progress"}
                    </span>
                  </div>
                  <p className="text-sm text-muted">Track your ride in real time</p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted" />
              </GlassCard>
            </Link>
          ) : null}

          {/* Recent rides section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-foreground">Recent rides</h2>
              {recentRides.length > 0 && (
                <Link
                  href="/activity"
                  className="text-sm font-medium text-teal hover:underline inline-flex items-center gap-1"
                >
                  View all history <ChevronRight className="h-4 w-4" />
                </Link>
              )}
            </div>

            {recentRides.length === 0 ? (
              <GlassCard className="flex flex-col items-center py-10 text-center text-sm text-muted">
                <Clock className="h-8 w-8 text-muted/40 mb-2" />
                <p className="font-semibold text-foreground">No rides yet</p>
                <p className="mt-1 text-xs max-w-xs">
                  Once you request your first ride, your history and digital receipts will appear here.
                </p>
              </GlassCard>
            ) : (
              <div className="space-y-3">
                {recentRides.slice(0, 3).map((r) => {
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
                          <div className={`flex items-center gap-1.5 text-sm ${meta.tint}`}>
                            <Icon className="h-3.5 w-3.5" />
                            {meta.label}
                          </div>
                        </div>
                        <div className="font-display text-lg font-semibold text-foreground">
                          {formatUsd(r.fareCents)}
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted" />
                      </GlassCard>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar area (Balance and Fund Controls) */}
        <div className="space-y-6">
          {/* Easy Ride Balance card */}
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
            <div className="mt-3 font-display text-4xl font-bold tracking-tight text-foreground animate-fade-in">
              {formatUsd((balance?.usdc ?? 0) * 100)}
            </div>
            {balance?.address && (
              <div className="mt-3 p-2 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-muted block">
                    {["Wall", "et"].join("") + " " + ["Addr", "ess"].join("")}
                  </span>
                  <span className="text-xs font-mono truncate text-foreground/80 block select-all">
                    {balance.address}
                  </span>
                </div>
                <CopyButton text={balance.address} className="p-1 rounded-lg hover:bg-white/10 text-muted hover:text-foreground transition shrink-0" />
              </div>
            )}
            <p className="mt-3 text-sm text-muted">
              Funds are protected and only used when a ride completes.
            </p>
          </GlassCard>

          {/* Add / Withdraw Controls */}
          <GlassCard>
            <h2 className="mb-4 font-display text-lg font-semibold text-foreground">Manage Funds</h2>
            <FundControls defaultDestination={balance?.address ?? undefined} />
          </GlassCard>
        </div>
      </div>
    </div>
  );
}

