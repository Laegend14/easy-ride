import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { firebaseConfig } from "./config";

export function getFirebaseApp(): FirebaseApp {
  if (getApps().length > 0) {
    return getApp();
  }
  return initializeApp(firebaseConfig);
}

export function getFirebaseAuth(): Auth {
  return getAuth(getFirebaseApp());
}

export function getFirebaseDb(): Firestore {
  const app = getFirebaseApp();
  const dbId = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_ID || "default";
  try {
    return getFirestore(app, dbId);
  } catch {
    return getFirestore(app);
  }
}
