/**
 * The waitlist form's Turnstile state, as a pure function so it can be tested without a browser.
 *
 * The human check is never a gate. Every submit ends in a send: with a token when Cloudflare
 * has given one, or without one (and the reason) when it hasn't, in which case the server holds
 * the signup for approval instead of turning the visitor away. The old version waited for a
 * token with no time limit, so a check that stalled on a slow phone or in Instagram's in-app
 * browser lost the visitor silently: their details never left the phone.
 *
 * Turnstile starts before the visitor submits, so its events are remembered as they arrive.
 */

/** Why there was no token when the visitor pressed Join. Sent to the server and logged. */
export const CLIENT_CHECKS = ['pending', 'not-loaded', 'error', 'unsupported', 'interactive', 'expired'] as const;
export type ClientCheck = (typeof CLIENT_CHECKS)[number];
export const isClientCheck = (value: unknown): value is ClientCheck =>
  typeof value === 'string' && (CLIENT_CHECKS as readonly string[]).includes(value);

/** How long a submit waits for a check that is still running before sending without it. */
export const GRACE_MS = 3000;

export type VerifyState = {
  token: string | null;
  /** A submit is waiting (for at most GRACE_MS) for the check to finish. */
  pending: boolean;
  /** What the check last reported; 'idle' until the widget has said anything. */
  status: 'idle' | 'running' | 'error' | 'unsupported' | 'interactive' | 'expired';
};

export type VerifyEvent =
  | { type: 'started' }
  | { type: 'token'; token: string }
  | { type: 'error' }
  | { type: 'unsupported' }
  /** Cloudflare wants the visitor to tick a box. We don't make them; we send without it. */
  | { type: 'interactive' }
  | { type: 'expire' }
  | { type: 'submit' }
  /** GRACE_MS passed with a submit still waiting. */
  | { type: 'timeout' }
  /** A token was sent to the server; tokens are single-use. */
  | { type: 'sent' };

export type VerifyAction =
  | { type: 'send'; token: string }
  | { type: 'send-unverified'; check: ClientCheck }
  /** Start the GRACE_MS timer; a token, failure or timeout will follow. */
  | { type: 'wait' }
  | { type: 'none' };

export const initialVerifyState: VerifyState = { token: null, pending: false, status: 'idle' };

function checkFor(status: VerifyState['status']): ClientCheck {
  if (status === 'idle') return 'not-loaded';
  if (status === 'running') return 'pending';
  return status;
}

/** A failure-type report: remember it, and if a submit is waiting, send without a token now. */
function failed(state: VerifyState, status: Exclude<VerifyState['status'], 'idle' | 'running'>) {
  const next: VerifyState = { token: null, pending: false, status };
  return {
    state: next,
    action: state.pending ? ({ type: 'send-unverified', check: status } as const) : ({ type: 'none' } as const),
  };
}

export function verifyStep(
  state: VerifyState,
  event: VerifyEvent
): { state: VerifyState; action: VerifyAction } {
  switch (event.type) {
    case 'started':
      return { state: { ...state, status: state.status === 'idle' ? 'running' : state.status }, action: { type: 'none' } };

    case 'token':
      if (state.pending) {
        return { state: { token: null, pending: false, status: 'running' }, action: { type: 'send', token: event.token } };
      }
      return { state: { ...state, token: event.token, status: 'running' }, action: { type: 'none' } };

    case 'error':
      return failed(state, 'error');
    case 'unsupported':
      return failed(state, 'unsupported');
    case 'interactive':
      return failed(state, 'interactive');

    case 'expire':
      // Turnstile fetches a fresh token by itself; until then there is none to send.
      return { state: { ...state, token: null, status: 'expired' }, action: { type: 'none' } };

    case 'submit':
      if (state.token) return { state: { ...state, token: null }, action: { type: 'send', token: state.token } };
      // Still running (or about to start): give it a moment. Anything else won't produce a
      // token in time, so don't make the visitor wait for nothing.
      if (state.status === 'running' || state.status === 'idle' || state.status === 'expired') {
        return { state: { ...state, pending: true }, action: { type: 'wait' } };
      }
      return { state: { ...state, pending: false }, action: { type: 'send-unverified', check: checkFor(state.status) } };

    case 'timeout':
      if (!state.pending) return { state, action: { type: 'none' } };
      return { state: { ...state, pending: false }, action: { type: 'send-unverified', check: checkFor(state.status) } };

    case 'sent':
      return { state: { ...state, token: null, pending: false }, action: { type: 'none' } };
  }
}
