import { describe, it, expect } from "vitest";
import { fallbackIntent } from "./intent";

// fallbackIntent is the deterministic parser used whenever Gemini is unavailable.
// It must never throw and must extract a usable destination for the demo path.
describe("fallbackIntent", () => {
  it("parses the canonical airport request", () => {
    const intent = fallbackIntent("Take me to the airport");
    expect(intent.destination.placeRef).toBe("airport");
    expect(intent.needsClarification).toBe(false);
    expect(intent.confidence).toBeGreaterThan(0);
  });

  it("detects home + cheapest optimization", () => {
    const intent = fallbackIntent("get me home as cheap as possible");
    expect(intent.destination.placeRef).toBe("home");
    expect(intent.optimizationHint).toBe("cheapest");
  });

  it("detects work + fastest + EV preference together", () => {
    const intent = fallbackIntent("to the office fast in a tesla");
    expect(intent.destination.placeRef).toBe("work");
    expect(intent.optimizationHint).toBe("fastest");
    expect(intent.vehiclePreference).toBe("ev");
  });

  it("detects shared-ride preference", () => {
    expect(fallbackIntent("pool to the mall").vehiclePreference).toBe("shared");
  });

  it("falls back to a custom place for unrecognized destinations", () => {
    const intent = fallbackIntent("take me to Joe's Diner");
    expect(intent.destination.placeRef).toBe("custom");
    expect(intent.destination.raw).toBe("take me to Joe's Diner");
  });

  it("requests clarification on empty/too-short input", () => {
    const intent = fallbackIntent("");
    expect(intent.needsClarification).toBe(true);
    expect(intent.confidence).toBe(0);
    expect(intent.clarificationPrompt).toBeTruthy();
  });

  it("leaves optional hints null when nothing is stated", () => {
    const intent = fallbackIntent("take me to the airport");
    expect(intent.optimizationHint).toBeNull();
    expect(intent.vehiclePreference).toBeNull();
    expect(intent.origin).toBeNull();
  });
});
