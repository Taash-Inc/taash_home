import { logEvent } from './log';
import { APPROVAL_LINK_DAYS, signApproval } from './signing';
import { SITE_URL } from './site';
import { headers, postToSlack, supabase, syncSignup } from './waitlist-sync';

/**
 * Signups whose Cloudflare human check didn't pass. They are never turned away: they wait in
 * `waitlist_pending` (supabase/migrations/20261113190000_waitlist_pending.sql) until someone
 * approves them from the Slack link. Nothing is emailed before approval, and the table has its
 * own rate limits, so a bot that skips the check can't bombard the waitlist or anyone's inbox.
 */
const TABLE = 'waitlist_pending';
const WINDOW_MS = 60 * 60 * 1000;
/** Unverified signups allowed per IP per hour. Mobile carriers share IPs, so not lower. */
export const PER_IP_LIMIT = 5;
/** Unverified signups allowed per hour across everyone. Above this it's an attack. */
export const GLOBAL_LIMIT = 40;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type PendingSignup = {
  fullName: string;
  email: string;
  profession: string | null;
  monthlyIncome: string | null;
  reason: string;
  ipHash: string | null;
};

type PendingRow = {
  id: string;
  full_name: string;
  email: string;
  profession: string | null;
  monthly_income: string | null;
  reason: string;
};

export const isPendingId = (id: unknown): id is string => typeof id === 'string' && UUID.test(id);

export type SaveResult = { saved: true; id: string | null } | { saved: false; duplicate: true } | { saved: false; error: string };

export async function savePending(signup: PendingSignup): Promise<SaveResult> {
  const db = supabase();
  if (!db) return { saved: false, error: 'Supabase configuration missing' };
  try {
    const response = await fetch(`${db.url}/rest/v1/${TABLE}?select=id`, {
      method: 'POST',
      headers: { ...headers(db.key, true), Prefer: 'return=representation' },
      body: JSON.stringify({
        full_name: signup.fullName,
        email: signup.email,
        profession: signup.profession,
        monthly_income: signup.monthlyIncome,
        reason: signup.reason,
        ip_hash: signup.ipHash,
      }),
    });
    if (response.ok) {
      const rows: unknown = await response.json().catch(() => null);
      const id = Array.isArray(rows) && isPendingId(rows[0]?.id) ? (rows[0].id as string) : null;
      return { saved: true, id };
    }
    const body: { code?: string } = await response.json().catch(() => ({}));
    if (response.status === 409 || body?.code === '23505') return { saved: false, duplicate: true };
    return { saved: false, error: `Pending insert failed: HTTP ${response.status}${body?.code ? ` (${body.code})` : ''}` };
  } catch (error) {
    return { saved: false, error: error instanceof Error ? error.message : String(error) };
  }
}

async function countPending(since: string, ipHash?: string): Promise<number | null> {
  const db = supabase();
  if (!db) return null;
  const filter = ipHash ? `&ip_hash=eq.${encodeURIComponent(ipHash)}` : '';
  try {
    const response = await fetch(
      `${db.url}/rest/v1/${TABLE}?select=id&created_at=gte.${encodeURIComponent(since)}${filter}`,
      { method: 'HEAD', headers: { ...headers(db.key), Prefer: 'count=exact' }, signal: AbortSignal.timeout(3000) }
    );
    const total = Number(response.headers.get('content-range')?.split('/')[1]);
    return response.ok && Number.isInteger(total) ? total : null;
  } catch {
    return null;
  }
}

/** One Slack alert per limit per 30 minutes per server instance, so an attack can't flood Slack. */
const lastLimitAlert = new Map<string, number>();
function shouldAlert(scope: string, now: number): boolean {
  const last = lastLimitAlert.get(scope) ?? 0;
  if (now - last < 30 * 60 * 1000) return false;
  lastLimitAlert.set(scope, now);
  return true;
}

export type LimitResult = { allowed: true } | { allowed: false; scope: 'ip' | 'global' };

/**
 * Whether another unverified signup may be saved. If Supabase can't count, the signup is let
 * through (losing a real person is worse than one extra row) and the failure is logged.
 */
