/**
 * chat-history.ts
 * Client-side Firestore helpers for reading/writing chat conversation history.
 * Collection path: chatConversations/{userId}/sessions/{sessionId}
 */

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDocs,
  getDoc,
  orderBy,
  query,
  limit,
  serverTimestamp,
  Timestamp,
  arrayUnion,
} from "firebase/firestore";
import { getFirebaseDb } from "./client";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ChatMessage {
  id: string;
  sender: "user" | "assistant";
  text: string;
  timestamp: string; // display time string, e.g. "09:41 AM"
  createdAt?: Timestamp;
}

export interface ChatSession {
  id: string;
  title: string;          // derived from first user message
  startedAt: Timestamp | null;
  updatedAt: Timestamp | null;
  messages: ChatMessage[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sessionsRef(userId: string) {
  return collection(getFirebaseDb(), "chatConversations", userId, "sessions");
}

/**
 * Start a brand-new chat session, returns the Firestore session document ID.
 */
export async function createChatSession(
  userId: string,
  firstMessage: ChatMessage
): Promise<string> {
  const title =
    firstMessage.text.length > 50
      ? firstMessage.text.slice(0, 50) + "…"
      : firstMessage.text;

  const docRef = await addDoc(sessionsRef(userId), {
    title,
    startedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    messages: [firstMessage],
  });
  return docRef.id;
}

/**
 * Append a message to an existing session.
 */
export async function appendMessageToSession(
  userId: string,
  sessionId: string,
  message: ChatMessage
): Promise<void> {
  const ref = doc(sessionsRef(userId), sessionId);
  await updateDoc(ref, {
    messages: arrayUnion(message),
    updatedAt: serverTimestamp(),
  });
}

/**
 * List the most recent chat sessions (newest first, capped at 30).
 */
export async function listChatSessions(userId: string): Promise<ChatSession[]> {
  const q = query(sessionsRef(userId), orderBy("updatedAt", "desc"), limit(30));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<ChatSession, "id">),
  }));
}

/**
 * Fetch a single session by ID (used when reopening from history).
 */
export async function getChatSession(
  userId: string,
  sessionId: string
): Promise<ChatSession | null> {
  const ref = doc(sessionsRef(userId), sessionId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as Omit<ChatSession, "id">) };
}
