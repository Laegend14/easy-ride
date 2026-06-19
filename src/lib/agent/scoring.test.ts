import { describe, it, expect } from "vitest";
import { scoreOffers, selectBest } from "./scoring";
import type { AgentRidePreferences } from "./types";
import type { RideOffer } from "@/lib/providers";

const OFFERS: RideOffer[] = [
  { offerId: "a", provider: "Cheap", productName: "X", vehicleClass: "standard", fareCents: 1000, etaMinutes: 25, rating: 4.0 },
  { offerId: "b", provider: "Fast", productName: "X", vehicleClass: "standard", fareCents: 2000, etaMinutes: 10, rating: 4.5 },
  { offerId: "c", provider: "Rated", productName: "X", vehicleClass: "premium", fareCents: 1800, etaMinutes: 18, rating: 5.0 },
];

const base: AgentRidePreferences = {
  optimizationGoal: "balanced",
  dailyBudgetCents: 100000,
  maxRideCents: 100000,
  evPreferred: false,
  premiumPreferred: false,
  sharedRideAllowed: true,
};

function pick(goal: AgentRidePreferences["optimizationGoal"]) {
  return selectBest(scoreOffers(OFFERS, { ...base, optimizationGoal: goal }))?.provider;
}

describe("scoreOffers / selectBest", () => {
  it("selects the right offer per optimization goal", () => {
    expect(pick("cheapest")).toBe("Cheap");
    expect(pick("fastest")).toBe("Fast");
    expect(pick("highest_rated")).toBe("Rated");
  });

  it("excludes over-budget offers from selection but keeps them ranked", () => {
    const ranked = scoreOffers(OFFERS, { ...base, optimizationGoal: "fastest", maxRideCents: 1500 });
    const fast = ranked.find((o) => o.provider === "Fast")!;
    expect(fast.withinBudget).toBe(false);
    expect(fast.selected).toBe(false);
    // Cheapest affordable wins instead.
    expect(selectBest(ranked)?.provider).toBe("Cheap");
  });

  it("returns null selection when nothing is within budget", () => {
    const ranked = scoreOffers(OFFERS, { ...base, maxRideCents: 100 });
    expect(selectBest(ranked)).toBeNull();
    expect(ranked.every((o) => !o.withinBudget)).toBe(true);
  });

  it("handles empty input", () => {
    expect(scoreOffers([], base)).toEqual([]);
  });

  it("assigns ranks 1..n", () => {
    const ranked = scoreOffers(OFFERS, base);
    expect(ranked.map((o) => o.rank).sort()).toEqual([1, 2, 3]);
  });
});
