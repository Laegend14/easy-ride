import "server-only";
import { getAdminFirestore } from "./admin";

export interface UserProfile {
  uid: string;
  email: string;
  fullName?: string;
  homeAddress?: string;
  workAddress?: string;
  onboardingCompleted: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AgentPreferences {
  userId: string;
  optimizationGoal: "cheapest" | "fastest" | "balanced" | "highest_rated";
  dailyBudgetCents: number;
  maxRideCents: number;
  evPreferred: boolean;
  premiumPreferred: boolean;
  sharedRideAllowed: boolean;
  updatedAt?: string;
}

export interface SavedDestination {
  userId: string;
  kind: "home" | "work" | "custom";
  label: string;
  address: string;
  createdAt?: string;
}

export interface UserWalletRecord {
  userId: string;
  status: "provisioning" | "active" | "suspended" | "failed";
  balanceCents: number;
  address: string | null;
  blockchain: string;
  circleWalletId: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface RideRequestRecord {
  id: string;
  userId: string;
  rawText: string;
  originAddress: string;
  originLat: number;
  originLng: number;
  destinationAddress: string;
  destinationLat: number;
  destinationLng: number;
  status: string;
  createdAt: string;
}

export interface RideQuoteRecord {
  id: string;
  rideRequestId: string;
  provider: string;
  productName: string;
  fareCents: number;
  etaMinutes: number;
  rating: number;
  isSelected: boolean;
  score: number;
}

export interface RideBookingRecord {
  id: string;
  userId: string;
  rideRequestId?: string;
  provider: string;
  fareCents: number;
  etaMinutes?: number;
  status: string;
  bookedAt: string;
  completedAt?: string | null;
  paymentMethod?: string;
  escrowTxHash?: string;
  pickupAddress?: string;
  dropoffAddress?: string;
}

export interface RideLifecycleEventRecord {
  rideBookingId: string;
  status: string;
  detail: string;
  timestamp: string;
}

const CACHE_TTL_MS = 60_000; // 60 seconds

interface CachedItem<T> {
  val: T | null;
  cachedAt: number;
}

// Memory fallback cache ensuring ultra-low latency and resilience
const memoryCache = {
  profiles: new Map<string, CachedItem<UserProfile>>(),
  preferences: new Map<string, CachedItem<AgentPreferences>>(),
  destinations: new Map<string, CachedItem<SavedDestination[]>>(),
  wallets: new Map<string, CachedItem<UserWalletRecord>>(),
  requests: new Map<string, RideRequestRecord>(),
  quotes: new Map<string, RideQuoteRecord[]>(),
  bookings: new Map<string, RideBookingRecord>(),
  events: new Map<string, RideLifecycleEventRecord[]>(),
};

/**
 * Fetches user profile from Firestore with in-memory caching
 */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const cached = memoryCache.profiles.get(uid);
  if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
    return cached.val;
  }

  try {
    const db = getAdminFirestore();
    const doc = await db.collection("users").doc(uid).get();
    if (doc.exists) {
      const data = doc.data() as UserProfile;
      memoryCache.profiles.set(uid, { val: data, cachedAt: Date.now() });
      return data;
    }
  } catch (err: any) {
    console.warn("[Firestore] Read error for users collection:", err.message);
  }
  return cached?.val || null;
}

/**
 * Saves user profile in Firestore
 */
export async function saveUserProfile(uid: string, profile: Partial<UserProfile>): Promise<UserProfile> {
  const existing = await getUserProfile(uid);
  const now = new Date().toISOString();
  const merged: UserProfile = {
    uid,
    email: profile.email || existing?.email || "",
    fullName: profile.fullName ?? existing?.fullName ?? "",
    homeAddress: profile.homeAddress ?? existing?.homeAddress ?? "",
    workAddress: profile.workAddress ?? existing?.workAddress,
    onboardingCompleted: profile.onboardingCompleted ?? existing?.onboardingCompleted ?? false,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };

  memoryCache.profiles.set(uid, { val: merged, cachedAt: Date.now() });

  try {
    const db = getAdminFirestore();
    await db.collection("users").doc(uid).set(merged, { merge: true });
  } catch (err: any) {
    console.warn("[Firestore] Write error for users collection:", err.message);
  }

  return merged;
}

