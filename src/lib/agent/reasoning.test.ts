import { describe, it, expect } from "vitest";
import { explainSelection, explainNoOption, explainRecovery } from "./reasoning";
import type { RankedOffer } from "./types";

function offer(p: Partial<RankedOffer>): RankedOffer {
  return {
    offerId: p.offerId ?? "x",
    provider: p.provider ?? "Prov",
    productName: "X",
    vehicleClass: "standard",
    fareCents: p.fareCents ?? 1000,
    etaMinutes: p.etaMinutes ?? 10,
    rating: p.rating ?? 4.5,
    score: p.score ?? 0.5,
    rank: p.rank ?? 1,
    selected: p.selected ?? false,
    withinBudget: p.withinBudget ?? true,
  };
}

const offers: RankedOffer[] = [
  offer({ offerId: "a", provider: "Cheap", fareCents: 1000, etaMinutes: 25, selected: true }),
  offer({ offerId: "b", provider: "Fast", fareCents: 2000, etaMinutes: 10 }),
];

describe("explainSelection", () => {
  it("names the selected provider and compares alternatives", () => {
    const text = explainSelection(offers[0], offers, "cheapest");
    expect(text).toContain("Cheap");
    expect(text.length).toBeGreaterThan(10);
  });
});

describe("explainNoOption", () => {
  it("differentiates budget vs no availability", () => {
    expect(explainNoOption(3)).toMatch(/budget/i);
    expect(explainNoOption(0)).toMatch(/available|try again/i);
  });
});

describe("explainRecovery", () => {
  it("mentions cancellation, the new provider, and protection", () => {
    const text = explainRecovery(offers[1], "Cheap", 1000);
    expect(text).toContain("Cheap");
    expect(text).toContain("Fast");
    expect(text).toMatch(/protect/i);
  });
});
