"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentFirebaseUser, setFirebaseSessionCookie } from "@/lib/firebase/session";
import { saveUserProfile, saveAgentPreferences, saveUserDestinations } from "@/lib/firebase/db";
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

  // 1. Identify user
  const fbUser = await getCurrentFirebaseUser();
  if (!fbUser) redirect("/login");

  const userId = fbUser.uid;

  // 2. Persist to Firestore
  try {
    await saveUserProfile(userId, {
      fullName,
      homeAddress,
      workAddress: workAddress || undefined,
      onboardingCompleted: true,
    });

    await saveAgentPreferences(userId, {
      optimizationGoal: goal,
      dailyBudgetCents,
      maxRideCents,
      evPreferred: Boolean(payload.evPreferred),
      premiumPreferred: Boolean(payload.premiumPreferred),
      sharedRideAllowed: Boolean(payload.sharedRideAllowed),
    });

    const destinations: Array<{
      userId: string;
      kind: "home" | "work";
      label: string;
      address: string;
    }> = [{ userId, kind: "home", label: "Home", address: homeAddress }];

    if (workAddress) {
      destinations.push({
        userId,
        kind: "work",
        label: "Work",
        address: workAddress,
      });
    }

    await saveUserDestinations(userId, destinations);
  } catch (err: any) {
    console.error("[completeOnboarding] Firestore save error:", err);
  }

  // Update session cookie with onboardingCompleted: true
  await setFirebaseSessionCookie({
    uid: userId,
    email: fbUser.email || "",
    displayName: fullName || fbUser.displayName || undefined,
    onboardingCompleted: true,
  });

  redirect("/dashboard");
}
