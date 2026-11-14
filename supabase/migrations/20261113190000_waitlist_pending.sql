-- Signups whose Cloudflare human check did not pass (it never finished, the browser could not
-- run it, or the token was rejected). They are kept here, apart from the real waitlist, until
-- someone approves them from the Slack link (app/api/waitlist/approve). Nothing is emailed
-- before approval, so this table can't be used to send mail to strangers.
--
-- Apply in the Supabase SQL editor BEFORE deploying the code that writes to it. Until then,
-- unverified signups fail to save and are posted to Slack with their details instead.
-- Reapplying is safe. No existing records are changed.
begin;

create table if not exists public.waitlist_pending (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  profession text,
  monthly_income text,
  -- Why it was not verified, e.g. "no-token:pending" or "rejected". Never personal data.
  reason text not null,
  -- HMAC of the visitor's IP address, only to rate-limit. The address itself is never stored.
  ip_hash text,
  -- Handled rows are kept, not deleted, so they still count toward the hourly limits and
  -- approve/discard can claim a row atomically (only a 'pending' row can change).
  status text not null default 'pending' check (status in ('pending', 'approved', 'discarded')),
  handled_at timestamptz,
  created_at timestamptz not null default now()
);

-- One open signup per email; someone whose earlier attempt was discarded can try again.
create unique index if not exists waitlist_pending_one_open_per_email
  on public.waitlist_pending (email) where status = 'pending';
create index if not exists waitlist_pending_ip_recent
  on public.waitlist_pending (ip_hash, created_at);
create index if not exists waitlist_pending_recent
  on public.waitlist_pending (created_at);

-- The rate limits, enforced inside the insert. Counting first and inserting afterwards (from
-- the app) let simultaneous requests all see room and all get in. The advisory lock makes
-- concurrent inserts take turns, so the count each one sees includes the others. Every row
-- from the last hour counts, whatever its status. Keep the numbers in step with
-- PER_IP_LIMIT and GLOBAL_LIMIT in lib/waitlist-pending.ts (they word the Slack alerts).
create or replace function public.waitlist_pending_rate_limit()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  recent integer;
begin
  perform pg_advisory_xact_lock(hashtext('public.waitlist_pending_rate_limit'));

  select count(*) into recent
  from public.waitlist_pending
  where created_at >= now() - interval '1 hour';
  if recent >= 40 then
    raise exception 'rate_limited:global' using errcode = 'P0001';
  end if;

  if new.ip_hash is not null then
    select count(*) into recent
    from public.waitlist_pending
    where ip_hash = new.ip_hash and created_at >= now() - interval '1 hour';
    if recent >= 5 then
      raise exception 'rate_limited:ip' using errcode = 'P0001';
    end if;
  end if;

  return new;
end;
$function$;

drop trigger if exists waitlist_pending_rate_limit on public.waitlist_pending;
create trigger waitlist_pending_rate_limit
  before insert on public.waitlist_pending
  for each row execute function public.waitlist_pending_rate_limit();

-- Server access only, like every other signup table (see 20261103190000_lock_down_waitlist.sql).
alter table public.waitlist_pending enable row level security;
revoke all privileges on table public.waitlist_pending from public, anon, authenticated;
grant select, insert, update, delete on table public.waitlist_pending to service_role;
revoke all privileges on function public.waitlist_pending_rate_limit() from public, anon, authenticated;
grant execute on function public.waitlist_pending_rate_limit() to service_role;

commit;
