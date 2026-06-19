-- M12: owner-scoped write paths for booking + escrow + settlement.
-- All previously SELECT-only.

-- ride_bookings: user manages their own bookings
create policy ride_bookings_insert_own on public.ride_bookings
  for insert to authenticated
  with check (auth.uid() = user_id);
create policy ride_bookings_update_own on public.ride_bookings
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- escrows: user owns their escrow records
create policy escrows_insert_own on public.escrows
  for insert to authenticated
  with check (auth.uid() = user_id);
create policy escrows_update_own on public.escrows
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- transactions: user owns their transaction records
create policy transactions_insert_own on public.transactions
  for insert to authenticated
  with check (auth.uid() = user_id);
create policy transactions_update_own on public.transactions
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ride_lifecycle_events: insert allowed when the parent booking belongs to the user
create policy ride_lifecycle_insert_own on public.ride_lifecycle_events
  for insert to authenticated
  with check (
    exists (
      select 1 from public.ride_bookings b
      where b.id = ride_lifecycle_events.ride_booking_id and b.user_id = auth.uid()
    )
  );
