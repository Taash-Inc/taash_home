# Measure paid waitlist signups

For combined reporting across channels, see [Measure waitlist campaigns](waitlist-campaigns.md).

The website recognizes `utm_source=fb` or `ig` (or the full platform name)
with `utm_medium=paid_social` and a campaign slug. The carousel uses
`utm_campaign=taash_waitlist&utm_content=overview_carousel`. The website
retains the latest tagged visit in the same browser tab. A later link with
different campaign tags replaces it or clears it if it is ineligible.

The confirmed waitlist keeps the platform, campaign, optional creative slug
and original submission time. Signups waiting for approval carry those
fields forward when approved. Repeated submissions do not change an
existing signup's source. Earlier signups without tags stay unattributed.

## Before the test

1. Apply [the migration](../supabase/migrations/20261115190000_waitlist_paid_social.sql)
   in Supabase before the website deploy. This order preserves compatibility
   with the currently deployed signup handler.
2. After the migration and deploy, use a clearly marked test signup from a
   tagged URL and check that it reaches the confirmed waitlist with the
   expected source. Exclude it by starting the report window after the test.

## Check the result

1. In Meta Ads Manager, select the carousel ad and use **Breakdown → Platform**.
   Note the actual Facebook and Instagram spend for the reporting dates.
2. In the Supabase SQL editor, open [the report](../supabase/waitlist-paid-social-report.sql).
   Enter both amounts in USD and set the timestamp bounds to the same
   reporting window and timezone. The end is exclusive. Use a distinct
   creative slug or nonoverlapping reporting dates for another run.
3. The report counts confirmed rows by platform and divides spend by that
   count. Cost is blank until spend is entered and the platform has a
   confirmed signup. Run the report again after pending approvals have
   cleared, since each signup is counted in its original submission window.

The report contains totals only. It measures signups with the tagged ad URL
and does not send signup details or conversion events to Meta.
