import "server-only";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
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

const TERMINAL: RideStatus[] = ["SETTLED", "CANCELLED"];

/** Owner-checked full status + event history for one ride. */
export async function getRideStatus(bookingId: string): Promise<RideStatusView | null> {
  const supabase = createClient(await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: booking } = await supabase
    .from("ride_bookings")
    .select(
      "id, user_id, provider, fare_cents, status, created_at, completed_at, is_reassignment, previous_booking_id, ride_requests(origin_address, origin_lat, origin_lng, destination_address, destination_lat, destination_lng)",
    )
    .eq("id", bookingId)
    .single();
  if (!booking || booking.user_id !== user.id) return null;

  const { data: events } = await supabase
    .from("ride_lifecycle_events")
    .select("status, detail, created_at")
    .eq("ride_booking_id", bookingId)
    .order("created_at", { ascending: true });

  const req = (booking as any)?.ride_requests;

  return {
    booking: {
      id: booking.id,
      provider: booking.provider,
      fareCents: booking.fare_cents,
      status: booking.status,
      createdAt: booking.created_at,
      completedAt: booking.completed_at,
      isReassignment: booking.is_reassignment ?? false,
      previousBookingId: booking.previous_booking_id ?? null,
      originAddress: req?.origin_address ?? undefined,
      originLat: req?.origin_lat ?? undefined,
      originLng: req?.origin_lng ?? undefined,
      destinationAddress: req?.destination_address ?? undefined,
      destinationLat: req?.destination_lat ?? undefined,
      destinationLng: req?.destination_lng ?? undefined,
    },
    events: (events ?? []).map((e) => ({
      status: e.status,
      detail: e.detail,
      createdAt: e.created_at,
    })),
    isActive: !TERMINAL.includes(booking.status),
  };
}

/** All of the current user's bookings, newest first (for Activity + dashboard). */
export async function listRides(): Promise<RideListItem[]> {
  const supabase = createClient(await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("ride_bookings")
    .select("id, provider, fare_cents, status, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (data ?? []).map((b) => ({
    id: b.id,
    provider: b.provider,
    fareCents: b.fare_cents,
    status: b.status,
    createdAt: b.created_at,
  }));
}

/** The user's most recent still-active ride, if any (dashboard card). */
export async function getActiveRide(): Promise<RideListItem | null> {
  const rides = await listRides();
  return rides.find((r) => !TERMINAL.includes(r.status)) ?? null;
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
}

/** All bookings with a derived history category (M15). */
export async function listRidesWithCategory(): Promise<RideHistoryItem[]> {
  const supabase = createClient(await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: bookings } = await supabase
    .from("ride_bookings")
    .select(
      "id, provider, fare_cents, status, created_at, is_reassignment, previous_booking_id",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const { data: escrows } = await supabase
    .from("escrows")
    .select("ride_booking_id, status")
    .eq("user_id", user.id);

  const escrowByBooking = new Map<string, string>();
  for (const e of escrows ?? []) {
    if (e.ride_booking_id) escrowByBooking.set(e.ride_booking_id, e.status);
  }
  // Bookings that were superseded by a reassignment.
  const replaced = new Set<string>();
  for (const b of bookings ?? []) {
    if (b.previous_booking_id) replaced.add(b.previous_booking_id);
  }

  const categorize = (b: {
    id: string;
    status: RideStatus;
    is_reassignment: boolean | null;
    previous_booking_id: string | null;
  }): RideCategory => {
    if (b.is_reassignment || replaced.has(b.id)) return "reassigned";
    if (escrowByBooking.get(b.id) === "refunded") return "refunded";
    if (b.status === "CANCELLED") return "cancelled";
    if (b.status === "SETTLED" || b.status === "COMPLETED") return "completed";
    return "active";
  };

  return (bookings ?? []).map((b) => ({
    id: b.id,
    provider: b.provider,
    fareCents: b.fare_cents,
    status: b.status,
    category: categorize(b),
    createdAt: b.created_at,
  }));
}
