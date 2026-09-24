// Easy Ride — database domain types.
// Hand-authored to mirror supabase/migrations. Regenerate later with:
//   supabase gen types typescript --project-id <ref> > src/types/database.ts

export type OptimizationGoal = "cheapest" | "fastest" | "balanced" | "highest_rated";

export type RideStatus =
  | "REQUESTED"
  | "SEARCHING"
  | "PROVIDER_SELECTED"
  | "ACCEPTED"
  | "ESCROW_FUNDED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "SETTLED"
  | "CANCELLED"
  | "REFUNDED";

export type EscrowStatus = "created" | "funded" | "released" | "refunded" | "reassigned";

export type TransactionType =
  | "deposit"
  | "withdrawal"
  | "ride_payment"
  | "refund"
  | "settlement";

export type TransactionStatus = "pending" | "completed" | "failed";

export type WalletStatus = "provisioning" | "active" | "suspended" | "failed";

export type DestinationKind = "home" | "work" | "school" | "frequent" | "other";

export type NotificationType =
  | "ride_booked"
  | "driver_assigned"
  | "driver_cancelled"
  | "alternative_found"
  | "escrow_created"
  | "settlement_complete"
  | "refund_issued"
  | "trip_completed"
  | "savings_report"
  | "system";

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  home_address: string | null;
  work_address: string | null;
  school_address: string | null;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface Wallet {
  id: string;
  user_id: string;
  circle_wallet_id: string | null;
  circle_wallet_set_id: string | null;
  blockchain: string;
  address: string | null;
  status: WalletStatus;
  balance_cents: number;
  created_at: string;
  updated_at: string;
}

export interface Agent {
  id: string;
  user_id: string;
  name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AgentPreferences {
  id: string;
  agent_id: string;
  optimization_goal: OptimizationGoal;
  daily_budget_cents: number;
  max_ride_cents: number;
  ev_preferred: boolean;
  premium_preferred: boolean;
  shared_ride_allowed: boolean;
  auto_accept_alternatives: boolean;
  require_confirmation_before_rebooking: boolean;
  created_at: string;
  updated_at: string;
}

export interface Destination {
  id: string;
  user_id: string;
  kind: DestinationKind;
  label: string;
  address: string;
  lat: number | null;
  lng: number | null;
  created_at: string;
  updated_at: string;
}

export interface RideRequest {
  id: string;
  user_id: string;
  agent_id: string | null;
  raw_text: string;
  parsed_intent: Record<string, unknown> | null;
  origin_address: string | null;
  origin_lat: number | null;
  origin_lng: number | null;
  destination_address: string | null;
  destination_lat: number | null;
  destination_lng: number | null;
  status: RideStatus;
  created_at: string;
  updated_at: string;
}

export interface RideQuote {
  id: string;
  ride_request_id: string;
  provider: string;
  product_name: string | null;
  fare_cents: number;
  eta_minutes: number;
  rating: number | null;
  is_selected: boolean;
  score: number | null;
  raw: Record<string, unknown> | null;
  created_at: string;
}

export interface RideBooking {
  id: string;
  ride_request_id: string;
  user_id: string;
  selected_quote_id: string | null;
  provider: string;
  provider_booking_ref: string | null;
  driver_name: string | null;
  vehicle_info: string | null;
  fare_cents: number;
  eta_minutes: number | null;
  status: RideStatus;
  is_reassignment: boolean;
  previous_booking_id: string | null;
  booked_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface RideLifecycleEvent {
  id: string;
  ride_booking_id: string;
  status: RideStatus;
  detail: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface AgentDecision {
  id: string;
  agent_id: string | null;
  ride_request_id: string | null;
  decision_type: string;
  reasoning: string | null;
  structured: Record<string, unknown> | null;
  created_at: string;
}

export interface Escrow {
  id: string;
  user_id: string;
  ride_booking_id: string | null;
  amount_cents: number;
  status: EscrowStatus;
  onchain_escrow_id: string | null;
  tx_hash_create: string | null;
  tx_hash_fund: string | null;
  tx_hash_settle: string | null;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  wallet_id: string | null;
  ride_booking_id: string | null;
  escrow_id: string | null;
  type: TransactionType;
  status: TransactionStatus;
  amount_cents: number;
  description: string | null;
  tx_hash: string | null;
  created_at: string;
  updated_at: string;
}

export interface Refund {
  id: string;
  user_id: string;
  escrow_id: string | null;
  ride_booking_id: string | null;
  amount_cents: number;
  reason: string | null;
  status: TransactionStatus;
  tx_hash: string | null;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  ride_booking_id: string | null;
  is_read: boolean;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface Analytics {
  id: string;
  user_id: string;
  day: string;
  savings_cents: number;
  time_saved_minutes: number;
  rides_total: number;
  rides_completed: number;
  rides_cancelled: number;
  rides_reassigned: number;
  optimization_score: number | null;
  created_at: string;
  updated_at: string;
}
