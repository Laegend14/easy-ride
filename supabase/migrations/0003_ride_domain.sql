-- Easy Ride — Milestone 2: ride request/quote/booking domain

-- ride_requests: a natural-language intent ("take me to the airport")
create table ride_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  agent_id uuid references agents (id) on delete set null,
  raw_text text not null,
  parsed_intent jsonb,
  origin_address text,
  origin_lat double precision,
  origin_lng double precision,
  destination_address text,
  destination_lat double precision,
  destination_lng double precision,
  status ride_status not null default 'REQUESTED',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger ride_requests_set_updated_at
  before update on ride_requests
  for each row execute function set_updated_at();

create index ride_requests_user_id_idx on ride_requests (user_id);
create index ride_requests_status_idx on ride_requests (status);

-- ride_quotes: offers returned by provider adapters for a request
create table ride_quotes (
  id uuid primary key default gen_random_uuid(),
  ride_request_id uuid not null references ride_requests (id) on delete cascade,
  provider text not null,
  product_name text,
  fare_cents bigint not null,
  eta_minutes integer not null,
  rating numeric(2, 1),
  is_selected boolean not null default false,
  score numeric,
  raw jsonb,
  created_at timestamptz not null default now()
);

create index ride_quotes_request_id_idx on ride_quotes (ride_request_id);

-- ride_bookings: the committed ride for a request
create table ride_bookings (
  id uuid primary key default gen_random_uuid(),
  ride_request_id uuid not null references ride_requests (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  selected_quote_id uuid references ride_quotes (id) on delete set null,
  provider text not null,
  provider_booking_ref text,
  driver_name text,
  vehicle_info text,
  fare_cents bigint not null,
  eta_minutes integer,
  status ride_status not null default 'PROVIDER_SELECTED',
  is_reassignment boolean not null default false,
  previous_booking_id uuid references ride_bookings (id) on delete set null,
  booked_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger ride_bookings_set_updated_at
  before update on ride_bookings
  for each row execute function set_updated_at();

create index ride_bookings_request_id_idx on ride_bookings (ride_request_id);
create index ride_bookings_user_id_idx on ride_bookings (user_id);
create index ride_bookings_status_idx on ride_bookings (status);

-- ride_lifecycle_events: append-only timeline of state transitions
create table ride_lifecycle_events (
  id uuid primary key default gen_random_uuid(),
  ride_booking_id uuid not null references ride_bookings (id) on delete cascade,
  status ride_status not null,
  detail text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index ride_lifecycle_events_booking_id_idx on ride_lifecycle_events (ride_booking_id);

-- agent_decisions: audit trail of why the agent did what it did
create table agent_decisions (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid references agents (id) on delete set null,
  ride_request_id uuid references ride_requests (id) on delete cascade,
  decision_type text not null,
  reasoning text,
  structured jsonb,
  created_at timestamptz not null default now()
);

create index agent_decisions_request_id_idx on agent_decisions (ride_request_id);
