import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Keyed hashes for the waitlist: signed approval links, hashed IP addresses and log references.
 *
 * The key is derived from SUPABASE_SERVICE_KEY, which only the server has and which every one of
 * these paths needs anyway, so there is no extra secret to set up or forget. Each use gets its
 * own derived key, so a value from one can never be passed off as another.
 */
type Purpose = 'approve' | 'ip' | 'ref';

function key(purpose: Purpose, secret = process.env.SUPABASE_SERVICE_KEY): Buffer | null {
  if (!secret) return null;
  return createHmac('sha256', secret).update(`taash:${purpose}:v1`).digest();
}

function hmac(purpose: Purpose, value: string, secret?: string): string | null {
  const k = key(purpose, secret);
  return k ? createHmac('sha256', k).update(value).digest('hex') : null;
}

/** The visitor's IP as an opaque hash, for rate limits. The address itself is never kept. */
export function hashIp(ip: string | null, secret?: string): string | null {
  return ip ? hmac('ip', ip, secret)?.slice(0, 32) ?? null : null;
}

/**
 * A short, stable reference for one email address, for log lines that must not contain the
 * address. Search Slack or the logs for it to connect the two.
 */
export function refFor(email: string, secret?: string): string {
  return hmac('ref', email.toLowerCase(), secret)?.slice(0, 10) ?? 'no-key';
}

export const APPROVAL_LINK_DAYS = 14;

/** Signature for an approval link: which pending signup, and until when the link works. */
export function signApproval(id: string, expiresAt: number, secret?: string): string | null {
  return hmac('approve', `${id}.${expiresAt}`, secret);
}

export function checkApproval(
  id: string,
  expiresAt: number,
  signature: string,
  { now = Date.now(), secret }: { now?: number; secret?: string } = {}
): 'ok' | 'expired' | 'invalid' {
  const expected = signApproval(id, expiresAt, secret);
  if (!expected || !/^[0-9a-f]{64}$/.test(signature)) return 'invalid';
  if (!timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(signature, 'hex'))) return 'invalid';
  return now > expiresAt ? 'expired' : 'ok';
}

/** The client's IP as Vercel reports it. Only ever passed to hashIp(). */
export function clientIp(headers: Headers): string | null {
  return headers.get('x-real-ip') || headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null;
}
