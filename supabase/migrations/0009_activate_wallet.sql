-- M4: Circle wallet provisioning — privileged write-back.
-- Lets a signed-in user activate ONLY their own wallet row after the server
-- creates their Circle wallet. SECURITY DEFINER + scoped to auth.uid() so the
-- caller can't touch anyone else's row. search_path pinned (advisor-clean).

create or replace function public.activate_wallet(
  p_circle_wallet_id text,
  p_wallet_set_id text,
  p_address text,
  p_blockchain text
) returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.wallets
     set circle_wallet_id = p_circle_wallet_id,
         circle_wallet_set_id = p_wallet_set_id,
         address = p_address,
         blockchain = coalesce(p_blockchain, blockchain),
         status = 'active',
         updated_at = now()
   where user_id = auth.uid()
     and status <> 'active';
end;
$$;

revoke execute on function public.activate_wallet(text, text, text, text) from anon, public;
grant execute on function public.activate_wallet(text, text, text, text) to authenticated;
