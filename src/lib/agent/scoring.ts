// Pure scoring engine. Ranks provider offers under the user's optimization goal,
// enforcing the per-ride budget. No I/O, no randomness — fully unit-testable.

import type { OptimizationGoal } from "@/types/database";
import type { RideOffer } from "@/lib/providers";
import type { AgentRidePreferences, RankedOffer } from "./types";

type Weights = { price: number; speed: number; rating: number };

const GOAL_WEIGHTS: Record<OptimizationGoal, Weights> = {
  cheapest: { price: 0.7, speed: 0.15, rating: 0.15 },
  fastest: { price: 0.15, speed: 0.7, rating: 0.15 },
  highest_rated: { price: 0.2, speed: 0.2, rating: 0.6 },
  balanced: { price: 0.35, speed: 0.35, rating: 0.3 },
};

/** Normalize so lower raw values score higher (price, ETA). Safe when all equal. */
function lowerIsBetter(value: number, min: number, max: number): number {
  if (max <= min) return 1;
  return (max - value) / (max - min);
}

/** Normalize so higher raw values score higher (rating). Safe when all equal. */
function higherIsBetter(value: number, min: number, max: number): number {
  if (max <= min) return 1;
  return (value - min) / (max - min);
}

export function scoreOffers(
  offers: RideOffer[],
  prefs: AgentRidePreferences,
): RankedOffer[] {
  if (offers.length === 0) return [];

  const fares = offers.map((o) => o.fareCents);
  const etas = offers.map((o) => o.etaMinutes);
  const ratings = offers.map((o) => o.rating);
  const minFare = Math.min(...fares);
  const maxFare = Math.max(...fares);
  const minEta = Math.min(...etas);
  const maxEta = Math.max(...etas);
  const minRating = Math.min(...ratings);
  const maxRating = Math.max(...ratings);

  const w = GOAL_WEIGHTS[prefs.optimizationGoal];

  const scored = offers.map((offer): RankedOffer => {
    const priceScore = lowerIsBetter(offer.fareCents, minFare, maxFare);
    const speedScore = lowerIsBetter(offer.etaMinutes, minEta, maxEta);
    // Rating is normalized relative to the candidate set — consistent with price
    // and speed — so the "highest_rated" goal reliably surfaces the top-rated
    // offer even when absolute ratings sit in a narrow band (e.g. 4.0–5.0).
    const ratingScore = higherIsBetter(offer.rating, minRating, maxRating);

    let score = w.price * priceScore + w.speed * speedScore + w.rating * ratingScore;

    // Soft preference nudges only when the goal is "balanced"; hard filtering by
    // vehicle class already happened at search time.
    if (prefs.optimizationGoal === "balanced") {
      if (prefs.evPreferred && offer.vehicleClass === "ev") score += 0.05;
      if (prefs.premiumPreferred && offer.vehicleClass === "premium") score += 0.05;
    }
    score = Math.max(0, Math.min(1, score));

    return {
      ...offer,
      score,
      rank: 0,
      selected: false,
      withinBudget: offer.fareCents <= prefs.maxRideCents,
    };
  });

  // Sort: affordable offers first (by score desc), then over-budget (by score desc).
  scored.sort((a, b) => {
    if (a.withinBudget !== b.withinBudget) return a.withinBudget ? -1 : 1;
    return b.score - a.score;
  });
  scored.forEach((o, i) => {
    o.rank = i + 1;
  });

  // Select the best affordable offer.
  const best = scored.find((o) => o.withinBudget);
  if (best) best.selected = true;

  return scored;
}

export function selectBest(ranked: RankedOffer[]): RankedOffer | null {
  return ranked.find((o) => o.selected) ?? null;
}
