// The Arc Agent — Easy Ride's operational brain. Orchestrates provider
// discovery, scoring/selection, reasoning, and autonomous cancellation recovery.
// Decision logic is pure; economic actions are delegated to the EconomicActions
// abstraction (mock now, on-chain in M11).

import type { ProviderRegistry } from "@/lib/providers";
import type { RideSearchParams, RideOffer } from "@/lib/providers";
import type { AgentPreferences } from "@/types/database";
import type { AgentRidePreferences, RidePlan } from "./types";
import { scoreOffers, selectBest } from "./scoring";
import { explainSelection, explainNoOption, explainRecovery } from "./reasoning";
import type { EconomicActions } from "./economic-actions";

/** Map a DB agent_preferences row to the agent's working preferences. */
export function prefsFromRow(
  row: Pick<
    AgentPreferences,
    | "optimization_goal"
    | "daily_budget_cents"
    | "max_ride_cents"
    | "ev_preferred"
    | "premium_preferred"
    | "shared_ride_allowed"
  >,
): AgentRidePreferences {
  return {
    optimizationGoal: row.optimization_goal,
    dailyBudgetCents: row.daily_budget_cents,
    maxRideCents: row.max_ride_cents,
    evPreferred: row.ev_preferred,
    premiumPreferred: row.premium_preferred,
    sharedRideAllowed: row.shared_ride_allowed,
  };
}

export class RideAgent {
  constructor(
    private readonly registry: ProviderRegistry,
    private readonly economics: EconomicActions,
  ) {}

  /** Discover → compare → score → select, with transparent reasoning. */
  async planRide(
    params: RideSearchParams,
    prefs: AgentRidePreferences,
  ): Promise<RidePlan> {
    const offers = await this.registry.searchAll(params);
    return this.buildPlan(offers, prefs);
  }

  /** Re-plan after a driver cancellation, excluding the cancelled provider. */
  async recoverFromCancellation(
    params: RideSearchParams,
    cancelledProvider: string,
    previousFareCents: number,
    prefs: AgentRidePreferences,
    escrowId?: string,
    newBookingRef?: string,
  ): Promise<RidePlan> {
    const offers = (await this.registry.searchAll(params)).filter(
      (o) => o.provider !== cancelledProvider,
    );
    const plan = this.buildPlan(offers, prefs);

    if (plan.selected) {
      // Preserve funds: move the existing protected payment to the new booking.
      if (escrowId && newBookingRef) {
        await this.economics.reassignEscrow(escrowId, newBookingRef);
      }
      plan.reasoning = explainRecovery(
        plan.selected,
        cancelledProvider,
        previousFareCents,
      );
    }
    return plan;
  }

  private buildPlan(offers: RideOffer[], prefs: AgentRidePreferences): RidePlan {
    const ranked = scoreOffers(offers, prefs);
    const selected = selectBest(ranked);
    const rejectedForBudget = ranked.filter((o) => !o.withinBudget).length;

    const reasoning = selected
      ? explainSelection(selected, ranked, prefs.optimizationGoal)
      : explainNoOption(rejectedForBudget);

    return { offers: ranked, selected, reasoning, rejectedForBudget };
  }
}
