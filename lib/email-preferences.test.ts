import { describe, expect, it, vi } from 'vitest';
import {
  ensurePreferenceToken,
  findEmailByToken,
  isPreferenceToken,
  leaveWaitlist,
  maskEmail,
} from './email-preferences';

const TOKEN = '0123456789abcdef'.repeat(4);
const SUPABASE = 'https://db.example.supabase.co';

/** A fetch that answers each call in turn with [status, body], recording the requests. */
function replies(...answers: [number, unknown][]) {
  let i = 0;
  return vi.fn<typeof fetch>(async () => {
    const [status, body] = answers[Math.min(i++, answers.length - 1)];
    return new Response(body === null ? null : JSON.stringify(body), { status });
  });
}
const call = (f: ReturnType<typeof replies>, n: number) => ({
  url: String(f.mock.calls[n][0]),
  method: f.mock.calls[n][1]?.method,
  headers: f.mock.calls[n][1]?.headers as Record<string, string>,
  body: f.mock.calls[n][1]?.body === undefined ? undefined : JSON.parse(String(f.mock.calls[n][1]?.body)),
});
const db = (fetchImpl: typeof fetch) => ({ url: SUPABASE, key: 'service-key', fetchImpl });

describe('isPreferenceToken', () => {
  it('accepts 64 lowercase hex characters and nothing else', () => {
    expect(isPreferenceToken(TOKEN)).toBe(true);
    expect(isPreferenceToken(TOKEN.toUpperCase())).toBe(false);
    expect(isPreferenceToken(TOKEN.slice(1))).toBe(false);
    expect(isPreferenceToken(`${TOKEN.slice(1)}g`)).toBe(false);
    expect(isPreferenceToken([TOKEN])).toBe(false);
    expect(isPreferenceToken(undefined)).toBe(false);
  });
});

describe('maskEmail', () => {
  it('keeps the first letter and the domain', () => {
    expect(maskEmail('ada@example.com')).toBe('a•••@example.com');
    expect(maskEmail('not-an-email')).toBe('•••');
  });
});

describe('ensurePreferenceToken', () => {
  it('upserts by email and returns the token, new or existing', async () => {
    const fetchImpl = replies([201, [{ token: TOKEN }]]);
    expect(await ensurePreferenceToken('ada@example.com', db(fetchImpl))).toEqual({
      success: true,
      token: TOKEN,
    });
    const sent = call(fetchImpl, 0);
    expect(sent.url).toBe(`${SUPABASE}/rest/v1/email_preference_tokens?on_conflict=email&select=token`);
    expect(sent.method).toBe('POST');
    expect(sent.headers.Prefer).toBe('resolution=merge-duplicates,return=representation');
    expect(sent.body).toEqual({ email: 'ada@example.com' });
  });

  it('fails when no valid token comes back, e.g. before the SQL has been run', async () => {
    const fetchImpl = replies([404, { message: 'relation "email_preference_tokens" does not exist' }]);
    const result = await ensurePreferenceToken('ada@example.com', db(fetchImpl));
    expect(result.success).toBe(false);
  });

  it('fails without calling Supabase when it is not configured', async () => {
    const fetchImpl = replies([201, [{ token: TOKEN }]]);
    const result = await ensurePreferenceToken('ada@example.com', { url: undefined, key: 'k', fetchImpl });
    expect(result.success).toBe(false);
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});

describe('findEmailByToken', () => {
  it('returns the address a token belongs to', async () => {
    const fetchImpl = replies([200, [{ email: 'ada@example.com' }]]);
    expect(await findEmailByToken(TOKEN, db(fetchImpl))).toEqual({ success: true, email: 'ada@example.com' });
    expect(call(fetchImpl, 0).url).toBe(`${SUPABASE}/rest/v1/email_preference_tokens?token=eq.${TOKEN}&select=email`);
  });

  it('returns null for a token nobody has', async () => {
    const fetchImpl = replies([200, []]);
    expect(await findEmailByToken(TOKEN, db(fetchImpl))).toEqual({ success: true, email: null });
  });

  it('never queries with something that is not a token', async () => {
    const fetchImpl = replies([200, []]);
    expect(await findEmailByToken('abc&or=(email.neq.x)', db(fetchImpl))).toEqual({ success: true, email: null });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('reports a failed lookup instead of calling the link invalid', async () => {
    const fetchImpl = replies([500, { message: 'down' }]);
    expect((await findEmailByToken(TOKEN, db(fetchImpl))).success).toBe(false);
  });
});

describe('leaveWaitlist', () => {
  const EMAIL = 'ada+taash@example.com';
  const deps = (fetchImpl: typeof fetch) => ({
    db: db(fetchImpl),
    oneSignal: { appId: 'app-uuid', apiKey: 'os_v2_app_test', fetchImpl },
  });

  it('deletes from OneSignal first, then every Supabase copy, the token last', async () => {
    const fetchImpl = replies([202, {}], [204, null], [204, null], [204, null], [204, null]);
    expect(await leaveWaitlist(EMAIL, deps(fetchImpl))).toEqual({ success: true });

    const urls = fetchImpl.mock.calls.map(([url]) => String(url));
    const encoded = 'ada%2Btaash%40example.com';
    expect(urls).toEqual([
      `https://api.onesignal.com/apps/app-uuid/users/by/external_id/${encoded}`,
      `${SUPABASE}/rest/v1/waitlist?email=eq.${encoded}`,
      `${SUPABASE}/rest/v1/waitlist_backup?email=eq.${encoded}`,
      `${SUPABASE}/rest/v1/failed_onesignal_syncs?email=eq.${encoded}`,
      `${SUPABASE}/rest/v1/email_preference_tokens?email=eq.${encoded}`,
    ]);
    expect(fetchImpl.mock.calls.every(([, init]) => init?.method === 'DELETE')).toBe(true);
  });

  it('touches nothing in Supabase when OneSignal fails, so the person still has their link', async () => {
    const fetchImpl = replies([503, { errors: ['unavailable'] }]);
    const result = await leaveWaitlist(EMAIL, deps(fetchImpl));
    expect(result.success).toBe(false);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('stops at a failed delete and keeps the token, so the person can try again', async () => {
    const fetchImpl = replies([202, {}], [204, null], [500, { message: 'boom' }]);
    const result = await leaveWaitlist(EMAIL, deps(fetchImpl));
    expect(result).toEqual({ success: false, error: 'delete from waitlist_backup: HTTP 500 {"message":"boom"}' });
    expect(fetchImpl).toHaveBeenCalledTimes(3);
  });
});
