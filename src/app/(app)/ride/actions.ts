"use server";

import { randomUUID } from "node:crypto";
import { getCurrentFirebaseUser } from "@/lib/firebase/session";
import {
  getUserProfile,
  getAgentPreferences,
  saveRideRequest,
  saveRideQuotes,
  setSelectedQuote,
  type RideRequestRecord,
  type RideQuoteRecord,
} from "@/lib/firebase/db";
import { createDefaultRegistry, resolveLocationDetails } from "@/lib/providers";
import type { RideSearchParams, VehicleClass } from "@/lib/providers";
import { RideAgent, MockEconomicActions } from "@/lib/agent";
import { parseRideIntent, generateRideInsight } from "@/lib/gemini";
import { bookSelectedRide, settleRide } from "@/lib/payments/booking";
import { getRideStatus, type RideStatusView } from "@/lib/payments/ride-status";
import { recoverRide } from "@/lib/payments/recovery";
import { checkRateLimit, LIMITS } from "@/lib/security/rate-limit";
import { clampText } from "@/lib/security/validate";

export interface RideOfferLite {
  offerId: string;
  provider: string;
  productName: string;
  vehicleClass: VehicleClass;
  fareCents: number;
  etaMinutes: number;
  rating: number;
  selected: boolean;
  withinBudget: boolean;
  driverName?: string;
  driverPhoto?: string;
  driverSex?: string;
  driverRating?: number;
  vehicleName?: string;
  vehiclePhoto?: string;
}

export interface RideResult {
  error: string | null;
  needsClarification?: boolean;
  clarificationPrompt?: string | null;
  rideRequestId?: string;
  query?: string;
  destinationLabel?: string;
  offers?: RideOfferLite[];
  selectedProvider?: string | null;
  reasoning?: string;
  savings?: string | null;
  summary?: string;
  originAddress?: string;
  originLat?: number;
  originLng?: number;
  destinationAddress?: string;
  destinationLat?: number;
  destinationLng?: number;
}

export async function requestRide(
  _prev: RideResult,
  formData: FormData,
): Promise<RideResult> {
  const rawText = clampText(formData.get("query"), 280);
  if (!rawText) return { error: "Tell me where you'd like to go." };

  const fbUser = await getCurrentFirebaseUser();
  if (!fbUser) return { error: "Please sign in to request a ride." };

  const rl = checkRateLimit(fbUser.uid, "rideSearch", LIMITS.rideSearch);
  if (!rl.ok) return { error: rl.error };

  // Agent + preferences from Firestore
  const prefRow = await getAgentPreferences(fbUser.uid);
  const profile = await getUserProfile(fbUser.uid);

  const prefs = {
    optimizationGoal: prefRow?.optimizationGoal ?? ("balanced" as const),
    dailyBudgetCents: prefRow?.dailyBudgetCents ?? 5000,
    maxRideCents: prefRow?.maxRideCents ?? 2000,
    evPreferred: prefRow?.evPreferred ?? false,
    premiumPreferred: prefRow?.premiumPreferred ?? false,
    sharedRideAllowed: prefRow?.sharedRideAllowed ?? true,
  };

  // 1) Gemini understanding
  const intent = await parseRideIntent(rawText);
  if (intent.needsClarification) {
    return {
      error: null,
      needsClarification: true,
      clarificationPrompt:
        intent.clarificationPrompt ?? "Where would you like to go?",
      query: rawText,
    };
  }

  // 2) Resolve places from saved destinations
  const resolvePlace = (ref: string | null, fallback: string): string => {
    if (ref === "home" && profile?.homeAddress) return profile.homeAddress;
    if (ref === "work" && profile?.workAddress) return profile.workAddress;
    return fallback;
  };

  const destinationText = resolvePlace(
    intent.destination.placeRef,
    intent.destination.address ?? intent.destination.raw,
  );
  const originText = intent.origin
    ? resolvePlace(intent.origin.placeRef, intent.origin.address ?? intent.origin.raw)
    : "Current location";

  // Resolve named locations & coordinates
  const destLoc = resolveLocationDetails(destinationText, intent.destination.placeRef);
  const originLoc = resolveLocationDetails(originText, intent.origin?.placeRef);

  const destinationAddress = destLoc.address;
  const originAddress = originLoc.address;
  const reqId = randomUUID();

  // 3) Persist the request to Firestore
  const requestRecord: RideRequestRecord = {
    id: reqId,
    userId: fbUser.uid,
    rawText,
    originAddress,
    originLat: originLoc.lat,
    originLng: originLoc.lng,
    destinationAddress,
    destinationLat: destLoc.lat,
    destinationLng: destLoc.lng,
    status: "SEARCHING",
    createdAt: new Date().toISOString(),
  };

  await saveRideRequest(requestRecord);

  // 4) Provider search + agent recommendation
  const params: RideSearchParams = {
    origin: { address: originAddress },
    destination: { address: destinationAddress },
    evPreferred: intent.vehiclePreference === "ev" || prefs.evPreferred,
    sharedAllowed: prefs.sharedRideAllowed,
  };
  const goal = intent.optimizationHint ?? prefs.optimizationGoal;
  const agentEngine = new RideAgent(createDefaultRegistry(), new MockEconomicActions());
  const plan = await agentEngine.planRide(params, { ...prefs, optimizationGoal: goal });

  // 5) Persist quotes to Firestore
  if (plan.offers.length > 0) {
    const quotesToSave: RideQuoteRecord[] = plan.offers.map((o) => ({
      id: o.offerId || (o as any).id || randomUUID(),
      rideRequestId: reqId,
      provider: o.provider,
      productName: o.productName,
      fareCents: o.fareCents,
      etaMinutes: o.etaMinutes,
      rating: o.rating,
      isSelected: o.selected,
      score: o.score,
    }));
    await saveRideQuotes(reqId, quotesToSave);
  }

  // 6) Insight (Gemini + fallback)
  const insight = await generateRideInsight({ intent, plan });

  return {
    error: null,
    rideRequestId: reqId,
    query: rawText,
    destinationLabel: destLoc.label,
    selectedProvider: plan.selected?.provider ?? null,
    reasoning: insight.reasoning,
    savings: insight.savings,
    summary: insight.summary,
    originAddress,
    originLat: originLoc.lat,
    originLng: originLoc.lng,
    destinationAddress,
    destinationLat: destLoc.lat,
    destinationLng: destLoc.lng,
    offers: plan.offers.map((o) => ({
      offerId: o.offerId || (o as any).id || randomUUID(),
      provider: o.provider,
      productName: o.productName,
      vehicleClass: o.vehicleClass,
      fareCents: o.fareCents,
      etaMinutes: o.etaMinutes,
      rating: o.rating,
      selected: o.selected,
      withinBudget: o.withinBudget,
      driverName: o.driverName,
      driverPhoto: o.driverPhoto,
      driverSex: o.driverSex,
      driverRating: o.driverRating,
      vehicleName: o.vehicleName,
      vehiclePhoto: o.vehiclePhoto,
    })),
  };
}

