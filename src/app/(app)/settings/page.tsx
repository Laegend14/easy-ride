import { cookies } from "next/headers";
import { User, SlidersHorizontal, Bell, Shield, LogOut } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { signOut } from "@/app/(auth)/actions";
import { getWalletDetails } from "@/lib/circle/wallets";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { AdvancedDisclosure } from "@/components/settings/advanced-disclosure";
import { ProfileForm } from "@/components/settings/profile-form";
import { PreferencesForm } from "@/components/settings/preferences-form";
import { NotificationsForm } from "@/components/settings/notifications-form";
import { SecurityForm } from "@/components/settings/security-form";
import type { OptimizationGoal } from "@/types/database";

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-muted">
        {icon}
        {title}
      </div>
      <GlassCard>{children}</GlassCard>
    </div>
  );
}

export default async function SettingsPage() {
  const supabase = createClient(await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "full_name, email, home_address, work_address, notify_ride_updates, notify_savings_reports",
    )
    .eq("id", user.id)
    .single();

  const { data: agent } = await supabase
    .from("agents")
    .select("id")
    .eq("user_id", user.id)
    .single();

  const { data: prefs } = agent
    ? await supabase
        .from("agent_preferences")
        .select(
          "optimization_goal, daily_budget_cents, max_ride_cents, ev_preferred, premium_preferred, shared_ride_allowed, auto_accept_alternatives, require_confirmation_before_rebooking",
        )
        .eq("agent_id", agent.id)
        .single()
    : { data: null };

  const details = await getWalletDetails();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1 text-muted">Manage your profile and how your agent rides.</p>
      </div>

      <Section icon={<User className="h-4 w-4" />} title="Profile">
        <ProfileForm
          fullName={profile?.full_name ?? ""}
          email={profile?.email ?? user.email ?? ""}
          homeAddress={profile?.home_address ?? ""}
          workAddress={profile?.work_address ?? ""}
        />
      </Section>

      <Section icon={<SlidersHorizontal className="h-4 w-4" />} title="Your agent">
        <PreferencesForm
          optimizationGoal={(prefs?.optimization_goal as OptimizationGoal) ?? "balanced"}
          dailyBudgetCents={prefs?.daily_budget_cents ?? 5000}
          maxRideCents={prefs?.max_ride_cents ?? 2000}
          evPreferred={prefs?.ev_preferred ?? false}
          premiumPreferred={prefs?.premium_preferred ?? false}
          sharedRideAllowed={prefs?.shared_ride_allowed ?? true}
          autoAcceptAlternatives={prefs?.auto_accept_alternatives ?? false}
          requireConfirmationBeforeRebooking={
            prefs?.require_confirmation_before_rebooking ?? false
          }
        />
      </Section>

      <Section icon={<Bell className="h-4 w-4" />} title="Notifications">
        <NotificationsForm
          rideUpdates={profile?.notify_ride_updates ?? true}
          savingsReports={profile?.notify_savings_reports ?? true}
        />
      </Section>

      <Section icon={<Shield className="h-4 w-4" />} title="Security">
        <SecurityForm />
      </Section>

      {details ? (
        <AdvancedDisclosure
          rows={[
            { label: "Payment account", value: details.paymentRef ?? "—" },
            { label: "Account address", value: details.address ?? "—" },
            { label: "Network", value: details.network },
          ]}
        />
      ) : null}

      <form action={signOut}>
        <Button type="submit" variant="glass" size="md" className="w-full">
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </form>
    </div>
  );
}
