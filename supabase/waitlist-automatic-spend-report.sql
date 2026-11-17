-- Dates are local calendar dates for each ad account. The end is exclusive.
-- NULL dates show the last seven complete days in the account's time zone.
with report as (
  select null::date as starts_on, null::date as ends_on
),
attributed as (
  select
    campaign_source as source, campaign_medium as medium, campaign_name as campaign,
    campaign_content as content, campaign_submitted_at as submitted_at
  from public.waitlist
  where campaign_source is not null
  union all
  select paid_social_platform, 'paid_social', paid_social_campaign, paid_social_content, paid_social_submitted_at
  from public.waitlist
  where campaign_source is null and paid_social_platform is not null
),
eligible as (
  select source, medium, campaign, submitted_at from attributed
  where medium is not null and campaign is not null and submitted_at is not null
    and left(campaign, 3) <> 'qa_'
    and not (
      source in ('facebook', 'instagram') and medium = 'paid_social' and campaign = 'taash_waitlist'
      and content is not distinct from 'attribution_qa_20261115'
    )
),
periods as (
  select
    link.*,
    greatest(link.starts_on, coalesce(report.starts_on, today.account_day - 7)) as period_start,
    least(coalesce(link.ends_on, today.account_day), coalesce(report.ends_on, today.account_day), today.account_day) as period_end
  from public.waitlist_ad_spend_links link
  cross join report
  cross join lateral (select (now() at time zone link.time_zone)::date as account_day) today
),
mapped as (
  select
    p.source, p.medium, p.campaign, p.period_start, p.period_end, p.time_zone,
    signups.confirmed_signups,
    case when p.period_end - p.period_start = spend.days_synced then spend.amount end as actual_spend,
    p.currency, spend.days_synced, p.period_end - p.period_start as expected_days, spend.synced_at,
    case when p.period_end - p.period_start = spend.days_synced then 'complete'
         when spend.days_synced = 0 then 'awaiting_sync'
         else 'partial' end as spend_status
  from periods p
  cross join lateral (
    select count(*) as confirmed_signups
    from eligible e
    where (e.source,e.medium,e.campaign) = (p.source,p.medium,p.campaign)
      and e.submitted_at >= p.period_start::timestamp at time zone p.time_zone
      and e.submitted_at < p.period_end::timestamp at time zone p.time_zone
  ) signups
  cross join lateral (
    select count(*) as days_synced, sum(d.amount_micros)::numeric / 1000000 as amount,
           min(d.synced_at) as synced_at
    from public.waitlist_ad_spend_daily d
    where d.link_id=p.id and d.day>=p.period_start and d.day<p.period_end
  ) spend
  where p.period_start < p.period_end
),
unmapped_bounds as (
  select coalesce(starts_on, (now() at time zone 'UTC')::date - 7) as period_start,
         least(coalesce(ends_on, (now() at time zone 'UTC')::date), (now() at time zone 'UTC')::date) as period_end
  from report
),
campaign_rows as (
  select * from mapped
  union all
  select
    e.source, e.medium, e.campaign, b.period_start, b.period_end, 'UTC',
    count(*), null::numeric, null::text, null::bigint, null::integer, null::timestamptz, 'no_spend_link'
  from eligible e
  cross join unmapped_bounds b
  where e.submitted_at >= b.period_start::timestamp at time zone 'UTC'
    and e.submitted_at < b.period_end::timestamp at time zone 'UTC'
    and not exists (
      select 1 from public.waitlist_ad_spend_links p where (e.source,e.medium,e.campaign)=(p.source,p.medium,p.campaign)
    )
  group by e.source,e.medium,e.campaign,b.period_start,b.period_end
)
select *,
  round(actual_spend / nullif(confirmed_signups, 0), 2) as cost_per_confirmed_signup
from campaign_rows
order by campaign, source, medium;
