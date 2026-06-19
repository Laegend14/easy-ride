-- M10: allow a signed-in user to insert quotes and agent decisions for their OWN
-- ride request (parent ownership check). Child tables previously had SELECT only.

create policy ride_quotes_insert_own on public.ride_quotes
  for insert to authenticated
  with check (
    exists (
      select 1 from public.ride_requests r
      where r.id = ride_quotes.ride_request_id and r.user_id = auth.uid()
    )
  );

create policy agent_decisions_insert_own on public.agent_decisions
  for insert to authenticated
  with check (
    exists (
      select 1 from public.ride_requests r
      where r.id = agent_decisions.ride_request_id and r.user_id = auth.uid()
    )
  );
