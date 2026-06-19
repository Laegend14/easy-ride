import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { AuroraBackground } from "@/components/ui/aurora-background";
import {
  OnboardingWizard,
  type OnboardingInitial,
} from "@/components/onboarding/onboarding-wizard";
import type { OptimizationGoal } from "@/types/database";

export default async function OnboardingPage() {
  const supabase = createClient(await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, onboarding_completed")
    .eq("id", user.id)
    .single();

  if (profile?.onboarding_completed) redirect("/dashboard");

  const { data: agent } = await supabase
    .from("agents")
    .select("id")
    .eq("user_id", user.id)
    .single();

  const { data: prefs } = agent
    ? await supabase
        .from("agent_preferences")
        .select(
          "optimization_goal, daily_budget_cents, max_ride_cents, ev_preferred, premium_preferred, shared_ride_allowed",
        )
        .eq("agent_id", agent.id)
        .single()
    : { data: null };

  const initial: OnboardingInitial = {
    fullName: profile?.full_name ?? "",
    optimizationGoal: (prefs?.optimization_goal as OptimizationGoal) ?? "balanced",
    dailyBudgetCents: prefs?.daily_budget_cents ?? 5000,
    maxRideCents: prefs?.max_ride_cents ?? 2000,
    evPreferred: prefs?.ev_preferred ?? false,
    premiumPreferred: prefs?.premium_preferred ?? false,
    sharedRideAllowed: prefs?.shared_ride_allowed ?? true,
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
