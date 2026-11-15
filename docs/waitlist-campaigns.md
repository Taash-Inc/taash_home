# Measure waitlist campaigns

Use tags on links to the Taash signup form. Keep the source, medium and
campaign consistent across ad links and spend entries. The optional
`utm_content` identifies a creative or link location within a campaign.
Use lowercase names up to 100 characters with letters, digits, underscores,
hyphens or dots between segments. Reserve campaign names starting with
`qa_` for tests.

| Channel | `utm_source` | `utm_medium` | `utm_campaign` |
| --- | --- | --- | --- |
| TikTok Ads | `tiktok` | `paid_social` | `launch_waitlist` |
| Google Ads | `google` | `cpc` | `launch_waitlist` |
| Taash newsletter | `taash_newsletter` | `email` | `launch_waitlist` |
| Partner site | `partner.example` | `referral` | `launch_waitlist` |

This [example TikTok destination](https://www.taash.tax/?utm_source=tiktok&utm_medium=paid_social&utm_campaign=launch_waitlist&utm_content=demo_reel#waitlist)
opens the Taash waitlist form with campaign tags.
In Google Ads, set the manual UTM parameters with the destination URL or
final URL suffix. Auto-tagging alone does not supply these campaign fields.
For a newsletter or partner site, give the publisher the full tagged URL.
Replace the example campaign and creative names before using it.

## Read the results

For ad accounts with reporting API access, see [import ad spend automatically](waitlist-ad-spend.md).

1. Open [the campaign report](../supabase/waitlist-campaign-report.sql) in
   the Supabase SQL editor. Enter the reporting dates with their timezone
   offsets. The start is inclusive and the end is exclusive.
2. For cost, enter actual spend for each source, medium and campaign in the
   same date window. Use one currency for the report, and convert amounts
   before entering them if the sources bill in different currencies. Enter
   zero for a campaign only if its actual cost was zero.
3. Run the query to see confirmed signups and cost per confirmed signup for
   each source, medium and campaign. Cost stays blank if spend is missing
   or there are zero confirmed signups. The report includes spend entries
   that produced zero signups.

The latest tagged visit in the same browser tab supplies attribution. A
signup that was held and later approved counts in its original submission
window. Untagged signups and existing duplicates do not add to these totals.
Existing Facebook and Instagram attribution is included once, and their
original report remains valid. The report excludes `qa_` campaigns and the
two original Meta verification rows.

## Rollout

Apply [the migration](../supabase/migrations/20261115230000_waitlist_campaign_attribution.sql)
before deploying the website. Use separate tagged `qa_` links for post-deploy
tests and confirm the source and campaign in the stored waitlist rows.
