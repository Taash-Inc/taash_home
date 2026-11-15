-- Enter the reporting dates and one currency for each run. Bounds include the
-- start and exclude the end. Use the same window as the actual spend totals.
-- NULL dates show all signups. Leave spend blank until actual costs are known.
with report as (
  select null::timestamptz as starts_at, null::timestamptz as ends_at, 'USD'::text as currency
),
spend_input(source, medium, campaign, amount) as (
  values (null::text, null::text, null::text, null::numeric)
  -- , ('tiktok', 'paid_social', 'launch_waitlist', 20.00)
  -- , ('google', 'cpc', 'launch_waitlist', 15.00)
),
spend as (
  select source, medium, campaign, sum(amount) as actual_spend
  from spend_input
  where source is not null and medium is not null and campaign is not null and amount >= 0
  group by source, medium, campaign
),
attributed as (
  select
    campaign_source as source, campaign_medium as medium, campaign_name as campaign,
    campaign_content as content, campaign_submitted_at as submitted_at
  from public.waitlist
  where campaign_source is not null
  union all
  select
    paid_social_platform, 'paid_social', paid_social_campaign,
    paid_social_content, paid_social_submitted_at
  from public.waitlist
  where campaign_source is null and paid_social_platform is not null
),
signups as (
  select source, medium, campaign, count(*) as confirmed_signups
  from attributed
  cross join report
  where medium is not null and campaign is not null and submitted_at is not null
    and left(campaign, 3) <> 'qa_'
    -- The original Meta rollout marked its two test signups by creative.
    and not (
      source in ('facebook', 'instagram') and medium = 'paid_social' and campaign = 'taash_waitlist'
      and content is not distinct from 'attribution_qa_20261115'
    )
    and (report.starts_at is null or submitted_at >= report.starts_at)
    and (report.ends_at is null or submitted_at < report.ends_at)
  group by source, medium, campaign
)
select
  source, medium, campaign, coalesce(signups.confirmed_signups, 0) as confirmed_signups,
  spend.actual_spend,
  case when spend.actual_spend is not null then report.currency end as currency,
  round(spend.actual_spend / nullif(signups.confirmed_signups, 0), 2) as cost_per_confirmed_signup
from signups
full join spend using (source, medium, campaign)
cross join report
order by campaign, source, medium;
