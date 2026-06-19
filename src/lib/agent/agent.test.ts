import { describe, it, expect } from "vitest";
import { RideAgent, prefsFromRow } from "./agent";
import { MockEconomicActions } from "./economic-actions";
import { createDefaultRegistry } from "@/lib/providers";
import type { RideSearchParams } from "@/lib/providers";
import type { AgentRidePreferences } from "./types";

const ROUTE: RideSearchParams = {
  origin: { address: "12 Market St" },
  destination: { address: "JFK Airport" },
};

const PREFS: AgentRidePreferences = {
  optimizationGoal: "balanced",
  dailyBudgetCents: 100000,
  maxRideCents: 100000,
  evPreferred: false,
  premiumPreferred: false,
  sharedRideAllowed: true,
};

function newAgent() {
  return new RideAgent(createDefaultRegistry(), new MockEconomicActions());
}

describe("prefsFromRow", () => {
  it("maps a DB agent_preferences row to working preferences", () => {
    const prefs = prefsFromRow({
      optimization_goal: "fastest",
      daily_budget_cents: 5000,
      max_ride_cents: 2500,
      ev_preferred: true,
      premium_preferred: false,
      shared_ride_allowed: true,
    });
    expect(prefs).toEqual({
      optimizationGoal: "fastest",
      dailyBudgetCents: 5000,
      maxRideCents: 2500,
      evPreferred: true,
      premiumPreferred: false,
      sharedRideAllowed: true,
    });
  });
});

describe("RideAgent.planRide", () => {
  it("selects an affordable offer and returns reasoning", async () => {
    const plan = await newAgent().planRide(ROUTE, PREFS);
    expect(plan.offers.length).toBeGreaterThan(0);
    expect(plan.selected).not.toBeNull();
    expect(plan.selected!.withinBudget).toBe(true);
    expect(plan.selected!.selected).toBe(true);
    expect(plan.reasoning).toBeTruthy();
  });

  it("is deterministic for the same route + preferences", async () => {
    const a = await newAgent().planRide(ROUTE, PREFS);
    const b = await newAgent().planRide(ROUTE, PREFS);
    expect(a.selected!.provider).toBe(b.selected!.provider);
    expect(a.selected!.fareCents).toBe(b.selected!.fareCents);
  });

  it("makes no selection and counts rejects when every offer is over budget", async () => {
    const plan = await newAgent().planRide(ROUTE, { ...PREFS, maxRideCents: 1 });
    expect(plan.selected).toBeNull();
    expect(plan.rejectedForBudget).toBe(plan.offers.length);
    expect(plan.reasoning).toBeTruthy();
  });
});

describe("RideAgent.recoverFromCancellation", () => {
  it("re-plans excluding the cancelled provider and reassigns the protected payment", async () => {
    const economics = new MockEconomicActions();
    const agent = new RideAgent(createDefaultRegistry(), economics);

    // Find who would normally be selected, then simulate that driver cancelling.
    const original = await agent.planRide(ROUTE, PREFS);
    const cancelled = original.selected!.provider;

    // A funded escrow exists from the original booking.
    const escrow = await economics.createEscrow("booking-1", original.selected!.fareCents);
    await economics.lockFunds(escrow.escrowId);

    const plan = await agent.recoverFromCancellation(
      ROUTE,
      cancelled,
      original.selected!.fareCents,
      PREFS,
      escrow.escrowId,
      "booking-2",
    );

    expect(plan.selected).not.toBeNull();
    expect(plan.selected!.provider).not.toBe(cancelled);
    expect(plan.offers.every((o) => o.provider !== cancelled)).toBe(true);

    // Funds were preserved and moved to the replacement booking.
    const moved = await economics.reassignEscrow(escrow.escrowId, "booking-2");
    expect(moved.state).toBe("reassigned");
    expect(moved.bookingRef).toBe("booking-2");
  });
});
