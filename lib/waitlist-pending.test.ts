import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const syncSignup = vi.fn(async () => {});
const postToSlack = vi.fn(async () => {});
vi.mock('./waitlist-sync', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./waitlist-sync')>()),
  syncSignup,
  postToSlack,
}));

const { GLOBAL_LIMIT, PER_IP_LIMIT, approvePending, approveUrl, checkPendingLimits, discardPending, savePending } =
  await import('./waitlist-pending');
const { checkApproval } = await import('./signing');

const DB = 'https://db.example.supabase.co';
const ID = '3f1c2b4a-1d2e-4f5a-8b9c-0d1e2f3a4b5c';
const ROW = { id: ID, full_name: 'Ada Obi', email: 'ada@example.com', profession: null, monthly_income: null, reason: 'no-token:pending' };
const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status });
const counted = (total: number) => new Response(null, { status: 200, headers: { 'content-range': `*/${total}` } });

let fetchMock: ReturnType<typeof vi.fn<typeof fetch>>;
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

  it('reports other failures so the route can alert with the details', async () => {
    fetchMock.mockResolvedValueOnce(json(404, { code: '42P01' }));
    expect(await savePending(signup)).toEqual({ saved: false, error: 'Pending insert failed: HTTP 404 (42P01)' });
  });
});

describe('checkPendingLimits', () => {
  it(`allows an IP up to ${PER_IP_LIMIT} unverified signups an hour, then blocks it and alerts once`, async () => {
    fetchMock.mockImplementation(async (url) => (String(url).includes('ip_hash=') ? counted(PER_IP_LIMIT - 1) : counted(3)));
    expect(await checkPendingLimits('ip-a', 1_000_000)).toEqual({ allowed: true });

    fetchMock.mockImplementation(async (url) => (String(url).includes('ip_hash=') ? counted(PER_IP_LIMIT) : counted(3)));
    expect(await checkPendingLimits('ip-a', 2_000_000)).toEqual({ allowed: false, scope: 'ip' });
    expect(await checkPendingLimits('ip-a', 2_000_001)).toEqual({ allowed: false, scope: 'ip' });
    expect(postToSlack).toHaveBeenCalledTimes(1);
  });

  it(`pauses all unverified signups past ${GLOBAL_LIMIT} an hour`, async () => {
    fetchMock.mockImplementation(async (url) => (String(url).includes('ip_hash=') ? counted(0) : counted(GLOBAL_LIMIT)));
    expect(await checkPendingLimits('ip-b', 9_000_000)).toEqual({ allowed: false, scope: 'global' });
  });

  it('lets the signup through and logs it when Supabase cannot count', async () => {
    fetchMock.mockResolvedValue(json(500, {}));
    expect(await checkPendingLimits('ip-c')).toEqual({ allowed: true });
    expect(String(vi.mocked(console.error).mock.calls[0][0])).toContain('waitlist.limit_check_failed');
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

  it('moves the signup onto the waitlist, sends the welcome email, and removes it from pending', async () => {
    fetchMock
      .mockResolvedValueOnce(json(200, [ROW]))
      .mockResolvedValueOnce(new Response(null, { status: 201 }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    const result = await approvePending(ID);
    expect(result.status).toBe('approved');
    const calls = fetchMock.mock.calls.map(([url, init]) => `${init?.method ?? 'GET'} ${String(url).split('?')[0]}`);
    expect(calls).toEqual([
      `GET ${DB}/rest/v1/waitlist_pending`,
      `POST ${DB}/rest/v1/waitlist`,
      `DELETE ${DB}/rest/v1/waitlist_pending`,
    ]);
    expect(syncSignup).toHaveBeenCalledWith(expect.objectContaining({ email: 'ada@example.com', firstName: 'Ada', lastName: 'Obi' }));
  });

  it('does not email again someone who was already on the waitlist', async () => {
    fetchMock
      .mockResolvedValueOnce(json(200, [ROW]))
      .mockResolvedValueOnce(json(409, { code: '23505' }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    expect((await approvePending(ID)).status).toBe('already-on-list');
    expect(syncSignup).not.toHaveBeenCalled();
  });

  it('keeps the pending row when the waitlist insert fails, so nobody is lost', async () => {
    fetchMock.mockResolvedValueOnce(json(200, [ROW])).mockResolvedValueOnce(json(500, {}));
    expect((await approvePending(ID)).status).toBe('error');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('reports a signup that was already handled', async () => {
    fetchMock.mockResolvedValueOnce(json(200, []));
    expect((await approvePending(ID)).status).toBe('missing');
    fetchMock.mockResolvedValueOnce(json(200, []));
    expect(await discardPending(ID)).toBe('missing');
  });
});
