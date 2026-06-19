"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import type { OptimizationGoal } from "@/types/database";

export type OnboardingState = { error: string | null };

const GOALS: OptimizationGoal[] = [
  "cheapest",
  "fastest",
  "balanced",
  "highest_rated",
];

export async function completeOnboarding(
  _prev: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  let payload: {
    fullName?: string;
    homeAddress?: string;
    workAddress?: string;
    optimizationGoal?: string;
    dailyBudgetCents?: number;
    maxRideCents?: number;
    evPreferred?: boolean;
    premiumPreferred?: boolean;
    sharedRideAllowed?: boolean;
  };
  try {
    payload = JSON.parse(String(formData.get("payload") ?? "{}"));
  } catch {
    return { error: "Something went wrong. Please try again." };
  }

  const fullName = (payload.fullName ?? "").trim();
  const homeAddress = (payload.homeAddress ?? "").trim();
  const workAddress = (payload.workAddress ?? "").trim();
  const goal = GOALS.includes(payload.optimizationGoal as OptimizationGoal)
    ? (payload.optimizationGoal as OptimizationGoal)
    : "balanced";
  const dailyBudgetCents = Math.round(Number(payload.dailyBudgetCents));
  const maxRideCents = Math.round(Number(payload.maxRideCents));

  if (!fullName) return { error: "Please tell us your name." };
  if (!homeAddress) return { error: "Please add your home address." };
  if (!Number.isFinite(dailyBudgetCents) || dailyBudgetCents <= 0) {
    return { error: "Daily budget must be greater than zero." };
  }
  if (!Number.isFinite(maxRideCents) || maxRideCents <= 0) {
    return { error: "Max per-ride amount must be greater than zero." };
  }

  const supabase = createClient(await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      full_name: fullName,
      home_address: homeAddress,
      work_address: workAddress || null,
      onboarding_completed: true,
    })
    .eq("id", user.id);
  if (profileError) return { error: "Couldn’t save your profile. Try again." };

  const { data: agent } = await supabase
    .from("agents")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (agent) {
    await supabase
      .from("agent_preferences")
      .update({
        optimization_goal: goal,
        daily_budget_cents: dailyBudgetCents,
        max_ride_cents: maxRideCents,
        ev_preferred: Boolean(payload.evPreferred),
        premium_preferred: Boolean(payload.premiumPreferred),
        shared_ride_allowed: Boolean(payload.sharedRideAllowed),
      })
      .eq("agent_id", agent.id);
  }

  // Replace home/work saved places (idempotent across re-runs).
  await supabase
    .from("destinations")
    .delete()
    .eq("user_id", user.id)
    .in("kind", ["home", "work"]);

  const places: {
    user_id: string;
    kind: "home" | "work";
    label: string;
    address: string;
  }[] = [{ user_id: user.id, kind: "home", label: "Home", address: homeAddress }];
  if (workAddress) {
    places.push({
      user_id: user.id,
      kind: "work",
      label: "Work",
      address: workAddress,
    });
  }
  await supabase.from("destinations").insert(places);

  revalidatePath("/", "layout");
  redirect("/dashboard");
}
