-- Easy Ride — Milestone 2: auto-provision profile + agent + wallet on signup
-- Runs as SECURITY DEFINER so it can insert into public tables during auth signup.
-- The actual Circle wallet is provisioned later (M4); this seeds a placeholder row.

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_agent_id uuid;
begin
  insert into profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  );

  insert into agents (user_id, name)
  values (new.id, 'Easy Ride Assistant')
  returning id into new_agent_id;

  insert into agent_preferences (agent_id)
  values (new_agent_id);

  insert into wallets (user_id, status)
  values (new.id, 'provisioning');

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
