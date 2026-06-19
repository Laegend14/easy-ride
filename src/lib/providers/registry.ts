import type { RideProvider } from "./provider";
import type { RideOffer, RideSearchParams } from "./types";
import { MOCK_PROFILES, MockProviderAdapter } from "./mock-provider";

/**
 * Registry of active transportation providers.
 * Swap mock adapters for real ones (Uber/Bolt) here without touching callers.
 */
export class ProviderRegistry {
  private readonly providers: Map<string, RideProvider> = new Map();

  constructor(providers: RideProvider[]) {
    for (const p of providers) this.providers.set(p.name, p);
  }

  list(): RideProvider[] {
    return [...this.providers.values()];
  }

  get(name: string): RideProvider | undefined {
    return this.providers.get(name);
  }

  /** Fan out search across every provider; failing adapters are skipped. */
  async searchAll(params: RideSearchParams): Promise<RideOffer[]> {
    const results = await Promise.allSettled(
      this.list().map((p) => p.searchRides(params)),
    );
    return results
      .filter((r): r is PromiseFulfilledResult<RideOffer[]> => r.status === "fulfilled")
      .flatMap((r) => r.value);
  }
}

/** Default registry backed by the mock fleet. */
export function createDefaultRegistry(): ProviderRegistry {
  return new ProviderRegistry(MOCK_PROFILES.map((p) => new MockProviderAdapter(p)));
}
