import Link from "next/link";
import {
  Car,
  TrendingUp,
  Zap,
  ArrowRight,
  Plus,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { getCurrentFirebaseUser } from "@/lib/firebase/session";
import { getUserProfile } from "@/lib/firebase/db";
import { getWalletSummary } from "@/lib/circle/wallets";
import { getOnchainBalance } from "@/lib/circle/balance";
import { getActiveRide, listRidesWithCategory } from "@/lib/payments/ride-status";
import { DashboardSearchBar } from "@/components/dashboard/search-bar";
import { DashboardWalletCard } from "@/components/dashboard/dashboard-wallet-card";
import { RideHistorySlider } from "@/components/dashboard/ride-history-slider";
import { verifyAndCreditCheckout } from "@/lib/payments/stripe-checkout";

const ACTIVE_LABEL: Record<string, string> = {
  ACCEPTED: "Booked", ESCROW_FUNDED: "Payment secured",
  IN_PROGRESS: "On the way", COMPLETED: "Arrived",
};

function formatUsd(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

interface DashboardPageProps {
  searchParams?: Promise<{
    stripe_success?: string;
    session_id?: string;
    stripe_cancel?: string;
  }>;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const fbUser = await getCurrentFirebaseUser();
  if (!fbUser) return null;

  const params = searchParams ? await searchParams : {};
  let stripeNotice: { success: boolean; amount?: number } | null = null;

  if (params.stripe_success === "true" && params.session_id) {
    const res = await verifyAndCreditCheckout(params.session_id);
    if (res.success) {
      stripeNotice = { success: true, amount: res.amountDollars };
    }
  }

  const [profile, wallet, balance, recentRides, activeRide] = await Promise.all([
    getUserProfile(fbUser.uid),
    getWalletSummary(),
    getOnchainBalance(),
    listRidesWithCategory(),
    getActiveRide(),
  ]);

  const fullName      = profile?.fullName || fbUser.displayName || "";
  const firstName     = fullName.split(" ")[0] || "there";
  const isActive      = wallet?.status === "active";
  const totalSpent    = recentRides.filter(r => r.category === "completed").reduce((s, r) => s + r.fareCents, 0);
  const completedCount= recentRides.filter(r => r.category === "completed").length;
  const hour          = new Date().getHours();
  const greeting      = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    /* Extra bottom padding on mobile so content clears the bottom nav bar */
    <div className="py-4 pb-28 md:py-6 md:pb-10 space-y-5">

      {/* ── Greeting ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-muted">{greeting} 👋</p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight mt-0.5">
            {firstName}<span className="text-gradient">,</span>{" "}
            <span className="text-foreground/75 font-semibold">where to?</span>
          </h1>
        </div>
        <Link
          href="/ride"
          className="flex items-center gap-2 bg-gradient-brand text-white rounded-2xl px-4 py-2.5 font-semibold text-sm shadow-lg shadow-indigo/25 hover:brightness-110 transition shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Book a ride</span>
          <span className="sm:hidden">Book</span>
        </Link>
      </div>

      {/* ── Stripe deposit status notice ─────────────────────────── */}
      {stripeNotice && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-teal/15 border border-teal/30 text-teal text-sm shadow-lg shadow-teal/10 animate-in fade-in duration-300">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <div>
            <p className="font-bold">Real Stripe Deposit Confirmed!</p>
            <p className="text-xs text-teal/80">
              ${stripeNotice.amount?.toFixed(2)} USD verified via Stripe and added to your balance.
            </p>
          </div>
        </div>
      )}
      {params.stripe_cancel === "true" && (
        <div className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-white/5 border border-white/10 text-muted text-xs">
          <span>Stripe checkout was cancelled. No funds were debited.</span>
        </div>
      )}

      {/* ── Active ride banner ─────────────────────────────────────── */}
      {activeRide && (
        <Link href={`/ride/${activeRide.id}`} className="block">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-brand p-4 flex items-center gap-3 shadow-xl shadow-indigo/25 hover:brightness-105 transition">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
              <Car className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                <span className="text-white font-bold text-sm">{activeRide.provider}</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-semibold text-white">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  {ACTIVE_LABEL[activeRide.status] ?? "In progress"}
                </span>
              </div>
              <p className="text-white/70 text-xs">Tap to track your ride in real time</p>
            </div>
            <ArrowRight className="w-4 h-4 text-white/70 shrink-0" />
            <div className="pointer-events-none absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/5 blur-2xl" />
          </div>
        </Link>
      )}

      {/* ── AI search bar ──────────────────────────────────────────── */}
      <DashboardSearchBar />

      {/* ── 4 stat cards (2×2 mobile, 4×1 desktop) ───────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Balance",      value: formatUsd((balance?.usdc ?? 0) * 100), sub: isActive ? "Protected" : "Setting up…", icon: ShieldCheck, accent: "border-teal/20 text-teal" },
          { label: "Total rides",  value: String(recentRides.length),            sub: `${completedCount} done`,               icon: Car,         accent: "border-indigo/20 text-indigo" },
          { label: "Total spent",  value: formatUsd(totalSpent),                 sub: "Lifetime",                             icon: TrendingUp,  accent: "border-violet/20 text-violet" },
          { label: "AI savings",   value: "~12%",                                sub: "vs. booking direct",                   icon: Zap,         accent: "border-teal/20 text-teal" },
        ].map(({ label, value, sub, icon: Icon, accent }) => (
          <div key={label} className={`relative overflow-hidden rounded-2xl border p-4 bg-surface/60 backdrop-blur-sm ${accent.split(" ")[0]}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted">{label}</span>
              <Icon className={`w-3.5 h-3.5 ${accent.split(" ")[1]}`} />
            </div>
            <p className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">{value}</p>
            <p className="text-[10px] text-muted mt-0.5">{sub}</p>
            <div className="pointer-events-none absolute -bottom-4 -right-4 w-16 h-16 rounded-full blur-2xl opacity-20 bg-gradient-brand" />
          </div>
        ))}
      </div>

      {/* ── Main 2-col layout ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 items-start">

        {/* Left col (3/5) */}
        <div className="lg:col-span-3 space-y-5">
          {/* Large Visual Ride History with Sliding Carousel */}
          <RideHistorySlider rides={recentRides} />
        </div>

        {/* Right col (2/5) */}
        <div className="lg:col-span-2 space-y-5">
          {/* Consolidated Smart Wallet & Funding Card */}
          <DashboardWalletCard
            initialBalance={balance?.usdc ?? 0}
            cryptoUsdc={balance?.cryptoUsdc}
            stripeUsd={balance?.stripeUsd}
            address={balance?.address ?? undefined}
            isActive={isActive}
          />
        </div>
      </div>
    </div>
  );
}
