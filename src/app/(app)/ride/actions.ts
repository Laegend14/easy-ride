"use server";

import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { createDefaultRegistry, resolveLocationDetails } from "@/lib/providers";
import type { RideSearchParams, VehicleClass } from "@/lib/providers";
import { RideAgent, MockEconomicActions, prefsFromRow } from "@/lib/agent";
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

  const supabase = createClient(await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in to request a ride." };

  const rl = checkRateLimit(user.id, "rideSearch", LIMITS.rideSearch);
  if (!rl.ok) return { error: rl.error };

  // Agent + preferences
  const { data: agent } = await supabase
    .from("agents")
    .select("id")
    .eq("user_id", user.id)
    .single();
  const { data: prefRow } = agent
    ? await supabase
        .from("agent_preferences")
        .select(
          "optimization_goal, daily_budget_cents, max_ride_cents, ev_preferred, premium_preferred, shared_ride_allowed",
        )
        .eq("agent_id", agent.id)
        .single()
    : { data: null };

  const prefs = prefRow
    ? prefsFromRow(prefRow)
    : {
        optimizationGoal: "balanced" as const,
        dailyBudgetCents: 5000,
        maxRideCents: 2000,
        evPreferred: false,
        premiumPreferred: false,
        sharedRideAllowed: true,
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

  // 2) Resolve places from saved destinations when referenced
  const resolvePlace = async (
    ref: string | null,
    fallback: string,
  ): Promise<string> => {
    if (ref === "home" || ref === "work") {
      const { data: place } = await supabase
        .from("destinations")
        .select("address")
        .eq("user_id", user.id)
        .eq("kind", ref)
        .maybeSingle();
      if (place?.address) return place.address;
    }
    return fallback;
  };

  const destinationText = await resolvePlace(
    intent.destination.placeRef,
    intent.destination.address ?? intent.destination.raw,
  );
  const originText = intent.origin
    ? await resolvePlace(
        intent.origin.placeRef,
        intent.origin.address ?? intent.origin.raw,
      )
    : "Current location";

  // Resolve named locations & coordinates
  const destLoc = resolveLocationDetails(destinationText, intent.destination.placeRef);
  const originLoc = resolveLocationDetails(originText, intent.origin?.placeRef);

  const destinationAddress = destLoc.address;
  const originAddress = originLoc.address;

  // 3) Persist the request
  const { data: reqRow, error: reqErr } = await supabase
    .from("ride_requests")
    .insert({
      user_id: user.id,
      agent_id: agent?.id ?? null,
      raw_text: rawText,
      parsed_intent: intent,
      origin_address: originAddress,
      origin_lat: originLoc.lat,
      origin_lng: originLoc.lng,
      destination_address: destinationAddress,
      destination_lat: destLoc.lat,
      destination_lng: destLoc.lng,
      status: "SEARCHING",
    })
    .select("id")
    .single();
  if (reqErr || !reqRow) return { error: "Couldn't start your search. Try again." };

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

  // 5) Persist quotes
  if (plan.offers.length > 0) {
    await supabase.from("ride_quotes").insert(
      plan.offers.map((o) => ({
        ride_request_id: reqRow.id,
        provider: o.provider,
        product_name: o.productName,
        fare_cents: o.fareCents,
        eta_minutes: o.etaMinutes,
        rating: o.rating,
        is_selected: o.selected,
        score: o.score,
        raw: o.raw ?? null,
      })),
    );
  }

  // 6) Insight (Gemini + fallback) + decision record
  const insight = await generateRideInsight({ intent, plan });
  await supabase.from("agent_decisions").insert({
    agent_id: agent?.id ?? null,
    ride_request_id: reqRow.id,
    decision_type: "ride_planned",
    reasoning: insight.reasoning,
    structured: {
      goal,
      selected: plan.selected?.provider ?? null,
      offerCount: plan.offers.length,
      rejectedForBudget: plan.rejectedForBudget,
    },
  });

  // 7) Advance status
  await supabase
    .from("ride_requests")
    .update({ status: plan.selected ? "PROVIDER_SELECTED" : "SEARCHING" })
    .eq("id", reqRow.id);

  return {
    error: null,
    rideRequestId: reqRow.id,
    query: rawText,
    destinationLabel: destLoc.label,
    selectedProvider: plan.selected?.provider ?? null,
    reasoning: insight.reasoning,
    savings: insight.savings,
    summary: insight.summary,
    originAddress: originAddress,
    originLat: originLoc.lat,
    originLng: originLoc.lng,
    destinationAddress: destinationAddress,
    destinationLat: destLoc.lat,
    destinationLng: destLoc.lng,
    offers: plan.offers.map((o) => ({
      offerId: o.offerId,
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
  if (!rideRequestId) return { error: "Missing ride to book." };

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
