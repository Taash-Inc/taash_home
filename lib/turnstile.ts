const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

/**
 * The hostnames the taash_captcha widget is registered for in Cloudflare (Turnstile → widget →
 * Hostname Management). Keep the two lists in step: a token issued anywhere else is rejected,
 * so a domain added only in Cloudflare will fail every signup until it is added here too.
 */
export const TURNSTILE_HOSTNAMES: ReadonlySet<string> = new Set([
  'taash.tax',
  'www.taash.tax',
  'taash.app',
  'www.taash.app',
]);

/**
 * Server-side check of a Turnstile token with Cloudflare's siteverify API.
 *
 * Fails closed. A missing secret used to return true, which silently let every request through
 * while looking like a working CAPTCHA; that is now only allowed under `next dev`, so preview
 * and production deployments reject until the secret is set. Rejections log Cloudflare's
 * error codes (never the token or secret), so a wrong secret shows up as
 * `invalid-input-secret` in the Vercel logs instead of as a generic failure.
 */
export async function verifyTurnstile(
  token: string,
  {
    secret,
    isDevelopment,
    fetchImpl = fetch,
  }: { secret: string | undefined; isDevelopment: boolean; fetchImpl?: typeof fetch }
): Promise<boolean> {
  if (!secret || secret === 'your-secret-key-here') {
    if (isDevelopment) {
      console.warn('Turnstile secret not configured, skipping verification in development');
      return true;
    }
    console.error('TURNSTILE_SECRET_KEY is not set; rejecting the request');
    return false;
  }

  try {
    const response = await fetchImpl(SITEVERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret, response: token }),
    });
    const data: { success?: boolean; hostname?: string; 'error-codes'?: string[] } =
      await response.json();

    if (data.success !== true) {
      console.error('Turnstile rejected the token:', data['error-codes'] ?? []);
      return false;
    }
    // Cloudflare's test keys report example.com, so the hostname check is skipped under next dev.
    if (!isDevelopment && !TURNSTILE_HOSTNAMES.has(data.hostname ?? '')) {
      console.error('Turnstile token was issued on an unexpected hostname:', data.hostname);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Turnstile verification error:', error);
    return false;
  }
}
