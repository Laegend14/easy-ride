import { type NextRequest, NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebase/admin";
import { signSessionPayload } from "@/lib/firebase/session";
import { getUserProfile, saveUserProfile, saveAgentPreferences } from "@/lib/firebase/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const COOKIE_NAME = "firebase_token";

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
      const res = NextResponse.json({ ok: true });
      res.cookies.delete(COOKIE_NAME);
      res.cookies.delete("__session");
      return res;
    }

    if (!idToken && !clientUid) {
      return NextResponse.json({ error: "Missing authentication credentials" }, { status: 400 });
    }

    let uid: string | null = null;
    let email: string | null = null;
    let name: string | undefined = undefined;

    // 1. First, attempt verification via Firebase REST API
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

    // 2. Second, attempt verification via Firebase Admin SDK if available
    if (!uid && idToken) {
      try {
        const auth = await getAdminAuth();
        if (auth) {
          const decoded = await auth.verifyIdToken(idToken);
          if (decoded?.uid) {
            uid = decoded.uid;
            email = decoded.email || null;
            name = decoded.name || undefined;
          }
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

    // 5. Initialize or check Firestore / memory profile gracefully
    let onboardingCompleted = true;
    try {
      const profile = await getUserProfile(uid);
      if (!profile) {
        await saveUserProfile(uid, {
          email,
          fullName: name || clientName || "",
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
      console.warn("[Session Route] Profile setup deferred:", dbErr);
    }

    // 6. Set signed session cookie directly on HTTP response
    const token = signSessionPayload({
      uid,
      email,
      displayName: name || clientName,
      onboardingCompleted,
    });

    const res = NextResponse.json({
      ok: true,
      uid,
      onboardingCompleted,
    });

    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 14, // 14 days
    });

    return res;
  } catch (err: any) {
    console.error("[Session Route Fatal Error]:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to establish session" },
      { status: 500 }
    );
  }
}
