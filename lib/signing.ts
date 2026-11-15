import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Keyed hashes for the waitlist: signed approval links, hashed IP addresses and log references.
 *
 * The key is derived from SUPABASE_SERVICE_KEY, which only the server has and which every one of
 * these paths needs anyway, so there is no extra secret to set up or forget. Each use gets its
 * own derived key, so a value from one can never be passed off as another.
 */
type Purpose = 'approve' | 'confirm' | 'ip' | 'ref';

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

function verify(
  purpose: 'approve' | 'confirm',
  id: string,
  expiresAt: number,
  signature: string,
  { now = Date.now(), secret }: { now?: number; secret?: string }
): 'ok' | 'expired' | 'invalid' {
  const expected = hmac(purpose, `${id}.${expiresAt}`, secret);
  if (!expected || !/^[0-9a-f]{64}$/.test(signature)) return 'invalid';
  if (!timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(signature, 'hex'))) return 'invalid';
  return now > expiresAt ? 'expired' : 'ok';
}

/** Signature for an approval link: which pending signup, and until when the link works. */
export function signApproval(id: string, expiresAt: number, secret?: string): string | null {
  return hmac('approve', `${id}.${expiresAt}`, secret);
}

export function checkApproval(
  id: string,
  expiresAt: number,
  signature: string,
  options: { now?: number; secret?: string } = {}
): 'ok' | 'expired' | 'invalid' {
  return verify('approve', id, expiresAt, signature, options);
}

/** How long a held signup's browser may confirm it with a late Cloudflare token. */
export const CONFIRM_WINDOW_MS = 10 * 60 * 1000;

/**
 * Signature for the handle the visitor's browser gets with a held signup. It can only be used
 * together with a valid Cloudflare token (app/api/waitlist/confirm), and a different key from
 * approval links, so one can never stand in for the other.
 */
export function signConfirm(id: string, expiresAt: number, secret?: string): string | null {
  return hmac('confirm', `${id}.${expiresAt}`, secret);
}

export function checkConfirm(
  id: string,
  expiresAt: number,
  signature: string,
  options: { now?: number; secret?: string } = {}
): 'ok' | 'expired' | 'invalid' {
  return verify('confirm', id, expiresAt, signature, options);
}

/** The client's IP as Vercel reports it. Only ever passed to hashIp(). */
export function clientIp(headers: Headers): string | null {
  return headers.get('x-real-ip') || headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null;
}
