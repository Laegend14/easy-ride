import "server-only";
import { initializeApp, getApps, getApp, cert, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
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

export function getAdminApp(): App | null {
  if (cachedApp) return cachedApp;
  if (getApps().length > 0) {
    cachedApp = getApp();
    return cachedApp;
  }

  // 1. Try full service account JSON from environment variable (ideal for Vercel)
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
      console.warn("[Firebase Admin] Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY from env:", err);
    }
  }

  // 2. Try local service account file first (most reliable for local dev)
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

  // If no credentials, DO NOT initializeApp without credentials on serverless/Vercel (causes Google ADC crash)
  return null;
}

export function getAdminAuth(): Auth | null {
  if (cachedAuth) return cachedAuth;
  const app = getAdminApp();
  if (!app) return null;
  try {
    cachedAuth = getAuth(app);
    return cachedAuth;
  } catch (err) {
    console.warn("[Firebase Admin Auth] Initialization skipped:", err);
    return null;
  }
}

export function getAdminFirestore(): Firestore | null {
  if (cachedFirestore) return cachedFirestore;

  const app = getAdminApp();
  if (!app) return null;

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
}
