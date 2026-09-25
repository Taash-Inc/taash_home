import { deleteUser, type OneSignalConfig, type SyncResult } from './onesignal';

/**
 * Every email's Unsubscribe link opens taash.tax/email-preferences?t=<token>. The token is 64
 * hex characters, made per address by supabase/email_preference_tokens.sql. It stands in for
 * the address, so no email appears in the link and nobody can guess someone else's.
 */
const TOKEN = /^[0-9a-f]{64}$/;
const TOKENS_TABLE = 'email_preference_tokens';

/**
 * Every table that holds a signup's details; leaving the waitlist deletes the address from
 * each. waitlist_backup is a copy of waitlist, and a row left in failed_onesignal_syncs would be
 * re-added to OneSignal by the nightly retry. The token goes last, so if a delete fails
 * part-way the link still works and the person can try again.
 */
const SIGNUP_TABLES = ['waitlist', 'waitlist_backup', 'failed_onesignal_syncs', TOKENS_TABLE];

export type Db = { url: string | undefined; key: string | undefined; fetchImpl?: typeof fetch };

const NOT_CONFIGURED = 'Supabase is not configured (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_KEY)';

export function isPreferenceToken(value: unknown): value is string {
  return typeof value === 'string' && TOKEN.test(value);
}

/** a•••@gmail.com: enough for the owner to recognise, without spelling out a forwarded address. */
export function maskEmail(email: string): string {
  const at = email.lastIndexOf('@');
  return at > 0 ? `${email[0]}•••${email.slice(at)}` : '•••';
}

export function preferencesConfig(): { db: Db; oneSignal: OneSignalConfig } {
  return {
    db: { url: process.env.NEXT_PUBLIC_SUPABASE_URL, key: process.env.SUPABASE_SERVICE_KEY },
    oneSignal: { appId: process.env.ONESIGNAL_APP_ID, apiKey: process.env.ONESIGNAL_API_KEY },
  };
}

async function rest(
  { url, key, fetchImpl = fetch }: Db,
  method: 'GET' | 'POST' | 'DELETE',
  path: string,
  { body, prefer }: { body?: unknown; prefer?: string } = {}
): Promise<{ ok: boolean; status: number; data: unknown }> {
  const response = await fetchImpl(`${url}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: key!,
      Authorization: `Bearer ${key}`,
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...(prefer ? { Prefer: prefer } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data: unknown = await response.json().catch(() => null);
  return { ok: response.ok, status: response.status, data };
}

function thrown(error: unknown) {
  return { success: false as const, error: error instanceof Error ? error.message : 'Unknown error' };
}

/**
 * The token for an address, created the first time it is asked for. The same address always
 * gets the same token back, so a retried signup sync reuses it.
 */
export async function ensurePreferenceToken(
  email: string,
  db: Db
): Promise<{ success: true; token: string } | { success: false; error: string }> {
  if (!db.url || !db.key) return { success: false, error: NOT_CONFIGURED };
  try {
    const response = await rest(db, 'POST', `${TOKENS_TABLE}?on_conflict=email&select=token`, {
      body: { email },
      prefer: 'resolution=merge-duplicates,return=representation',
    });
    const token = Array.isArray(response.data)
      ? (response.data[0] as { token?: unknown } | undefined)?.token
      : undefined;
    if (!response.ok || !isPreferenceToken(token)) {
      return {
        success: false,
        error: `preference token: HTTP ${response.status} ${JSON.stringify(response.data)}`,
      };
    }
    return { success: true, token };
  } catch (error) {
    return thrown(error);
  }
}

/** The address a token belongs to, or null when no signup has it (never issued, or left). */
export async function findEmailByToken(
  token: string,
  db: Db
): Promise<{ success: true; email: string | null } | { success: false; error: string }> {
  if (!isPreferenceToken(token)) return { success: true, email: null };
  if (!db.url || !db.key) return { success: false, error: NOT_CONFIGURED };
  try {
    const response = await rest(db, 'GET', `${TOKENS_TABLE}?token=eq.${token}&select=email`);
    if (!response.ok || !Array.isArray(response.data)) {
      return { success: false, error: `token lookup: HTTP ${response.status} ${JSON.stringify(response.data)}` };
    }
    const email = (response.data[0] as { email?: unknown } | undefined)?.email;
    return { success: true, email: typeof email === 'string' ? email : null };
  } catch (error) {
    return thrown(error);
  }
}

/** Deletes an address from every Supabase table that holds signup details. */
export async function deleteSignupData(email: string, db: Db): Promise<SyncResult> {
  if (!db.url || !db.key) return { success: false, error: NOT_CONFIGURED };
  try {
    for (const table of SIGNUP_TABLES) {
      const response = await rest(db, 'DELETE', `${table}?email=eq.${encodeURIComponent(email)}`, {
        prefer: 'return=minimal',
      });
      if (!response.ok) {
        return {
          success: false,
          error: `delete from ${table}: HTTP ${response.status} ${JSON.stringify(response.data)}`,
        };
      }
    }
    return { success: true };
  } catch (error) {
    return thrown(error);
  }
}

/**
 * "Leave the waitlist": deletes the person from OneSignal, then from every Supabase table.
 * OneSignal goes first, so a failure can never leave someone still getting emails with no
 * working link left to stop them.
 */
export async function leaveWaitlist(
  email: string,
  { db, oneSignal }: { db: Db; oneSignal: OneSignalConfig }
): Promise<SyncResult> {
  const removed = await deleteUser(email, oneSignal);
  if (!removed.success) return removed;
  return deleteSignupData(email, db);
}
