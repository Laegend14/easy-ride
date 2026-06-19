import { describe, it, expect } from "vitest";
import {
  MockProviderAdapter,
  MOCK_PROFILES,
  ProviderRegistry,
  createDefaultRegistry,
} from "./index";
import type { RideSearchParams } from "./types";

const ROUTE: RideSearchParams = {
  origin: { address: "12 Market St" },
  destination: { address: "JFK Airport" },
};

const uberProfile = MOCK_PROFILES.find((p) => p.provider === "Uber")!;
const teslaProfile = MOCK_PROFILES.find((p) => p.provider === "Tesla Fleet")!;
const inDriveProfile = MOCK_PROFILES.find((p) => p.provider === "inDrive")!;

describe("MockProviderAdapter.searchRides", () => {
  it("is deterministic for a given route (route-stable offers)", async () => {
    const a = new MockProviderAdapter(uberProfile);
    const b = new MockProviderAdapter(uberProfile);
    const [first] = await a.searchRides(ROUTE);
    const [again] = await a.searchRides(ROUTE);
    const [other] = await b.searchRides(ROUTE);
    expect(first).toEqual(again);
    expect(first).toEqual(other);
  });

  it("produces sane, well-formed offers", async () => {
    const [offer] = await new MockProviderAdapter(uberProfile).searchRides(ROUTE);
    expect(offer.provider).toBe("Uber");
    expect(offer.fareCents).toBeGreaterThan(0);
    expect(Number.isInteger(offer.fareCents)).toBe(true);
    expect(offer.etaMinutes).toBeGreaterThanOrEqual(2);
    expect(offer.rating).toBeGreaterThan(0);
    expect(offer.rating).toBeLessThanOrEqual(5);
  });

  it("excludes non-EV providers when evPreferred is set", async () => {
    const standard = new MockProviderAdapter(uberProfile);
    const ev = new MockProviderAdapter(teslaProfile);
    expect(await standard.searchRides({ ...ROUTE, evPreferred: true })).toEqual([]);
    expect(await ev.searchRides({ ...ROUTE, evPreferred: true })).toHaveLength(1);
  });

  it("excludes shared rides when sharedAllowed is false", async () => {
    const shared = new MockProviderAdapter(inDriveProfile);
    expect(await shared.searchRides({ ...ROUTE, sharedAllowed: false })).toEqual([]);
    expect(await shared.searchRides(ROUTE)).toHaveLength(1);
  });

  it("honors an explicit vehicleClasses filter", async () => {
    const uber = new MockProviderAdapter(uberProfile);
    expect(await uber.searchRides({ ...ROUTE, vehicleClasses: ["ev"] })).toEqual([]);
    expect(
      await uber.searchRides({ ...ROUTE, vehicleClasses: ["standard"] }),
    ).toHaveLength(1);
  });

  it("varies fares between different routes", async () => {
    const uber = new MockProviderAdapter(uberProfile);
    const [a] = await uber.searchRides(ROUTE);
    const [b] = await uber.searchRides({
      origin: { address: "99 Hill Rd" },
      destination: { address: "Downtown" },
    });
    expect(a.fareCents).not.toBe(b.fareCents);
  });
});

describe("ProviderRegistry", () => {
  it("fans out across the full default fleet for an unfiltered search", async () => {
    const offers = await createDefaultRegistry().searchAll(ROUTE);
    expect(offers).toHaveLength(MOCK_PROFILES.length);
    expect(new Set(offers.map((o) => o.provider)).size).toBe(MOCK_PROFILES.length);
  });

  it("only returns the EV provider when evPreferred is set", async () => {
    const offers = await createDefaultRegistry().searchAll({
      ...ROUTE,
      evPreferred: true,
    });
    expect(offers).toHaveLength(1);
    expect(offers[0].vehicleClass).toBe("ev");
  });

  it("skips a failing adapter instead of rejecting the whole search", async () => {
    const broken = {
      name: "Broken",
      searchRides: async () => {
        throw new Error("provider down");
      },
    } as unknown as MockProviderAdapter;
    const registry = new ProviderRegistry([
      new MockProviderAdapter(uberProfile),
      broken,
    ]);
    const offers = await registry.searchAll(ROUTE);
    expect(offers).toHaveLength(1);
    expect(offers[0].provider).toBe("Uber");
  });

  it("looks up providers by name", () => {
    const registry = createDefaultRegistry();
    expect(registry.get("Uber")?.name).toBe("Uber");
    expect(registry.get("Nonexistent")).toBeUndefined();
    expect(registry.list()).toHaveLength(MOCK_PROFILES.length);
  });
});
