import { ensurePreferenceToken, leaveWaitlist, preferencesConfig } from './email-preferences';
import { syncWaitlistContact, type SyncResult, type WaitlistContact } from './onesignal';

/**
 * Failed OneSignal syncs are parked in Supabase and retried by the nightly cron
 * (app/api/onesignal-retry). Same design the Loops integration used: the signup itself never
 * fails because of OneSignal, each failure alerts Slack once, and the cron posts a summary.
 * Table definition: supabase/failed_onesignal_syncs.sql.
 */
const TABLE = 'failed_onesignal_syncs';
export const MAX_RETRIES = 3;

export type FailedSync = {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  profession: string | null;
  monthly_income: string | null;
  retry_count: number | null;
};

export async function syncToOneSignal(contact: WaitlistContact): Promise<SyncResult> {
  // Every email's Unsubscribe link carries this token, so it has to exist before OneSignal
  // sends the confirmation. If it can't be made, the sync fails and is retried like any other.
  const token = await ensurePreferenceToken(contact.email, {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    key: process.env.SUPABASE_SERVICE_KEY,
  });
  if (!token.success) return token;
  return syncWaitlistContact(
    { ...contact, preferenceToken: token.token },
    { appId: process.env.ONESIGNAL_APP_ID, apiKey: process.env.ONESIGNAL_API_KEY }
  );
}

function supabase(): { url: string; key: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  return url && key ? { url, key } : null;
}

function headers(key: string, json = false): Record<string, string> {
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    ...(json ? { 'Content-Type': 'application/json' } : {}),
  };
}

export async function postToSlack(text: string): Promise<void> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) {
    console.warn('Slack webhook not configured, skipping alert');
    return;
  }
  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
  } catch (error) {
    console.error('Failed to send Slack alert:', error);
  }
}

async function storeFailedSync(contact: WaitlistContact, errorMessage: string): Promise<void> {
  const db = supabase();
  if (!db) {
    console.error('Supabase not configured, cannot store failed OneSignal sync');
    return;
  }
  try {
    const response = await fetch(`${db.url}/rest/v1/${TABLE}`, {
      method: 'POST',
      headers: headers(db.key, true),
      body: JSON.stringify({
        email: contact.email,
        first_name: contact.firstName,
        last_name: contact.lastName,
        profession: contact.profession,
        monthly_income: contact.monthlyIncome,
        error_message: errorMessage,
        retry_count: 0,
      }),
    });
    if (!response.ok) {
      console.error(`Failed to store failed OneSignal sync: HTTP ${response.status}`, await response.text());
    }
  } catch (error) {
    console.error('Failed to store failed OneSignal sync:', error);
  }
}

/** Sync a new signup; on failure, park it for the nightly retry and alert Slack. */
export async function syncSignup(contact: WaitlistContact): Promise<void> {
  const result = await syncToOneSignal(contact);
  if (result.success) return;

  console.error('OneSignal sync failed:', result.error);
  await storeFailedSync(contact, result.error);
  await postToSlack(
    `⚠️ *OneSignal Sync Failed*\n• Email: ${contact.email}\n• Error: ${result.error}\n• Stored for retry in \`${TABLE}\``
  );
}

export async function getFailedSyncs(): Promise<{ data: FailedSync[]; error?: string }> {
  const db = supabase();
  if (!db) return { data: [], error: 'Supabase not configured' };
  try {
    const response = await fetch(
      `${db.url}/rest/v1/${TABLE}?retry_count=lt.${MAX_RETRIES}&order=created_at.asc&limit=50`,
      { headers: headers(db.key) }
    );
    if (!response.ok) return { data: [], error: `Failed to fetch: ${response.status}` };
    return { data: await response.json() };
  } catch (error) {
    return { data: [], error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function deleteFailedSync(id: string): Promise<void> {
  const db = supabase();
  if (!db) return;
  await fetch(`${db.url}/rest/v1/${TABLE}?id=eq.${id}`, { method: 'DELETE', headers: headers(db.key) });
}

export async function recordRetryFailure(sync: FailedSync, errorMessage: string): Promise<void> {
  const db = supabase();
  if (!db) return;
  await fetch(`${db.url}/rest/v1/${TABLE}?id=eq.${sync.id}`, {
    method: 'PATCH',
    headers: headers(db.key, true),
    body: JSON.stringify({
      retry_count: (sync.retry_count ?? 0) + 1,
      last_retry_at: new Date().toISOString(),
      error_message: errorMessage,
    }),
  });
}

/** Whether an address is still on the waitlist, or null when Supabase can't say. */
async function isOnWaitlist(email: string): Promise<boolean | null> {
  const db = supabase();
  if (!db) return null;
  try {
    const response = await fetch(
      `${db.url}/rest/v1/waitlist?email=eq.${encodeURIComponent(email)}&select=email`,
      { headers: headers(db.key) }
    );
    if (!response.ok) return null;
    const rows: unknown = await response.json();
    return Array.isArray(rows) && rows.length > 0;
  } catch {
    return null;
  }
}

export type RetryOutcome = 'synced' | 'left' | 'failed';

/**
 * Retries one parked signup (app/api/onesignal-retry). Someone who has left the waitlist is
 * never put back: the waitlist is checked just before the sync, and again after it in case they
 * left while it ran, in which case their removal is finished rather than undone.
 */
export async function retryFailedSync(sync: FailedSync): Promise<RetryOutcome> {
  const onList = await isOnWaitlist(sync.email);
  if (onList === null) {
    await recordRetryFailure(sync, 'could not check the waitlist before retrying');
    return 'failed';
  }
  if (!onList) {
    await deleteFailedSync(String(sync.id));
    return 'left';
  }

  const result = await syncToOneSignal({
    email: sync.email,
    firstName: sync.first_name ?? '',
    lastName: sync.last_name ?? '',
    profession: sync.profession ?? '',
    monthlyIncome: sync.monthly_income,
  });
  if (!result.success) {
    await recordRetryFailure(sync, result.error);
    return 'failed';
  }

  // Only a definite "gone" undoes the sync. If Supabase can't answer a moment after it said
  // they were on the list, that is still the likelier truth.
  if ((await isOnWaitlist(sync.email)) === false) {
    const removed = await leaveWaitlist(sync.email, preferencesConfig());
    if (!removed.success) {
      await postToSlack(
        `⚠️ *A retry re-added someone who left the waitlist*\n• Email: ${sync.email}\n• Error: ${removed.error}\nRemove them from OneSignal by hand.`
      );
    }
    return 'left';
  }
  await deleteFailedSync(String(sync.id));
  return 'synced';
}

export async function postRetrySummary(results: {
  total: number;
  succeeded: number;
  failed: number;
  left: number;
  maxRetriesReached: number;
}): Promise<void> {
  if (results.total === 0) return;
  const emoji = results.failed === 0 ? '✅' : '⚠️';
  await postToSlack(
    `${emoji} *OneSignal Retry Summary*\n• Total processed: ${results.total}\n• Succeeded: ${results.succeeded}\n• Failed: ${results.failed}\n• Left the waitlist (not re-added): ${results.left}\n• Max retries reached: ${results.maxRetriesReached}`
  );
}
