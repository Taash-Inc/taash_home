import { createHash } from 'node:crypto';

const API = 'https://api.onesignal.com';
const TIMEOUT_MS = 10_000;

/** OneSignal → Messages → Templates → "Waitlist confirmation". Not a secret. */
export const WAITLIST_CONFIRMATION_TEMPLATE_ID = '49492721-2460-4780-a5f1-477af5965e96';

/** The page every email's Unsubscribe link opens (app/email-preferences). */
export const PREFERENCES_PAGE = 'https://www.taash.tax/email-preferences';

export type WaitlistContact = {
  email: string;
  firstName: string;
  lastName: string;
  profession: string;
  monthlyIncome: string | null;
};

/** A contact on its way to OneSignal, with the token its emails' Unsubscribe links carry. */
export type OneSignalContact = WaitlistContact & { preferenceToken: string };

/**
 * A choice on the preferences page. 'invite_only' ("Only email me when my access is ready")
 * stays subscribed but carries the email_scope tag, which update and newsletter sends exclude.
 */
export type EmailPreference = 'all' | 'invite_only' | 'none';

export type SyncResult = { success: true } | { success: false; error: string };

export type OneSignalConfig = {
  appId: string | undefined;
  apiKey: string | undefined;
  fetchImpl?: typeof fetch;
};

const SCOPE_TAG = 'email_scope';

const NOT_CONFIGURED = {
  success: false,
  error: 'OneSignal is not configured (ONESIGNAL_APP_ID / ONESIGNAL_API_KEY)',
} as const;

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

/**
 * The tags a signup gets. OneSignal tags are strings, and '' deletes a tag.
 *
 * The Free plan allows 6 tags. pref_token builds every template's Unsubscribe link and the
 * preferences page sets email_scope, so last_name is not sent: no template uses it.
 */
function tagsFor(contact: OneSignalContact): Record<string, string> {
  const tags: Record<string, string> = {
    source: 'waitlist',
    first_name: contact.firstName,
    profession: contact.profession,
    monthly_income: contact.monthlyIncome ?? '',
    pref_token: contact.preferenceToken,
  };
  return Object.fromEntries(Object.entries(tags).filter(([, v]) => v !== ''));
}

