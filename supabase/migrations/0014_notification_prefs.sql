-- M20: per-user notification preferences (real toggles).
alter table public.profiles
  add column if not exists notify_ride_updates boolean not null default true,
  add column if not exists notify_savings_reports boolean not null default true;
