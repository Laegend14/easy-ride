"use server";

import { revalidatePath } from "next/cache";
import { getCurrentFirebaseUser } from "@/lib/firebase/session";
import { saveUserProfile, saveAgentPreferences, saveUserDestinations } from "@/lib/firebase/db";
import { getAdminAuth } from "@/lib/firebase/admin";
import type { OptimizationGoal } from "@/types/database";
import { checkRateLimit, LIMITS } from "@/lib/security/rate-limit";

export interface SettingsState {
  error: string | null;
  message?: string;
}

const GOALS: OptimizationGoal[] = ["cheapest", "fastest", "balanced", "highest_rated"];

function dollarsToCents(v: FormDataEntryValue | null): number {
  return Math.round(parseFloat(String(v ?? "").replace(/[^0-9.]/g, "") || "0") * 100);
}

async function getActiveUserId(): Promise<string | null> {
  const fbUser = await getCurrentFirebaseUser();
  return fbUser?.uid ?? null;
}

export async function updateProfile(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const homeAddress = String(formData.get("homeAddress") ?? "").trim();
  const workAddress = String(formData.get("workAddress") ?? "").trim();
  if (!fullName) return { error: "Please enter your name." };

  const userId = await getActiveUserId();
  if (!userId) return { error: "Please sign in." };

  try {
    await saveUserProfile(userId, {
      fullName,
      homeAddress,
      workAddress: workAddress || undefined,
    });

    const destinations: Array<{
      userId: string;
      kind: "home" | "work";
      label: string;
      address: string;
    }> = [{ userId, kind: "home", label: "Home", address: homeAddress }];
    if (workAddress) {
      destinations.push({ userId, kind: "work", label: "Work", address: workAddress });
    }
    await saveUserDestinations(userId, destinations);
  } catch (err: any) {
    console.warn("[updateProfile] Firestore save error:", err);
    return { error: "Could not save profile. Please try again." };
  }

  revalidatePath("/settings");
  return { error: null, message: "Profile updated." };
}

export async function updatePreferences(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const userId = await getActiveUserId();
  if (!userId) return { error: "Please sign in." };

  const goalRaw = String(formData.get("optimizationGoal") ?? "balanced");
  const goal = GOALS.includes(goalRaw as OptimizationGoal)
    ? (goalRaw as OptimizationGoal)
    : "balanced";
  const daily = dollarsToCents(formData.get("dailyBudget"));
  const maxRide = dollarsToCents(formData.get("maxRide"));
  if (daily <= 0 || maxRide <= 0) {
    return { error: "Budgets must be greater than zero." };
  }

  const evPreferred = formData.get("ev") === "on";
  const premiumPreferred = formData.get("premium") === "on";
  const sharedRideAllowed = formData.get("shared") === "on";

  try {
    await saveAgentPreferences(userId, {
      optimizationGoal: goal,
      dailyBudgetCents: daily,
      maxRideCents: maxRide,
      evPreferred,
      premiumPreferred,
      sharedRideAllowed,
    });
  } catch (err: any) {
    console.warn("[updatePreferences] Firestore save error:", err);
    return { error: "Could not save preferences." };
  }

  revalidatePath("/settings");
  return { error: null, message: "Preferences updated." };
}

export async function updateNotifications(
  _prev: SettingsState,
  _formData: FormData,
): Promise<SettingsState> {
  const userId = await getActiveUserId();
  if (!userId) return { error: "Please sign in." };

  revalidatePath("/settings");
  return { error: null, message: "Notification settings updated." };
}

export async function updatePassword(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (password.length < 8) return { error: "Password must be at least 8 characters." };
  if (password !== confirm) return { error: "Passwords don’t match." };

  const userId = await getActiveUserId();
  if (!userId) return { error: "Please sign in." };

  const rl = checkRateLimit(userId, "password", LIMITS.password);
  if (!rl.ok) return { error: rl.error };

  try {
    const auth = getAdminAuth();
    if (!auth) {
      return { error: "Password updates via settings are only available when server admin credentials are configured." };
    }
    await auth.updateUser(userId, { password });
  } catch (err: any) {
    return { error: err.message || "Failed to update password." };
  }

  return { error: null, message: "Password updated." };
}
