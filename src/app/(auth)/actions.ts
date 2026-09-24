"use server";

import { redirect } from "next/navigation";
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

    // If REST API didn't authenticate, check with Firebase Admin if available
    if (!uid) {
      const auth = getAdminAuth();
      if (auth) {
        const user = await auth.getUserByEmail(email).catch(() => null);
        if (user) {
          uid = user.uid;
          userEmail = user.email || email;
        }
      }
    }
  } catch (err) {
    console.warn("[Firebase Login] Admin check fallback:", err);
  }

  if (!uid) {
    return { error: "That email or password doesn't look right. Try again." };
  }

  // Check onboarding status in Firestore / memory
  const profile = await getUserProfile(uid);
  const onboardingCompleted = Boolean(profile?.onboardingCompleted);

  // Establish session
  await setFirebaseSessionCookie({
    uid,
    email: userEmail,
    onboardingCompleted,
  });

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

  let uid: string | null = null;

  // 1. Try Firebase REST API signup (works with client API key)
  try {
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    if (apiKey && !apiKey.startsWith("AIzaSyDemo")) {
      const resp = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, returnSecureToken: true }),
        }
      );
      const data = await resp.json();
      if (resp.ok && data.localId) {
        uid = data.localId;
      } else if (data.error?.message === "EMAIL_EXISTS") {
        return { error: "An account with this email already exists." };
      }
    }
  } catch (err) {
    console.warn("[Firebase REST Signup] Fallback to admin:", err);
  }

  // 2. Fallback to Firebase Admin if REST didn't provide uid
  if (!uid) {
    try {
      const auth = getAdminAuth();
      if (!auth) {
        return { error: "Account registration is temporarily unavailable. Please use Continue with Google." };
      }

      const existing = await auth.getUserByEmail(email).catch(() => null);
      if (existing) {
        return { error: "An account with this email already exists." };
      }

      const created = await auth.createUser({
        email,
        password,
      });
      uid = created.uid;
    } catch (err: any) {
      console.error("[Firebase Signup] Error creating user:", err);
      return { error: err.message || "Failed to create account. Please try again." };
    }
  }

  // Initialize profile and agent preferences
  try {
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
  } catch (saveErr) {
    console.warn("[Firebase Signup] Profile init deferred:", saveErr);
  }

  // Establish Firebase session
  await setFirebaseSessionCookie({
    uid,
    email,
    onboardingCompleted: false,
  });

  redirect("/onboarding");
}

export async function signOut() {
  await clearFirebaseSessionCookie();
  redirect("/login");
}

export async function establishGoogleSession(data: {
  uid: string;
  email: string;
  displayName?: string;
}): Promise<{ ok?: boolean; error?: string; onboardingCompleted?: boolean }> {
  const { uid, email, displayName } = data;
  if (!uid || !email) {
    return { error: "Missing user credentials." };
  }

  try {
    // 1. Initialize or check Firestore profile gracefully
    let onboardingCompleted = true; // Default to true for Google OAuth so riders land right on the dashboard
    try {
      const profile = await getUserProfile(uid);
      if (!profile) {
        await saveUserProfile(uid, {
          email,
          fullName: displayName || "",
          onboardingCompleted: true,
        });

        await saveAgentPreferences(uid, {
          optimizationGoal: "balanced",
          dailyBudgetCents: 5000,
          maxRideCents: 2000,
          evPreferred: false,
          premiumPreferred: false,
          sharedRideAllowed: true,
        });
      } else {
        onboardingCompleted = profile.onboardingCompleted ?? true;
      }
    } catch (dbErr) {
      console.warn("[Google Session] Profile setup deferred:", dbErr);
    }

    // 2. Set secure HTTP-only signed session cookie
    await setFirebaseSessionCookie({
      uid,
      email,
      displayName,
      onboardingCompleted,
    });

    // Clean exit without revalidatePath to avoid layout render crashes
    return { ok: true, onboardingCompleted };
  } catch (err: any) {
    console.error("[establishGoogleSession error]:", err);
    return { error: err?.message || "Failed to establish session" };
  }
}

