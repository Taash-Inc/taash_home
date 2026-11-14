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
