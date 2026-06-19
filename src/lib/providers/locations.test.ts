import { describe, it, expect } from "vitest";
import { resolveLocationDetails } from "./locations";

describe("resolveLocationDetails", () => {
  it("resolves airports correctly", () => {
    const loc1 = resolveLocationDetails("take me to the airport");
    expect(loc1.label).toContain("Airport");
    expect(loc1.lat).toBeGreaterThan(37);
    expect(loc1.lng).toBeLessThan(-120);

    const loc2 = resolveLocationDetails("go to SFO");
    expect(loc2.label).toBe("San Francisco International Airport (SFO)");
    expect(loc2.lat).toBe(37.6213);
    expect(loc2.lng).toBe(-122.3790);
  });

  it("resolves eateries/restaurants correctly", () => {
    const loc = resolveLocationDetails("Let's go eat food at a nice eatery");
    expect(loc.address).toContain("San Francisco");
    expect(loc.lat).toBeCloseTo(37.77, 1);
  });

  it("resolves hospitals correctly", () => {
    const loc = resolveLocationDetails("take me to Kaiser Permanente");
    expect(loc.label).toBe("Kaiser Permanente SF Medical Center");
    expect(loc.lat).toBe(37.7831);
    expect(loc.lng).toBe(-122.4426);
  });

  it("resolves custom location with stable deterministic coordinates", () => {
    const loc1 = resolveLocationDetails("Coit Tower");
    const loc2 = resolveLocationDetails("Coit Tower");
    expect(loc1.label).toBe("Coit Tower");
    expect(loc1.lat).toBe(loc2.lat);
    expect(loc1.lng).toBe(loc2.lng);

    const differentLoc = resolveLocationDetails("Golden Gate Bridge");
    expect(differentLoc.lat).not.toBe(loc1.lat);
  });
});
