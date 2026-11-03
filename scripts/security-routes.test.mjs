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
      process: { env }, console: { error() {}, warn() {} },
      fetch: fetchImpl ?? (() => { throw new Error('Unexpected network call'); }),
      TextDecoder, Uint8Array, AbortSignal, URLSearchParams,
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
  fullName: 'Ada Obi', email: 'Ada@example.invalid', profession: 'Designer',
  monthlyIncome: null, turnstileToken: 'dummy-captcha',
};

function waitlist(status = 201, errorBody) {
  const writes = [];
  let captchas = 0;
  const route = handler('app/api/waitlist/route.ts', {
    env: { NEXT_PUBLIC_SUPABASE_URL: 'https://db.example.invalid', SUPABASE_SERVICE_KEY: 'dummy-key' },
    providers: {
      '@/lib/turnstile': { verifyTurnstile: async () => { captchas++; return true; } },
      '@/lib/waitlist-sync': { syncSignup: async () => { throw new Error('Must run after response'); } },
    },
    fetchImpl: async (url, init) => {
      writes.push({ url, init });
      return new Response(errorBody === undefined ? null : JSON.stringify(errorBody), { status });
    },
  });
  return { ...route, writes, captchas: () => captchas };
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
  assert.equal(fresh.callbacks.length, 1);
  assert.equal(duplicate.callbacks.length, 0);
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
