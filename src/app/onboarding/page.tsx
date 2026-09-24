import { redirect } from "next/navigation";
import { getCurrentFirebaseUser } from "@/lib/firebase/session";
import { getUserProfile, getAgentPreferences } from "@/lib/firebase/db";
import { AuroraBackground } from "@/components/ui/aurora-background";
import {
  OnboardingWizard,
  type OnboardingInitial,
} from "@/components/onboarding/onboarding-wizard";
import type { OptimizationGoal } from "@/types/database";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function OnboardingPage() {
  const fbUser = await getCurrentFirebaseUser();
  if (!fbUser) redirect("/login");

  const profile = await getUserProfile(fbUser.uid);
  if (profile?.onboardingCompleted) redirect("/dashboard");

  const prefs = await getAgentPreferences(fbUser.uid);

  const initial: OnboardingInitial = {
    fullName: profile?.fullName ?? "",
    optimizationGoal: (prefs?.optimizationGoal as OptimizationGoal) ?? "balanced",
    dailyBudgetCents: prefs?.dailyBudgetCents ?? 5000,
    maxRideCents: prefs?.maxRideCents ?? 2000,
    evPreferred: prefs?.evPreferred ?? false,
    premiumPreferred: prefs?.premiumPreferred ?? false,
    sharedRideAllowed: prefs?.sharedRideAllowed ?? true,
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-16">
      <AuroraBackground />
      <div className="glass-gradient-border w-full max-w-xl rounded-3xl p-8">
        <OnboardingWizard initial={initial} />
      </div>
    </div>
  );
}
