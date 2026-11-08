import { describe, expect, it } from 'vitest';
import { initialVerifyState, verifyStep, type VerifyEvent, type VerifyState } from './waitlist-verify';

function run(events: VerifyEvent[], state: VerifyState = initialVerifyState) {
  let s = state;
  let last = verifyStep(s, { type: 'expire' });
  for (const event of events) {
    last = verifyStep(s, event);
    s = last.state;
  }
  return last;
}

describe('waitlist Turnstile state', () => {
  // PR #53 review: "unsupported" arriving while the visitor is still typing was dropped, so the
  // later submit waited for a token that could never come.
  it('fails at once on submit when the browser was reported unsupported before submitting', () => {
    expect(run([{ type: 'unsupported' }, { type: 'submit' }]).action).toEqual({ type: 'failed' });
  });

  it('fails a waiting submit when the browser is reported unsupported', () => {
    expect(run([{ type: 'submit' }, { type: 'unsupported' }]).action).toEqual({ type: 'failed' });
  });

  it('keeps failing later submits once unsupported', () => {
    const r = run([{ type: 'unsupported' }, { type: 'submit' }, { type: 'submit' }]);
    expect(r.action).toEqual({ type: 'failed' });
    expect(r.state.pending).toBe(false);
  });

  it('sends straight away when a token is already there', () => {
    expect(run([{ type: 'token', token: 't1' }, { type: 'submit' }]).action).toEqual({ type: 'send', token: 't1' });
  });

  it('waits, then sends when the token arrives', () => {
    const waiting = run([{ type: 'submit' }]);
    expect(waiting.action).toEqual({ type: 'wait', retry: false });
    expect(verifyStep(waiting.state, { type: 'token', token: 't2' }).action).toEqual({ type: 'send', token: 't2' });
  });

  it('asks for a retry when submitting after an earlier error', () => {
    expect(run([{ type: 'error' }, { type: 'submit' }]).action).toEqual({ type: 'wait', retry: true });
  });

  it('recovers when Turnstile retries successfully after an error', () => {
    expect(run([{ type: 'error' }, { type: 'token', token: 't3' }, { type: 'submit' }]).action).toEqual({
      type: 'send',
      token: 't3',
    });
  });

  it('fails a waiting submit on error', () => {
    expect(run([{ type: 'submit' }, { type: 'error' }]).action).toEqual({ type: 'failed' });
  });

  it('does not reuse a token after it was sent or expired', () => {
    expect(run([{ type: 'token', token: 't4' }, { type: 'sent' }, { type: 'submit' }]).action.type).toBe('wait');
    expect(run([{ type: 'token', token: 't5' }, { type: 'expire' }, { type: 'submit' }]).action.type).toBe('wait');
  });
});
