import { describe, expect, it } from 'vitest';
import {
  initialVerifyState,
  isClientCheck,
  verifyStep,
  type VerifyAction,
  type VerifyEvent,
  type VerifyState,
} from './waitlist-verify';

function run(events: VerifyEvent[], state: VerifyState = initialVerifyState) {
  let s = state;
  let action: VerifyAction = { type: 'none' };
  for (const event of events) {
    ({ state: s, action } = verifyStep(s, event));
  }
  return { state: s, action };
}

describe('waitlist Turnstile state: the check is never a gate', () => {
  // 13 Nov 2026: a visitor from Instagram on Android pressed Join and nothing reached the server.
  // The old machine waited for a token with no time limit, so a stalled check lost them.
  it('sends without a token when the check is still running after the grace period', () => {
    const waiting = run([{ type: 'started' }, { type: 'submit' }]);
    expect(waiting.action).toEqual({ type: 'wait' });
    expect(verifyStep(waiting.state, { type: 'timeout' }).action).toEqual({ type: 'send-unverified', check: 'pending' });
  });

  it('sends without a token when the check never loaded at all', () => {
    expect(run([{ type: 'submit' }, { type: 'timeout' }]).action).toEqual({ type: 'send-unverified', check: 'not-loaded' });
  });

  it('sends with the token when it arrives during the grace period', () => {
    const waiting = run([{ type: 'started' }, { type: 'submit' }]);
    expect(verifyStep(waiting.state, { type: 'token', token: 't2' }).action).toEqual({ type: 'send', token: 't2' });
  });

  it('ignores a late timeout once the signup was sent', () => {
    const sent = run([{ type: 'started' }, { type: 'submit' }, { type: 'token', token: 't' }, { type: 'sent' }]);
    expect(verifyStep(sent.state, { type: 'timeout' }).action).toEqual({ type: 'none' });
  });

  it('sends straight away when a token is already there', () => {
    expect(run([{ type: 'token', token: 't1' }, { type: 'submit' }]).action).toEqual({ type: 'send', token: 't1' });
  });

  it.each(['error', 'unsupported', 'interactive'] as const)(
    'does not make the visitor wait when the check already reported %s',
    (type) => {
      expect(run([{ type: 'started' }, { type }, { type: 'submit' }]).action).toEqual({
        type: 'send-unverified',
        check: type,
      });
    }
  );

  it.each(['error', 'unsupported', 'interactive'] as const)('sends a waiting submit at once on %s', (type) => {
    expect(run([{ type: 'started' }, { type: 'submit' }, { type }]).action).toEqual({
      type: 'send-unverified',
      check: type,
    });
  });

  it('uses a token that arrives after an earlier error (Turnstile retries by itself)', () => {
    expect(run([{ type: 'error' }, { type: 'token', token: 't3' }, { type: 'submit' }]).action).toEqual({
      type: 'send',
      token: 't3',
    });
  });

  it('gives an expired check the grace period to refresh, then reports it as expired', () => {
    const waiting = run([{ type: 'token', token: 't' }, { type: 'expire' }, { type: 'submit' }]);
    expect(waiting.action).toEqual({ type: 'wait' });
    expect(verifyStep(waiting.state, { type: 'timeout' }).action).toEqual({ type: 'send-unverified', check: 'expired' });
  });

  it('does not reuse a token after it was sent', () => {
    expect(run([{ type: 'token', token: 't4' }, { type: 'sent' }, { type: 'submit' }]).action.type).toBe('wait');
  });

  it('only accepts its own reason codes', () => {
    expect(isClientCheck('pending')).toBe(true);
    expect(isClientCheck('passed')).toBe(false);
    expect(isClientCheck('pending\n• Email: x')).toBe(false);
    expect(isClientCheck(undefined)).toBe(false);
  });
});

// PR #62: after a held signup the check keeps running, and a late token confirms it. The handle
// lives in this state so every token goes through one decision.
describe('waitlist Turnstile state: confirming a held signup late', () => {
  const HANDLE = 'id.123.sig';
  const heldSend = () => run([{ type: 'started' }, { type: 'submit' }, { type: 'timeout' }]);

  it('confirms with a token that arrives after the server returned the handle', () => {
    const held = verifyStep(heldSend().state, { type: 'held', handle: HANDLE });
    expect(held.action).toEqual({ type: 'watch-late' });
    expect(verifyStep(held.state, { type: 'token', token: 'late' }).action).toEqual({
      type: 'confirm-late',
      handle: HANDLE,
      token: 'late',
    });
  });

  // Review finding: the token arrived while the held signup's request was still in flight, was
  // stored, and was then wiped when the reply came back. Cloudflare doesn't send it twice.
  it('confirms with a token that arrived while the held signup was still being sent', () => {
    const inFlight = verifyStep(heldSend().state, { type: 'token', token: 'early' });
    expect(inFlight.action).toEqual({ type: 'none' });
    expect(verifyStep(inFlight.state, { type: 'held', handle: HANDLE }).action).toEqual({
      type: 'confirm-late',
      handle: HANDLE,
      token: 'early',
    });
  });

  it('uses each late token once', () => {
    const held = verifyStep(heldSend().state, { type: 'held', handle: HANDLE }).state;
    const confirmed = verifyStep(held, { type: 'token', token: 'late' }).state;
    expect(confirmed.held).toBeNull();
    expect(confirmed.token).toBeNull();
  });

  // Review finding: "Not you? Use another email" left the old handle in place, so the next token
  // confirmed the old signup and the new one went out unverified.
  it('stops confirming the old signup once the visitor starts over', () => {
    const held = verifyStep(heldSend().state, { type: 'held', handle: HANDLE }).state;
    const reset = verifyStep(held, { type: 'reset' }).state;
    expect(verifyStep(reset, { type: 'token', token: 'fresh' }).action).toEqual({ type: 'none' });
    expect(verifyStep(verifyStep(reset, { type: 'token', token: 'fresh' }).state, { type: 'submit' }).action).toEqual({
      type: 'send',
      token: 'fresh',
    });
  });

  it('stops confirming once the late window closes', () => {
    const held = verifyStep(heldSend().state, { type: 'held', handle: HANDLE }).state;
    const expired = verifyStep(held, { type: 'late-expired' }).state;
    expect(expired.held).toBeNull();
    expect(verifyStep(expired, { type: 'token', token: 'x' }).action).toEqual({ type: 'none' });
  });
});

