-- This project accesses signup data only from the server with service_role.
-- Apply in the Supabase SQL editor. No signup records are changed or deleted.
begin;

alter table public.waitlist enable row level security;
alter table public.waitlist_backup enable row level security;
alter table public.failed_loops_syncs enable row level security;
alter table public.failed_onesignal_syncs enable row level security;
alter table public.email_preference_tokens enable row level security;

-- Direct inserts bypass the server's CAPTCHA and input checks.
drop policy if exists "Allow anonymous inserts" on public.waitlist;

revoke all privileges on table
  public.waitlist, public.waitlist_backup, public.failed_loops_syncs,
  public.failed_onesignal_syncs, public.email_preference_tokens
from public, anon, authenticated;

-- RLS does not apply to TRUNCATE. Revoking privileges matters even on tables
-- that already had RLS. Preserve the existing server access explicitly.
grant select, insert, update, delete on table
  public.waitlist, public.waitlist_backup, public.failed_loops_syncs,
  public.failed_onesignal_syncs, public.email_preference_tokens
to service_role;

-- Keep the existing trigger and invoker privileges. Qualify the destination
-- so changing search_path cannot redirect a backup into a different table.
create or replace function public.backup_waitlist()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $function$
begin
  insert into public.waitlist_backup (id, full_name, email, profession, monthly_income, created_at)
  values (new.id, new.full_name, new.email, new.profession, new.monthly_income, new.created_at);
  return new;
end;
$function$;

revoke all privileges on function public.backup_waitlist() from public, anon, authenticated;
grant execute on function public.backup_waitlist() to service_role;

-- New objects created by postgres should require an explicit API grant.
alter default privileges for role postgres in schema public
  revoke all on tables from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke all on sequences from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke execute on functions from anon, authenticated;
-- PostgreSQL's built-in PUBLIC function grant is global, not schema-local.
alter default privileges for role postgres revoke execute on functions from public;

commit;
