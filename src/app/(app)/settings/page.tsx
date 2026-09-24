import { User, SlidersHorizontal, Bell, Shield, LogOut } from "lucide-react";
import { getCurrentFirebaseUser } from "@/lib/firebase/session";
import { getUserProfile, getAgentPreferences } from "@/lib/firebase/db";
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
  const fbUser = await getCurrentFirebaseUser();
  if (!fbUser) return null;

  const [profile, prefs, details] = await Promise.all([
    getUserProfile(fbUser.uid),
    getAgentPreferences(fbUser.uid),
    getWalletDetails(),
  ]);

  const fullName = profile?.fullName || "";
  const homeAddress = profile?.homeAddress || "";
  const workAddress = profile?.workAddress || "";
  const optimizationGoal = (prefs?.optimizationGoal || "balanced") as OptimizationGoal;
  const dailyBudgetCents = prefs?.dailyBudgetCents ?? 5000;
  const maxRideCents = prefs?.maxRideCents ?? 2000;
  const evPreferred = prefs?.evPreferred ?? false;
  const premiumPreferred = prefs?.premiumPreferred ?? false;
  const sharedRideAllowed = prefs?.sharedRideAllowed ?? true;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1 text-muted">Manage your profile and how your agent rides.</p>
      </div>

      <Section icon={<User className="h-4 w-4" />} title="Profile">
        <ProfileForm
          fullName={fullName}
          email={fbUser.email ?? ""}
          homeAddress={homeAddress}
          workAddress={workAddress}
        />
      </Section>

      <Section icon={<SlidersHorizontal className="h-4 w-4" />} title="Your agent">
        <PreferencesForm
          optimizationGoal={optimizationGoal}
          dailyBudgetCents={dailyBudgetCents}
          maxRideCents={maxRideCents}
          evPreferred={evPreferred}
          premiumPreferred={premiumPreferred}
          sharedRideAllowed={sharedRideAllowed}
          autoAcceptAlternatives={false}
          requireConfirmationBeforeRebooking={false}
        />
      </Section>

      <Section icon={<Bell className="h-4 w-4" />} title="Notifications">
        <NotificationsForm
          rideUpdates={true}
          savingsReports={true}
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
