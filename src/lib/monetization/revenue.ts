// Easy Ride Founder Revenue & Monetization Engine:
// 1. Platform convenience fee ($1.50 flat per ride, waived for Pro subscribers)
// 2. Savings performance fee (10% of verified dollars saved by AI optimization)
// 3. Pro membership tier ($9.99/mo)
// 4. Lifetime GMV & profit analytics for founder

export interface RideMonetizationBreakdown {
  rawFareCents: number;
  platformFeeCents: number;
  savingsShareCents: number;
  netFounderEarningsCents: number;
  totalChargedCents: number;
  riderSavedCents: number;
  isProMember: boolean;
}

export const MONETIZATION_CONFIG = {
  defaultPlatformFeeCents: 150, // $1.50 per trip
  savingsShareRate: 0.10, // 10% of savings
  proMonthlyPriceCents: 999, // $9.99/mo
};

/**
 * Calculates developer earnings for a given ride booking
 */
export function calculateRideMonetization(params: {
  fareCents: number;
  highestOrFastestFareCents?: number;
  isProMember?: boolean;
}): RideMonetizationBreakdown {
  const { fareCents, highestOrFastestFareCents, isProMember = false } = params;

  // 1. Platform fee (waived for Pro)
  const platformFeeCents = isProMember ? 0 : MONETIZATION_CONFIG.defaultPlatformFeeCents;

  // 2. Savings performance fee
  let riderSavedCents = 0;
  let savingsShareCents = 0;

  if (highestOrFastestFareCents && highestOrFastestFareCents > fareCents) {
    riderSavedCents = highestOrFastestFareCents - fareCents;
    savingsShareCents = Math.round(riderSavedCents * MONETIZATION_CONFIG.savingsShareRate);
  }

  const netFounderEarningsCents = platformFeeCents + savingsShareCents;
  const totalChargedCents = fareCents + platformFeeCents;

  return {
    rawFareCents: fareCents,
    platformFeeCents,
    savingsShareCents,
    netFounderEarningsCents,
    totalChargedCents,
    riderSavedCents,
    isProMember,
  };
}

export interface PlatformRevenueSummary {
  totalGmvDollars: number;
  netRevenueDollars: number;
  platformFeesDollars: number;
  savingsFeesDollars: number;
  proSubscriptionsCount: number;
  totalRiderSavingsDollars: number;
  totalTripsCount: number;
}

// In-memory / persistent ledger fallback for analytics
let MOCK_REVENUE_LEDGER = {
  totalGmvCents: 1425000, // $14,250.00
  platformFeesCents: 184500, // $1,845.00
  savingsFeesCents: 64200, // $642.00
  proSubscribers: 28,
  totalRiderSavingsCents: 642000, // $6,420.00 saved for riders
  totalTripsCount: 1230,
};

export function recordCompletedRideRevenue(breakdown: RideMonetizationBreakdown) {
  MOCK_REVENUE_LEDGER.totalGmvCents += breakdown.totalChargedCents;
  MOCK_REVENUE_LEDGER.platformFeesCents += breakdown.platformFeeCents;
  MOCK_REVENUE_LEDGER.savingsFeesCents += breakdown.savingsShareCents;
  MOCK_REVENUE_LEDGER.totalRiderSavingsCents += breakdown.riderSavedCents;
  MOCK_REVENUE_LEDGER.totalTripsCount += 1;
}

export function getPlatformRevenueSummary(): PlatformRevenueSummary {
  const totalNet = MOCK_REVENUE_LEDGER.platformFeesCents + MOCK_REVENUE_LEDGER.savingsFeesCents + (MOCK_REVENUE_LEDGER.proSubscribers * MONETIZATION_CONFIG.proMonthlyPriceCents);
  return {
    totalGmvDollars: Number((MOCK_REVENUE_LEDGER.totalGmvCents / 100).toFixed(2)),
    netRevenueDollars: Number((totalNet / 100).toFixed(2)),
    platformFeesDollars: Number((MOCK_REVENUE_LEDGER.platformFeesCents / 100).toFixed(2)),
    savingsFeesDollars: Number((MOCK_REVENUE_LEDGER.savingsFeesCents / 100).toFixed(2)),
    proSubscriptionsCount: MOCK_REVENUE_LEDGER.proSubscribers,
    totalRiderSavingsDollars: Number((MOCK_REVENUE_LEDGER.totalRiderSavingsCents / 100).toFixed(2)),
    totalTripsCount: MOCK_REVENUE_LEDGER.totalTripsCount,
  };
}
