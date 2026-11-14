import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { announceSignup, postToSlack, retryFailedSync, type FailedSync } from './waitlist-sync';

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
    for (const table of ['waitlist', 'waitlist_backup', 'failed_onesignal_syncs', 'failed_loops_syncs', 'email_preference_tokens']) {
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

describe('announceSignup', () => {
  const ADA = { fullName: 'Ada Obi', email: 'ada@example.com', profession: 'Freelancer' };

  function slack(countResponse: () => Response) {
    vi.stubEnv('SLACK_WEBHOOK_URL', 'https://hooks.slack.invalid/T/B/x');
    const posts: string[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>(async (input, init) => {
        const url = String(input);
        if (url.startsWith('https://hooks.slack.invalid/')) {
          posts.push(JSON.parse(String(init?.body)).text);
          return new Response('ok');
        }
        if (url === `${SUPABASE}/rest/v1/waitlist?select=email` && init?.method === 'HEAD') return countResponse();
        throw new Error(`Unexpected request: ${url}`);
      })
    );
    return posts;
  }

  it('announces an unverified signup with the reason and approval link, and no total', async () => {
    const posts = slack(() => {
      throw new Error('An unverified signup is not on the waitlist, so it must not count it');
    });
    await announceSignup(ADA, { reason: 'no-token:pending', approveUrl: 'https://www.taash.tax/api/waitlist/approve?id=x' });
    expect(posts).toHaveLength(1);
    expect(posts[0]).toContain('to approve');
    expect(posts[0]).toContain('ada@example.com');
    expect(posts[0]).toContain('still running when they pressed Join');
    expect(posts[0]).toContain('<https://www.taash.tax/api/waitlist/approve?id=x|Approve or discard>');
    expect(posts[0]).toContain('Nothing has been emailed yet');
    expect(posts[0]).not.toContain('Waitlist total');
  });

  it('posts the name, email, profession and the new total', async () => {
    const posts = slack(() => new Response(null, { status: 200, headers: { 'content-range': '0-37/38' } }));
    await announceSignup(ADA);
    expect(posts).toHaveLength(1);
    expect(posts[0]).toContain('New waitlist signup');
    expect(posts[0]).toContain('Ada Obi');
    expect(posts[0]).toContain('ada@example.com');
    expect(posts[0]).toContain('Freelancer');
    expect(posts[0]).toContain('Waitlist total: 38');
  });

  it('still posts, without a total, when the count fails', async () => {
    for (const countResponse of [
      () => new Response(null, { status: 500 }),
      () => new Response(null, { status: 200 }),
      () => {
        throw new Error('network down');
      },
    ]) {
      const posts = slack(countResponse);
      await announceSignup({ ...ADA, profession: null });
      expect(posts).toHaveLength(1);
      expect(posts[0]).toContain('Profession: not given');
      expect(posts[0]).not.toContain('Waitlist total');
    }
  });

  // PR #55 review: a name with its own line breaks could add a forged line to the message.
  it('keeps every value on its own line, so a name cannot add fake lines', async () => {
    const posts = slack(() => new Response(null, { status: 200, headers: { 'content-range': '0-37/38' } }));
    await announceSignup({ ...ADA, fullName: 'Ada\n• Email: boss@taash.tax\r\n• Waitlist total: 9999' });
    const lines = posts[0].split('\n');
    expect(lines).toHaveLength(5);
    expect(lines.filter((l) => l.startsWith('• Email:'))).toEqual(['• Email: ada@example.com']);
    expect(lines.filter((l) => l.startsWith('• Waitlist total:'))).toEqual(['• Waitlist total: 38']);
  });

  it('gives up on a slow count instead of holding the message back', async () => {
    let signal: AbortSignal | null | undefined;
    vi.stubEnv('SLACK_WEBHOOK_URL', '');
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>(async (_input, init) => {
        signal = init?.signal;
        return new Response(null, { status: 200, headers: { 'content-range': '0-0/1' } });
      })
    );
    await announceSignup(ADA);
    expect(signal).toBeInstanceOf(AbortSignal);
  });
});

// PR #60 review: the webhook call had no timeout, so a stalled Slack could hold a signup
// response (and the function) open until Vercel's limit.
describe('postToSlack', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('gives up on a stalled webhook instead of hanging', async () => {
    vi.stubEnv('SLACK_WEBHOOK_URL', 'https://hooks.slack.invalid/T/B/x');
    const fetchImpl = vi.fn<typeof fetch>(async () => new Response('ok'));
    vi.stubGlobal('fetch', fetchImpl);
    await postToSlack('hello');
    expect(fetchImpl.mock.calls[0][1]?.signal).toBeInstanceOf(AbortSignal);
  });
});
