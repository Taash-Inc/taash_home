import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchAdSpend, type AdSpendLink } from './waitlist-ad-spend-providers';
import { closedSpendDays, syncWaitlistAdSpend } from './waitlist-ad-spend';

const days = ['2026-11-19', '2026-11-20'];
const link: AdSpendLink = {
  id: 'ebcfa2d2-97dc-4b73-b54f-5646f050a928',
  provider: 'meta',
  account_id: '1234567890',
  reporting_id: '456',
  source: 'facebook',
  currency: 'USD',
  time_zone: 'America/Los_Angeles',
  starts_on: days[0],
  ends_on: null,
};
const fetchMock = vi.fn<typeof fetch>();
const json = (data: unknown) => Response.json(data);

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
  vi.stubEnv('META_ADS_ACCESS_TOKEN', 'test-meta');
  vi.stubEnv('TIKTOK_ADS_ACCESS_TOKEN', 'test-tiktok');
  vi.stubEnv('GOOGLE_ADS_CLIENT_ID', 'test-client');
  vi.stubEnv('GOOGLE_ADS_CLIENT_SECRET', 'test-client-secret');
  vi.stubEnv('GOOGLE_ADS_REFRESH_TOKEN', 'test-refresh');
  vi.stubEnv('GOOGLE_ADS_DEVELOPER_TOKEN', 'test-developer');
  vi.stubEnv('GOOGLE_ADS_LOGIN_CUSTOMER_ID', '9876543210');
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('ad platform spend', () => {
  it('fetches Meta spend for the mapped delivery platform and follows cursors, never next URLs', async () => {
    fetchMock
      .mockResolvedValueOnce(json({ currency: 'USD', timezone_name: link.time_zone }))
      .mockResolvedValueOnce(json({ id: link.reporting_id, account_id: link.account_id }))
      .mockResolvedValueOnce(json({
        data: [
          { publisher_platform: 'facebook', spend: '1.89', date_start: days[0], date_stop: days[0] },
          { publisher_platform: 'instagram', spend: '9.00', date_start: days[0], date_stop: days[0] },
        ],
        paging: { next: 'https://unexpected.example.invalid/', cursors: { after: 'second' } },
      }))
      .mockResolvedValueOnce(json({
        data: [{ publisher_platform: 'facebook', spend: '0.01', date_start: days[1], date_stop: days[1] }],
      }));

    expect(await fetchAdSpend(link, days)).toEqual(new Map([[days[0], BigInt(1_890_000)], [days[1], BigInt(10_000)]]));
    const [url, init] = fetchMock.mock.calls[3];
    expect(new URL(String(url)).origin).toBe('https://graph.facebook.com');
    expect(new URL(String(url)).searchParams.get('after')).toBe('second');
    expect(init?.headers).toEqual({ Authorization: 'Bearer test-meta' });
  });

  it('fetches the mapped TikTok campaign in daily buckets and preserves the decimal spend', async () => {
    fetchMock
      .mockResolvedValueOnce(json({ code: 0, data: { list: [{
        advertiser_id: link.account_id, currency: 'USD', timezone: link.time_zone,
      }] } }))
      .mockResolvedValueOnce(json({ code: 0, data: { list: [{ campaign_id: link.reporting_id }] } }))
      .mockResolvedValueOnce(json({ code: 0, data: {
        list: [{
          dimensions: { campaign_id: link.reporting_id, stat_time_day: `${days[0]} 00:00:00` },
          metrics: { spend: '12.345678' },
        }],
        page_info: { total_page: 1 },
      } }));

    const result = await fetchAdSpend({ ...link, provider: 'tiktok', source: 'tiktok' }, days);
    expect(result).toEqual(new Map([[days[0], BigInt(12_345_678)]]));
    const query = new URL(String(fetchMock.mock.calls[2][0]));
    expect(query.searchParams.get('end_date')).toBe(days[1]);
    expect(JSON.parse(query.searchParams.get('filtering')!)[0].filter_value).toBe('["456"]');
  });

  it('uses a refreshed Google OAuth token and keeps integer cost micros exact', async () => {
    fetchMock
      .mockResolvedValueOnce(json({ access_token: 'fresh-google-token' }))
      .mockResolvedValueOnce(json({
        results: [{ campaign: { id: '456' }, customer: { currencyCode: 'USD', timeZone: link.time_zone } }],
      }))
      .mockResolvedValueOnce(json({
        results: [{ segments: { date: days[0] }, metrics: { costMicros: '1234567' } }],
      }));

    const result = await fetchAdSpend({ ...link, provider: 'google', source: 'google' }, days);
    expect(result).toEqual(new Map([[days[0], BigInt(1_234_567)]]));
    const [url, request] = fetchMock.mock.calls[2];
    expect(String(url)).toContain('/customers/1234567890/googleAds:search');
    expect(request?.headers).toMatchObject({
      Authorization: 'Bearer fresh-google-token', 'developer-token': 'test-developer', 'login-customer-id': '9876543210',
    });
    expect(JSON.parse(String(request?.body)).query).toContain('WHERE campaign.id = 456');
  });
});

