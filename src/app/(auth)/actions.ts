"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getAdminAuth } from "@/lib/firebase/admin";
import { setFirebaseSessionCookie, clearFirebaseSessionCookie } from "@/lib/firebase/session";
import { getUserProfile, saveUserProfile, saveAgentPreferences } from "@/lib/firebase/db";

export type AuthState = { error: string | null };

function readCredentials(formData: FormData) {
  return {
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
    password: String(formData.get("password") ?? ""),
  };
}

export async function login(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const { email, password } = readCredentials(formData);
  if (!email || !password) {
    return { error: "Enter your email and password." };
  }

  let uid: string | null = null;
  let userEmail = email;

  // 1. Authenticate with Firebase REST API
  try {
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    if (apiKey && !apiKey.startsWith("AIzaSyDemo")) {
      const resp = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, returnSecureToken: true }),
        }
      );
      const data = await resp.json();
      if (!resp.ok) {
        const msg = data.error?.message;
        if (msg === "INVALID_PASSWORD" || msg === "EMAIL_NOT_FOUND" || msg === "INVALID_LOGIN_CREDENTIALS") {
          return { error: "That email or password doesn't look right. Try again." };
        }
      } else {
        uid = data.localId;
        userEmail = data.email;
      }
    }

    // If REST API didn't authenticate, check with Firebase Admin
    if (!uid) {
      const auth = getAdminAuth();
      const user = await auth.getUserByEmail(email).catch(() => null);
      if (user) {
        uid = user.uid;
        userEmail = user.email || email;
      }
    }
  } catch (err) {
    console.warn("[Firebase Login] Admin check fallback:", err);
  }

  if (!uid) {
    return { error: "That email or password doesn't look right. Try again." };
  }

  // Establish session
  await setFirebaseSessionCookie({
    uid,
    email: userEmail,
  });

  // Check onboarding status in Firestore
  const profile = await getUserProfile(uid);
  revalidatePath("/", "layout");

  if (!profile || !profile.onboardingCompleted) {
    redirect("/onboarding");
  }

  redirect("/dashboard");
}

export async function signup(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const { email, password } = readCredentials(formData);
  if (!email || !password) {
    return { error: "Enter your email and password." };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  let uid: string;

  // Create user in Firebase Auth
  try {
    const auth = getAdminAuth();
    const existing = await auth.getUserByEmail(email).catch(() => null);
    if (existing) {
      return { error: "An account with this email already exists." };
    }

    const created = await auth.createUser({
      email,
      password,
    });
    uid = created.uid;

    // Initialize Firestore profile and agent preferences
    await saveUserProfile(uid, {
      email,
      onboardingCompleted: false,
    });

    await saveAgentPreferences(uid, {
      optimizationGoal: "balanced",
      dailyBudgetCents: 5000,
      maxRideCents: 2000,
      evPreferred: false,
      premiumPreferred: false,
      sharedRideAllowed: true,
    });
  } catch (err: any) {
    console.error("[Firebase Signup] Error creating user:", err);
    return { error: err.message || "Failed to create account. Please try again." };
  }

  // Establish Firebase session
  await setFirebaseSessionCookie({
    uid,
    email,
  });

  revalidatePath("/", "layout");
  redirect("/onboarding");
}

export async function signOut() {
  await clearFirebaseSessionCookie();
  revalidatePath("/", "layout");
  redirect("/login");
}
