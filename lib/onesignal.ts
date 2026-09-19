import { createHash } from 'node:crypto';

const API = 'https://api.onesignal.com';
const TIMEOUT_MS = 10_000;

/** OneSignal → Messages → Templates → "Waitlist confirmation". Not a secret. */
export const WAITLIST_CONFIRMATION_TEMPLATE_ID = '49492721-2460-4780-a5f1-477af5965e96';

export type WaitlistContact = {
  email: string;
  firstName: string;
  lastName: string;
  profession: string;
  monthlyIncome: string | null;
};

export type SyncResult = { success: true } | { success: false; error: string };

type Config = { appId: string | undefined; apiKey: string | undefined; fetchImpl?: typeof fetch };

/**
 * A name-based UUID (RFC 9562 v5 layout over SHA-1). The same input always gives the same
 * UUID, which is what makes the confirmation email safe to retry: OneSignal drops a send whose
 * idempotency_key it has already seen in the last 30 days.
 */
export function deterministicUuid(name: string): string {
  const bytes = createHash('sha1').update(name).digest().subarray(0, 16);
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/** Tags for segmenting the waitlist later. OneSignal tags are strings, and '' deletes a tag. */
function tagsFor(contact: WaitlistContact): Record<string, string> {
  const tags: Record<string, string> = {
    source: 'waitlist',
    first_name: contact.firstName,
    last_name: contact.lastName,
    profession: contact.profession,
    monthly_income: contact.monthlyIncome ?? '',
  };
  return Object.fromEntries(Object.entries(tags).filter(([, v]) => v !== ''));
}

async function call(
  fetchImpl: typeof fetch,
  url: string,
  apiKey: string,
  body: unknown
): Promise<{ ok: boolean; status: number; data: Record<string, unknown> }> {
  const response = await fetchImpl(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Key ${apiKey}` },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  return { ok: response.ok, status: response.status, data };
}

/**
 * Adds a waitlist signup to OneSignal and sends the confirmation email.
 *
 * Both steps are safe to repeat, so a failed sync is retried whole: the user is keyed by
 * external_id (the email), which OneSignal upserts, and the email carries an idempotency key
 * derived from the address, so a retry after a partial success never sends a second copy.
 */
export async function syncWaitlistContact(
  contact: WaitlistContact,
  { appId, apiKey, fetchImpl = fetch }: Config
): Promise<SyncResult> {
  if (!appId || !apiKey) {
    return { success: false, error: 'OneSignal is not configured (ONESIGNAL_APP_ID / ONESIGNAL_API_KEY)' };
  }

  try {
    const user = await call(fetchImpl, `${API}/apps/${appId}/users`, apiKey, {
      identity: { external_id: contact.email },
      properties: { tags: tagsFor(contact) },
      subscriptions: [{ type: 'Email', token: contact.email, enabled: true }],
    });
    if (!user.ok) {
      return { success: false, error: `create user: HTTP ${user.status} ${JSON.stringify(user.data.errors ?? user.data)}` };
    }

    const email = await call(fetchImpl, `${API}/notifications?c=email`, apiKey, {
      app_id: appId,
      template_id: WAITLIST_CONFIRMATION_TEMPLATE_ID,
      email_to: [contact.email],
      custom_data: { first_name: contact.firstName },
      idempotency_key: deterministicUuid(`taash-waitlist-confirmation:${contact.email}`),
    });
    // A request OneSignal accepts but delivers to nobody still answers 200, with an empty id
    // and the reason in `errors` — that is a failure, not a success.
    if (!email.ok || !email.data.id) {
      return { success: false, error: `send confirmation: HTTP ${email.status} ${JSON.stringify(email.data.errors ?? email.data)}` };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
