import "server-only";
import { getCurrentFirebaseUser } from "@/lib/firebase/session";
import { getUserBookings, getRideBooking } from "@/lib/firebase/db";
import type { RideStatus } from "@/types/database";

export interface LifecycleEvent {
  status: RideStatus;
  detail: string | null;
  createdAt: string;
}

export interface RideStatusView {
  booking: {
    id: string;
    provider: string;
    fareCents: number;
    status: RideStatus;
    createdAt: string;
    completedAt: string | null;
    isReassignment: boolean;
    previousBookingId: string | null;
    originAddress?: string;
    originLat?: number;
    originLng?: number;
    destinationAddress?: string;
    destinationLat?: number;
    destinationLng?: number;
  };
  events: LifecycleEvent[];
  isActive: boolean;
}

export interface RideListItem {
  id: string;
  provider: string;
  fareCents: number;
  status: RideStatus;
  createdAt: string;
}

export type RideCategory =
  | "active"
  | "completed"
  | "cancelled"
  | "refunded"
  | "reassigned";

export interface RideHistoryItem {
  id: string;
  provider: string;
  fareCents: number;
  status: RideStatus;
  category: RideCategory;
  createdAt: string;
  completedAt?: string | null;
  pickupAddress?: string;
  dropoffAddress?: string;
  etaMinutes?: number;
  paymentMethod?: string;
  escrowTxHash?: string | null;
}

const TERMINAL: RideStatus[] = ["SETTLED", "CANCELLED"];

/** Owner-checked full status for one ride. */
export async function getRideStatus(bookingId: string): Promise<RideStatusView | null> {
  const fbUser = await getCurrentFirebaseUser();
  if (!fbUser) return null;

  const booking = await getRideBooking(bookingId);
  if (!booking || booking.userId !== fbUser.uid) return null;

  return {
    booking: {
      id: booking.id,
      provider: booking.provider,
      fareCents: booking.fareCents,
      status: (booking.status as RideStatus) || "ESCROW_FUNDED",
      createdAt: booking.bookedAt,
      completedAt: booking.completedAt ?? null,
      isReassignment: false,
      previousBookingId: null,
      originAddress: booking.pickupAddress,
      destinationAddress: booking.dropoffAddress,
    },
    events: [
      {
        status: (booking.status as RideStatus) || "ESCROW_FUNDED",
        detail: `Dispatched with ${booking.provider}`,
        createdAt: booking.bookedAt,
      },
    ],
    isActive: !TERMINAL.includes((booking.status as RideStatus) || "ESCROW_FUNDED"),
  };
}

/** All of the current user's bookings, newest first. */
export async function listRides(): Promise<RideListItem[]> {
  const fbUser = await getCurrentFirebaseUser();
  if (!fbUser) return [];

  const bookings = await getUserBookings(fbUser.uid);
  return bookings
    .sort((a, b) => new Date(b.bookedAt).getTime() - new Date(a.bookedAt).getTime())
    .map((b) => ({
      id: b.id,
      provider: b.provider,
      fareCents: b.fareCents,
      status: (b.status as RideStatus) || "ESCROW_FUNDED",
      createdAt: b.bookedAt,
    }));
}

/** The user's most recent still-active ride, if any. */
export async function getActiveRide(): Promise<RideListItem | null> {
  const rides = await listRides();
  return rides.find((r) => !TERMINAL.includes(r.status)) ?? null;
}

/** All bookings with a derived history category. */
export async function listRidesWithCategory(): Promise<RideHistoryItem[]> {
  const fbUser = await getCurrentFirebaseUser();
  if (!fbUser) return [];

  const bookings = await getUserBookings(fbUser.uid);
  return bookings
    .sort((a, b) => new Date(b.bookedAt).getTime() - new Date(a.bookedAt).getTime())
    .map((b) => {
      let category: RideCategory = "active";
      const status = (b.status as RideStatus) || "ESCROW_FUNDED";

      if (status === "SETTLED" || status === "COMPLETED") {
        category = "completed";
      } else if (status === "CANCELLED") {
        category = "cancelled";
      } else if (status === "REFUNDED") {
        category = "refunded";
      }

      return {
        id: b.id,
        provider: b.provider,
        fareCents: b.fareCents,
        status,
        category,
        createdAt: b.bookedAt,
        completedAt: b.completedAt ?? null,
        pickupAddress: b.pickupAddress || "Origin Pickup Location",
        dropoffAddress: b.dropoffAddress || "Destination Drop-Off",
        etaMinutes: b.etaMinutes || 12,
        paymentMethod: b.paymentMethod || "USDC Escrow",
        escrowTxHash: b.escrowTxHash || null,
      };
    });
}
