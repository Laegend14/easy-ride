import "server-only";
import type { VehicleClass } from "@/lib/providers";
import type { OptimizationGoal } from "@/types/database";
import { generateJson } from "./client";
import type { RideIntent, PlaceRef, IntentPlace } from "./types";

const VEHICLES: VehicleClass[] = ["standard", "shared", "premium", "ev"];
const GOALS: OptimizationGoal[] = ["cheapest", "fastest", "balanced", "highest_rated"];
const PLACE_REFS: PlaceRef[] = ["home", "work", "airport", "custom", null];

const SYSTEM = `You are Easy Ride's dispatch parser. Convert a rider's natural-language request into a ride intent.
This is a consumer travel app — never mention payments rails, wallets, blockchain, or crypto.
Return ONLY a JSON object with exactly this shape:
{
  "destination": { "raw": string, "address": string|null, "placeRef": "home"|"work"|"airport"|"custom"|null },
  "origin": { "raw": string, "address": string|null, "placeRef": "home"|"work"|"airport"|"custom"|null } | null,
  "when": string|null,
  "vehiclePreference": "standard"|"shared"|"premium"|"ev"|null,
  "optimizationHint": "cheapest"|"fastest"|"balanced"|"highest_rated"|null,
  "confidence": number,
  "needsClarification": boolean,
  "clarificationPrompt": string|null
}
Rules:
- placeRef "home"/"work" when the rider says home/work/office; "airport" for airports; "custom" for any other named place; null if none.
- address: a concrete address only if the rider stated one, else null (leave the named place in raw).
- "cheap/cheapest/save" -> cheapest; "fast/quick/hurry/asap" -> fastest; "best rated/safe" -> highest_rated; otherwise null.
- "ev/electric/tesla" -> ev; "pool/share" -> shared; "premium/luxury/black" -> premium; else null.
- needsClarification true only if there is no usable destination; then set a short clarificationPrompt.
- confidence in [0,1].`;

function clamp01(n: unknown): number {
  const v = typeof n === "number" ? n : 0;
  return Math.max(0, Math.min(1, v));
}

function oneOf<T>(value: unknown, allowed: readonly T[], fallback: T): T {
  return (allowed as readonly unknown[]).includes(value) ? (value as T) : fallback;
}

function normalizePlace(p: unknown): IntentPlace | null {
  if (!p || typeof p !== "object") return null;
  const o = p as Record<string, unknown>;
  const raw = typeof o.raw === "string" ? o.raw : "";
  if (!raw && !o.address) return null;
  return {
    raw,
    address: typeof o.address === "string" && o.address.trim() ? o.address : null,
    placeRef: oneOf(o.placeRef, PLACE_REFS, null),
  };
}

function normalize(obj: Record<string, unknown>, rawText: string): RideIntent {
  const destination =
    normalizePlace(obj.destination) ??
    ({ raw: rawText, address: null, placeRef: "custom" } as IntentPlace);
  return {
    destination,
    origin: normalizePlace(obj.origin),
    when: typeof obj.when === "string" && obj.when.trim() ? obj.when : null,
    vehiclePreference: oneOf(obj.vehiclePreference, [...VEHICLES, null], null),
    optimizationHint: oneOf(obj.optimizationHint, [...GOALS, null], null),
    confidence: clamp01(obj.confidence),
    needsClarification: Boolean(obj.needsClarification),
    clarificationPrompt:
      typeof obj.clarificationPrompt === "string" ? obj.clarificationPrompt : null,
  };
}

/** Deterministic parse used when Gemini is unavailable. */
export function fallbackIntent(rawText: string): RideIntent {
  const text = rawText.trim();
  const lower = text.toLowerCase();
  const placeRef: PlaceRef = /\bairport\b/.test(lower)
    ? "airport"
    : /\b(work|office)\b/.test(lower)
      ? "work"
      : /\bhome\b/.test(lower)
        ? "home"
        : "custom";

  const optimizationHint: OptimizationGoal | null = /(cheap|save|budget)/.test(lower)
    ? "cheapest"
    : /(fast|quick|hurry|asap|soon)/.test(lower)
      ? "fastest"
      : /(best rated|top rated|safe)/.test(lower)
        ? "highest_rated"
        : null;

  const vehiclePreference: VehicleClass | null = /(ev|electric|tesla)/.test(lower)
    ? "ev"
    : /(pool|share)/.test(lower)
      ? "shared"
      : /(premium|luxury|black)/.test(lower)
        ? "premium"
        : null;

  return {
    destination: { raw: text, address: null, placeRef },
    origin: null,
    when: /\bnow\b/.test(lower) ? "now" : null,
    vehiclePreference,
    optimizationHint,
    confidence: text.length > 0 ? 0.3 : 0,
    needsClarification: text.length < 3,
    clarificationPrompt: text.length < 3 ? "Where would you like to go?" : null,
  };
}

/** Parse a natural-language ride request into a structured intent. */
export async function parseRideIntent(rawText: string): Promise<RideIntent> {
  try {
    const obj = await generateJson<Record<string, unknown>>({
      system: SYSTEM,
      prompt: `Rider request: "${rawText}"`,
    });
    return normalize(obj, rawText);
  } catch (err) {
    console.error("[parseRideIntent] Gemini failed, using fallback:", err);
    return fallbackIntent(rawText);
  }
}
