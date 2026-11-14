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
  email text not null unique,
  profession text,
  monthly_income text,
  -- Why it was not verified, e.g. "no-token:pending" or "rejected". Never personal data.
  reason text not null,
  -- HMAC of the visitor's IP address, only to rate-limit. The address itself is never stored.
  ip_hash text,
  created_at timestamptz not null default now()
);

create index if not exists waitlist_pending_ip_recent
  on public.waitlist_pending (ip_hash, created_at);
create index if not exists waitlist_pending_recent
  on public.waitlist_pending (created_at);

-- Server access only, like every other signup table (see 20261103190000_lock_down_waitlist.sql).
alter table public.waitlist_pending enable row level security;
revoke all privileges on table public.waitlist_pending from public, anon, authenticated;
grant select, insert, update, delete on table public.waitlist_pending to service_role;

commit;
