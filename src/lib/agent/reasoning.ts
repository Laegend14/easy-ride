// Deterministic, human-readable explanation of the agent's choice. This is NOT
// the LLM (that's M8) — it's transparent string math the user can trust.
// Web2-first language: no chain/wallet terms.

import type { OptimizationGoal } from "@/types/database";
import type { RankedOffer } from "./types";

function usd(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

/** Explain why `selected` was chosen vs the cheapest and fastest alternatives. */
export function explainSelection(
  selected: RankedOffer,
  offers: RankedOffer[],
  goal: OptimizationGoal,
): string {
  const affordable = offers.filter((o) => o.withinBudget);
  const cheapest = [...affordable].sort((a, b) => a.fareCents - b.fareCents)[0];
  const fastest = [...affordable].sort((a, b) => a.etaMinutes - b.etaMinutes)[0];

  const parts: string[] = [];

  switch (goal) {
    case "cheapest":
      parts.push(
        `${selected.provider} is the best value at ${usd(selected.fareCents)}.`,
      );
      break;
    case "fastest":
      parts.push(
        `${selected.provider} gets you there fastest — about ${selected.etaMinutes} min.`,
      );
      break;
    case "highest_rated":
      parts.push(
        `${selected.provider} is the top-rated pick (${selected.rating.toFixed(1)}★) within your budget.`,
      );
      break;
    default:
      parts.push(
        `${selected.provider} is the best balance of price and time.`,
      );
  }

  // Compare to the fastest alternative (if it's a different, pricier option).
  if (fastest && fastest.offerId !== selected.offerId) {
    const saved = fastest.fareCents - selected.fareCents;
    const slower = selected.etaMinutes - fastest.etaMinutes;
    if (saved > 0 && slower > 0) {
      const pct = Math.round((saved / fastest.fareCents) * 100);
      parts.push(
        `${pct}% cheaper than the fastest option, adding only ${slower} min.`,
      );
    }
  }

  // Compare to the cheapest alternative (if we picked something pricier for speed/quality).
  if (cheapest && cheapest.offerId !== selected.offerId) {
    const extra = selected.fareCents - cheapest.fareCents;
    const faster = cheapest.etaMinutes - selected.etaMinutes;
    if (extra > 0 && faster > 0) {
      parts.push(
        `${faster} min sooner than the cheapest, for ${usd(extra)} more.`,
      );
    }
  }

  return parts.join(" ");
}

export function explainNoOption(rejectedForBudget: number): string {
  if (rejectedForBudget > 0) {
    return "Every available ride is above your per-ride budget right now. Raise your max in Settings or try again shortly.";
  }
  return "No rides are available for that trip right now. Please try again in a moment.";
}

/** Reasoning for an autonomous rebooking after a driver cancellation. */
export function explainRecovery(
  newPick: RankedOffer,
  cancelledProvider: string,
  previousFareCents: number,
): string {
  const diff = newPick.fareCents - previousFareCents;
  const tail =
    diff <= 0
      ? `at the same protected price or less (${usd(newPick.fareCents)}).`
      : `for ${usd(diff)} more (${usd(newPick.fareCents)}), still within your budget.`;
  return `${cancelledProvider} cancelled — your payment stayed protected and we rebooked with ${newPick.provider} ${tail}`;
}
