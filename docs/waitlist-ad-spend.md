# Import ad spend for waitlist campaigns

Taash reads actual daily spend from the three advertising APIs. To keep spend
and signups comparable, each reporting object is linked to the exact
`utm_source`, `utm_medium`, and `utm_campaign` used in its destination link.
Use the currency and time zone from the ad account. The sync checks both against
the API. Only spend and campaign identifiers are used for the import.

## Connect the ad accounts

Store credentials as sensitive server environment variables on the Vercel
production project. Use a reporting-only ad account role where supported.

| Platform | Account access | Environment variables |
| --- | --- | --- |
| Meta | A Marketing API token with `ads_read` and access to the ad account. Use the `ANALYZE` task for a system user. | `META_ADS_ACCESS_TOKEN` |
| TikTok | A TikTok API for Business app with reporting access and advertiser authorization. | `TIKTOK_ADS_ACCESS_TOKEN` |
| Google Ads | A developer token approved for production accounts and Google OAuth credentials for a user with access to the advertiser. If the advertiser is reached through a manager account, use that account's ID without hyphens. | `GOOGLE_ADS_DEVELOPER_TOKEN`, `GOOGLE_ADS_CLIENT_ID`, `GOOGLE_ADS_CLIENT_SECRET`, `GOOGLE_ADS_REFRESH_TOKEN`, and optionally `GOOGLE_ADS_LOGIN_CUSTOMER_ID` |

See [Meta Ads Insights permissions](https://developers.facebook.com/docs/marketing-api/insights/),
[TikTok developer app setup](https://business-api.tiktok.com/portal/docs/create-a-developer-app/v1.3),
and [Google Ads API authorization](https://developers.google.com/google-ads/api/rest/auth).

## Deploy and link campaigns

1. Apply [the migration](../supabase/migrations/20261116010000_waitlist_ad_spend.sql)
   before deploying the website. This creates private tables and a restricted
   write function for the sync. The Vercel cron uses the existing `CRON_SECRET`.
2. Add an entry to `public.waitlist_ad_spend_links` as the Supabase project
   owner for each paid source and campaign to import. The fields are shown
   below. Use the campaign's first reporting date and optionally its exclusive
   end date. Leave the end empty for an ongoing campaign.
3. Deploy and verify a successful pull in Vercel’s logs and the Supabase
   report. The endpoint can also be run with a GET request authenticated by
   the cron secret. Check each connected platform on a finished reporting
   day with known spend before using its cost figures.

```sql
-- Replace the example IDs, dates, time zone, currency and tags for your campaign.
insert into public.waitlist_ad_spend_links (
  provider, account_id, reporting_id, source, medium, campaign, currency, time_zone, starts_on
) values
  ('meta', '111', '222', 'facebook', 'paid_social', 'launch_waitlist', 'USD', 'America/Los_Angeles', '2026-11-19'),
  ('meta', '111', '222', 'instagram', 'paid_social', 'launch_waitlist', 'USD', 'America/Los_Angeles', '2026-11-19'),
  ('tiktok', '333', '444', 'tiktok', 'paid_social', 'launch_waitlist', 'USD', 'America/Los_Angeles', '2026-11-19'),
  ('google', '555', '666', 'google', 'cpc', 'launch_waitlist', 'USD', 'America/Los_Angeles', '2026-11-19');
```

Use a Meta ad ID if the tagged link covers only that ad, or a Meta campaign
ID if the tagged link covers the whole campaign. Both Meta rows can reference
the same reporting object because the provider separates Facebook and
Instagram spend. TikTok and Google Ads mappings use their campaign IDs.
Each mapping covers one reporting object per source, medium and campaign.
Use distinct campaign tags when separate reporting objects need separate
costs. Use a new mapping for changed reporting objects or account settings.

## Read automatic costs

Run [the automatic spend report](../supabase/waitlist-automatic-spend-report.sql)
in the Supabase SQL editor. It shows confirmed signups, spend, account currency,
day coverage and cost per confirmed signup. It uses the last seven complete
days by default. Set the two optional date values to inspect a different
window. The end date is exclusive. A signup's original submission time
determines which date it falls on, even if it was approved later.

The daily import refreshes the latest 14 closed days and keeps previously
imported days. Today and days before the first complete import may be absent.
Cost remains blank for an incomplete date range or a campaign without
confirmed signups. A source without a spend link still shows its confirmed
signups. The [manual report](waitlist-campaigns.md) can include newsletter or
partner costs that aren’t in the ad platforms.
