// Easy Ride — Arc Agent (Milestone 7). The agent's decision/orchestration core.
// Pure, framework-free types so the engine is unit-testable and reusable from
// server actions (M10), the Gemini flow (M8), and the escrow layer (M11).

import type { OptimizationGoal, RideStatus } from "@/types/database";
import type { RideOffer } from "@/lib/providers";

/** camelCase subset of the agent_preferences row the agent reasons over. */
export interface AgentRidePreferences {
  optimizationGoal: OptimizationGoal;
  dailyBudgetCents: number;
  maxRideCents: number;
  evPreferred: boolean;
  premiumPreferred: boolean;
  sharedRideAllowed: boolean;
}

/** An offer after the agent has scored and ranked it. */
export interface RankedOffer extends RideOffer {
  /** 0..1 composite score under the active optimization goal. */
  score: number;
  /** 1-based rank among selectable offers (best first). */
  rank: number;
  selected: boolean;
  /** False when fare exceeds the per-ride budget — kept for transparency. */
  withinBudget: boolean;
}

/** Result of the agent planning a ride. */
export interface RidePlan {
  offers: RankedOffer[];
  selected: RankedOffer | null;
  /** Human-readable, Web2-first explanation of the choice. */
  reasoning: string;
  /** How many offers were excluded for exceeding the per-ride budget. */
  rejectedForBudget: number;
}

/** The 8 user-facing booking stages, mapped to the DB RideStatus enum. */
export type RideStage =
  | "provider_selected"
  | "booking_confirmed"
  | "payment_secured"
  | "driver_assigned"
  | "driver_approaching"
  | "ride_in_progress"
  | "destination_reached"
  | "settled";

/** Shape persisted to agent_decisions by the server caller (M10). */
export interface AgentDecisionRecord {
  decisionType:
    | "ride_planned"
    | "provider_selected"
    | "cancellation_recovered"
    | "rebooked";
  reasoning: string;
  structured: Record<string, unknown>;
}

export type { RideStatus };
