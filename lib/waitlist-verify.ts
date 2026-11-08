/**
 * The waitlist form's Turnstile state, as a pure function so it can be tested without a browser.
 *
 * Turnstile mounts on the first focus, so its events can arrive before the visitor submits.
 * Each event is remembered, not only acted on while a submit is waiting: an in-app browser can
 * report "unsupported" while the visitor is still typing, and a submit after that must show the
 * "open in your browser" message at once instead of waiting for a token that will never come.
 */
export type VerifyState = {
  token: string | null;
  /** A submit is waiting for a token. */
  pending: boolean;
  /** Turnstile said this browser can't be verified. Final for this page view. */
  unsupported: boolean;
  /** The last attempt errored; Turnstile retries on its own, so this is not final. */
  errored: boolean;
};

export type VerifyEvent =
  | { type: 'token'; token: string }
  | { type: 'error' }
  | { type: 'unsupported' }
  | { type: 'expire' }
  | { type: 'submit' }
  /** A token was sent to the server; tokens are single-use. */
  | { type: 'sent' };

export type VerifyAction =
  | { type: 'send'; token: string }
  /** Waiting for a token; `retry` asks the widget for a fresh attempt after an error. */
  | { type: 'wait'; retry: boolean }
  | { type: 'failed' }
  | { type: 'none' };

export const initialVerifyState: VerifyState = {
  token: null,
  pending: false,
  unsupported: false,
  errored: false,
};

export function verifyStep(
  state: VerifyState,
  event: VerifyEvent
): { state: VerifyState; action: VerifyAction } {
  switch (event.type) {
    case 'token':
      if (state.pending) {
        return {
          state: { ...state, token: null, pending: false, errored: false },
          action: { type: 'send', token: event.token },
        };
      }
      return { state: { ...state, token: event.token, errored: false }, action: { type: 'none' } };

    case 'error':
      return {
        state: { ...state, token: null, pending: false, errored: true },
        action: state.pending ? { type: 'failed' } : { type: 'none' },
      };

    case 'unsupported':
      return {
        state: { ...state, token: null, pending: false, unsupported: true },
        action: state.pending ? { type: 'failed' } : { type: 'none' },
      };

    case 'expire':
      return { state: { ...state, token: null }, action: { type: 'none' } };

    case 'submit':
      if (state.unsupported) return { state: { ...state, pending: false }, action: { type: 'failed' } };
      if (state.token) {
        return { state: { ...state, token: null }, action: { type: 'send', token: state.token } };
      }
      return {
        state: { ...state, pending: true, errored: false },
        action: { type: 'wait', retry: state.errored },
      };

    case 'sent':
      return { state: { ...state, token: null, pending: false }, action: { type: 'none' } };
  }
}
