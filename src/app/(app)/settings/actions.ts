"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
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

export async function updateProfile(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const homeAddress = String(formData.get("homeAddress") ?? "").trim();
  const workAddress = String(formData.get("workAddress") ?? "").trim();
  if (!fullName) return { error: "Please enter your name." };

  const supabase = createClient(await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in." };

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: fullName,
      home_address: homeAddress || null,
      work_address: workAddress || null,
    })
    .eq("id", user.id);
  if (error) return { error: "Couldn’t save your profile." };

  // Sync home/work saved places.
  await supabase.from("destinations").delete().eq("user_id", user.id).in("kind", ["home", "work"]);
  const places: { user_id: string; kind: "home" | "work"; label: string; address: string }[] = [];
  if (homeAddress) places.push({ user_id: user.id, kind: "home", label: "Home", address: homeAddress });
  if (workAddress) places.push({ user_id: user.id, kind: "work", label: "Work", address: workAddress });
  if (places.length) await supabase.from("destinations").insert(places);

  revalidatePath("/settings");
  return { error: null, message: "Profile updated." };
}

export async function updatePreferences(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const supabase = createClient(await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in." };

  const goalRaw = String(formData.get("optimizationGoal") ?? "balanced");
  const goal = GOALS.includes(goalRaw as OptimizationGoal)
    ? (goalRaw as OptimizationGoal)
    : "balanced";
  const daily = dollarsToCents(formData.get("dailyBudget"));
  const maxRide = dollarsToCents(formData.get("maxRide"));
  if (daily <= 0 || maxRide <= 0) {
    return { error: "Budgets must be greater than zero." };
  }

  const { data: agent } = await supabase
    .from("agents")
    .select("id")
    .eq("user_id", user.id)
    .single();
  if (!agent) return { error: "Your agent isn’t ready yet." };

  const { error } = await supabase
    .from("agent_preferences")
    .update({
      optimization_goal: goal,
      daily_budget_cents: daily,
      max_ride_cents: maxRide,
      ev_preferred: formData.get("ev") === "on",
      premium_preferred: formData.get("premium") === "on",
      shared_ride_allowed: formData.get("shared") === "on",
      auto_accept_alternatives: formData.get("autoAccept") === "on",
      require_confirmation_before_rebooking: formData.get("confirmRebook") === "on",
    })
    .eq("agent_id", agent.id);
  if (error) return { error: "Couldn’t save your preferences." };

  revalidatePath("/settings");
  return { error: null, message: "Preferences updated." };
}

export async function updateNotifications(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const supabase = createClient(await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in." };

  const { error } = await supabase
    .from("profiles")
    .update({
      notify_ride_updates: formData.get("rideUpdates") === "on",
      notify_savings_reports: formData.get("savingsReports") === "on",
    })
    .eq("id", user.id);
  if (error) return { error: "Couldn’t save notification settings." };

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

  const supabase = createClient(await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in." };

  const rl = checkRateLimit(user.id, "password", LIMITS.password);
  if (!rl.ok) return { error: rl.error };

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };

  return { error: null, message: "Password updated." };
}
