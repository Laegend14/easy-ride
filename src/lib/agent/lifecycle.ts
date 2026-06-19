// Ride lifecycle model. The 8 user-facing booking stages, their mapping to the
// DB RideStatus enum, valid transitions, and provider-status → stage mapping.
// Foundation for monitoring + autonomous recovery (M12+). Pure.

import type { ProviderRideStatus } from "@/lib/providers";
import type { RideStage, RideStatus } from "./types";

export const RIDE_STAGES: {
  stage: RideStage;
  label: string;
  status: RideStatus;
}[] = [
  { stage: "provider_selected", label: "Provider selected", status: "PROVIDER_SELECTED" },
  { stage: "booking_confirmed", label: "Booking confirmed", status: "ACCEPTED" },
  { stage: "payment_secured", label: "Payment secured", status: "ESCROW_FUNDED" },
  { stage: "driver_assigned", label: "Driver assigned", status: "ACCEPTED" },
  { stage: "driver_approaching", label: "Driver approaching", status: "IN_PROGRESS" },
  { stage: "ride_in_progress", label: "On the way", status: "IN_PROGRESS" },
  { stage: "destination_reached", label: "Arrived", status: "COMPLETED" },
  { stage: "settled", label: "Settled", status: "SETTLED" },
];

/** Allowed forward transitions, plus cancellation from any active stage. */
export const STAGE_TRANSITIONS: Record<RideStage, RideStage[]> = {
  provider_selected: ["booking_confirmed"],
  booking_confirmed: ["payment_secured"],
  payment_secured: ["driver_assigned"],
  driver_assigned: ["driver_approaching"],
  driver_approaching: ["ride_in_progress"],
  ride_in_progress: ["destination_reached"],
  destination_reached: ["settled"],
  settled: [],
};

export function canTransition(from: RideStage, to: RideStage): boolean {
  return STAGE_TRANSITIONS[from]?.includes(to) ?? false;
}

export function stageStatus(stage: RideStage): RideStatus {
  return RIDE_STAGES.find((s) => s.stage === stage)!.status;
}

/** Map a provider adapter's status onto our lifecycle stage. */
export function mapProviderStatus(status: ProviderRideStatus): RideStage {
  switch (status) {
    case "accepted":
      return "driver_assigned";
    case "driver_approaching":
      return "driver_approaching";
    case "in_progress":
      return "ride_in_progress";
    case "completed":
      return "destination_reached";
    case "cancelled":
      // Cancellation is handled out-of-band by the recovery flow; surface the
      // pre-driver stage so the agent re-plans.
      return "provider_selected";
  }
}
