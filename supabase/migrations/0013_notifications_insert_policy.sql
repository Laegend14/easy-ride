-- M19: allow a user to insert their own notifications (written by server flows
-- running under the user's session).
create policy notifications_insert_own on public.notifications
  for insert to authenticated
  with check (auth.uid() = user_id);
