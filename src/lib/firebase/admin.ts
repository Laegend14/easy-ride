import "server-only";
import type { App } from "firebase-admin/app";
import type { Auth } from "firebase-admin/auth";
import type { Firestore } from "firebase-admin/firestore";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

let cachedApp: App | null = null;
let cachedAuth: Auth | null = null;
let cachedFirestore: Firestore | null = null;

export function hasAdminCredentials(): boolean {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY || process.env.FIREBASE_SERVICE_ACCOUNT) {
    return true;
  }
  try {
    const serviceAccountPath = resolve(process.cwd(), "firebase-service-account.json");
    if (existsSync(serviceAccountPath)) {
      return true;
    }
  } catch {}
  if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    return true;
  }
  return false;
}

export async function getAdminApp(): Promise<App | null> {
  if (cachedApp) return cachedApp;
  if (!hasAdminCredentials()) return null;

  try {
    const { initializeApp, getApps, getApp, cert } = await import("firebase-admin/app");

    if (getApps().length > 0) {
      cachedApp = getApp();
      return cachedApp;
    }

    // 1. Try full service account JSON from environment variable
    const envServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY || process.env.FIREBASE_SERVICE_ACCOUNT;
    if (envServiceAccount) {
      try {
        const sa = JSON.parse(
          envServiceAccount.startsWith("{")
            ? envServiceAccount
            : Buffer.from(envServiceAccount, "base64").toString("utf8")
        );
        cachedApp = initializeApp({
          credential: cert(sa),
          projectId: sa.project_id || "easyride-52548",
        });
        return cachedApp;
      } catch (err) {
        console.warn("[Firebase Admin] Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:", err);
      }
    }

    // 2. Try local service account file (local dev only)
    try {
      const serviceAccountPath = resolve(process.cwd(), "firebase-service-account.json");
      if (existsSync(serviceAccountPath)) {
        const sa = JSON.parse(readFileSync(serviceAccountPath, "utf8"));
        cachedApp = initializeApp({
          credential: cert(sa),
          projectId: sa.project_id || "easyride-52548",
        });
        return cachedApp;
      }
    } catch (err) {
      console.warn("[Firebase Admin] Failed to read local service account:", err);
    }

    // 3. Try separate environment variables
    const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "easyride-52548";
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (privateKey) {
      privateKey = privateKey.replace(/\\n/g, "\n");
    }

    if (clientEmail && privateKey) {
      try {
        cachedApp = initializeApp({
          credential: cert({
            projectId,
            clientEmail,
            privateKey,
          }),
          projectId,
        });
        return cachedApp;
      } catch (err) {
        console.warn("[Firebase Admin] Failed to initialize with separate credentials:", err);
      }
    }
  } catch (importErr) {
    console.warn("[Firebase Admin] Dynamic import failed:", importErr);
  }

  return null;
}

export async function getAdminAuth(): Promise<Auth | null> {
  if (cachedAuth) return cachedAuth;
  if (!hasAdminCredentials()) return null;

  try {
    const app = await getAdminApp();
    if (!app) return null;
    const { getAuth } = await import("firebase-admin/auth");
    cachedAuth = getAuth(app);
    return cachedAuth;
  } catch (err) {
    console.warn("[Firebase Admin Auth] Initialization skipped:", err);
    return null;
  }
}

export async function getAdminFirestore(): Promise<Firestore | null> {
  if (cachedFirestore) return cachedFirestore;
  if (!hasAdminCredentials()) return null;

  try {
    const app = await getAdminApp();
    if (!app) return null;

    const { getFirestore } = await import("firebase-admin/firestore");
    const dbId = process.env.FIREBASE_DATABASE_ID || "default";
    try {
      cachedFirestore = getFirestore(app, dbId);
    } catch {
      try {
        cachedFirestore = getFirestore(app);
      } catch {
        return null;
      }
    }

    try {
      cachedFirestore.settings({ ignoreUndefinedProperties: true });
    } catch {}

    return cachedFirestore;
  } catch (err) {
    console.warn("[Firebase Admin Firestore] Initialization skipped:", err);
    return null;
  }
}
