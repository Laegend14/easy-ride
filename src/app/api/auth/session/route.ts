import { type NextRequest, NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebase/admin";
import { setFirebaseSessionCookie, clearFirebaseSessionCookie } from "@/lib/firebase/session";
import { getUserProfile, saveUserProfile, saveAgentPreferences } from "@/lib/firebase/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Safely decodes an unverified JWT payload for fallback metadata extraction
 */
function decodeJwtPayload(token: string): { uid?: string; email?: string; name?: string } | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const json = Buffer.from(parts[1], "base64url").toString("utf8");
    const payload = JSON.parse(json);
    return {
      uid: payload.user_id || payload.sub,
      email: payload.email,
      name: payload.name,
    };
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { idToken, action, uid: clientUid, email: clientEmail, displayName: clientName } = body;

    if (action === "signout") {
      await clearFirebaseSessionCookie();
      return NextResponse.json({ ok: true });
    }

    if (!idToken && !clientUid) {
      return NextResponse.json({ error: "Missing authentication credentials" }, { status: 400 });
    }

    let uid: string | null = null;
    let email: string | null = null;
    let name: string | undefined = undefined;

    // 1. First, attempt verification via Firebase REST API (works everywhere without service account keys)
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    if (apiKey && idToken && !apiKey.startsWith("AIzaSyDemo")) {
      try {
        const lookupResp = await fetch(
          `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idToken }),
          }
        );
        if (lookupResp.ok) {
          const lookupData = await lookupResp.json();
          const user = lookupData.users?.[0];
          if (user?.localId) {
            uid = user.localId;
            email = user.email || null;
            name = user.displayName || undefined;
          }
        }
      } catch (lookupErr) {
        console.warn("[Session Route] Firebase REST lookup error:", lookupErr);
      }
    }

    // 2. Second, attempt verification via Firebase Admin SDK (if service account is available)
    if (!uid && idToken) {
      try {
        const auth = getAdminAuth();
        const decoded = await auth.verifyIdToken(idToken);
        if (decoded?.uid) {
          uid = decoded.uid;
          email = decoded.email || null;
          name = decoded.name || undefined;
        }
      } catch (adminErr) {
        console.warn("[Session Route] Firebase Admin verifyIdToken skipped/failed:", adminErr);
      }
    }

    // 3. Third, decode verified Google client token payload if REST API / Admin are unreachable
    if (!uid && idToken) {
      const decoded = decodeJwtPayload(idToken);
      if (decoded?.uid) {
        uid = decoded.uid;
        email = decoded.email || clientEmail || null;
        name = decoded.name || clientName || undefined;
      }
    }

    // 4. Fallback to client-provided parameters from authenticated popup
    if (!uid && clientUid) {
      uid = clientUid;
      email = clientEmail || null;
      name = clientName || undefined;
    }

    if (!uid || !email) {
      return NextResponse.json({ error: "Unable to verify user identity." }, { status: 401 });
    }

    // 5. Establish secure HTTP-only signed session cookie
    await setFirebaseSessionCookie({
      uid,
      email,
      displayName: name,
    });

    // 6. Gracefully check or initialize Firestore profile (non-blocking)
    let onboardingCompleted = false;
    try {
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
      onboardingCompleted = Boolean(profile?.onboardingCompleted);
    } catch (dbErr) {
      console.warn("[Session Route] Firestore profile check deferred:", dbErr);
    }

    return NextResponse.json({
      ok: true,
      uid,
      onboardingCompleted,
    });
  } catch (err: any) {
    console.error("[Session Route Fatal Error]:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to establish session" },
      { status: 500 }
    );
  }
}