/**
 * Fetches AI agent preferences with in-memory caching
 */
export async function getAgentPreferences(uid: string): Promise<AgentPreferences | null> {
  const cached = memoryCache.preferences.get(uid);
  if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
    return cached.val;
  }

  try {
    const db = getAdminFirestore();
    const doc = await db.collection("agent_preferences").doc(uid).get();
    if (doc.exists) {
      const data = doc.data() as AgentPreferences;
      memoryCache.preferences.set(uid, { val: data, cachedAt: Date.now() });
      return data;
    }
  } catch (err: any) {
    console.warn("[Firestore] Read error for agent_preferences:", err.message);
  }
  return cached?.val || null;
}

/**
 * Saves AI agent preferences
 */
export async function saveAgentPreferences(uid: string, prefs: Partial<AgentPreferences>): Promise<AgentPreferences> {
  const existing = await getAgentPreferences(uid);
  const now = new Date().toISOString();
  const merged: AgentPreferences = {
    userId: uid,
    optimizationGoal: prefs.optimizationGoal || existing?.optimizationGoal || "balanced",
    dailyBudgetCents: prefs.dailyBudgetCents ?? existing?.dailyBudgetCents ?? 5000,
    maxRideCents: prefs.maxRideCents ?? existing?.maxRideCents ?? 2000,
    evPreferred: prefs.evPreferred ?? existing?.evPreferred ?? false,
    premiumPreferred: prefs.premiumPreferred ?? existing?.premiumPreferred ?? false,
    sharedRideAllowed: prefs.sharedRideAllowed ?? existing?.sharedRideAllowed ?? true,
    updatedAt: now,
  };

  memoryCache.preferences.set(uid, { val: merged, cachedAt: Date.now() });

  try {
    const db = getAdminFirestore();
    await db.collection("agent_preferences").doc(uid).set(merged, { merge: true });
  } catch (err: any) {
    console.warn("[Firestore] Write error for agent_preferences:", err.message);
  }

  return merged;
}

/**
 * Fetches user wallet from Firestore with in-memory caching
 */
export async function getUserWallet(userId: string): Promise<UserWalletRecord | null> {
  const cached = memoryCache.wallets.get(userId);
  if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
    return cached.val;
  }

  try {
    const db = getAdminFirestore();
    const doc = await db.collection("wallets").doc(userId).get();
    if (doc.exists) {
      const data = doc.data() as UserWalletRecord;
      memoryCache.wallets.set(userId, { val: data, cachedAt: Date.now() });
      return data;
    }
  } catch (err: any) {
    console.warn("[Firestore] Read error for wallets:", err.message);
  }
  return cached?.val || null;
}

/**
 * Saves user wallet in Firestore
 */
export async function saveUserWallet(userId: string, data: Partial<UserWalletRecord>): Promise<UserWalletRecord> {
  const existing = await getUserWallet(userId);
  const now = new Date().toISOString();
  const merged: UserWalletRecord = {
    userId,
    status: data.status || existing?.status || "active",
    balanceCents: data.balanceCents ?? existing?.balanceCents ?? 0,
    address: data.address ?? existing?.address ?? null,
    blockchain: data.blockchain || existing?.blockchain || "ARC-TESTNET",
    circleWalletId: data.circleWalletId ?? existing?.circleWalletId ?? null,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };

  memoryCache.wallets.set(userId, { val: merged, cachedAt: Date.now() });

  try {
    const db = getAdminFirestore();
    await db.collection("wallets").doc(userId).set(merged, { merge: true });
  } catch (err: any) {
    console.warn("[Firestore] Write error for wallets:", err.message);
  }

  return merged;
}

/**
 * Saves user destinations
 */
export async function saveUserDestinations(uid: string, destinations: SavedDestination[]): Promise<void> {
  memoryCache.destinations.set(uid, destinations);

  try {
    const db = getAdminFirestore();
    const batch = db.batch();
    for (const d of destinations) {
      const docRef = db.collection("destinations").doc(`${uid}_${d.kind}`);
      batch.set(docRef, { ...d, userId: uid, createdAt: new Date().toISOString() });
    }
    await batch.commit();
  } catch (err: any) {
    console.warn("[Firestore] Write error for destinations:", err.message);
  }
}

