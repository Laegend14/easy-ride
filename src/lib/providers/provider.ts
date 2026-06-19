import type {
  BookingResult,
  EtaEstimate,
  FareEstimate,
  RideOffer,
  RideSearchParams,
  RideStatusResult,
} from "./types";

/**
 * Contract every transportation provider adapter implements.
 * The agent layer (M7) and ride search flow (M10) depend only on this
 * interface, never on a concrete provider — so Uber/Bolt/Mock are swappable.
 */
export interface RideProvider {
  readonly name: string;

  searchRides(params: RideSearchParams): Promise<RideOffer[]>;

  bookRide(offerId: string): Promise<BookingResult>;

  cancelRide(providerBookingRef: string): Promise<void>;

  getRideStatus(providerBookingRef: string): Promise<RideStatusResult>;

  estimateFare(params: RideSearchParams): Promise<FareEstimate>;

  estimateETA(params: RideSearchParams): Promise<EtaEstimate>;
}
