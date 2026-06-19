-- Easy Ride — Milestone 2: Row Level Security
-- Model: a row is visible/editable by its owning user (auth.uid()).
-- Child tables (agent_preferences, ride_quotes, ride_lifecycle_events) are
-- scoped through their parent via EXISTS checks.
-- The service role bypasses RLS entirely for server-side automation.

-- ---- profiles -------------------------------------------------------------
alter table profiles enable row level security;

create policy "profiles_select_own" on profiles
  for select using (auth.uid() = id);
create policy "profiles_update_own" on profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- ---- wallets --------------------------------------------------------------
alter table wallets enable row level security;

create policy "wallets_select_own" on wallets
  for select using (auth.uid() = user_id);

-- ---- agents ---------------------------------------------------------------
alter table agents enable row level security;

create policy "agents_select_own" on agents
  for select using (auth.uid() = user_id);
create policy "agents_update_own" on agents
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---- agent_preferences (scoped via agents) --------------------------------
alter table agent_preferences enable row level security;

create policy "agent_prefs_select_own" on agent_preferences
  for select using (
    exists (select 1 from agents a where a.id = agent_preferences.agent_id and a.user_id = auth.uid())
  );
create policy "agent_prefs_update_own" on agent_preferences
  for update using (
    exists (select 1 from agents a where a.id = agent_preferences.agent_id and a.user_id = auth.uid())
  ) with check (
    exists (select 1 from agents a where a.id = agent_preferences.agent_id and a.user_id = auth.uid())
  );

-- ---- destinations ---------------------------------------------------------
alter table destinations enable row level security;

create policy "destinations_all_own" on destinations
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---- ride_requests --------------------------------------------------------
alter table ride_requests enable row level security;

create policy "ride_requests_all_own" on ride_requests
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---- ride_quotes (scoped via ride_requests) -------------------------------
alter table ride_quotes enable row level security;

create policy "ride_quotes_select_own" on ride_quotes
  for select using (
    exists (select 1 from ride_requests r where r.id = ride_quotes.ride_request_id and r.user_id = auth.uid())
  );

-- ---- ride_bookings --------------------------------------------------------
alter table ride_bookings enable row level security;

create policy "ride_bookings_select_own" on ride_bookings
  for select using (auth.uid() = user_id);

-- ---- ride_lifecycle_events (scoped via ride_bookings) ---------------------
alter table ride_lifecycle_events enable row level security;

create policy "ride_lifecycle_select_own" on ride_lifecycle_events
  for select using (
    exists (select 1 from ride_bookings b where b.id = ride_lifecycle_events.ride_booking_id and b.user_id = auth.uid())
  );

-- ---- agent_decisions ------------------------------------------------------
alter table agent_decisions enable row level security;

create policy "agent_decisions_select_own" on agent_decisions
  for select using (
    exists (select 1 from ride_requests r where r.id = agent_decisions.ride_request_id and r.user_id = auth.uid())
  );

-- ---- escrows --------------------------------------------------------------
alter table escrows enable row level security;

create policy "escrows_select_own" on escrows
  for select using (auth.uid() = user_id);

-- ---- transactions ---------------------------------------------------------
alter table transactions enable row level security;

create policy "transactions_select_own" on transactions
  for select using (auth.uid() = user_id);

-- ---- refunds --------------------------------------------------------------
alter table refunds enable row level security;

create policy "refunds_select_own" on refunds
  for select using (auth.uid() = user_id);

-- ---- notifications --------------------------------------------------------
alter table notifications enable row level security;

create policy "notifications_select_own" on notifications
  for select using (auth.uid() = user_id);
create policy "notifications_update_own" on notifications
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---- analytics ------------------------------------------------------------
alter table analytics enable row level security;

create policy "analytics_select_own" on analytics
  for select using (auth.uid() = user_id);
