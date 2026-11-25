import { describe, expect, it } from 'vitest';
import { signupFailure } from './signup-error';

// Vercel's firewall answers in front of our API, so our server never sees these requests.
// Captured from production on 24 Nov 2026, the first time the signup rate limit fired.
const FIREWALL_RATE_LIMIT = {
  error: { code: '429', message: 'Too Many Requests', id: 'cle1::p6mt7-1795573496798-ae81533000e5' },
};

describe('signup failures', () => {
  it('shows a readable message for a firewall rate limit and reports it, since our server never saw it', () => {
    const failure = signupFailure(429, FIREWALL_RATE_LIMIT, 'deny');
    expect(typeof failure.message).toBe('string');
    expect(failure.message).not.toContain('[object');
    expect(failure.message).toMatch(/wait a minute/i);
    expect(failure).toMatchObject({ code: 'firewall-deny-429', report: true });
  });

  it('asks a visitor stopped by a firewall challenge to reload, and reports it', () => {
    // A challenge answers with a page, not JSON, so the body parse falls back to {}.
    const failure = signupFailure(403, {}, 'challenge');
    expect(failure.message).toMatch(/reload the page/i);
    expect(failure).toMatchObject({ code: 'firewall-challenge-403', report: true });
  });

  it('never shows an error field that is not a string, even without the firewall header', () => {
    const failure = signupFailure(429, FIREWALL_RATE_LIMIT, null);
    expect(failure.message).not.toContain('[object');
    expect(failure.report).toBe(true);
  });

  it("reports a failure our server didn't answer itself", () => {
    expect(signupFailure(413, {}, null)).toMatchObject({ code: 'http-413', report: true });
    expect(signupFailure(404, null, null)).toMatchObject({ code: 'http-404', report: true });
  });

  it("shows our own messages and leaves alerts to the server when it answered", () => {
    expect(signupFailure(429, { error: 'Too many signups right now. Please try again in a few minutes.' }, null))
      .toEqual({ message: 'Too many signups right now. Please try again in a few minutes.', code: 'http-429', report: false });
    expect(signupFailure(400, { error: 'Invalid email format' }, null)).toMatchObject({
      message: 'That email address doesn’t look right. Please check it and try again.',
      report: false,
    });
    expect(signupFailure(400, { error: 'Missing required fields' }, null)).toMatchObject({
      message: 'Missing required fields',
      report: false,
    });
  });

  it('keeps reporting server errors, as before', () => {
    expect(signupFailure(500, { error: 'Internal server error' }, null)).toEqual({
      message: 'Something went wrong on our side. Please try again in a moment.',
      code: 'http-500',
      report: true,
    });
  });

  it('keeps a header value out of the report code unless it is a plain word', () => {
    expect(signupFailure(403, {}, 'deny<script>').code).toBe('firewall-403');
  });
});
