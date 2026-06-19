import "server-only";
import type { RidePlan } from "@/lib/agent";
import { generateJson } from "./client";
import type { RideIntent, RideInsight } from "./types";

const SYSTEM = `You are Easy Ride's assistant explaining a booking decision to a rider.
Consumer travel app — friendly, concise, reassuring. Never mention wallets, blockchain, crypto, or gas.
Refer to payment protection as "Protected Payment". Return ONLY JSON:
{ "reasoning": string, "savings": string|null, "summary": string }
- reasoning: one sentence on why this ride was chosen.
- savings: a short money/time win if there is one, else null.
- summary: a short friendly trip summary line.`;

function usd(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

/** Deterministic insight derived from the agent's plan (no LLM). */
export function fallbackInsight(plan: RidePlan): RideInsight {
  const selected = plan.selected;
  if (!selected) {
    return { reasoning: plan.reasoning, savings: null, summary: "No ride selected yet." };
  }
  const affordable = plan.offers.filter((o) => o.withinBudget);
  const priciest = affordable.reduce(
    (max, o) => (o.fareCents > max ? o.fareCents : max),
    selected.fareCents,
  );
  const saved = priciest - selected.fareCents;
  return {
    reasoning: plan.reasoning,
    savings: saved > 0 ? `Saves you ${usd(saved)} vs the priciest option.` : null,
    summary: `${selected.provider} • ${usd(selected.fareCents)} • ~${selected.etaMinutes} min`,
  };
}

/** Gemini-enriched explanation of the selected ride, with deterministic fallback. */
export async function generateRideInsight(args: {
  intent: RideIntent;
  plan: RidePlan;
}): Promise<RideInsight> {
  const { intent, plan } = args;
  if (!plan.selected) return fallbackInsight(plan);

  try {
    const offersBrief = plan.offers
      .slice(0, 5)
      .map(
        (o) =>
          `${o.provider}: ${usd(o.fareCents)}, ${o.etaMinutes}min, ${o.rating}star${o.selected ? " (selected)" : ""}`,
      )
      .join("; ");

    const insight = await generateJson<RideInsight>({
      system: SYSTEM,
      prompt: `Rider wanted: "${intent.destination.raw}". Options -> ${offersBrief}. Agent's note: "${plan.reasoning}". Explain the pick.`,
    });

    return {
      reasoning:
        typeof insight.reasoning === "string" && insight.reasoning.trim()
          ? insight.reasoning
          : plan.reasoning,
      savings:
        typeof insight.savings === "string" && insight.savings.trim()
          ? insight.savings
          : fallbackInsight(plan).savings,
      summary:
        typeof insight.summary === "string" && insight.summary.trim()
          ? insight.summary
          : fallbackInsight(plan).summary,
    };
  } catch (err) {
    console.error("[generateRideInsight] Gemini failed, using fallback:", err);
    return fallbackInsight(plan);
  }
}
