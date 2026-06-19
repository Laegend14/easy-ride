-- M17: allow a user to update their own wallet (Easy Ride Balance ledger).
create policy wallets_update_own on public.wallets
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
