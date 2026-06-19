/** Shared input-validation helpers (pure). Used by server actions. */

/** Trim, strip control chars, and cap length. */
export function clampText(input: unknown, max: number): string {
  const s = typeof input === "string" ? input : String(input ?? "");
  // eslint-disable-next-line no-control-regex
  return s.replace(/[\x00-\x1F\x7F]/g, " ").trim().slice(0, max);
}

/** Collapse to a single trimmed line. */
export function sanitizeSingleLine(input: unknown, max = 200): string {
  return clampText(input, max).replace(/\s+/g, " ");
}

export function isPositiveAmount(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n) && n > 0;
}

export function isEvmAddress(s: unknown): s is string {
  return typeof s === "string" && /^0x[a-fA-F0-9]{40}$/.test(s);
}

/** Parse a "$12.34"/"12.34" string to integer cents (0 if invalid). */
export function dollarsToCents(input: unknown): number {
  const n = parseFloat(String(input ?? "").replace(/[^0-9.]/g, "") || "0");
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
}
