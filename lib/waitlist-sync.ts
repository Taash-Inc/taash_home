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

export function syncToOneSignal(contact: WaitlistContact): Promise<SyncResult> {
  return syncWaitlistContact(contact, {
    appId: process.env.ONESIGNAL_APP_ID,
    apiKey: process.env.ONESIGNAL_API_KEY,
  });
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

async function postToSlack(text: string): Promise<void> {
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

export async function postRetrySummary(results: {
  total: number;
  succeeded: number;
  failed: number;
  maxRetriesReached: number;
}): Promise<void> {
  if (results.total === 0) return;
  const emoji = results.failed === 0 ? '✅' : '⚠️';
  await postToSlack(
    `${emoji} *OneSignal Retry Summary*\n• Total processed: ${results.total}\n• Succeeded: ${results.succeeded}\n• Failed: ${results.failed}\n• Max retries reached: ${results.maxRetriesReached}`
  );
}
