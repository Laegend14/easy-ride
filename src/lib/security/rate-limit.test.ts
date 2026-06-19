import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { rateLimit, checkRateLimit } from "./rate-limit";

describe("rateLimit", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("allows up to the limit then blocks", () => {
    const key = "user:test-allow";
    const opts = { limit: 3, windowMs: 1000 };
    expect(rateLimit(key, opts).ok).toBe(true);
    expect(rateLimit(key, opts).ok).toBe(true);
    expect(rateLimit(key, opts).ok).toBe(true);
    const blocked = rateLimit(key, opts);
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfterSec).toBeGreaterThan(0);
  });

  it("resets after the window elapses", () => {
    const key = "user:test-reset";
    const opts = { limit: 1, windowMs: 1000 };
    expect(rateLimit(key, opts).ok).toBe(true);
    expect(rateLimit(key, opts).ok).toBe(false);
    vi.advanceTimersByTime(1001);
    expect(rateLimit(key, opts).ok).toBe(true);
  });
});

describe("checkRateLimit", () => {
  it("returns a friendly error when limited", () => {
    const opts = { limit: 1, windowMs: 10_000 };
    expect(checkRateLimit("u1", "act", opts)).toEqual({ ok: true });
    const res = checkRateLimit("u1", "act", opts);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toMatch(/try again/i);
  });
});
