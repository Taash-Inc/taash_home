/**
 * What the visitor sees when a signup request fails, and whether the browser has to tell us.
 *
 * Our API answers its own errors as `{ error: "message" }` and alerts Slack itself when it fails.
 * Vercel's firewall answers in front of it (the signup rate limit, a bot challenge, a deny rule),
 * with an `x-vercel-mitigated` header and a body whose `error` is an object. Our server never sees
 * those requests, so the browser reports them, and that object must never reach the screen: it
 * showed as "[object Object]" the first time the rate limit fired (24 Nov 2026).
 */
export type SignupFailure = { message: string; code: string; report: boolean };

export function signupFailure(status: number, body: unknown, mitigated: string | null): SignupFailure {
  if (mitigated) {
    const action = /^[a-z]{1,20}$/.test(mitigated) ? `${mitigated}-` : '';
    return {
      message:
        status === 429
          ? 'Too many signups from your connection right now. Please wait a minute and try again.'
          : 'We couldn’t confirm this came from your browser. Please reload the page and try again.',
      code: `firewall-${action}${status}`,
      report: true,
    };
  }

  const error = body && typeof body === 'object' && 'error' in body ? body.error : undefined;
  const ours = typeof error === 'string' && error.trim() ? error : undefined;
  return {
    message: friendlyError(status, ours),
    code: `http-${status}`,
    // A server error alerts Slack from the server too, but the browser has always reported it:
    // the request may have died before our code ran. Anything else without our own message
    // came from something in front of our API, which never heard about it.
    report: status >= 500 || !ours,
  };
}

function friendlyError(status: number, message?: string): string {
  if (status === 429) return message || 'Too many signups right now. Please try again in a few minutes.';
  if (message === 'Invalid email format')
    return 'That email address doesn’t look right. Please check it and try again.';
  if (status >= 500) return 'Something went wrong on our side. Please try again in a moment.';
  return message || 'Something went wrong. Please try again.';
}
