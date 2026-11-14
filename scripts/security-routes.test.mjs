import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { test } from 'node:test';
import ts from 'typescript';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const nextServer = require('next/server');

// Compile the real handlers with the existing compiler API. Each test gets its own
// environment and provider stubs; no real database, email or Slack call can run.
function handler(file, { env = {}, providers = {}, fetchImpl } = {}) {
  const callbacks = [];
  const cache = new Map();
  function load(filename) {
    if (cache.has(filename)) return cache.get(filename).exports;
    const loaded = { exports: {} };
    cache.set(filename, loaded);
    const code = ts.transpileModule(readFileSync(filename, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText;
    vm.runInNewContext(code, {
      module: loaded, exports: loaded.exports,
      require(id) {
        if (id === 'next/server') return { ...nextServer, after: (fn) => callbacks.push(fn) };
        if (Object.hasOwn(providers, id)) return providers[id];
        if (id.startsWith('@/')) return load(path.join(root, `${id.slice(2)}.ts`));
        throw new Error(`Unexpected dependency: ${id}`);
      },
      process: { env }, console: { error() {}, warn() {}, info() {} },
      fetch: fetchImpl ?? (() => { throw new Error('Unexpected network call'); }),
      TextDecoder, Uint8Array, AbortSignal, URLSearchParams, URL,
    }, { filename });
    return loaded.exports;
  }
  return { ...load(path.join(root, file)), callbacks };
}

const request = (body, headers = {}) => new nextServer.NextRequest('https://www.taash.tax/api/test', {
  method: 'POST', headers: { 'content-type': 'application/json', ...headers },
  body: typeof body === 'string' ? body : JSON.stringify(body),
});
const signup = {
  fullName: 'Ada Obi', email: 'Ada@example.invalid', profession: 'Freelancer',
  monthlyIncome: null, turnstileToken: 'dummy-captcha',
};

function waitlist(status = 201, errorBody, { captcha = true, pendingResult } = {}) {
  const writes = [];
  const slack = [];
  const announced = [];
  const pending = [];
  const limitAlerts = [];
  let captchas = 0;
  const route = handler('app/api/waitlist/route.ts', {
    env: { NEXT_PUBLIC_SUPABASE_URL: 'https://db.example.invalid', SUPABASE_SERVICE_KEY: 'dummy-key' },
    providers: {
      '@/lib/turnstile': { verifyTurnstile: async () => { captchas++; return captcha; } },
      '@/lib/signing': { clientIp: () => '102.89.1.2', hashIp: () => 'ip-hash', refFor: () => 'ref123' },
      '@/lib/waitlist-pending': {
        // Never settles: a 429 must not wait on the Slack alert.
        alertRateLimit: (scope) => { limitAlerts.push(scope); return new Promise(() => {}); },
        savePending: async (row) => { pending.push(row); return pendingResult ?? { saved: true, id: 'pending-1' }; },
        approveUrl: (id) => `https://www.taash.tax/api/waitlist/approve?id=${id}&exp=1&sig=s`,
      },
      '@/lib/waitlist-sync': {
        syncSignup: async () => { throw new Error('Must run after response'); },
        postToSlack: async (text) => { slack.push(text); },
        announceSignup: async (signup, unverified) => { announced.push(unverified ? { signup, unverified } : signup); },
      },
    },
    fetchImpl: async (url, init) => {
      writes.push({ url, init });
      return new Response(errorBody === undefined ? null : JSON.stringify(errorBody), { status });
    },
  });
  return { ...route, writes, slack, announced, pending, limitAlerts, captchas: () => captchas };
}

test('retry GET and POST deny missing, blank and wrong secrets before reading the queue', async () => {
  for (const secret of [undefined, '', '   ', 'correct-secret']) {
    const route = handler('app/api/onesignal-retry/route.ts', {
      env: { CRON_SECRET: secret },
      providers: { '@/lib/waitlist-sync': {
        getFailedSyncs() { throw new Error('Unauthorized caller reached queue'); },
      } },
    });
    for (const method of ['GET', 'POST']) {
      for (const authorization of ['', 'Bearer wrong', 'correct-secret']) {
        const response = await route[method](request({}, { authorization }));
        assert.equal(response.status, 401);
      }
    }
  }
});

test('retry accepts the configured bearer secret', async () => {
  let reads = 0;
  const route = handler('app/api/onesignal-retry/route.ts', {
    env: { CRON_SECRET: 'correct-secret' },
    providers: { '@/lib/waitlist-sync': {
      getFailedSyncs: async () => { reads++; return { data: [] }; },
    } },
  });
  const response = await route.GET(request({}, { authorization: 'Bearer correct-secret' }));
  assert.equal(response.status, 200);
  assert.equal(reads, 1);
});

test('signup returns the same public response for a new or existing address', async () => {
  const fresh = waitlist();
  const duplicate = waitlist(409, { code: '23505', details: 'Private signup details' });
  const response = await fresh.POST(request(signup));
  const repeated = await duplicate.POST(request(signup));
  assert.equal(response.status, 201);
  assert.equal(repeated.status, 201);
  assert.deepEqual(await response.json(), await repeated.json());
  assert.equal(fresh.writes[0].init.headers.Prefer, 'return=minimal');
  assert.equal(JSON.parse(fresh.writes[0].init.body).email, 'ada@example.invalid');
  assert.equal(fresh.callbacks.length, 2);
  assert.equal(duplicate.callbacks.length, 0);
});

test('signup accepts a first name and email without profession or income', async () => {
  for (const extra of [{}, { profession: null }, { profession: '' }]) {
    const route = waitlist();
    const { profession: _p, monthlyIncome: _m, ...minimal } = signup;
    const response = await route.POST(request({ ...minimal, ...extra }));
    assert.equal(response.status, 201);
    const row = JSON.parse(route.writes[0].init.body);
    assert.equal(row.profession, null);
    assert.equal(row.monthly_income, null);
    assert.equal(route.callbacks.length, 2);
  }
});

test('signup still requires a name and rejects a non-string profession', async () => {
  const route = waitlist();
  assert.equal((await route.POST(request({ ...signup, fullName: '' }))).status, 400);
  assert.equal((await route.POST(request({ ...signup, profession: 42 }))).status, 400);
  assert.equal((await route.POST(request({ ...signup, profession: 'a'.repeat(101) }))).status, 400);
  assert.equal(route.writes.length, 0);
});

test('a signup that cannot be saved alerts Slack, with the details, after the response', async () => {
  const route = waitlist(500, { code: 'XX000' });
  const response = await route.POST(request(signup));
  assert.equal(response.status, 500);
  assert.equal(route.slack.length, 0, 'the alert must not delay the response');
  assert.equal(route.callbacks.length, 1);
  await route.callbacks[0]();
  assert.equal(route.slack.length, 1);
  assert.match(route.slack[0], /ada@example\.invalid/);
  assert.match(route.slack[0], /Ada Obi/);
  assert.match(route.slack[0], /HTTP 500/);
});

test('a duplicate signup does not alert Slack', async () => {
  const route = waitlist(409, { code: '23505' });
  assert.equal((await route.POST(request(signup))).status, 201);
  assert.equal(route.callbacks.length, 0);
});

test('a new signup is announced on Slack after the response, with the cleaned-up details', async () => {
  const route = waitlist();
  assert.equal((await route.POST(request(signup))).status, 201);
  assert.equal(route.announced.length, 0, 'the announcement must not delay the response');
  await route.callbacks[1]();
  // The route runs in its own VM context, so compare plain data rather than object identity.
  assert.deepEqual(JSON.parse(JSON.stringify(route.announced)), [
    { fullName: 'Ada Obi', email: 'ada@example.invalid', profession: 'Freelancer', monthlyIncome: null },
  ]);
});

// PR #55 review: line breaks in a name could add forged lines to the Slack alerts.
test('signup collapses line breaks in the name before saving or alerting', async () => {
  const injected = { ...signup, fullName: 'Ada\n• Email: boss@taash.tax\r\n\t• Error: none' };
  const saved = waitlist();
  assert.equal((await saved.POST(request(injected))).status, 201);
  const row = JSON.parse(saved.writes[0].init.body);
  assert.equal(row.full_name, 'Ada • Email: boss@taash.tax • Error: none');
  await saved.callbacks[1]();
  assert.doesNotMatch(saved.announced[0].fullName, /[\r\n\t]/);

  const failed = waitlist(500, { code: 'XX000' });
  await failed.POST(request(injected));
  await failed.callbacks[0]();
  const lines = failed.slack[0].split('\n');
  assert.deepEqual(lines.filter((l) => l.startsWith('• Email:')), ['• Email: ada@example.invalid']);
  assert.equal(lines.filter((l) => l.startsWith('• Error:')).length, 1);
});

test('a signup that cannot be saved is not announced as a new signup', async () => {
  const route = waitlist(500, { code: 'XX000' });
  await route.POST(request(signup));
  for (const callback of route.callbacks) await callback();
  assert.equal(route.announced.length, 0);
});

test('signup accepts only the profession choices the form offers', async () => {
  for (const profession of ['Freelancer', 'Content creator', 'Small business', 'Salary earner', 'Other']) {
    assert.equal((await waitlist().POST(request({ ...signup, profession }))).status, 201, profession);
  }
  const route = waitlist();
  for (const profession of ['Designer', "'; DROP TABLE waitlist; --", 'freelancer ']) {
    assert.equal((await route.POST(request({ ...signup, profession }))).status, 400, profession);
  }
  assert.equal(route.writes.length, 0);
});

test('signup rejects malformed shapes, long fields and oversized bodies before provider calls', async () => {
  const route = waitlist();
  for (const body of [
    'null', '[]', '{bad json', { ...signup, fullName: {} }, { ...signup, email: 42 },
    { ...signup, monthlyIncome: [] }, { ...signup, turnstileToken: {} },
    { ...signup, email: 'a'.repeat(256) }, { ...signup, turnstileToken: 'a'.repeat(2049) },
  ]) {
    assert.equal((await route.POST(request(body))).status, 400);
  }
  assert.equal((await route.POST(request({ ...signup, padding: 'a'.repeat(8192) }))).status, 413);
  assert.equal((await route.POST(request(signup, { 'content-type': 'text/plain' }))).status, 415);
  assert.equal(route.writes.length, 0);
  assert.equal(route.captchas(), 0);
});

test('preference changes require a valid secret token and action before lookup', async () => {
  const route = handler('app/api/email-preferences/route.ts', {
    providers: {
      '@/lib/email-preferences': {
        isPreferenceToken: (token) => typeof token === 'string' && /^[0-9a-f]{64}$/.test(token),
        preferencesConfig() { throw new Error('Invalid caller reached token lookup'); },
      },
      '@/lib/onesignal': {}, '@/lib/waitlist-sync': {},
    },
  });
  for (const body of ['null', '{bad', [], { token: 'guessed', action: 'leave' },
    { token: 'a'.repeat(64), action: 'delete_everyone' }]) {
    assert.equal((await route.POST(request(body))).status, 400);
  }
  assert.equal((await route.POST(request({ padding: 'a'.repeat(8192) }))).status, 413);
});

function streamed(bytes, chunkSize = 1) {
  let offset = 0;
  return new Request('https://example.invalid', {
    method: 'POST', headers: { 'content-type': 'application/json' }, duplex: 'half',
    body: new ReadableStream({
      pull(controller) {
        if (offset === bytes.length) return controller.close();
        const end = Math.min(bytes.length, offset + chunkSize);
        controller.enqueue(bytes.slice(offset, end));
        offset = end;
      },
    }),
  });
}

test('body limits count actual bytes across chunked and split UTF-8 input', async () => {
  const { readJsonObject } = handler('lib/request-json.ts');
  const utf8 = new TextEncoder();
  const unicode = utf8.encode(JSON.stringify({ x: 'é'.repeat(4080) }));
  assert.equal((await readJsonObject(streamed(unicode))).x, 'é'.repeat(4080));
  const exact = utf8.encode(JSON.stringify({ x: 'a'.repeat(8184) }));
  assert.equal(exact.length, 8192);
  assert.equal((await readJsonObject(streamed(exact, 137))).x.length, 8184);
  const oversized = utf8.encode(JSON.stringify({ x: 'a'.repeat(8185) }));
  await assert.rejects(readJsonObject(streamed(oversized, 137)), (error) => error.status === 413);
});

test('invalid UTF-8 and scalar bodies cannot pass the JSON object parser', async () => {
  const { readJsonObject } = handler('lib/request-json.ts');
  const utf8 = new TextEncoder();
  for (const text of ['', 'null', 'false', 'true', '1', '0', '-1', '[]', '"text"', '{"x":NaN}']) {
    await assert.rejects(readJsonObject(streamed(utf8.encode(text))), (error) => error.status === 400);
  }
  const invalidUtf8 = new Uint8Array([123, 34, 120, 34, 58, 34, 255, 34, 125]);
  await assert.rejects(readJsonObject(streamed(invalidUtf8)), (error) => error.status === 400);
});

// 13 Nov 2026: a visitor's Cloudflare check never finished, the form waited forever, and their
// details never reached us. A signup without a passing check is now held for approval.
test('a signup without a token is held for approval, not turned away', async () => {
  const route = waitlist();
  const { turnstileToken: _t, ...noToken } = signup;
  const response = await route.POST(request({ ...noToken, check: 'pending' }));
  assert.equal(response.status, 201);
  assert.deepEqual(await response.json(), { message: 'Successfully joined the waitlist!' });
  assert.equal(route.captchas(), 0);
  assert.equal(route.writes.length, 0, 'nothing is written to the real waitlist');
  assert.deepEqual(JSON.parse(JSON.stringify(route.pending)), [{
    fullName: 'Ada Obi', email: 'ada@example.invalid', profession: 'Freelancer', monthlyIncome: null,
    reason: 'no-token:pending', ipHash: 'ip-hash',
  }]);
  assert.equal(route.callbacks.length, 1, 'only the Slack approval message; no welcome email');
  await route.callbacks[0]();
  assert.equal(route.announced[0].unverified.reason, 'no-token:pending');
  assert.match(route.announced[0].unverified.approveUrl, /approve\?id=pending-1/);
});

test('an unknown or injected check value is logged as unknown', async () => {
  const route = waitlist();
  await route.POST(request({ ...signup, turnstileToken: null, check: 'pending\n• Email: boss@taash.tax' }));
  assert.equal(route.pending[0].reason, 'no-token:unknown');
  assert.equal((await waitlist().POST(request({ ...signup, check: 42 }))).status, 400);
});

test('a token Cloudflare rejects is held for approval too', async () => {
  const route = waitlist(201, undefined, { captcha: false });
  assert.equal((await route.POST(request(signup))).status, 201);
  assert.equal(route.captchas(), 1);
  assert.equal(route.writes.length, 0);
  assert.equal(route.pending[0].reason, 'rejected');
});

test('a filled-in hidden field is answered like a signup but nothing is saved or sent', async () => {
  const route = waitlist();
  const response = await route.POST(request({ ...signup, extra_info: 'http://spam.example' }));
  assert.equal(response.status, 201);
  assert.deepEqual(await response.json(), { message: 'Successfully joined the waitlist!' });
  assert.equal(route.writes.length + route.pending.length + route.callbacks.length + route.captchas(), 0);
});

// PR #60 review: the limit alert was awaited before the 429, and Slack had no timeout.
test('over the limit, the visitor is told at once and Slack is alerted afterwards', async () => {
  const route = waitlist(201, undefined, { pendingResult: { saved: false, rateLimited: 'ip' } });
  const response = await route.POST(request({ ...signup, turnstileToken: null, check: 'error' }));
  assert.equal(response.status, 429);
  assert.match((await response.json()).error, /try again/i);
  assert.equal(route.limitAlerts.length, 0, 'the alert must not delay the response');
  assert.equal(route.callbacks.length, 1);
  void route.callbacks[0]();
  assert.deepEqual(route.limitAlerts, ['ip']);
});

test('verified signups never touch the pending table', async () => {
  const route = waitlist(201, undefined, { pendingResult: { saved: false, rateLimited: 'global' } });
  assert.equal((await route.POST(request(signup))).status, 201);
  assert.equal(route.pending.length, 0);
  assert.equal(route.writes.length, 1);
});

test('a repeated unverified signup is not announced twice', async () => {
  const route = waitlist(201, undefined, { pendingResult: { saved: false, duplicate: true } });
  assert.equal((await route.POST(request({ ...signup, turnstileToken: null }))).status, 201);
  assert.equal(route.callbacks.length, 0);
});

test('an unverified signup that cannot be saved alerts Slack with the details', async () => {
  const route = waitlist(201, undefined, { pendingResult: { saved: false, error: 'Pending insert failed: HTTP 404 (42P01)' } });
  assert.equal((await route.POST(request({ ...signup, turnstileToken: null, check: 'pending' }))).status, 500);
  await route.callbacks[0]();
  assert.match(route.slack[0], /could not be saved\* \(unverified, no-token:pending\)/);
  assert.match(route.slack[0], /ada@example\.invalid/);
  assert.match(route.slack[0], /42P01/);
});

function clientReport() {
  const slack = [];
  const route = handler('app/api/client-report/route.ts', {
    providers: { '@/lib/waitlist-sync': { postToSlack: async (text) => { slack.push(text); } } },
  });
  return { ...route, slack };
}
const fromSite = { origin: 'https://www.taash.tax', host: 'www.taash.tax' };

test('browser reports are only accepted from our own pages, in the expected shape', async () => {
  const route = clientReport();
  const report = { type: 'signup-failed', reason: 'network', placement: 'hero', path: '/' };
  assert.equal((await route.POST(request(report))).status, 403);
  assert.equal((await route.POST(request(report, { origin: 'https://evil.example', host: 'www.taash.tax' }))).status, 403);
  for (const body of [{ ...report, type: 'anything' }, { ...report, reason: '' }, { ...report, placement: 'footer' },
    { ...report, path: 'https://evil.example' }, { ...report, reason: 42 }]) {
    assert.equal((await route.POST(request(body, fromSite))).status, 400);
  }
  assert.equal((await route.POST(request({ ...report, padding: 'a'.repeat(2048) }, fromSite))).status, 413);
  assert.equal(route.slack.length, 0);
});

test('a browser report reaches Slack scrubbed, after the response, and an identical repeat is muted', async () => {
  const route = clientReport();
  const report = { type: 'js-error', reason: 'Failed for ada@example.com card 4111111111111111 at /email-preferences?t=secret', source: 'page.js:12', path: '/' };
  assert.equal((await route.POST(request(report, fromSite))).status, 204);
  assert.equal((await route.POST(request(report, fromSite))).status, 204);
  assert.equal(route.slack.length, 0, 'Slack is posted after the response');
  for (const callback of route.callbacks) await callback();
  assert.equal(route.slack.length, 1);
  assert.doesNotMatch(route.slack[0], /ada@example\.com|4111/);
  assert.match(route.slack[0], /\[email\]/);
  assert.doesNotMatch(route.slack[0], /t=secret/);
});

function approve({ check = 'ok', row = { id: '3f1c2b4a-1d2e-4f5a-8b9c-0d1e2f3a4b5c', full_name: 'Ada Obi', email: 'ada@example.invalid', profession: null, reason: 'no-token:pending' } } = {}) {
  const calls = [];
  const slack = [];
  const route = handler('app/api/waitlist/approve/route.ts', {
    providers: {
      '@/lib/signing': { checkApproval: (id, exp, sig) => (sig === 'good' ? check : 'invalid') },
      '@/lib/waitlist-pending': {
        isPendingId: (id) => typeof id === 'string' && /^[0-9a-f-]{36}$/.test(id),
        getPending: async (id) => { calls.push(['get', id]); return row; },
        approvePending: async (id) => { calls.push(['approve', id]); return { status: 'approved', row }; },
        discardPending: async (id) => { calls.push(['discard', id]); return 'discarded'; },
      },
      '@/lib/waitlist-sync': { postToSlack: async (text) => { slack.push(text); } },
    },
  });
  return { ...route, calls, slack };
}
const ID = '3f1c2b4a-1d2e-4f5a-8b9c-0d1e2f3a4b5c';
const approveGet = (sig) => new nextServer.NextRequest(`https://www.taash.tax/api/waitlist/approve?id=${ID}&exp=99&sig=${sig}`);
const approvePost = (fields) => new nextServer.NextRequest(`https://www.taash.tax/api/waitlist/approve?id=${ID}&exp=99&sig=good`, {
  method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams(fields).toString(),
});

test('opening an approval link only shows the signup; it never approves it', async () => {
  const route = approve();
  const page = await route.GET(approveGet('good'));
  assert.equal(page.status, 200);
  const html = await page.text();
  assert.match(html, /Approve and send welcome email/);
  assert.match(html, /noindex/);
  assert.deepEqual(route.calls.map(([kind]) => kind), ['get']);
});

test('a forged or expired approval link is refused before any lookup', async () => {
  const forged = approve();
  assert.equal((await forged.GET(approveGet('bad'))).status, 403);
  assert.equal((await forged.POST(approvePost({ id: ID, exp: '99', sig: 'bad', action: 'approve' }))).status, 403);
  const expired = approve({ check: 'expired' });
  assert.equal((await expired.POST(approvePost({ id: ID, exp: '99', sig: 'good', action: 'approve' }))).status, 403);
  assert.equal(forged.calls.length + expired.calls.length, 0);
});

test('pressing Approve moves the signup to the waitlist and says so in Slack', async () => {
  const route = approve();
  const response = await route.POST(approvePost({ id: ID, exp: '99', sig: 'good', action: 'approve' }));
  assert.equal(response.status, 200);
  assert.deepEqual(route.calls, [['approve', ID]]);
  assert.match(route.slack[0], /Approved/);
});

test('names on the approval page are escaped', async () => {
  const route = approve({ row: { id: ID, full_name: '<script>alert(1)</script>', email: 'a@b.invalid', profession: null, reason: 'rejected' } });
  const html = await (await route.GET(approveGet('good'))).text();
  assert.doesNotMatch(html, /<script>alert/);
  assert.match(html, /&lt;script&gt;/);
});
