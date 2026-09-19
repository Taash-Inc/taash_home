import { afterEach, describe, expect, it, vi } from 'vitest';
import { verifyTurnstile } from './turnstile';

/** A fetch that answers siteverify with `body` and records what it was sent. */
function siteverify(body: Record<string, unknown>) {
  return vi.fn<typeof fetch>(async () => new Response(JSON.stringify(body), { status: 200 }));
}

const PROD = { secret: 'real-secret', isDevelopment: false };

afterEach(() => vi.restoreAllMocks());

describe('verifyTurnstile', () => {
  it('rejects in production when the secret is missing, without calling Cloudflare', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const fetchImpl = siteverify({ success: true, hostname: 'www.taash.tax' });
    expect(await verifyTurnstile('token', { ...PROD, secret: undefined, fetchImpl })).toBe(false);
    expect(await verifyTurnstile('token', { ...PROD, secret: '', fetchImpl })).toBe(false);
    expect(await verifyTurnstile('token', { ...PROD, secret: 'your-secret-key-here', fetchImpl })).toBe(false);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('still skips verification in local development when no secret is configured', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const fetchImpl = siteverify({ success: false });
    expect(await verifyTurnstile('token', { secret: undefined, isDevelopment: true, fetchImpl })).toBe(true);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('sends the secret and token to siteverify', async () => {
    const fetchImpl = siteverify({ success: true, hostname: 'www.taash.tax' });
    await verifyTurnstile('the-token', { ...PROD, fetchImpl });
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe('https://challenges.cloudflare.com/turnstile/v0/siteverify');
    const sent = new URLSearchParams(String(init?.body));
    expect(sent.get('secret')).toBe('real-secret');
    expect(sent.get('response')).toBe('the-token');
  });

  it.each(['taash.tax', 'www.taash.tax', 'taash.app', 'www.taash.app'])(
    'accepts a valid token issued on %s',
    async (hostname) => {
      const fetchImpl = siteverify({ success: true, hostname });
      expect(await verifyTurnstile('token', { ...PROD, fetchImpl })).toBe(true);
    }
  );

  it('rejects a valid token issued on a hostname that is not ours', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const fetchImpl = siteverify({ success: true, hostname: 'evil.example' });
    expect(await verifyTurnstile('token', { ...PROD, fetchImpl })).toBe(false);
  });

  it("logs Cloudflare's error codes when it rejects a token", async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const fetchImpl = siteverify({ success: false, 'error-codes': ['invalid-input-secret'] });
    expect(await verifyTurnstile('token', { ...PROD, fetchImpl })).toBe(false);
    expect(error.mock.calls.flat().join(' ')).toContain('invalid-input-secret');
  });

  it('rejects when siteverify cannot be reached', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const fetchImpl = vi.fn(async () => {
      throw new Error('network down');
    });
    expect(await verifyTurnstile('token', { ...PROD, fetchImpl })).toBe(false);
  });
});