export interface BookingState {
  error: string | null;
  bookingId?: string;
  status?: string;
  provider?: string;
  onchain?: boolean;
}

export async function bookRide(
  _prev: BookingState,
  formData: FormData,
): Promise<BookingState> {
  const rideRequestId = String(formData.get("rideRequestId") ?? "");
  const selectedOfferId = String(
    formData.get("selectedOfferId") ?? formData.get("offerId") ?? "",
  );

  if (!rideRequestId) return { error: "Missing ride to book." };

  if (selectedOfferId) {
    await setSelectedQuote(rideRequestId, selectedOfferId);
  }

  const result = await bookSelectedRide(rideRequestId);
  if ("error" in result) return { error: result.error };
  return {
    error: null,
    bookingId: result.summary.bookingId,
    status: result.summary.status,
    provider: result.summary.provider,
    onchain: result.summary.onchain,
  };
}

export async function completeTrip(
  _prev: BookingState,
  formData: FormData,
): Promise<BookingState> {
  const bookingId = String(formData.get("bookingId") ?? "");
  if (!bookingId) return { error: "Missing booking." };

  const result = await settleRide(bookingId);
  if ("error" in result) return { error: result.error };
  return {
    error: null,
    bookingId: result.summary.bookingId,
    status: result.summary.status,
    onchain: result.summary.onchain,
  };
}

/** Lightweight poll target for live ride-status updates in the UI. */
export async function refreshRideStatus(
  bookingId: string,
): Promise<RideStatusView | null> {
  return getRideStatus(bookingId);
}

export interface RecoveryState {
  error: string | null;
  recovered?: boolean;
  refunded?: boolean;
  newBookingId?: string;
  provider?: string;
  reasoning?: string;
}

export async function simulateCancellation(
  _prev: RecoveryState,
  formData: FormData,
): Promise<RecoveryState> {
  const bookingId = String(formData.get("bookingId") ?? "");
  const action = formData.get("action") as "rebook" | "refund" | null;
  if (!bookingId) return { error: "Missing ride." };

  const outcome = await recoverRide(bookingId, action ?? undefined);
  if ("error" in outcome) return { error: outcome.error };
  return {
    error: null,
    recovered: outcome.result.recovered,
    refunded: outcome.result.refunded,
    newBookingId: outcome.result.newBookingId,
    provider: outcome.result.provider,
    reasoning: outcome.result.reasoning,
  };
}
