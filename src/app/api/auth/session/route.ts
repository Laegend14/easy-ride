import { type NextRequest, NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebase/admin";
import { setFirebaseSessionCookie, clearFirebaseSessionCookie } from "@/lib/firebase/session";
import { getUserProfile, saveUserProfile, saveAgentPreferences } from "@/lib/firebase/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { idToken, action } = body;

    if (action === "signout") {
      await clearFirebaseSessionCookie();
      return NextResponse.json({ ok: true });
    }

    if (!idToken) {
      return NextResponse.json({ error: "Missing idToken" }, { status: 400 });
    }

    // Verify ID token with Firebase Admin
    const auth = getAdminAuth();
    const decoded = await auth.verifyIdToken(idToken);
    const { uid, email, name } = decoded;

    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    // Set secure server session cookie
    await setFirebaseSessionCookie({
      uid,
      email,
      displayName: name || undefined,
    });

    // Check or initialize Firestore profile
    let profile = await getUserProfile(uid);
    if (!profile) {
      profile = await saveUserProfile(uid, {
        email,
        fullName: name || "",
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
    }

    return NextResponse.json({
      ok: true,
      uid,
      onboardingCompleted: profile.onboardingCompleted,
    });
  } catch (err: any) {
    console.error("[Session Route Error]:", err);
    return NextResponse.json({ error: err.message || "Failed to establish session" }, { status: 500 });
  }
}
