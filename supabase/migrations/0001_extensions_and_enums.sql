-- Easy Ride — Milestone 2: extensions, enums, shared helpers
-- Note: Supabase already provides auth.users. The spec's "users" table is
-- represented by auth.users; "profiles" below is its 1:1 public mirror.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

create type optimization_goal as enum ('cheapest', 'fastest', 'balanced', 'highest_rated');

create type ride_status as enum (
  'REQUESTED',
  'SEARCHING',
  'PROVIDER_SELECTED',
  'ACCEPTED',
  'ESCROW_FUNDED',
  'IN_PROGRESS',
  'COMPLETED',
  'SETTLED',
  'CANCELLED'
);

create type escrow_status as enum (
  'created',
  'funded',
  'released',
  'refunded',
  'reassigned'
);

create type transaction_type as enum (
  'deposit',
  'withdrawal',
  'ride_payment',
  'refund',
  'settlement'
);

create type transaction_status as enum ('pending', 'completed', 'failed');

create type wallet_status as enum ('provisioning', 'active', 'suspended', 'failed');

create type destination_kind as enum ('home', 'work', 'school', 'frequent', 'other');

create type notification_type as enum (
  'ride_booked',
  'driver_assigned',
  'driver_cancelled',
  'alternative_found',
  'escrow_created',
  'settlement_complete',
  'refund_issued',
  'trip_completed',
  'savings_report',
  'system'
);

-- ---------------------------------------------------------------------------
-- Shared trigger: keep updated_at fresh
-- ---------------------------------------------------------------------------

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
