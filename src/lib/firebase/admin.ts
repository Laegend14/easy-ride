import "server-only";
import { initializeApp, getApps, getApp, cert, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

function getAdminApp(): App {
  if (getApps().length > 0) {
    return getApp();
  }

  // 1. Try full service account JSON from environment variable (ideal for Vercel)
  const envServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY || process.env.FIREBASE_SERVICE_ACCOUNT;
  if (envServiceAccount) {
    try {
      const sa = JSON.parse(envServiceAccount);
      return initializeApp({
        credential: cert(sa),
        projectId: sa.project_id || "easyride-52548",
      });
    } catch (err) {
      console.warn("[Firebase Admin] Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY from env:", err);
    }
  }

  // 2. Try local service account file first (most reliable for local dev)
  const serviceAccountPath = resolve(process.cwd(), "firebase-service-account.json");
  if (existsSync(serviceAccountPath)) {
    try {
      const sa = JSON.parse(readFileSync(serviceAccountPath, "utf8"));
      return initializeApp({
        credential: cert(sa),
        projectId: sa.project_id || "easyride-52548",
      });
    } catch (err) {
      console.warn("[Firebase Admin] Failed to parse local service account JSON:", err);
    }
  }

  // 3. Try separate environment variables
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "easyride-52548";
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (privateKey) {
    privateKey = privateKey.replace(/\\n/g, "\n");
  }

  if (clientEmail && privateKey) {
    return initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
      projectId,
    });
  }

  // 4. Fallback to project ID default
  return initializeApp({
    projectId,
  });
}

export function getAdminAuth(): Auth {
  return getAuth(getAdminApp());
}

let firestoreInstance: Firestore | null = null;

export function getAdminFirestore(): Firestore {
  if (firestoreInstance) return firestoreInstance;

  const app = getAdminApp();
  const dbId = process.env.FIREBASE_DATABASE_ID || "default";
  try {
    firestoreInstance = getFirestore(app, dbId);
  } catch {
    firestoreInstance = getFirestore(app);
  }

  try {
    firestoreInstance.settings({ ignoreUndefinedProperties: true });
  } catch {}

  return firestoreInstance;
}
