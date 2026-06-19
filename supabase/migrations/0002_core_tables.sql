-- Easy Ride — Milestone 2: core user/account tables

-- profiles: public 1:1 mirror of auth.users
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  email text not null,
  avatar_url text,
  home_address text,
  work_address text,
  school_address text,
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on profiles
  for each row execute function set_updated_at();

-- wallets: Circle Developer-Controlled Wallet metadata (no secrets stored here)
create table wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  circle_wallet_id text unique,
  circle_wallet_set_id text,
  blockchain text not null default 'ARC-TESTNET',
  address text,
  status wallet_status not null default 'provisioning',
  balance_cents bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

create trigger wallets_set_updated_at
  before update on wallets
  for each row execute function set_updated_at();

create index wallets_user_id_idx on wallets (user_id);

-- agents: the user's autonomous mobility agent
create table agents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null default 'Easy Ride Assistant',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

create trigger agents_set_updated_at
  before update on agents
  for each row execute function set_updated_at();

create index agents_user_id_idx on agents (user_id);

-- agent_preferences: optimization + budget + ride preferences
create table agent_preferences (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references agents (id) on delete cascade,
  optimization_goal optimization_goal not null default 'balanced',
  daily_budget_cents bigint not null default 5000,
  max_ride_cents bigint not null default 2000,
  ev_preferred boolean not null default false,
  premium_preferred boolean not null default false,
  shared_ride_allowed boolean not null default true,
  auto_accept_alternatives boolean not null default false,
  require_confirmation_before_rebooking boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (agent_id)
);

create trigger agent_preferences_set_updated_at
  before update on agent_preferences
  for each row execute function set_updated_at();

-- destinations: saved + frequent destinations
create table destinations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kind destination_kind not null default 'other',
  label text not null,
  address text not null,
  lat double precision,
  lng double precision,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger destinations_set_updated_at
  before update on destinations
  for each row execute function set_updated_at();

create index destinations_user_id_idx on destinations (user_id);
