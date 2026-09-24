import { DollarSign, TrendingUp, Users, ShieldAlert, Sparkles, CheckCircle2, ArrowUpRight, Clock, ShieldCheck } from "lucide-react";
import { redirect } from "next/navigation";
import { getCurrentFirebaseUser } from "@/lib/firebase/session";
import { isDeveloperEmail } from "@/lib/auth/admin";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { getPlatformRevenueSummary } from "@/lib/monetization/revenue";
import { getSupportTickets } from "@/lib/disputes/dispute-service";

export default async function AdminRevenueDashboard() {
  const fbUser = await getCurrentFirebaseUser();
  if (!fbUser || !isDeveloperEmail(fbUser.email)) {
    redirect("/dashboard");
  }

  const rev = getPlatformRevenueSummary();
  const tickets = getSupportTickets();

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-teal uppercase tracking-wider mb-1">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Founder Command Center</span>
        </div>
        <h1 className="font-display text-3xl font-bold tracking-tight">
          Platform Revenue & <span className="text-gradient">Operations</span>
        </h1>
        <p className="mt-1 text-muted text-sm">
          Monetization metrics, fee breakdown, and simulated human support escalation desk.
        </p>
      </div>

      {/* Top Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total GMV */}
        <GlassCard className="p-5 space-y-2">
          <div className="flex items-center justify-between text-muted text-xs">
            <span>Gross Volume (GMV)</span>
            <DollarSign className="w-4 h-4 text-teal" />
          </div>
          <p className="text-2xl font-bold text-foreground">${rev.totalGmvDollars.toLocaleString()}</p>
          <p className="text-[11px] text-muted">{rev.totalTripsCount} lifetime trips processed</p>
        </GlassCard>

        {/* Net Founder Profit */}
        <GlassCard gradientBorder className="p-5 space-y-2">
          <div className="flex items-center justify-between text-teal text-xs font-semibold">
            <span>Net Founder Profit</span>
            <TrendingUp className="w-4 h-4" />
          </div>
          <p className="text-2xl font-bold text-teal">${rev.netRevenueDollars.toLocaleString()}</p>
          <div className="flex items-center gap-2 text-[10px] text-muted">
            <span>Fees: ${rev.platformFeesDollars}</span>
            <span>•</span>
            <span>Savings Share: ${rev.savingsFeesDollars}</span>
          </div>
        </GlassCard>

        {/* Rider Savings Generated */}
        <GlassCard className="p-5 space-y-2">
          <div className="flex items-center justify-between text-muted text-xs">
            <span>Total Rider Savings</span>
            <Sparkles className="w-4 h-4 text-violet" />
          </div>
          <p className="text-2xl font-bold text-violet">${rev.totalRiderSavingsDollars.toLocaleString()}</p>
          <p className="text-[11px] text-muted">Earned 10% performance fee</p>
        </GlassCard>

        {/* Pro Subscribers */}
        <GlassCard className="p-5 space-y-2">
          <div className="flex items-center justify-between text-muted text-xs">
            <span>Easy Ride Pro MRR</span>
            <Users className="w-4 h-4 text-[#f6c177]" />
          </div>
          <p className="text-2xl font-bold text-[#f6c177]">
            ${(rev.proSubscriptionsCount * 9.99).toFixed(2)}
          </p>
          <p className="text-[11px] text-muted">{rev.proSubscriptionsCount} active subscribers ($9.99/mo)</p>
        </GlassCard>
      </div>

      {/* Monetization Model Breakdown */}
      <GlassCard className="p-6 space-y-4">
        <h2 className="font-display text-lg font-semibold text-foreground">Active Monetization Architecture</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1.5">
            <span className="text-xs font-semibold text-teal uppercase tracking-wider">1. Platform Dispatch Fee</span>
            <p className="font-medium text-foreground">$1.50 flat per trip</p>
            <p className="text-xs text-muted leading-relaxed">
              Charged on checkout for trip orchestration, autonomous escrow locking, and multi-provider search.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1.5">
            <span className="text-xs font-semibold text-violet uppercase tracking-wider">2. Savings Performance Fee</span>
            <p className="font-medium text-foreground">10% of verified savings</p>
            <p className="text-xs text-muted leading-relaxed">
              When the AI saves the rider money compared to alternative options, Easy Ride keeps 10%. User keeps 90%!
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1.5">
            <span className="text-xs font-semibold text-[#f6c177] uppercase tracking-wider">3. Pro Membership Tier</span>
            <p className="font-medium text-foreground">$9.99 / month</p>
            <p className="text-xs text-muted leading-relaxed">
              Waives all platform dispatch fees, unlocks priority AI matching, and grants access to human concierge hotline.
            </p>
          </div>
        </div>
      </GlassCard>

      {/* Human Support Queue (Simulated) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-[#ff9bab]" />
            <h2 className="font-display text-lg font-semibold text-foreground">
              Escalated Support Desk (Human Review Queue)
            </h2>
          </div>
          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-[#ff6e84]/10 text-[#ff9bab] border border-[#ff6e84]/20">
            {tickets.length} Active Tickets
          </span>
        </div>

        <div className="space-y-3">
          {tickets.map((t) => (
            <GlassCard key={t.ticketId} className="p-5 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
                <div className="flex items-center gap-3">
                  <span className="font-display font-semibold text-foreground text-sm">{t.ticketId}</span>
                  <span
                    className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${
                      t.severity === "critical"
                        ? "bg-[#ff6e84]/20 text-[#ff9bab] border border-[#ff6e84]/30"
                        : "bg-[#f6c177]/20 text-[#f6c177] border border-[#f6c177]/30"
                    }`}
                  >
                    {t.severity} priority
                  </span>
                  <span className="text-xs text-muted">Assigned: {t.assignedAgent}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{new Date(t.createdAt).toLocaleTimeString()}</span>
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-muted uppercase tracking-wider mb-1">
                  Issue: {t.category.replace("_", " ")}
                </p>
                <p className="text-sm text-foreground bg-white/[0.02] p-3 rounded-xl border border-white/5">
                  "{t.description}"
                </p>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-teal flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Hugging Face AI flagged for safety escalation
                </span>
                <div className="flex items-center gap-2">
                  <Button variant="glass" size="sm" className="text-xs">
                    Contact Rider
                  </Button>
                  <Button variant="gradient" size="sm" className="text-xs">
                    Approve Full Refund
                  </Button>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>
    </div>
  );
}