export async function checkPendingLimits(ipHash: string | null, now = Date.now()): Promise<LimitResult> {
  const since = new Date(now - WINDOW_MS).toISOString();
  const [global, perIp] = await Promise.all([
    countPending(since),
    ipHash ? countPending(since, ipHash) : Promise.resolve(0),
  ]);
  if (global === null || perIp === null) {
    logEvent('error', 'waitlist.limit_check_failed', { global: global === null, perIp: perIp === null });
  }
  const scope = perIp !== null && perIp >= PER_IP_LIMIT ? 'ip' : global !== null && global >= GLOBAL_LIMIT ? 'global' : null;
  if (!scope) return { allowed: true };

  logEvent('warn', 'waitlist.rate_limited', { scope, count: scope === 'ip' ? perIp : global });
  if (shouldAlert(scope, now)) {
    await postToSlack(
      scope === 'global'
        ? `🛑 *Unverified signups paused*\n• More than ${GLOBAL_LIMIT} in the last hour, which looks like a bot attack.\n• Verified signups are not affected. New unverified ones are told to try again later until the hour passes.\nSearch the Vercel logs for \`waitlist.rate_limited\`.`
        : `🛑 *One connection hit the signup limit*\n• More than ${PER_IP_LIMIT} unverified signups from the same IP address in an hour.\n• Verified signups are not affected.\nSearch the Vercel logs for \`waitlist.rate_limited\`.`
    );
  }
  return { allowed: false, scope };
}

/** A signed link that approves one pending signup, valid for APPROVAL_LINK_DAYS days. */
export function approveUrl(id: string, now = Date.now()): string | null {
  const expiresAt = now + APPROVAL_LINK_DAYS * 24 * 60 * 60 * 1000;
  const signature = signApproval(id, expiresAt);
  if (!signature) return null;
  const query = new URLSearchParams({ id, exp: String(expiresAt), sig: signature });
  return `${SITE_URL}/api/waitlist/approve?${query}`;
}

export async function getPending(id: string): Promise<PendingRow | null | 'error'> {
  const db = supabase();
  if (!db || !isPendingId(id)) return 'error';
  try {
    const response = await fetch(
      `${db.url}/rest/v1/${TABLE}?id=eq.${id}&select=id,full_name,email,profession,monthly_income,reason`,
      { headers: headers(db.key) }
    );
    if (!response.ok) return 'error';
    const rows: unknown = await response.json();
    return Array.isArray(rows) && rows.length > 0 ? (rows[0] as PendingRow) : null;
  } catch {
    return 'error';
  }
}

async function deletePending(id: string): Promise<boolean> {
  const db = supabase();
  if (!db) return false;
  try {
    const response = await fetch(`${db.url}/rest/v1/${TABLE}?id=eq.${id}`, {
      method: 'DELETE',
      headers: headers(db.key),
    });
    return response.ok;
  } catch {
    return false;
  }
}

export type ApproveResult =
  | { status: 'approved' | 'already-on-list'; row: PendingRow }
  | { status: 'missing' }
  | { status: 'error'; error: string };

/**
 * Move a pending signup onto the real waitlist and send the welcome email, exactly as if their
 * check had passed. The OneSignal step parks its own failures for the nightly retry.
 */
export async function approvePending(id: string): Promise<ApproveResult> {
  const row = await getPending(id);
  if (row === 'error') return { status: 'error', error: 'Could not read the pending signup' };
  if (!row) return { status: 'missing' };
  const db = supabase();
  if (!db) return { status: 'error', error: 'Supabase configuration missing' };

  let status: 'approved' | 'already-on-list';
  try {
    const response = await fetch(`${db.url}/rest/v1/waitlist`, {
      method: 'POST',
      headers: { ...headers(db.key, true), Prefer: 'return=minimal' },
      body: JSON.stringify({
        full_name: row.full_name,
        email: row.email,
        profession: row.profession,
        monthly_income: row.monthly_income,
      }),
    });
    const body: { code?: string } = response.ok ? {} : await response.json().catch(() => ({}));
    if (response.ok) status = 'approved';
    else if (response.status === 409 || body?.code === '23505') status = 'already-on-list';
    else return { status: 'error', error: `Waitlist insert failed: HTTP ${response.status}` };
  } catch (error) {
    return { status: 'error', error: error instanceof Error ? error.message : String(error) };
  }

  if (status === 'approved') {
    const [firstName, ...rest] = row.full_name.split(' ');
    await syncSignup({
      email: row.email,
      firstName: firstName ?? '',
      lastName: rest.join(' '),
      profession: row.profession ?? '',
      monthlyIncome: row.monthly_income,
    });
  }
  if (!(await deletePending(id))) logEvent('error', 'waitlist.pending_delete_failed', { id });
  return { status, row };
}

export async function discardPending(id: string): Promise<'discarded' | 'missing' | 'error'> {
  const row = await getPending(id);
  if (row === 'error') return 'error';
  if (!row) return 'missing';
  return (await deletePending(id)) ? 'discarded' : 'error';
}
