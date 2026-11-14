import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const syncSignup = vi.fn(async () => {});
const postToSlack = vi.fn(async () => {});
vi.mock('./waitlist-sync', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./waitlist-sync')>()),
  syncSignup,
  postToSlack,
}));

const { alertRateLimit, approvePending, approveUrl, discardPending, getPending, savePending } = await import('./waitlist-pending');
const { checkApproval } = await import('./signing');

const DB = 'https://db.example.supabase.co';
const ID = '3f1c2b4a-1d2e-4f5a-8b9c-0d1e2f3a4b5c';
const ROW = { id: ID, full_name: 'Ada Obi', email: 'ada@example.com', profession: null, monthly_income: null, reason: 'no-token:pending' };
const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status });

let fetchMock: ReturnType<typeof vi.fn<typeof fetch>>;
const calls = () =>
  fetchMock.mock.calls.map(([url, init]) => {
    const u = new URL(String(url));
    return `${init?.method ?? 'GET'} ${u.pathname.replace('/rest/v1/', '')}${u.search ? `?${decodeURIComponent(u.searchParams.toString())}` : ''}`;
  });

beforeEach(() => {
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', DB);
  vi.stubEnv('SUPABASE_SERVICE_KEY', 'service-key');
  vi.spyOn(console, 'info').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
  fetchMock = vi.fn<typeof fetch>();
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  syncSignup.mockClear();
  postToSlack.mockClear();
});

const signup = { fullName: 'Ada Obi', email: 'ada@example.com', profession: null, monthlyIncome: null, reason: 'no-token:pending', ipHash: 'abc' };

describe('savePending', () => {
  it('saves to the pending table, never the waitlist, and returns the new id', async () => {
    fetchMock.mockResolvedValueOnce(json(201, [{ id: ID }]));
    expect(await savePending(signup)).toEqual({ saved: true, id: ID });
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe(`${DB}/rest/v1/waitlist_pending?select=id`);
    expect(JSON.parse(String(init?.body))).toMatchObject({ email: 'ada@example.com', reason: 'no-token:pending', ip_hash: 'abc' });
  });

  it('treats a repeat of the same email as already saved', async () => {
    fetchMock.mockResolvedValueOnce(json(409, { code: '23505' }));
    expect(await savePending(signup)).toEqual({ saved: false, duplicate: true });
  });

  // PR #60 review: the limits were counted before the insert, so simultaneous requests all saw
  // room and all got in. The database now enforces them atomically in the insert itself
  // (supabase/migrations/20261113190000_waitlist_pending.sql) and answers with this error.
  it.each(['ip', 'global'] as const)('reports the database refusing a signup over the %s limit', async (scope) => {
    fetchMock.mockResolvedValueOnce(json(400, { code: 'P0001', message: `rate_limited:${scope}` }));
    expect(await savePending(signup)).toEqual({ saved: false, rateLimited: scope });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('reports other failures so the route can alert with the details', async () => {
    fetchMock.mockResolvedValueOnce(json(404, { code: '42P01' }));
    expect(await savePending(signup)).toEqual({ saved: false, error: 'Pending insert failed: HTTP 404 (42P01)' });
  });
});

describe('alertRateLimit', () => {
  it('alerts Slack at most once per limit per 30 minutes', async () => {
    await alertRateLimit('ip', 100_000_000);
    await alertRateLimit('ip', 100_000_001);
    await alertRateLimit('global', 100_000_002);
    await alertRateLimit('ip', 100_000_000 + 31 * 60 * 1000);
    expect(postToSlack).toHaveBeenCalledTimes(3);
  });
});

describe('approval', () => {
  it('builds a signed link that expires in 14 days', () => {
    const url = new URL(approveUrl(ID, 1_000)!);
    expect(url.pathname).toBe('/api/waitlist/approve');
    const exp = Number(url.searchParams.get('exp'));
    expect(exp).toBe(1_000 + 14 * 24 * 60 * 60 * 1000);
    expect(checkApproval(ID, exp, url.searchParams.get('sig')!, { now: 2_000 })).toBe('ok');
    expect(url.search).not.toContain('ada');
  });

  it('only shows signups that are still waiting', async () => {
    fetchMock.mockResolvedValueOnce(json(200, [ROW]));
    await getPending(ID);
    expect(calls()[0]).toContain('status=eq.pending');
  });

  it('claims the signup first, then adds it to the waitlist and sends the welcome email', async () => {
    fetchMock
      .mockResolvedValueOnce(json(200, [ROW]))
      .mockResolvedValueOnce(new Response(null, { status: 201 }));
    const result = await approvePending(ID);
    expect(result.status).toBe('approved');
    const [claim, insert] = calls();
    expect(claim).toMatch(/^PATCH waitlist_pending\?id=eq\.[0-9a-f-]+&status=eq\.pending/);
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toMatchObject({ status: 'approved' });
    expect(insert).toBe('POST waitlist');
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(syncSignup).toHaveBeenCalledWith(expect.objectContaining({ email: 'ada@example.com', firstName: 'Ada', lastName: 'Obi' }));
  });

  // PR #60 review: approve read the row, then inserted, then deleted, so a discard landing in
  // between was overridden. The claim is a single conditional update: only one action wins.
  it('does nothing if the signup was discarded (or approved) a moment earlier', async () => {
    fetchMock.mockResolvedValueOnce(json(200, []));
    expect((await approvePending(ID)).status).toBe('missing');
    expect(calls()).toHaveLength(1);
    expect(syncSignup).not.toHaveBeenCalled();
  });

  it('puts the signup back in the queue when the waitlist insert fails, so nobody is lost', async () => {
    fetchMock
      .mockResolvedValueOnce(json(200, [ROW]))
      .mockResolvedValueOnce(json(500, {}))
      .mockResolvedValueOnce(json(200, [ROW]));
    expect((await approvePending(ID)).status).toBe('error');
    const restore = fetchMock.mock.calls[2];
    expect(calls()[2]).toMatch(/^PATCH waitlist_pending\?id=eq\./);
    expect(JSON.parse(String(restore[1]?.body))).toEqual({ status: 'pending', handled_at: null });
  });

  it('does not email again someone who was already on the waitlist', async () => {
    fetchMock.mockResolvedValueOnce(json(200, [ROW])).mockResolvedValueOnce(json(409, { code: '23505' }));
    expect((await approvePending(ID)).status).toBe('already-on-list');
    expect(syncSignup).not.toHaveBeenCalled();
  });

  // PR #60 review: deleting handled rows removed them from the hourly count. Rows are now kept
  // and marked, and the database counts every row created in the last hour.
  it('marks a discarded signup instead of deleting it', async () => {
    fetchMock.mockResolvedValueOnce(json(200, [ROW]));
    expect(await discardPending(ID)).toBe('discarded');
    expect(calls()[0]).toMatch(/^PATCH waitlist_pending\?id=eq\.[0-9a-f-]+&status=eq\.pending/);
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toMatchObject({ status: 'discarded' });
    expect(calls().some((c) => c.startsWith('DELETE'))).toBe(false);
  });

  it('reports a discard that lost the race as already handled', async () => {
    fetchMock.mockResolvedValueOnce(json(200, []));
    expect(await discardPending(ID)).toBe('missing');
  });
});
