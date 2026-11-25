import { fetchAdSpend, ProviderRequestError, type AdSpendLink } from './waitlist-ad-spend-providers';
import { logEvent } from './log';
import { headers, supabase } from './waitlist-sync';

const LOOKBACK_DAYS = 14;
const LINK_FIELDS = 'id,provider,account_id,reporting_id,source,currency,time_zone,starts_on,ends_on';
const KNOWN_FAILURES = new Set([
  'provider_not_configured', 'ad_account_metadata_mismatch', 'reporting_object_mismatch',
  'provider_request_failed', 'provider_report_failed', 'spend_write_failed',
]);

function localDate(now: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(now);
  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value;
  return `${value('year')}-${value('month')}-${value('day')}`;
}

function shiftDay(day: string, offset: number) {
  const utc = new Date(`${day}T00:00:00Z`);
  utc.setUTCDate(utc.getUTCDate() + offset);
  return utc.toISOString().slice(0, 10);
}

/** Only fetch closed account-local days within this reporting object's lifetime. */
export function closedSpendDays(link: AdSpendLink, now: Date): string[] {
  const today = localDate(now, link.time_zone);
  const lookback = shiftDay(today, -LOOKBACK_DAYS);
  const first = link.starts_on > lookback ? link.starts_on : lookback;
  const end = link.ends_on && link.ends_on < today ? link.ends_on : today;
  const days: string[] = [];
  for (let day = first; day < end; day = shiftDay(day, 1)) days.push(day);
  return days;
}

export async function syncWaitlistAdSpend(now = new Date()) {
  const db = supabase();
  if (!db) throw new Error('database_not_configured');
  const query = new URL(`${db.url}/rest/v1/waitlist_ad_spend_links`);
  query.searchParams.set('select', LINK_FIELDS);
  query.searchParams.set('or', `(ends_on.is.null,ends_on.gte.${shiftDay(now.toISOString().slice(0, 10), -LOOKBACK_DAYS - 1)})`);
  query.searchParams.set('starts_on', `lte.${shiftDay(now.toISOString().slice(0, 10), 1)}`);
  const linksResponse = await fetch(query, {
    headers: { ...headers(db.key), Prefer: 'count=exact' },
    signal: AbortSignal.timeout(8_000),
  });
  if (!linksResponse.ok) throw new Error('link_read_failed');
  const links: AdSpendLink[] = await linksResponse.json();
  if (!Array.isArray(links) || Number(linksResponse.headers.get('content-range')?.split('/')[1]) !== links.length) {
    throw new Error('incomplete_links');
  }

  const result = { synced: 0, skipped: 0, failed: 0 };
  // Limit concurrent provider requests. A failure for one account does not stop the others.
  for (let start = 0; start < links.length; start += 4) {
    await Promise.all(links.slice(start, start + 4).map(async (link) => {
      try {
        const days = closedSpendDays(link, now);
        if (!days.length) {
          result.skipped++;
          return;
        }
        const spend = await fetchAdSpend(link, days);
        const write = await fetch(`${db.url}/rest/v1/rpc/record_waitlist_ad_spend`, {
          method: 'POST',
          headers: headers(db.key, true),
          body: JSON.stringify({
            p_link_id: link.id,
            p_days: days.map((day) => ({ day, amount_micros: (spend.get(day) ?? BigInt(0)).toString() })),
            p_synced_at: now.toISOString(),
          }),
          signal: AbortSignal.timeout(8_000),
        });
        if (!write.ok) throw new Error('spend_write_failed');
        result.synced++;
      } catch (error) {
        result.failed++;
        const reason = error instanceof Error && KNOWN_FAILURES.has(error.message) ? error.message : 'invalid_report';
        const details = error instanceof ProviderRequestError
          ? { status: error.status, provider_code: error.code, provider_message: error.providerMessage, trace: error.trace }
          : {};
        logEvent('error', 'waitlist.ad_spend_link_failed', { link: link.id, provider: link.provider, reason, ...details });
      }
    }));
  }
  return result;
}
