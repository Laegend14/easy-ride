import "server-only";
import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";
import { getAdminAuth } from "./admin";

export interface FirebaseUserSession {
  uid: string;
  email: string | null;
  displayName: string | null;
  onboardingCompleted?: boolean;
}

const SESSION_SECRET = process.env.FIREBASE_SESSION_SECRET || "easy-ride-secure-session-key-2026-production";
const COOKIE_NAME = "firebase_token";

/**
 * Signs a session payload: base64(payload).signature
 */
export function signSessionPayload(data: {
  uid: string;
  email: string;
  displayName?: string;
  onboardingCompleted?: boolean;
}): string {
  const json = JSON.stringify({ ...data, ts: Date.now() });
  const b64 = Buffer.from(json).toString("base64url");
  const sig = createHmac("sha256", SESSION_SECRET).update(b64).digest("base64url");
  return `${b64}.${sig}`;
}

/**
 * Verifies a signed session payload
 */
export function verifySessionPayload(token: string): FirebaseUserSession | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return null;
    const [b64, sig] = parts;
    const expectedSig = createHmac("sha256", SESSION_SECRET).update(b64).digest("base64url");
    if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) {
      return null;
    }
    const data = JSON.parse(Buffer.from(b64, "base64url").toString("utf8"));
    if (!data.uid) return null;
    return {
      uid: data.uid,
      email: data.email ?? null,
      displayName: data.displayName ?? null,
      onboardingCompleted: data.onboardingCompleted ?? undefined,
    };
  } catch {
    return null;
  }
}

/**
 * Sets session cookie for the authenticated user
 */
export async function setFirebaseSessionCookie(session: {
  uid: string;
  email: string;
  displayName?: string;
  onboardingCompleted?: boolean;
}): Promise<void> {
  const cookieStore = await cookies();
  const token = signSessionPayload(session);
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 14, // 14 days
  });
}

/**
 * Clears the session cookie
 */
export async function clearFirebaseSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
  cookieStore.delete("__session");
}

/**
 * Retrieves the currently logged-in user from the session cookie
 */
export async function getCurrentFirebaseUser(): Promise<FirebaseUserSession | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value || cookieStore.get("__session")?.value;

    if (!token) {
      return null;
    }

    // 1. Try custom signed session token
    const signedSession = verifySessionPayload(token);
    if (signedSession) {
      return signedSession;
    }

    // 2. Try Firebase Admin ID token / session cookie verification (only if admin available)
    const auth = getAdminAuth();
    if (auth) {
      try {
        const decoded = await auth.verifyIdToken(token).catch(async () => {
          return await auth.verifySessionCookie(token, true);
        });

        if (!decoded) return null;

        return {
          uid: decoded.uid,
          email: decoded.email ?? null,
          displayName: (decoded as any).name ?? null,
        };
      } catch {
        return null;
      }
    }
    return null;
  } catch (err) {
    console.warn("[getCurrentFirebaseUser] Error checking session:", err);
    return null;
  }
}
