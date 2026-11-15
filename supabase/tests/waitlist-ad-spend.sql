-- LOCAL DISPOSABLE DATABASE ONLY.
\ir waitlist-security.sql
\ir ../migrations/20261116010000_waitlist_ad_spend.sql
\ir ../migrations/20261116010000_waitlist_ad_spend.sql

do $$
begin
  if has_table_privilege('anon','public.waitlist_ad_spend_daily','SELECT')
     or has_table_privilege('authenticated','public.waitlist_ad_spend_links','SELECT')
     or has_function_privilege('anon','public.record_waitlist_ad_spend(uuid,jsonb,timestamptz)','EXECUTE')
     or has_function_privilege('authenticated','public.record_waitlist_ad_spend(uuid,jsonb,timestamptz)','EXECUTE')
     or has_table_privilege('service_role','public.waitlist_ad_spend_links','UPDATE') then
    raise exception 'An unauthorized role can view or change spend';
  end if;
end;
$$;

insert into public.waitlist_ad_spend_links (
  id, provider, account_id, reporting_id, source, medium, campaign, currency, time_zone, starts_on
) values
  ('00000000-0000-0000-0000-000000000001','meta','111','222','facebook','paid_social','october','USD','America/Los_Angeles','2026-10-19'),
  ('00000000-0000-0000-0000-000000000002','google','333','444','google','cpc','october','NGN','Africa/Lagos','2026-10-19'),
  ('00000000-0000-0000-0000-000000000003','tiktok','555','666','tiktok','paid_social','october','USD','America/Los_Angeles','2026-10-19');

set role service_role;
select public.record_waitlist_ad_spend(
  '00000000-0000-0000-0000-000000000001',
  '[{"day":"2026-10-19","amount_micros":"12000000"},{"day":"2026-10-20","amount_micros":"0"}]',
  '2026-10-22T00:00:00Z'
);
select public.record_waitlist_ad_spend(
  '00000000-0000-0000-0000-000000000001',
  '[{"day":"2026-10-19","amount_micros":"99000000"}]',
  '2026-10-21T00:00:00Z'
);
select public.record_waitlist_ad_spend(
  '00000000-0000-0000-0000-000000000002',
  '[{"day":"2026-10-19","amount_micros":"840000000"}]',
  '2026-10-22T00:00:00Z'
);
select public.record_waitlist_ad_spend(
  '00000000-0000-0000-0000-000000000003',
  '[{"day":"2026-10-19","amount_micros":"5000000"},{"day":"2026-10-20","amount_micros":"0"}]',
  '2026-10-22T00:00:00Z'
);
insert into public.waitlist (email, campaign_source, campaign_medium, campaign_name, campaign_submitted_at) values
  ('west@example.invalid','facebook','paid_social','october','2026-10-21T06:55:00Z'),
  ('east@example.invalid','facebook','paid_social','october','2026-10-19T06:55:00Z'),
  ('google@example.invalid','google','cpc','october','2026-10-21T01:00:00Z'),
  ('newsletter@example.invalid','newsletter','email','october','2026-10-20T08:00:00Z');
insert into public.waitlist (email, paid_social_platform, paid_social_campaign, paid_social_submitted_at) values
  ('legacy-facebook@example.invalid','facebook','october','2026-10-20T12:00:00Z');
reset role;

do $$
begin
  if (select amount_micros from public.waitlist_ad_spend_daily
      where link_id='00000000-0000-0000-0000-000000000001' and day='2026-10-19') <> 12000000 then
    raise exception 'Stale import overwrote a completed batch';
  end if;
end;
$$;
