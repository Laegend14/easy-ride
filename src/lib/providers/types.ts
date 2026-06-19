// Easy Ride — Provider Adapter Layer (Milestone 9)
// Shared contracts every transportation provider must satisfy.
// Money is always in integer cents; durations in whole minutes — matching the DB.

export interface Location {
  address: string;
  lat?: number;
  lng?: number;
}

export type VehicleClass = "standard" | "shared" | "premium" | "ev";

export interface RideSearchParams {
  origin: Location;
  destination: Location;
  /** Optional filters derived from the user's agent preferences. */
  vehicleClasses?: VehicleClass[];
  evPreferred?: boolean;
  sharedAllowed?: boolean;
}

export interface RideOffer {
  /** Adapter-local offer id (provider's own reference for this quote). */
  offerId: string;
  provider: string;
  productName: string;
  vehicleClass: VehicleClass;
  fareCents: number;
  etaMinutes: number;
  /** 0.0 – 5.0 provider/driver rating. */
  rating: number;
  /** Provider-specific raw payload, persisted to ride_quotes.raw for audit. */
  raw?: Record<string, unknown>;
  driverName?: string;
  driverPhoto?: string;
  driverSex?: string;
  driverRating?: number;
  vehicleName?: string;
  vehiclePhoto?: string;
}

export interface BookingResult {
  providerBookingRef: string;
  provider: string;
  driverName: string;
  vehicleInfo: string;
  etaMinutes: number;
  fareCents: number;
}

export type ProviderRideStatus =
  | "accepted"
  | "driver_approaching"
  | "in_progress"
  | "completed"
  | "cancelled";

export interface RideStatusResult {
  providerBookingRef: string;
  status: ProviderRideStatus;
  driverName?: string;
  etaMinutes?: number;
}

export interface FareEstimate {
  fareCents: number;
  currency: "USD";
}

export interface EtaEstimate {
  etaMinutes: number;
}