describe('daily sync', () => {
  it('uses closed account-local dates and the campaign end exclusive', () => {
    expect(closedSpendDays(link, new Date('2026-11-21T02:00:00Z'))).toEqual([days[0]]);
    expect(closedSpendDays({ ...link, ends_on: days[1] }, new Date('2026-11-22T12:00:00Z'))).toEqual([days[0]]);
  });

  it('does not record spend from a failed or partially fetched provider report', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://db.example.invalid');
    vi.stubEnv('SUPABASE_SERVICE_KEY', 'test-role');
    vi.spyOn(console, 'error').mockImplementation(() => {});
    fetchMock
      .mockResolvedValueOnce(Response.json([link], { headers: { 'content-range': '0-0/1' } }))
      .mockResolvedValueOnce(json({ currency: 'USD', timezone_name: link.time_zone }))
      .mockResolvedValueOnce(json({ id: link.reporting_id, account_id: link.account_id }))
      .mockResolvedValueOnce(json({
        data: [{ publisher_platform: 'facebook', spend: '1.89', date_start: days[0], date_stop: days[0] }],
        paging: { next: 'second-page', cursors: { after: 'second' } },
      }))
      .mockResolvedValueOnce(new Response('', { status: 429 }));
    expect(await syncWaitlistAdSpend(new Date('2026-11-21T13:15:00Z'))).toEqual({ synced: 0, skipped: 0, failed: 1 });
    expect(fetchMock.mock.calls.every(([url]) => !String(url).includes('/rpc/'))).toBe(true);
  });

  it('imports the entire requested window once, including zero-spend days on a successful pull', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://db.example.invalid');
    vi.stubEnv('SUPABASE_SERVICE_KEY', 'test-role');
    fetchMock
      .mockResolvedValueOnce(Response.json([link], { headers: { 'content-range': '0-0/1' } }))
      .mockResolvedValueOnce(json({ currency: 'USD', timezone_name: link.time_zone }))
      .mockResolvedValueOnce(json({ id: link.reporting_id, account_id: link.account_id }))
      .mockResolvedValueOnce(json({
        data: [{ publisher_platform: 'facebook', spend: '1.89', date_start: days[0], date_stop: days[0] }],
      }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    expect(await syncWaitlistAdSpend(new Date('2026-11-21T13:15:00Z'))).toEqual({ synced: 1, skipped: 0, failed: 0 });
    const writes = fetchMock.mock.calls.filter(([url]) => String(url).endsWith('/rpc/record_waitlist_ad_spend'));
    expect(writes).toHaveLength(1);
    expect(JSON.parse(String(writes[0][1]?.body))).toEqual({
      p_link_id: link.id,
      p_days: [{ day: days[0], amount_micros: '1890000' }, { day: days[1], amount_micros: '0' }],
      p_synced_at: '2026-11-21T13:15:00.000Z',
    });
  });
});
