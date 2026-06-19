-- Easy Ride — Milestone 2: escrow / transactions / refunds
-- User-facing language hides chain details; on-chain refs live in dedicated columns.

-- escrows: mirrors on-chain EasyRideEscrow positions ("Secure Ride Lock")
create table escrows (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  ride_booking_id uuid references ride_bookings (id) on delete set null,
  amount_cents bigint not null,
  status escrow_status not null default 'created',
  onchain_escrow_id text,
  tx_hash_create text,
  tx_hash_fund text,
  tx_hash_settle text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger escrows_set_updated_at
  before update on escrows
  for each row execute function set_updated_at();

create index escrows_user_id_idx on escrows (user_id);
create index escrows_booking_id_idx on escrows (ride_booking_id);

-- transactions: ledger of all balance movements ("Transaction Record")
create table transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  wallet_id uuid references wallets (id) on delete set null,
  ride_booking_id uuid references ride_bookings (id) on delete set null,
  escrow_id uuid references escrows (id) on delete set null,
  type transaction_type not null,
  status transaction_status not null default 'pending',
  amount_cents bigint not null,
  description text,
  tx_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger transactions_set_updated_at
  before update on transactions
  for each row execute function set_updated_at();

create index transactions_user_id_idx on transactions (user_id);
create index transactions_booking_id_idx on transactions (ride_booking_id);

-- refunds: refund records tied to escrows / bookings
create table refunds (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  escrow_id uuid references escrows (id) on delete set null,
  ride_booking_id uuid references ride_bookings (id) on delete set null,
  amount_cents bigint not null,
  reason text,
  status transaction_status not null default 'pending',
  tx_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger refunds_set_updated_at
  before update on refunds
  for each row execute function set_updated_at();

create index refunds_user_id_idx on refunds (user_id);
