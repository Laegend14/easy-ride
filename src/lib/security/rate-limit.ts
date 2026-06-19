import "server-only";

/**
 * Minimal in-memory sliding-window rate limiter.
 *
 * NOTE: per-instance only — fine for a single-node demo. In production behind
 * multiple serverless instances, swap the Map for a shared store (e.g. Upstash
 * Redis) keyed the same way. Documented in SECURITY.md.
 */
type Hit = { count: number; resetAt: number };

const buckets = new Map<string, Hit>();

export interface RateLimitResult {
  ok: boolean;
  retryAfterSec: number;
}

export function rateLimit(
  key: string,
  opts: { limit: number; windowMs: number },
): RateLimitResult {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + opts.windowMs });
    return { ok: true, retryAfterSec: 0 };
  }

  if (existing.count >= opts.limit) {
    return { ok: false, retryAfterSec: Math.ceil((existing.resetAt - now) / 1000) };
  }

  existing.count += 1;
  return { ok: true, retryAfterSec: 0 };
}

/** Convenience: throws-free guard returning a friendly message when limited. */
export function checkRateLimit(
  userId: string,
  action: string,
  opts: { limit: number; windowMs: number },
): { ok: true } | { ok: false; error: string } {
  const res = rateLimit(`${userId}:${action}`, opts);
  if (res.ok) return { ok: true };
  return {
    ok: false,
    error: `You're going a little fast — please try again in ${res.retryAfterSec}s.`,
  };
}

// Shared limit presets (per user).
export const LIMITS = {
  rideSearch: { limit: 10, windowMs: 60_000 },
  booking: { limit: 20, windowMs: 60_000 },
  addFunds: { limit: 5, windowMs: 60_000 },
  withdraw: { limit: 10, windowMs: 60_000 },
  password: { limit: 5, windowMs: 15 * 60_000 },
} as const;
