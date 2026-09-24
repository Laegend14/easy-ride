import { describe, it, expect } from "vitest";
import { calculateRideMonetization, getPlatformRevenueSummary, recordCompletedRideRevenue } from "./revenue";

describe("Revenue & Monetization Engine", () => {
  it("calculates platform convenience fee and savings share correctly", () => {
    const result = calculateRideMonetization({
      fareCents: 2000, // $20.00
      highestOrFastestFareCents: 3000, // $30.00 (user saved $10.00)
      isProMember: false,
    });

    expect(result.rawFareCents).toBe(2000);
    expect(result.platformFeeCents).toBe(150); // $1.50
    expect(result.riderSavedCents).toBe(1000); // $10.00
    expect(result.savingsShareCents).toBe(100); // 10% of $10.00 = $1.00
    expect(result.netFounderEarningsCents).toBe(250); // $1.50 + $1.00 = $2.50
    expect(result.totalChargedCents).toBe(2150); // $20.00 + $1.50 = $21.50
  });

  it("waives platform convenience fee for Pro members", () => {
    const result = calculateRideMonetization({
      fareCents: 2500,
      highestOrFastestFareCents: 3000,
      isProMember: true,
    });

    expect(result.platformFeeCents).toBe(0);
    expect(result.savingsShareCents).toBe(50); // 10% of $5.00 = $0.50
    expect(result.totalChargedCents).toBe(2500); // No platform fee added
  });

  it("returns aggregate platform revenue summary", () => {
    const summary = getPlatformRevenueSummary();
    expect(summary.totalGmvDollars).toBeGreaterThan(0);
    expect(summary.netRevenueDollars).toBeGreaterThan(0);
    expect(summary.proSubscriptionsCount).toBeGreaterThan(0);
  });
});
