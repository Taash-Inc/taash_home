import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { retryFailedSync, type FailedSync } from './waitlist-sync';

const SUPABASE = 'https://db.example.supabase.co';
const ONESIGNAL = 'https://api.onesignal.com';
const TOKEN = '0123456789abcdef'.repeat(4);
const SYNC: FailedSync = {
  id: 'row-1',
  email: 'ada@example.com',
  first_name: 'Ada',
  last_name: 'Obi',
  profession: 'Designer',
  monthly_income: null,
  retry_count: 0,
};

/**
 * Supabase and OneSignal as a retry sees them. `onWaitlist` answers each check of the waitlist
 * table in turn; 'error' makes the check fail. OneSignal has no user until one is created.
 */
function services(onWaitlist: boolean[] | 'error') {
  const requests: string[] = [];
  let checks = 0;
  const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status });
  const fetchImpl = vi.fn<typeof fetch>(async (input, init) => {
    const url = String(input);
    const method = init?.method ?? 'GET';
    requests.push(`${method} ${url}`);
    if (url.startsWith(`${SUPABASE}/rest/v1/waitlist?`) && method === 'GET') {
      if (onWaitlist === 'error') return json(500, { message: 'down' });
      const present = onWaitlist[Math.min(checks++, onWaitlist.length - 1)];
      return json(200, present ? [{ email: SYNC.email }] : []);
    }
    if (url.startsWith(`${SUPABASE}/rest/v1/email_preference_tokens?on_conflict`)) {
      return json(201, [{ token: TOKEN }]);
    }
    if (url.startsWith(`${SUPABASE}/rest/v1/`)) return new Response(null, { status: 204 });
    if (url.includes('/users/by/external_id/')) {
      return method === 'DELETE' ? json(202, {}) : json(404, { errors: [{ title: 'User not found' }] });
    }
    if (url === `${ONESIGNAL}/apps/app-uuid/users`) return json(201, { identity: {} });
    if (url.startsWith(`${ONESIGNAL}/notifications`)) return json(200, { id: 'notif-1' });
    return json(500, { unexpected: url });
  });
  vi.stubGlobal('fetch', fetchImpl);
  return requests;
}

beforeEach(() => {
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', SUPABASE);
  vi.stubEnv('SUPABASE_SERVICE_KEY', 'service-key');
  vi.stubEnv('ONESIGNAL_APP_ID', 'app-uuid');
  vi.stubEnv('ONESIGNAL_API_KEY', 'os_v2_app_test');
  vi.stubEnv('SLACK_WEBHOOK_URL', '');
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('retryFailedSync', () => {
  it('never puts back someone who left the waitlist before the retry reached them', async () => {
    const requests = services([false]);
    expect(await retryFailedSync(SYNC)).toBe('left');
    expect(requests.filter((r) => r.includes(ONESIGNAL))).toEqual([]);
    expect(requests.filter((r) => r.includes('/email_preference_tokens'))).toEqual([]);
    expect(requests).toContain(`DELETE ${SUPABASE}/rest/v1/failed_onesignal_syncs?id=eq.row-1`);
  });

  it('finishes removing someone who left while the retry was running', async () => {
    const requests = services([true, false]);
    expect(await retryFailedSync(SYNC)).toBe('left');
    const created = requests.indexOf(`POST ${ONESIGNAL}/apps/app-uuid/users`);
    const removed = requests.indexOf(`DELETE ${ONESIGNAL}/apps/app-uuid/users/by/external_id/ada%40example.com`);
    expect(created).toBeGreaterThan(-1);
    expect(removed).toBeGreaterThan(created);
    for (const table of ['waitlist', 'waitlist_backup', 'failed_onesignal_syncs', 'email_preference_tokens']) {
      expect(requests).toContain(`DELETE ${SUPABASE}/rest/v1/${table}?email=eq.ada%40example.com`);
    }
  });

  it('syncs someone still on the waitlist and clears their parked row', async () => {
    const requests = services([true, true]);
    expect(await retryFailedSync(SYNC)).toBe('synced');
    expect(requests).toContain(`POST ${ONESIGNAL}/notifications?c=email`);
    expect(requests).toContain(`DELETE ${SUPABASE}/rest/v1/failed_onesignal_syncs?id=eq.row-1`);
    expect(requests.some((r) => r.startsWith(`DELETE ${ONESIGNAL}`))).toBe(false);
  });

  it('keeps the row for the next night when the waitlist cannot be checked', async () => {
    const requests = services('error');
    expect(await retryFailedSync(SYNC)).toBe('failed');
    expect(requests.filter((r) => r.includes(ONESIGNAL))).toEqual([]);
    expect(requests).toContain(`PATCH ${SUPABASE}/rest/v1/failed_onesignal_syncs?id=eq.row-1`);
  });
});
