import { describe, expect, it, vi } from 'vitest';
import {
  UNSUBSCRIBE_HREF,
  WAITLIST_CONFIRMATION_TEMPLATE_ID,
  addWaitlistUser,
  deleteUser,
  deterministicUuid,
  getEmailPreference,
  setEmailPreference,
  setUserTags,
  syncWaitlistContact,
  withPreferencesLink,
  type OneSignalContact,
} from './onesignal';

const TOKEN = '0123456789abcdef'.repeat(4);
const CONTACT: OneSignalContact = {
  email: 'ada@example.com',
  firstName: 'Ada',
  lastName: 'Obi',
  profession: 'Designer',
  monthlyIncome: null,
  preferenceToken: TOKEN,
};
const CONFIG = { appId: 'app-uuid', apiKey: 'os_v2_app_test' };
const USER_URL = 'https://api.onesignal.com/apps/app-uuid/users/by/external_id/ada%40example.com';

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
  method: f.mock.calls[n][1]?.method,
  headers: f.mock.calls[n][1]?.headers as Record<string, string>,
  body: f.mock.calls[n][1]?.body === undefined ? undefined : JSON.parse(String(f.mock.calls[n][1]?.body)),
});

/** A OneSignal user as View User returns it. */
function user({ enabled = true, tags = {} }: { enabled?: boolean; tags?: Record<string, string> } = {}) {
  return {
    properties: { tags: { source: 'waitlist', ...tags } },
    subscriptions: [
      { id: 'push-1', type: 'ChromePush', token: 'abc', enabled: false },
      { id: 'sub-1', type: 'Email', token: 'ada@example.com', enabled },
    ],
  };
}

const NOT_FOUND: [number, Record<string, unknown>] = [404, { errors: [{ title: 'User not found' }] }];

