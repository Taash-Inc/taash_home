-- Run in the project's SQL editor. Fill in the same time window and spend
-- shown in Ads Manager's Platform breakdown for this one ad.
-- End is exclusive. Include a timezone offset. NULL dates show all attributed rows.
-- Rerun after pending signups are resolved; the report uses their original submission time.
with run as (
  select
    'taash_waitlist'::text as campaign,
    'overview_carousel'::text as content,
    null::timestamptz as starts_at,
    null::timestamptz as ends_at,
    null::numeric as facebook_spend,
    null::numeric as instagram_spend
),
spend as (
  select 'facebook'::text as platform, facebook_spend as spend_usd from run
  union all
  select 'instagram', instagram_spend from run
),
signups as (
  select paid_social_platform as platform, count(*) as confirmed_signups
  from public.waitlist
  cross join run
  where paid_social_campaign = run.campaign
    and paid_social_content is not distinct from run.content
    and (run.starts_at is null or paid_social_submitted_at >= run.starts_at)
    and (run.ends_at is null or paid_social_submitted_at < run.ends_at)
  group by paid_social_platform
)
select
  spend.platform,
  coalesce(signups.confirmed_signups, 0) as confirmed_signups,
  spend.spend_usd,
  round(spend.spend_usd / nullif(signups.confirmed_signups, 0), 2) as cost_per_signup_usd
from spend
left join signups using (platform)
order by spend.platform;
