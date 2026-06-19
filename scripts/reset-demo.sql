-- Easy Ride — demo reset (M23)
-- Wipes ONE user's transactional history so the end-to-end demo can be re-run
-- from a clean slate, while preserving their account, agent, preferences, saved
-- places and Circle wallet (so you don't have to re-onboard or re-fund).
--
-- WHAT IT KEEPS:   profiles, agents, agent_preferences, destinations, wallets
-- WHAT IT CLEARS:  ride_requests (+cascades: ride_quotes, ride_bookings,
--                  ride_lifecycle_events, agent_decisions), escrows,
--                  transactions, refunds, notifications, analytics
--
-- NOTE: this only resets the *database* mirror. On-chain escrow positions on Arc
-- Testnet are immutable and the wallet's real USDC balance is untouched — the
-- next demo run simply creates fresh escrows. Re-runnable and idempotent.
--
-- HOW TO RUN:
--   • Supabase Dashboard → SQL Editor → paste & Run, OR
--   • via the Supabase MCP execute_sql tool against project aehluthpcbcwojedtfdq.
-- Edit the email on the next line to match your demo account.

do $$
declare
  demo_email text := 'demo@easyride.app';  -- <-- CHANGE ME
  uid uuid;
begin
  select id into uid from auth.users where email = demo_email;
  if uid is null then
    raise notice 'No user found for %, nothing to reset.', demo_email;
    return;
  end if;

  -- Child / SET NULL tables first (by user), then the cascade root last.
  delete from analytics            where user_id = uid;
  delete from notifications        where user_id = uid;
  delete from refunds              where user_id = uid;
  delete from transactions         where user_id = uid;
  delete from escrows              where user_id = uid;
  delete from ride_requests        where user_id = uid;  -- cascades quotes/bookings/lifecycle/decisions

  raise notice 'Demo reset complete for % (user %).', demo_email, uid;
end $$;