describe('syncWaitlistContact', () => {
  it('creates the user, then sends the confirmation template', async () => {
    const fetchImpl = replies(NOT_FOUND, [201, { identity: {} }], [200, { id: 'notif-1' }]);
    expect(await syncWaitlistContact(CONTACT, { ...CONFIG, fetchImpl })).toEqual({ success: true });

    expect(sent(fetchImpl, 0)).toMatchObject({ url: USER_URL, method: 'GET' });
    const user = sent(fetchImpl, 1);
    expect(user.url).toBe('https://api.onesignal.com/apps/app-uuid/users');
    expect(user.headers.Authorization).toBe('Key os_v2_app_test');
    expect(user.body.identity).toEqual({ external_id: 'ada@example.com' });
    expect(user.body.subscriptions).toEqual([{ type: 'Email', token: 'ada@example.com', enabled: true }]);
    // Empty values are left out: OneSignal treats '' as "delete this tag". last_name is not
    // sent at all: the Free plan's 6 tags go to pref_token and email_scope instead.
    expect(user.body.properties.tags).toEqual({
      source: 'waitlist',
      first_name: 'Ada',
      profession: 'Designer',
      pref_token: TOKEN,
    });

    const email = sent(fetchImpl, 2);
    expect(email.url).toBe('https://api.onesignal.com/notifications?c=email');
    expect(email.body).toMatchObject({
      app_id: 'app-uuid',
      template_id: WAITLIST_CONFIRMATION_TEMPLATE_ID,
      email_to: ['ada@example.com'],
      // The token rides on the message too, for the Unsubscribe link of this very email.
      custom_data: { first_name: 'Ada', pref_token: TOKEN },
    });
  });

  it('leaves a user who is already in OneSignal untouched, so a retry cannot resubscribe them', async () => {
    // The retry case: the first attempt created them, then they unsubscribed before it re-ran.
    const fetchImpl = replies([200, user({ enabled: false })], [200, { id: 'notif-1' }]);
    expect(await syncWaitlistContact(CONTACT, { ...CONFIG, fetchImpl })).toEqual({ success: true });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(sent(fetchImpl, 0)).toMatchObject({ url: USER_URL, method: 'GET' });
    expect(sent(fetchImpl, 1).url).toBe('https://api.onesignal.com/notifications?c=email');
  });

  it('uses the same idempotency key every time for the same address', async () => {
    const a = replies(NOT_FOUND, [201, {}], [200, { id: 'n' }]);
    const b = replies([200, user()], [200, { id: 'n' }]);
    await syncWaitlistContact(CONTACT, { ...CONFIG, fetchImpl: a });
    await syncWaitlistContact(CONTACT, { ...CONFIG, fetchImpl: b });
    const keyA = sent(a, 2).body.idempotency_key;
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
    expect(result).toEqual({ success: false, error: 'view user: HTTP 401 ["Access denied."]' });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('reports a failed create and does not try to send the email', async () => {
    const fetchImpl = replies(NOT_FOUND, [400, { errors: ['bad request'] }]);
    const result = await syncWaitlistContact(CONTACT, { ...CONFIG, fetchImpl });
    expect(result).toEqual({ success: false, error: 'create user: HTTP 400 ["bad request"]' });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('treats a 200 that reached nobody as a failure', async () => {
    const fetchImpl = replies(NOT_FOUND, [201, {}], [200, { id: '', errors: ['All included players are not subscribed'] }]);
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

describe('addWaitlistUser', () => {
  it('creates a missing user without sending any email', async () => {
    const fetchImpl = replies(NOT_FOUND, [201, { identity: {} }]);
    expect(await addWaitlistUser(CONTACT, { ...CONFIG, fetchImpl })).toEqual({ success: true });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(sent(fetchImpl, 1).url).toBe('https://api.onesignal.com/apps/app-uuid/users');
  });

  it('sends nothing to a user who already exists, subscribed or not', async () => {
    for (const enabled of [true, false]) {
      const fetchImpl = replies([200, user({ enabled, tags: { email_scope: 'invite_only' } })]);
      expect(await addWaitlistUser(CONTACT, { ...CONFIG, fetchImpl })).toEqual({ success: true });
      expect(fetchImpl).toHaveBeenCalledTimes(1);
      expect(sent(fetchImpl, 0).method).toBe('GET');
    }
  });

  it('reports a failure instead of throwing', async () => {
    const fetchImpl = replies([403, { errors: ['Forbidden'] }]);
    const result = await addWaitlistUser(CONTACT, { ...CONFIG, fetchImpl });
    expect(result.success).toBe(false);
  });
});

describe('deterministicUuid', () => {
  it('is stable per input and different across inputs', () => {
    expect(deterministicUuid('a')).toBe(deterministicUuid('a'));
    expect(deterministicUuid('a')).not.toBe(deterministicUuid('b'));
  });
});

describe('getEmailPreference', () => {
  it('reads "all" from a subscribed, untagged user, looked up by URL-encoded email', async () => {
    const fetchImpl = replies([200, user()]);
    expect(await getEmailPreference('ada@example.com', { ...CONFIG, fetchImpl })).toEqual({
      success: true,
      preference: 'all',
    });
    expect(sent(fetchImpl, 0)).toMatchObject({ url: USER_URL, method: 'GET', body: undefined });
  });

  it('reads "invite_only" from the email_scope tag', async () => {
    const fetchImpl = replies([200, user({ tags: { email_scope: 'invite_only' } })]);
    const result = await getEmailPreference('ada@example.com', { ...CONFIG, fetchImpl });
    expect(result).toEqual({ success: true, preference: 'invite_only' });
  });

  it('reads "none" from a disabled email subscription, whatever the tags say', async () => {
    const fetchImpl = replies([200, user({ enabled: false, tags: { email_scope: 'invite_only' } })]);
    const result = await getEmailPreference('ada@example.com', { ...CONFIG, fetchImpl });
    expect(result).toEqual({ success: true, preference: 'none' });
  });

  it('fails for a user OneSignal does not have', async () => {
    const fetchImpl = replies([404, { errors: [{ title: 'User not found' }] }]);
    const result = await getEmailPreference('ada@example.com', { ...CONFIG, fetchImpl });
    expect(result.success).toBe(false);
    expect(!result.success && result.error).toContain('HTTP 404');
  });

  it('fails for a user with no email subscription', async () => {
    const fetchImpl = replies([200, { properties: { tags: {} }, subscriptions: [] }]);
    const result = await getEmailPreference('ada@example.com', { ...CONFIG, fetchImpl });
    expect(result).toEqual({ success: false, error: 'view user: no email subscription' });
  });
});

describe('setEmailPreference', () => {
  it('unsubscribing turns the email subscription off and leaves the tags alone', async () => {
    const fetchImpl = replies([200, user()], [200, {}]);
    expect(await setEmailPreference('ada@example.com', 'none', { ...CONFIG, fetchImpl })).toEqual({
      success: true,
    });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(sent(fetchImpl, 1)).toMatchObject({
      url: 'https://api.onesignal.com/apps/app-uuid/subscriptions/sub-1',
      method: 'PATCH',
      body: { subscription: { enabled: false } },
    });
  });

  it('"invite only" from unsubscribed sets the tag before turning email back on', async () => {
    const fetchImpl = replies([200, user({ enabled: false })], [202, {}], [200, {}]);
    await setEmailPreference('ada@example.com', 'invite_only', { ...CONFIG, fetchImpl });
    expect(sent(fetchImpl, 1)).toMatchObject({
      url: USER_URL,
      method: 'PATCH',
      body: { properties: { tags: { email_scope: 'invite_only' } } },
    });
    expect(sent(fetchImpl, 2)).toMatchObject({
      url: 'https://api.onesignal.com/apps/app-uuid/subscriptions/sub-1',
      body: { subscription: { enabled: true } },
    });
  });

  it('"all" deletes the tag and leaves an email that is already on alone', async () => {
    const fetchImpl = replies([200, user({ tags: { email_scope: 'invite_only' } })], [202, {}]);
    await setEmailPreference('ada@example.com', 'all', { ...CONFIG, fetchImpl });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(sent(fetchImpl, 1).body).toEqual({ properties: { tags: { email_scope: '' } } });
  });

  it('does nothing more when the choice is already in place', async () => {
    const fetchImpl = replies([200, user({ enabled: false })]);
    await setEmailPreference('ada@example.com', 'none', { ...CONFIG, fetchImpl });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('reports a rejected change, and does not turn email on after a failed tag', async () => {
    const fetchImpl = replies([200, user({ enabled: false })], [500, { errors: ['boom'] }]);
    const result = await setEmailPreference('ada@example.com', 'invite_only', { ...CONFIG, fetchImpl });
    expect(result).toEqual({ success: false, error: 'update tags: HTTP 500 ["boom"]' });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });
});

describe('deleteUser', () => {
  it('deletes the user by URL-encoded email', async () => {
    const fetchImpl = replies([202, {}]);
    expect(await deleteUser('ada@example.com', { ...CONFIG, fetchImpl })).toEqual({ success: true });
    expect(sent(fetchImpl, 0)).toMatchObject({ url: USER_URL, method: 'DELETE' });
  });

  it('counts a user who is already gone as deleted', async () => {
    const fetchImpl = replies([404, { errors: [] }]);
    expect(await deleteUser('ada@example.com', { ...CONFIG, fetchImpl })).toEqual({ success: true });
  });

  it('reports any other failure', async () => {
    const fetchImpl = replies([503, { errors: ['unavailable'] }]);
    expect((await deleteUser('ada@example.com', { ...CONFIG, fetchImpl })).success).toBe(false);
  });
});

describe('setUserTags', () => {
  it('sends tags and nothing else, so it can never resubscribe anyone', async () => {
    const fetchImpl = replies([202, {}]);
    await setUserTags('ada@example.com', { pref_token: TOKEN, last_name: '' }, { ...CONFIG, fetchImpl });
    expect(sent(fetchImpl, 0)).toEqual({
      url: USER_URL,
      method: 'PATCH',
      headers: expect.any(Object),
      body: { properties: { tags: { pref_token: TOKEN, last_name: '' } } },
    });
  });
});

describe('withPreferencesLink', () => {
  const footer = (href: string) =>
    `<p>You're receiving this because you joined the Taash waitlist.</p><p><a href="${href}" style="color:#A2D2FF;">Unsubscribe</a> &middot; <a href="https://www.taash.tax/privacy" style="color:#A2D2FF;">Privacy Policy</a></p>`;

  it.each(['{{unsubscribe_link}}', '[unsubscribe_url]'])('points %s at the preferences page', (old) => {
    const result = withPreferencesLink(footer(old));
    expect(result?.changed).toBe(true);
    expect(result?.html).toBe(
      footer(UNSUBSCRIBE_HREF).replace(`href="${UNSUBSCRIBE_HREF}"`, `href="${UNSUBSCRIBE_HREF}" data-disable-tracking="true"`)
    );
  });

  it('leaves a template that already points at the page alone', () => {
    const once = withPreferencesLink(footer('[unsubscribe_url]'))!.html;
    expect(withPreferencesLink(once)).toEqual({ html: once, changed: false });
  });

  it('refuses to guess when there is no Unsubscribe link, or more than one', () => {
    expect(withPreferencesLink('<p>No link here</p>')).toBeNull();
    expect(withPreferencesLink(footer('[unsubscribe_url]') + footer('{{unsubscribe_link}}'))).toBeNull();
  });

  it('builds an href that is safe inside an attribute and always has a working fallback', () => {
    expect(UNSUBSCRIBE_HREF).not.toContain('"');
    expect(UNSUBSCRIBE_HREF).toContain('https://www.taash.tax/email-preferences?t={{ message.custom_data.pref_token }}');
    expect(UNSUBSCRIBE_HREF).toContain('https://www.taash.tax/email-preferences?t={{ pref_token }}');
    expect(UNSUBSCRIBE_HREF).toContain('{% else %}[unsubscribe_url]{% endif %}');
  });
});
