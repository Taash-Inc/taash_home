import { describe, expect, it, vi } from 'vitest';
import {
  WAITLIST_CONFIRMATION_TEMPLATE_ID,
  deterministicUuid,
  syncWaitlistContact,
  type WaitlistContact,
} from './onesignal';

const CONTACT: WaitlistContact = {
  email: 'ada@example.com',
  firstName: 'Ada',
  lastName: 'Obi',
  profession: 'Designer',
  monthlyIncome: null,
};
const CONFIG = { appId: 'app-uuid', apiKey: 'os_v2_app_test' };

/** A fetch that answers each call in turn with [status, body], recording the requests. */
function replies(...answers: [number, Record<string, unknown>][]) {
  let i = 0;
  return vi.fn<typeof fetch>(async () => {
    const [status, body] = answers[Math.min(i++, answers.length - 1)];
    return new Response(JSON.stringify(body), { status });
  });
}
const sent = (f: ReturnType<typeof replies>, n: number) => ({
  url: String(f.mock.calls[n][0]),
  headers: f.mock.calls[n][1]?.headers as Record<string, string>,
  body: JSON.parse(String(f.mock.calls[n][1]?.body)),
});

describe('syncWaitlistContact', () => {
  it('creates the user, then sends the confirmation template', async () => {
    const fetchImpl = replies([201, { identity: {} }], [200, { id: 'notif-1' }]);
    expect(await syncWaitlistContact(CONTACT, { ...CONFIG, fetchImpl })).toEqual({ success: true });

    const user = sent(fetchImpl, 0);
    expect(user.url).toBe('https://api.onesignal.com/apps/app-uuid/users');
    expect(user.headers.Authorization).toBe('Key os_v2_app_test');
    expect(user.body.identity).toEqual({ external_id: 'ada@example.com' });
    expect(user.body.subscriptions).toEqual([{ type: 'Email', token: 'ada@example.com', enabled: true }]);
    // Empty values are left out: OneSignal treats '' as "delete this tag".
    expect(user.body.properties.tags).toEqual({
      source: 'waitlist',
      first_name: 'Ada',
      last_name: 'Obi',
      profession: 'Designer',
    });

    const email = sent(fetchImpl, 1);
    expect(email.url).toBe('https://api.onesignal.com/notifications?c=email');
    expect(email.body).toMatchObject({
      app_id: 'app-uuid',
      template_id: WAITLIST_CONFIRMATION_TEMPLATE_ID,
      email_to: ['ada@example.com'],
      custom_data: { first_name: 'Ada' },
    });
  });

  it('uses the same idempotency key every time for the same address', async () => {
    const a = replies([200, {}], [200, { id: 'n' }]);
    const b = replies([200, {}], [200, { id: 'n' }]);
    await syncWaitlistContact(CONTACT, { ...CONFIG, fetchImpl: a });
    await syncWaitlistContact(CONTACT, { ...CONFIG, fetchImpl: b });
    const keyA = sent(a, 1).body.idempotency_key;
    expect(keyA).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(sent(b, 1).body.idempotency_key).toBe(keyA);
  });

  it('fails without calling OneSignal when it is not configured', async () => {
    const fetchImpl = replies([200, {}]);
    const result = await syncWaitlistContact(CONTACT, { appId: undefined, apiKey: 'k', fetchImpl });
    expect(result.success).toBe(false);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('reports a rejected key and does not try to send the email', async () => {
    const fetchImpl = replies([401, { errors: ['Access denied.'] }]);
    const result = await syncWaitlistContact(CONTACT, { ...CONFIG, fetchImpl });
    expect(result).toEqual({ success: false, error: 'create user: HTTP 401 ["Access denied."]' });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('treats a 200 that reached nobody as a failure', async () => {
    const fetchImpl = replies([200, {}], [200, { id: '', errors: ['All included players are not subscribed'] }]);
    const result = await syncWaitlistContact(CONTACT, { ...CONFIG, fetchImpl });
    expect(result.success).toBe(false);
    expect(!result.success && result.error).toContain('not subscribed');
  });

  it('reports a network failure instead of throwing', async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () => {
      throw new Error('fetch failed');
    });
    expect(await syncWaitlistContact(CONTACT, { ...CONFIG, fetchImpl })).toEqual({
      success: false,
      error: 'fetch failed',
    });
  });
});

describe('deterministicUuid', () => {
  it('is stable per input and different across inputs', () => {
    expect(deterministicUuid('a')).toBe(deterministicUuid('a'));
    expect(deterministicUuid('a')).not.toBe(deterministicUuid('b'));
  });
});
