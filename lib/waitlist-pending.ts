import { logEvent } from './log';
import { APPROVAL_LINK_DAYS, signApproval } from './signing';
import { SITE_URL } from './site';
import { headers, postToSlack, supabase, syncSignup } from './waitlist-sync';

/**
 * Signups whose Cloudflare human check didn't pass. They are never turned away: they wait in
 * `waitlist_pending` (supabase/migrations/20261113190000_waitlist_pending.sql) until someone
 * approves them from the Slack link. Nothing is emailed before approval, and the database caps
 * how many can arrive per hour, so a bot that skips the check can't bombard the waitlist or
 * anyone's inbox.
 *
 * Rows are never deleted: approve and discard mark them. That keeps them in the hourly count
 * and lets each action claim a row with one conditional update, so approve and discard can't
 * both win.
 */
const TABLE = 'waitlist_pending';
const COLUMNS = 'id,full_name,email,profession,monthly_income,reason';
/**
 * The hourly limits. The database enforces them inside the insert (the trigger in
 * supabase/migrations/20261113190000_waitlist_pending.sql), so simultaneous requests can't all
 * slip past a count taken beforehand. These copies only word the Slack alerts: keep them equal.
 * Per IP: mobile carriers put many people behind one address, so not lower than 5.
 */
export const PER_IP_LIMIT = 5;
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

export type SaveResult =
  | { saved: true; id: string | null }
  | { saved: false; duplicate: true }
  | { saved: false; rateLimited: 'ip' | 'global' }
  | { saved: false; error: string };

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
    const body: { code?: string; message?: string } = await response.json().catch(() => ({}));
    if (response.status === 409 || body?.code === '23505') return { saved: false, duplicate: true };
    if (body?.code === 'P0001' && (body.message === 'rate_limited:ip' || body.message === 'rate_limited:global')) {
      return { saved: false, rateLimited: body.message === 'rate_limited:ip' ? 'ip' : 'global' };
    }
    return { saved: false, error: `Pending insert failed: HTTP ${response.status}${body?.code ? ` (${body.code})` : ''}` };
  } catch (error) {
    return { saved: false, error: error instanceof Error ? error.message : String(error) };
  }
}

/** One Slack alert per limit per 30 minutes per server instance, so an attack can't flood Slack. */
const lastLimitAlert = new Map<string, number>();

/** Tell the team a limit was hit. Runs after the 429 has gone out. */
export async function alertRateLimit(scope: 'ip' | 'global', now = Date.now()): Promise<void> {
  if (now - (lastLimitAlert.get(scope) ?? -Infinity) < 30 * 60 * 1000) return;
  lastLimitAlert.set(scope, now);
  await postToSlack(
    scope === 'global'
      ? `🛑 *Unverified signups paused*\n• More than ${GLOBAL_LIMIT} in the last hour, which looks like a bot attack.\n• Verified signups are not affected. New unverified ones are told to try again later until the hour passes.\nSearch the Vercel logs for \`waitlist.rate_limited\`.`
      : `🛑 *One connection hit the signup limit*\n• More than ${PER_IP_LIMIT} unverified signups from the same IP address in an hour.\n• Verified signups are not affected.\nSearch the Vercel logs for \`waitlist.rate_limited\`.`
  );
}

/** A signed link that approves one pending signup, valid for APPROVAL_LINK_DAYS days. */
export function approveUrl(id: string, now = Date.now()): string | null {
  const expiresAt = now + APPROVAL_LINK_DAYS * 24 * 60 * 60 * 1000;
  const signature = signApproval(id, expiresAt);
  if (!signature) return null;
  const query = new URLSearchParams({ id, exp: String(expiresAt), sig: signature });
  return `${SITE_URL}/api/waitlist/approve?${query}`;
}

/** A signup that is still waiting for a decision, or null if it was handled (or never existed). */
export async function getPending(id: string): Promise<PendingRow | null | 'error'> {
  const db = supabase();
  if (!db || !isPendingId(id)) return 'error';
  try {
    const response = await fetch(`${db.url}/rest/v1/${TABLE}?id=eq.${id}&status=eq.pending&select=${COLUMNS}`, {
      headers: headers(db.key),
    });
    if (!response.ok) return 'error';
    const rows: unknown = await response.json();
    return Array.isArray(rows) && rows.length > 0 ? (rows[0] as PendingRow) : null;
  } catch {
    return 'error';
  }
}

/**
 * Move a still-pending row to `status`, atomically: the update only matches while the row is
 * 'pending', so of two simultaneous actions exactly one gets the row back.
 */
async function claim(id: string, status: 'approved' | 'discarded'): Promise<PendingRow | null | 'error'> {
  const db = supabase();
  if (!db || !isPendingId(id)) return 'error';
  try {
    const response = await fetch(`${db.url}/rest/v1/${TABLE}?id=eq.${id}&status=eq.pending&select=${COLUMNS}`, {
      method: 'PATCH',
      headers: { ...headers(db.key, true), Prefer: 'return=representation' },
      body: JSON.stringify({ status, handled_at: new Date().toISOString() }),
    });
    if (!response.ok) return 'error';
    const rows: unknown = await response.json();
    return Array.isArray(rows) && rows.length > 0 ? (rows[0] as PendingRow) : null;
  } catch {
    return 'error';
  }
}

/** Undo a claim whose follow-up failed, so the signup goes back in the queue. */
async function release(id: string): Promise<boolean> {
  const db = supabase();
  if (!db) return false;
  try {
    const response = await fetch(`${db.url}/rest/v1/${TABLE}?id=eq.${id}`, {
      method: 'PATCH',
      headers: { ...headers(db.key, true), Prefer: 'return=minimal' },
      body: JSON.stringify({ status: 'pending', handled_at: null }),
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
 * check had passed. The row is claimed first, so a discard at the same moment can't be
 * overridden; if the waitlist insert then fails, the claim is undone. The OneSignal step parks
 * its own failures for the nightly retry.
 */
export async function approvePending(id: string): Promise<ApproveResult> {
  const row = await claim(id, 'approved');
  if (row === 'error') return { status: 'error', error: 'Could not claim the pending signup' };
  if (!row) return { status: 'missing' };

  const giveBack = async (error: string): Promise<ApproveResult> => {
    if (!(await release(id))) {
      logEvent('error', 'waitlist.pending_release_failed', { id });
      await postToSlack(
        `🚨 *An approval failed and the signup could not be put back in the queue*\n• Name: ${row.full_name}\n• Email: ${row.email}\n• Error: ${error}\nAdd them to the waitlist by hand.`
      );
    }
    return { status: 'error', error };
  };

  const db = supabase();
  if (!db) return giveBack('Supabase configuration missing');
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
    else return giveBack(`Waitlist insert failed: HTTP ${response.status}`);
  } catch (error) {
    return giveBack(error instanceof Error ? error.message : String(error));
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
  return { status, row };
}

export async function discardPending(id: string): Promise<'discarded' | 'missing' | 'error'> {
  const row = await claim(id, 'discarded');
  if (row === 'error') return 'error';
  return row ? 'discarded' : 'missing';
}
