export type AdSpendLink = {
  id: string;
  provider: 'meta' | 'tiktok' | 'google';
  account_id: string;
  reporting_id: string;
  source: 'facebook' | 'instagram' | 'tiktok' | 'google';
  currency: string;
  time_zone: string;
  starts_on: string;
  ends_on: string | null;
};

type JsonObject = Record<string, unknown>;
type DailySpend = Map<string, bigint>;
const MAX_PAGES = 12;

function object(value: unknown): JsonObject {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) throw new Error('invalid_response');
  return value as JsonObject;
}

function list(value: unknown): JsonObject[] {
  if (!Array.isArray(value)) throw new Error('invalid_response');
  return value.map(object);
}

function setting(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error('provider_not_configured');
  return value;
}

async function json(url: string | URL, init: RequestInit) {
  const response = await fetch(url, { ...init, redirect: 'error', signal: AbortSignal.timeout(9_000) });
  if (!response.ok) throw new Error('provider_request_failed');
  return object(await response.json());
}

function addSpend(spend: DailySpend, days: readonly string[], day: unknown, micros: bigint) {
  if (typeof day !== 'string' || !days.includes(day)) throw new Error('invalid_report_date');
  // Each request groups by day and a single source for one reporting object.
  if (spend.has(day)) throw new Error('duplicate_report_date');
  spend.set(day, micros);
}

function micros(value: unknown, format: 'currencyUnits' | 'micros'): bigint {
  if (typeof value !== 'string' && typeof value !== 'number') throw new Error('invalid_spend');
  if (typeof value === 'number' && format === 'micros' && !Number.isSafeInteger(value)) {
    throw new Error('invalid_spend');
  }
  const text = String(value);
  const pattern = format === 'micros' ? /^\d+$/ : /^\d+(?:\.\d{1,6})?$/;
  if (!pattern.test(text)) throw new Error('invalid_spend');
  if (format === 'micros') return BigInt(text);
  const [whole, fraction = ''] = text.split('.');
  return BigInt(whole) * BigInt(1_000_000) + BigInt(fraction.padEnd(6, '0'));
}

function checkAccount(link: AdSpendLink, currency: unknown, timeZone: unknown) {
  if (currency !== link.currency || timeZone !== link.time_zone) throw new Error('ad_account_metadata_mismatch');
}

async function fromMeta(link: AdSpendLink, days: readonly string[]) {
  const base = 'https://graph.facebook.com/v27.0/';
  const headers = { Authorization: `Bearer ${setting('META_ADS_ACCESS_TOKEN')}` };
  const [account, entity] = await Promise.all([
    json(`${base}act_${link.account_id}?fields=currency,timezone_name`, { headers }),
    json(`${base}${link.reporting_id}?fields=id,account_id`, { headers }),
  ]);
  checkAccount(link, account.currency, account.timezone_name);
  if (entity.id !== link.reporting_id || entity.account_id !== link.account_id) {
    throw new Error('reporting_object_mismatch');
  }

  const url = new URL(`${base}${link.reporting_id}/insights`);
  url.search = new URLSearchParams({
    fields: 'spend,date_start,date_stop',
    breakdowns: 'publisher_platform',
    time_increment: '1',
    time_range: JSON.stringify({ since: days[0], until: days.at(-1) }),
    limit: '200',
  }).toString();
  const spend: DailySpend = new Map();
  for (let page = 0; page < MAX_PAGES; page++) {
    const body = await json(url, { headers });
    for (const row of list(body.data)) {
      if (typeof row.publisher_platform !== 'string') throw new Error('missing_publisher_platform');
      if (row.publisher_platform !== link.source) continue;
      if (row.date_start !== row.date_stop) throw new Error('invalid_report_date');
      addSpend(spend, days, row.date_start, micros(row.spend, 'currencyUnits'));
    }
    const paging = body.paging ? object(body.paging) : {};
    if (!paging.next) return spend;
    const after = object(paging.cursors).after;
    if (typeof after !== 'string' || !after || after === url.searchParams.get('after')) {
      throw new Error('invalid_page_cursor');
    }
    // Never follow provider-supplied next URLs or put credentials in the URL.
    url.searchParams.set('after', after);
  }
  throw new Error('report_page_limit');
}

