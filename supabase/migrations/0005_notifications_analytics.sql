-- Easy Ride — Milestone 2: notifications + analytics

create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type notification_type not null,
  title text not null,
  body text,
  ride_booking_id uuid references ride_bookings (id) on delete set null,
  is_read boolean not null default false,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index notifications_user_id_idx on notifications (user_id);
create index notifications_unread_idx on notifications (user_id) where is_read = false;

-- analytics: daily per-user rollups (savings, time saved, success rates)
create table analytics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  day date not null,
  savings_cents bigint not null default 0,
  time_saved_minutes integer not null default 0,
  rides_total integer not null default 0,
  rides_completed integer not null default 0,
  rides_cancelled integer not null default 0,
  rides_reassigned integer not null default 0,
  optimization_score numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, day)
);

create trigger analytics_set_updated_at
  before update on analytics
  for each row execute function set_updated_at();

create index analytics_user_id_idx on analytics (user_id);