/**
 * Saves ride request
 */
export async function saveRideRequest(req: RideRequestRecord): Promise<void> {
  memoryCache.requests.set(req.id, req);
  try {
    const db = getAdminFirestore();
    await db.collection("ride_requests").doc(req.id).set(req, { merge: true });
  } catch (err: any) {
    console.warn("[Firestore] Write error for ride_requests:", err.message);
  }
}

/**
 * Gets ride request
 */
export async function getRideRequest(id: string): Promise<RideRequestRecord | null> {
  try {
    const db = getAdminFirestore();
    const doc = await db.collection("ride_requests").doc(id).get();
    if (doc.exists) return doc.data() as RideRequestRecord;
  } catch (err: any) {
    console.warn("[Firestore] Read error for ride_requests:", err.message);
  }
  return memoryCache.requests.get(id) || null;
}

/**
 * Saves ride quotes
 */
export async function saveRideQuotes(rideRequestId: string, quotes: RideQuoteRecord[]): Promise<void> {
  memoryCache.quotes.set(rideRequestId, quotes);
  try {
    const db = getAdminFirestore();
    const batch = db.batch();
    for (const q of quotes) {
      const docRef = db.collection("ride_quotes").doc(q.id);
      batch.set(docRef, q, { merge: true });
    }
    await batch.commit();
  } catch (err: any) {
    console.warn("[Firestore] Write error for ride_quotes:", err.message);
  }
}

/**
 * Gets ride quotes
 */
export async function getRideQuotes(rideRequestId: string): Promise<RideQuoteRecord[]> {
  try {
    const db = getAdminFirestore();
    const snap = await db.collection("ride_quotes").where("rideRequestId", "==", rideRequestId).get();
    if (!snap.empty) {
      return snap.docs.map((d) => d.data() as RideQuoteRecord);
    }
  } catch (err: any) {
    console.warn("[Firestore] Read error for ride_quotes:", err.message);
  }
  return memoryCache.quotes.get(rideRequestId) || [];
}

/**
 * Sets selected quote
 */
export async function setSelectedQuote(rideRequestId: string, quoteId: string): Promise<void> {
  const quotes = await getRideQuotes(rideRequestId);
  for (const q of quotes) {
    q.isSelected = q.id === quoteId;
  }
  await saveRideQuotes(rideRequestId, quotes);
}

/**
 * Saves a ride booking in Firestore
 */
export async function saveRideBooking(booking: RideBookingRecord): Promise<void> {
  memoryCache.bookings.set(booking.id, booking);

  try {
    const db = getAdminFirestore();
    await db.collection("ride_bookings").doc(booking.id).set(booking, { merge: true });
    await db.collection("ride_lifecycle_events").add({
      rideBookingId: booking.id,
      status: booking.status,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.warn("[Firestore] Write error for ride_bookings:", err.message);
  }
}

/**
 * Retrieves a ride booking from Firestore
 */
export async function getRideBooking(bookingId: string): Promise<RideBookingRecord | null> {
  try {
    const db = getAdminFirestore();
    const doc = await db.collection("ride_bookings").doc(bookingId).get();
    if (doc.exists) {
      return doc.data() as RideBookingRecord;
    }
  } catch (err: any) {
    console.warn("[Firestore] Read error for ride_bookings:", err.message);
  }
  return memoryCache.bookings.get(bookingId) || null;
}

/**
 * Retrieves active or recent bookings for a user
 */
export async function getUserBookings(uid: string): Promise<RideBookingRecord[]> {
  try {
    const db = getAdminFirestore();
    const snapshot = await db.collection("ride_bookings").where("userId", "==", uid).get();
    if (!snapshot.empty) {
      return snapshot.docs.map((doc) => doc.data() as RideBookingRecord);
    }
  } catch (err: any) {
    console.warn("[Firestore] Read error for getUserBookings:", err.message);
  }

  const results: RideBookingRecord[] = [];
  for (const b of memoryCache.bookings.values()) {
    if (b.userId === uid) results.push(b);
  }
  return results;
}