async function fromTikTok(link: AdSpendLink, days: readonly string[]) {
  const base = 'https://business-api.tiktok.com/open_api/v1.3/';
  const headers = { 'Access-Token': setting('TIKTOK_ADS_ACCESS_TOKEN') };
  async function get(path: string, params: Record<string, string>) {
    const url = new URL(path, base);
    url.search = new URLSearchParams(params).toString();
    const body = await json(url, { headers });
    if (body.code !== 0) throw new Error('provider_report_failed');
    return object(body.data);
  }
  const [accountData, campaignData] = await Promise.all([
    get('advertiser/info/', {
      advertiser_ids: JSON.stringify([link.account_id]),
      fields: JSON.stringify(['advertiser_id', 'currency', 'timezone']),
    }),
    get('campaign/get/', {
      advertiser_id: link.account_id, filtering: JSON.stringify({ campaign_ids: [link.reporting_id] }),
      fields: JSON.stringify(['campaign_id']),
    }),
  ]);
  const account = list(accountData.list).find((row) => row.advertiser_id === link.account_id);
  if (!account || !list(campaignData.list).some((row) => row.campaign_id === link.reporting_id)) {
    throw new Error('reporting_object_mismatch');
  }
  checkAccount(link, account.currency, account.timezone);
  const params = {
    advertiser_id: link.account_id,
    report_type: 'BASIC',
    data_level: 'AUCTION_CAMPAIGN',
    service_type: 'AUCTION',
    dimensions: JSON.stringify(['campaign_id', 'stat_time_day']),
    metrics: JSON.stringify(['spend']),
    start_date: days[0],
    end_date: days.at(-1)!,
    filtering: JSON.stringify([{
      field_name: 'campaign_ids', filter_type: 'IN', filter_value: JSON.stringify([link.reporting_id]),
    }]),
    page_size: '100',
  };
  const spend: DailySpend = new Map();
  for (let page = 1; page <= MAX_PAGES; page++) {
    const data = await get('report/integrated/get/', { ...params, page: String(page) });
    for (const row of list(data.list)) {
      const dimensions = object(row.dimensions);
      if (dimensions.campaign_id !== link.reporting_id) throw new Error('reporting_object_mismatch');
      const day = dimensions.stat_time_day;
      if (typeof day !== 'string' || !/^\d{4}-\d{2}-\d{2}(?: 00:00:00)?$/.test(day)) {
        throw new Error('invalid_report_date');
      }
      addSpend(spend, days, day.slice(0, 10), micros(object(row.metrics).spend, 'currencyUnits'));
    }
    const totalPage = object(data.page_info).total_page;
    if (typeof totalPage !== 'number' || !Number.isInteger(totalPage) || totalPage < 0) {
      throw new Error('invalid_page_cursor');
    }
    if (page >= totalPage) return spend;
  }
  throw new Error('report_page_limit');
}

async function googleToken() {
  const body = new URLSearchParams({
    client_id: setting('GOOGLE_ADS_CLIENT_ID'),
    client_secret: setting('GOOGLE_ADS_CLIENT_SECRET'),
    refresh_token: setting('GOOGLE_ADS_REFRESH_TOKEN'),
    grant_type: 'refresh_token',
  });
  const token = await json('https://oauth2.googleapis.com/token', { method: 'POST', body });
  if (typeof token.access_token !== 'string' || !token.access_token) throw new Error('invalid_token');
  return token.access_token;
}

async function fromGoogle(link: AdSpendLink, days: readonly string[]) {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${await googleToken()}`,
    'developer-token': setting('GOOGLE_ADS_DEVELOPER_TOKEN'),
    'Content-Type': 'application/json',
  };
  const loginCustomer = process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID?.trim();
  if (loginCustomer) {
    if (!/^\d{10}$/.test(loginCustomer)) throw new Error('invalid_manager_id');
    headers['login-customer-id'] = loginCustomer;
  }
  const url = `https://googleads.googleapis.com/v26/customers/${link.account_id}/googleAds:search`;
  const search = (query: string, pageToken?: string) => json(url, {
    method: 'POST', headers, body: JSON.stringify({ query, pageToken }),
  });
  const campaignFilter = `campaign.id = ${link.reporting_id}`;
  const identity = await search(`SELECT campaign.id, customer.currency_code, customer.time_zone FROM campaign WHERE ${campaignFilter}`);
  const row = list(identity.results ?? [])[0];
  if (!row || object(row.campaign).id !== link.reporting_id) throw new Error('reporting_object_mismatch');
  const account = object(row.customer);
  checkAccount(link, account.currencyCode, account.timeZone);

  const query = `SELECT segments.date, metrics.cost_micros FROM campaign WHERE ${campaignFilter} AND segments.date BETWEEN '${days[0]}' AND '${days.at(-1)}'`;
  const spend: DailySpend = new Map();
  let cursor: string | undefined;
  for (let page = 0; page < MAX_PAGES; page++) {
    const body = await search(query, cursor);
    // Google omits the results array for a successful empty search. A
    // response without results or the expected field mask is not that case.
    if (body.results === undefined &&
        (typeof body.fieldMask !== 'string' || !body.fieldMask.split(',').includes('metrics.costMicros'))) {
      throw new Error('invalid_response');
    }
    for (const row of list(body.results ?? [])) {
      addSpend(spend, days, object(row.segments).date, micros(object(row.metrics).costMicros, 'micros'));
    }
    if (!body.nextPageToken) return spend;
    if (typeof body.nextPageToken !== 'string' || body.nextPageToken === cursor) throw new Error('invalid_page_cursor');
    cursor = body.nextPageToken;
  }
  throw new Error('report_page_limit');
}

export async function fetchAdSpend(link: AdSpendLink, days: readonly string[]): Promise<DailySpend> {
  // IDs and dates become API query arguments. Never accept free-form query strings.
  if (![link.account_id, link.reporting_id].every((id) => /^\d{1,32}$/.test(id)) ||
      !days.length || !days.every((day) => /^\d{4}-\d{2}-\d{2}$/.test(day))) {
    throw new Error('invalid_spend_link');
  }
  switch (link.provider) {
    case 'meta': return fromMeta(link, days);
    case 'tiktok': return fromTikTok(link, days);
    case 'google': return fromGoogle(link, days);
  }
}
