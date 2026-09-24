import type { RideProvider } from "./provider";
import type {
  BookingResult,
  EtaEstimate,
  FareEstimate,
  ProviderRideStatus,
  RideOffer,
  RideSearchParams,
  RideStatusResult,
  VehicleClass,
} from "./types";

/** Deterministic 32-bit string hash → stable offers per route (good for demos). */
function seedFrom(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Mulberry32 PRNG — deterministic given a seed. */
function rng(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface MockProfile {
  provider: string;
  productName: string;
  vehicleClass: VehicleClass;
  baseCents: number;
  perKmCents: number;
  speedFactor: number; // lower = faster
  baseRating: number;
}

interface DriverDetail {
  name: string;
  sex: "Male" | "Female";
  photo: string;
  rating: number;
}

interface VehicleDetail {
  name: string;
  photo: string;
}

const MOCK_DRIVERS: DriverDetail[] = [
  {
    name: "Amara O.",
    sex: "Female",
    // Professional headshot — Black woman, smiling
    photo: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=200&h=200&fit=crop&crop=face",
    rating: 4.8,
  },
  {
    name: "Daniel K.",
    sex: "Male",
    // Professional headshot — Black man, smiling
    photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face",
    rating: 4.6,
  },
  {
    name: "Sofia R.",
    sex: "Female",
    // Professional headshot — Hispanic woman
    photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face",
    rating: 4.7,
  },
  {
    name: "Liang W.",
    sex: "Male",
    // Professional headshot — Asian man
    photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face",
    rating: 4.3,
  },
  {
    name: "Zara H.",
    sex: "Female",
    // Professional headshot — woman with hijab
    photo: "https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=200&h=200&fit=crop&crop=face",
    rating: 4.9,
  },
];

const MOCK_VEHICLES: Record<VehicleClass, VehicleDetail[]> = {
  standard: [
    {
      name: "Toyota Corolla",
      // White Toyota Corolla sedan
      photo: "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=400&h=250&fit=crop",
    },
    {
      name: "Honda Civic",
      // Silver Honda Civic
      photo: "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=400&h=250&fit=crop",
    },
    {
      name: "VW Passat",
      // Grey VW Passat / mid-size sedan
      photo: "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=400&h=250&fit=crop",
    },
  ],
  shared: [
    {
      name: "Toyota Corolla (Shared)",
      photo: "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=400&h=250&fit=crop",
    },
    {
      name: "Honda Civic (Shared)",
      photo: "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=400&h=250&fit=crop",
    },
  ],
  premium: [
    {
      name: "Tesla Model 3 Premium",
      // Red Tesla Model 3
      photo: "https://images.unsplash.com/photo-1561580125-028ee3bd62eb?w=400&h=250&fit=crop",
    },
  ],
  ev: [
    {
      name: "Hyundai Ioniq 5",
      // White Hyundai Ioniq 5
      photo: "https://images.unsplash.com/photo-1651286738017-84a1a1e3e4de?w=400&h=250&fit=crop",
    },
    {
      name: "Tesla Model 3",
      // Black Tesla Model 3
      photo: "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=400&h=250&fit=crop",
    },
    {
      name: "Kia Niro EV",
      // White Kia Niro EV
      photo: "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=400&h=250&fit=crop",
    },
  ],
};

/**
 * MockProviderAdapter — returns realistic, route-stable ride offers without any
 * external API. One adapter instance represents one branded provider.
 */
export class MockProviderAdapter implements RideProvider {
  readonly name: string;
  private readonly profile: MockProfile;

  constructor(profile: MockProfile) {
    this.profile = profile;
    this.name = profile.provider;
  }

  private routeKey(params: RideSearchParams): string {
    return `${params.origin.address}=>${params.destination.address}`;
  }

  /** Pseudo distance (km) derived from the route string — stable per route. */
  private distanceKm(params: RideSearchParams): number {
    const r = rng(seedFrom(this.routeKey(params)));
    return 3 + r() * 22; // 3–25 km
  }

  async searchRides(params: RideSearchParams): Promise<RideOffer[]> {
    if (params.evPreferred && this.profile.vehicleClass !== "ev") return [];
    if (params.sharedAllowed === false && this.profile.vehicleClass === "shared") {
      return [];
    }
    if (
      params.vehicleClasses &&
      !params.vehicleClasses.includes(this.profile.vehicleClass)
    ) {
      return [];
    }

    const r = rng(seedFrom(this.name + "|" + this.routeKey(params)));
    const km = this.distanceKm(params);

    const surge = 1 + r() * 0.35;
    const fareCents = Math.round(
      (this.profile.baseCents + this.profile.perKmCents * km) * surge,
    );
    const etaMinutes = Math.max(2, Math.round(km * this.profile.speedFactor + r() * 4));
    const rating = Math.min(
      5,
      Math.round((this.profile.baseRating + (r() - 0.5) * 0.4) * 10) / 10,
    );

    // Pick driver & vehicle deterministically
    const driverIdx = Math.floor(r() * MOCK_DRIVERS.length);
    const driver = MOCK_DRIVERS[driverIdx];
    const vehiclesList = MOCK_VEHICLES[this.profile.vehicleClass] || MOCK_VEHICLES.standard;
    const vehicleIdx = Math.floor(r() * vehiclesList.length);
    const vehicle = vehiclesList[vehicleIdx];

    return [
      {
        offerId: `${this.name.toLowerCase()}-${seedFrom(this.routeKey(params)).toString(36)}`,
        provider: this.name,
        productName: this.profile.productName,
        vehicleClass: this.profile.vehicleClass,
        fareCents,
        etaMinutes,
        rating,
        raw: { km: Math.round(km * 10) / 10, surge: Math.round(surge * 100) / 100 },
        driverName: driver.name,
        driverPhoto: driver.photo,
        driverSex: driver.sex,
        driverRating: rating,
        vehicleName: vehicle.name,
        vehiclePhoto: vehicle.photo,
      },
    ];
  }

  async bookRide(offerId: string): Promise<BookingResult> {
    const r = rng(seedFrom(offerId));
    const driverIdx = Math.floor(r() * MOCK_DRIVERS.length);
    const driver = MOCK_DRIVERS[driverIdx];
    const vehiclesList = MOCK_VEHICLES[this.profile.vehicleClass] || MOCK_VEHICLES.standard;
    const vehicleIdx = Math.floor(r() * vehiclesList.length);
    const vehicle = vehiclesList[vehicleIdx];

    return {
      providerBookingRef: `${this.name.toLowerCase()}-bk-${seedFrom(offerId).toString(36)}`,
      provider: this.name,
      driverName: driver.name,
      vehicleInfo: vehicle.name,
      etaMinutes: Math.max(2, Math.round(2 + r() * 6)),
      fareCents: this.profile.baseCents,
    };
  }

  async cancelRide(_providerBookingRef: string): Promise<void> {
    // Mock: cancellation always succeeds.
  }

  async getRideStatus(providerBookingRef: string): Promise<RideStatusResult> {
    const statuses: ProviderRideStatus[] = [
      "accepted",
      "driver_approaching",
      "in_progress",
      "completed",
    ];
    const r = rng(seedFrom(providerBookingRef));
    return {
      providerBookingRef,
      status: statuses[Math.floor(r() * statuses.length)],
    };
  }

  async estimateFare(params: RideSearchParams): Promise<FareEstimate> {
    const km = this.distanceKm(params);
    return {
      fareCents: Math.round(this.profile.baseCents + this.profile.perKmCents * km),
      currency: "USD",
    };
  }

  async estimateETA(params: RideSearchParams): Promise<EtaEstimate> {
    const km = this.distanceKm(params);
    return { etaMinutes: Math.max(2, Math.round(km * this.profile.speedFactor)) };
  }
}

/** Default branded mock fleet — varied profiles so the agent has real choices. */
export const MOCK_PROFILES: MockProfile[] = [
  {
    provider: "Uber",
    productName: "UberX",
    vehicleClass: "standard",
    baseCents: 350,
    perKmCents: 140,
    speedFactor: 2.1,
    baseRating: 4.8,
  },
  {
    provider: "Bolt",
    productName: "Bolt",
    vehicleClass: "standard",
    baseCents: 300,
    perKmCents: 120,
    speedFactor: 2.3,
    baseRating: 4.6,
  },
  {
    provider: "Lyft",
    productName: "Lyft Standard",
    vehicleClass: "standard",
    baseCents: 360,
    perKmCents: 135,
    speedFactor: 2.0,
    baseRating: 4.7,
  },
  {
    provider: "inDrive",
    productName: "inDrive Economy",
    vehicleClass: "shared",
    baseCents: 250,
    perKmCents: 100,
    speedFactor: 2.6,
    baseRating: 4.3,
  },
  {
    provider: "Tesla Fleet",
    productName: "Electric Premium",
    vehicleClass: "ev",
    baseCents: 420,
    perKmCents: 150,
    speedFactor: 1.9,
    baseRating: 4.9,
  },
];
