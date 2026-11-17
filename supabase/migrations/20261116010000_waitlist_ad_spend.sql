begin;
set local lock_timeout = '5s';

-- Each ad reporting object is paired with the exact UTM values used on its link.
create table if not exists public.waitlist_ad_spend_links (
  id uuid primary key default gen_random_uuid(),
  provider text not null check (provider in ('meta', 'tiktok', 'google')),
  account_id text not null check (account_id ~ '^[0-9]{1,32}$'),
  reporting_id text not null check (reporting_id ~ '^[0-9]{1,32}$'),
  source text not null,
  medium text not null,
  campaign text not null check (left(campaign, 3) <> 'qa_'),
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  time_zone text not null,
  starts_on date not null,
  ends_on date check (ends_on > starts_on),
  unique (source, medium, campaign),
  unique (provider, account_id, reporting_id, source),
  check (
    (provider = 'meta' and source in ('facebook', 'instagram')) or
    (provider = 'tiktok' and source = 'tiktok') or
    (provider = 'google' and source = 'google')
  )
);

create table if not exists public.waitlist_ad_spend_daily (
  link_id uuid not null references public.waitlist_ad_spend_links (id),
  day date not null,
  amount_micros bigint not null check (amount_micros >= 0),
  synced_at timestamptz not null,
  primary key (link_id, day)
);

alter table public.waitlist_ad_spend_links enable row level security;
alter table public.waitlist_ad_spend_daily enable row level security;
revoke all on table public.waitlist_ad_spend_links, public.waitlist_ad_spend_daily
  from public, anon, authenticated, service_role;
grant select on table public.waitlist_ad_spend_links to service_role;
grant select, insert, update on table public.waitlist_ad_spend_daily to service_role;

-- Take an entire completed pull at once. A slower overlapping pull cannot
-- overwrite a newer snapshot of the same dates.
create or replace function public.record_waitlist_ad_spend(
  p_link_id uuid, p_days jsonb, p_synced_at timestamptz
) returns void
language sql
security invoker
set search_path = ''
as $function$
  insert into public.waitlist_ad_spend_daily as prior (link_id, day, amount_micros, synced_at)
  select p_link_id, item.day, item.amount_micros, p_synced_at
  from jsonb_to_recordset(p_days) as item(day date, amount_micros bigint)
  on conflict (link_id, day) do update
    set amount_micros=excluded.amount_micros, synced_at=excluded.synced_at
    where prior.synced_at <= excluded.synced_at;
$function$;
revoke all on function public.record_waitlist_ad_spend(uuid, jsonb, timestamptz)
  from public, anon, authenticated;
grant execute on function public.record_waitlist_ad_spend(uuid, jsonb, timestamptz) to service_role;

notify pgrst, 'reload schema';
commit;