async function call(
  fetchImpl: typeof fetch,
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  url: string,
  apiKey: string,
  body?: unknown
): Promise<{ ok: boolean; status: number; data: Record<string, unknown> }> {
  const response = await fetchImpl(url, {
    method,
    headers: {
      Authorization: `Key ${apiKey}`,
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  return { ok: response.ok, status: response.status, data };
}

function failed(step: string, response: { status: number; data: Record<string, unknown> }) {
  return {
    success: false as const,
    error: `${step}: HTTP ${response.status} ${JSON.stringify(response.data.errors ?? response.data)}`,
  };
}

function thrown(error: unknown) {
  return { success: false as const, error: error instanceof Error ? error.message : 'Unknown error' };
}

/** Users are keyed by external_id, which is the signup's email address. */
function userUrl(appId: string, email: string): string {
  return `${API}/apps/${appId}/users/by/external_id/${encodeURIComponent(email)}`;
}

/**
 * Creates the OneSignal user for a waitlist signup, unless it already exists. No email is sent.
 *
 * An existing user is left untouched: the nightly retry lands here after a partial sync, by
 * which time the person may have unsubscribed, and sending enabled: true again would
 * resubscribe them. So enabled: true only ever reaches a user being created.
 */
export async function addWaitlistUser(
  contact: OneSignalContact,
  { appId, apiKey, fetchImpl = fetch }: OneSignalConfig
): Promise<SyncResult> {
  if (!appId || !apiKey) return NOT_CONFIGURED;
  try {
    const existing = await call(fetchImpl, 'GET', userUrl(appId, contact.email), apiKey);
    if (existing.ok) return { success: true };
    if (existing.status !== 404) return failed('view user', existing);

    const user = await call(fetchImpl, 'POST', `${API}/apps/${appId}/users`, apiKey, {
      identity: { external_id: contact.email },
      properties: { tags: tagsFor(contact) },
      subscriptions: [{ type: 'Email', token: contact.email, enabled: true }],
    });
    return user.ok ? { success: true } : failed('create user', user);
  } catch (error) {
    return thrown(error);
  }
}

/**
 * Adds a waitlist signup to OneSignal and sends the confirmation email.
 *
 * Both steps are safe to repeat, so a failed sync is retried whole: the user is only created if
 * missing, and the email carries an idempotency key derived from the address, so a retry after
 * a partial success never sends a second copy.
 */
export async function syncWaitlistContact(
  contact: OneSignalContact,
  config: OneSignalConfig
): Promise<SyncResult> {
  const user = await addWaitlistUser(contact, config);
  if (!user.success) return user;

  const { appId, apiKey, fetchImpl = fetch } = config;
  try {
    const email = await call(fetchImpl, 'POST', `${API}/notifications?c=email`, apiKey!, {
      app_id: appId,
      template_id: WAITLIST_CONFIRMATION_TEMPLATE_ID,
      email_to: [contact.email],
      // pref_token rides on the message as well as the tag: this email goes out moments after
      // the tag is set, and its Unsubscribe link reads the message first (UNSUBSCRIBE_HREF).
      custom_data: { first_name: contact.firstName, pref_token: contact.preferenceToken },
      idempotency_key: deterministicUuid(`taash-waitlist-confirmation:${contact.email}`),
    });
    // A request OneSignal accepts but delivers to nobody still answers 200, with an empty id
    // and the reason in `errors` — that is a failure, not a success.
    if (!email.ok || !email.data.id) return failed('send confirmation', email);
    return { success: true };
  } catch (error) {
    return thrown(error);
  }
}

type Subscription = { id?: string; type?: string; token?: string; enabled?: boolean };
type Current =
  | { success: true; preference: EmailPreference; subscriptionId: string }
  | { success: false; error: string };

async function readCurrent(
  email: string,
  appId: string,
  apiKey: string,
  fetchImpl: typeof fetch
): Promise<Current> {
  const user = await call(fetchImpl, 'GET', userUrl(appId, email), apiKey);
  if (!user.ok) return failed('view user', user);
  const subscriptions = Array.isArray(user.data.subscriptions)
    ? (user.data.subscriptions as Subscription[])
    : [];
  const subscription = subscriptions.find(
    (s) => s.type === 'Email' && s.token?.toLowerCase() === email.toLowerCase()
  );
  if (!subscription?.id) return { success: false, error: 'view user: no email subscription' };
  const tags = (user.data.properties as { tags?: Record<string, string> } | undefined)?.tags ?? {};
  const preference: EmailPreference =
    subscription.enabled === false ? 'none' : tags[SCOPE_TAG] === 'invite_only' ? 'invite_only' : 'all';
  return { success: true, preference, subscriptionId: subscription.id };
}

/** What a signup currently gets, as the preferences page shows it. */
export async function getEmailPreference(
  email: string,
  { appId, apiKey, fetchImpl = fetch }: OneSignalConfig
): Promise<{ success: true; preference: EmailPreference } | { success: false; error: string }> {
  if (!appId || !apiKey) return NOT_CONFIGURED;
  try {
    const current = await readCurrent(email, appId, apiKey, fetchImpl);
    return current.success ? { success: true, preference: current.preference } : current;
  } catch (error) {
    return thrown(error);
  }
}

/**
 * Applies a choice from the preferences page.
 *
 * This is the only code that may turn someone's email back on, because it only ever runs on
 * that person's own click. Anything that runs in bulk uses setUserTags, which cannot.
 */
export async function setEmailPreference(
  email: string,
  preference: EmailPreference,
  { appId, apiKey, fetchImpl = fetch }: OneSignalConfig
): Promise<SyncResult> {
  if (!appId || !apiKey) return NOT_CONFIGURED;
  try {
    const current = await readCurrent(email, appId, apiKey, fetchImpl);
    if (!current.success) return current;

    // The tag goes first: switching email back on before it is right could let an update reach
    // someone who has just asked for the invite only.
    if (preference !== 'none') {
      const tags = await call(fetchImpl, 'PATCH', userUrl(appId, email), apiKey, {
        properties: { tags: { [SCOPE_TAG]: preference === 'invite_only' ? 'invite_only' : '' } },
      });
      if (!tags.ok) return failed('update tags', tags);
    }

    const enabled = preference !== 'none';
    if ((current.preference !== 'none') !== enabled) {
      const subscription = await call(
        fetchImpl,
        'PATCH',
        `${API}/apps/${appId}/subscriptions/${current.subscriptionId}`,
        apiKey,
        { subscription: { enabled } }
      );
      if (!subscription.ok) return failed('update subscription', subscription);
    }
    return { success: true };
  } catch (error) {
    return thrown(error);
  }
}

/** Deletes a user and all their subscriptions. One that is already gone counts as deleted. */
export async function deleteUser(
  email: string,
  { appId, apiKey, fetchImpl = fetch }: OneSignalConfig
): Promise<SyncResult> {
  if (!appId || !apiKey) return NOT_CONFIGURED;
  try {
    const response = await call(fetchImpl, 'DELETE', userUrl(appId, email), apiKey);
    return response.ok || response.status === 404 ? { success: true } : failed('delete user', response);
  } catch (error) {
    return thrown(error);
  }
}

/**
 * Sets tags on an existing user. It sends no subscription, so it cannot resubscribe anyone who
 * has unsubscribed: bulk jobs use this, never addWaitlistUser.
 */
export async function setUserTags(
  email: string,
  tags: Record<string, string>,
  { appId, apiKey, fetchImpl = fetch }: OneSignalConfig
): Promise<SyncResult> {
  if (!appId || !apiKey) return NOT_CONFIGURED;
  try {
    const response = await call(fetchImpl, 'PATCH', userUrl(appId, email), apiKey, {
      properties: { tags },
    });
    return response.ok ? { success: true } : failed('update tags', response);
  } catch (error) {
    return thrown(error);
  }
}

/**
 * The Unsubscribe href for every email template. The confirmation email carries the token in
 * custom_data (see syncWaitlistContact), later emails read the tag, and anyone with neither
 * falls back to OneSignal's own unsubscribe page. It uses only if/elsif, which the templates
 * already rely on, and no quotes, because it sits inside an attribute.
 */
export const UNSUBSCRIBE_HREF =
  `{% if message.custom_data.pref_token %}${PREFERENCES_PAGE}?t={{ message.custom_data.pref_token }}` +
  `{% elsif pref_token %}${PREFERENCES_PAGE}?t={{ pref_token }}` +
  '{% else %}[unsubscribe_url]{% endif %}';

/** The two Unsubscribe links the templates were written with; {{unsubscribe_link}} never worked. */
const OLD_UNSUBSCRIBE_LINK = /<a href="(?:\{\{\s*unsubscribe_link\s*\}\}|\[unsubscribe_url\])"/g;

/**
 * Points a template's Unsubscribe link at the preferences page, with OneSignal's click tracking
 * off for it. Returns null unless the template has exactly one link it recognises, so a
 * template it does not understand is left for a person to fix rather than guessed at.
 */
export function withPreferencesLink(html: string): { html: string; changed: boolean } | null {
  if (html.includes(UNSUBSCRIBE_HREF)) return { html, changed: false };
  if ((html.match(OLD_UNSUBSCRIBE_LINK) ?? []).length !== 1) return null;
  return {
    html: html.replace(
      OLD_UNSUBSCRIBE_LINK,
      () => `<a href="${UNSUBSCRIBE_HREF}" data-disable-tracking="true"`
    ),
    changed: true,
  };
}
