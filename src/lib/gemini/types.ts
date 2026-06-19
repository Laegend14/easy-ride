// Easy Ride — Gemini layer (Milestone 8). Structured outputs only.

import type { VehicleClass } from "@/lib/providers";
import type { OptimizationGoal } from "@/types/database";

export type PlaceRef = "home" | "work" | "airport" | "custom" | null;

export interface IntentPlace {
  /** The phrase the user used, e.g. "the airport". */
  raw: string;
  /** A usable address string if one was stated, else null. */
  address: string | null;
  placeRef: PlaceRef;
}

export interface RideIntent {
  destination: IntentPlace;
  origin: IntentPlace | null;
  /** Free text such as "now", "in 30 minutes", "8am" — null if unspecified. */
  when: string | null;
  vehiclePreference: VehicleClass | null;
  optimizationHint: OptimizationGoal | null;
  /** 0..1 model confidence. */
  confidence: number;
  needsClarification: boolean;
  clarificationPrompt: string | null;
}

export interface RideInsight {
  /** One-line, Web2-first explanation of the chosen ride. */
  reasoning: string;
  /** Optional savings/time framing, e.g. "Saves you $6 vs the priciest option." */
  savings: string | null;
  /** Short friendly trip summary. */
  summary: string;
}
