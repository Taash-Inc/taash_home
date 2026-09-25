/**
 * One-off rollout of the email preferences page (app/email-preferences). Run it once
 * supabase/email_preference_tokens.sql has been applied and the page is live. It:
 *
 *   1. Tags every signup in OneSignal with its pref_token, and deletes the last_name tag (the
 *      Free plan allows 6 tags and no template uses it). Tags only: it never sends a
 *      subscription, so nobody who has unsubscribed is signed back up.
 *   2. Points the Unsubscribe link in every email template at the page, sending every other
 *      field back unchanged and checking afterwards that it stayed that way.
 *
 * Dry run (prints what it would do):
 *   node --env-file=.env.local scripts/email-preferences-rollout.ts
 * Apply:
 *   node --env-file=.env.local scripts/email-preferences-rollout.ts --apply
 *
 * Re-running is safe: the tags are rewritten with the same values, and templates that already
 * point at the page are left alone.
 */
import { PREFERENCES_PAGE, setUserTags, withPreferencesLink } from '../lib/onesignal.ts';

const apply = process.argv.includes('--apply');
const {
  NEXT_PUBLIC_SUPABASE_URL: url,
  SUPABASE_SERVICE_KEY: key,
  ONESIGNAL_APP_ID: appId,
  ONESIGNAL_API_KEY: apiKey,
} = process.env;
if (!url || !key) throw new Error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY');
if (!appId || !apiKey) throw new Error('Set ONESIGNAL_APP_ID and ONESIGNAL_API_KEY');

const API = 'https://api.onesignal.com';
const oneSignalHeaders = { Authorization: `Key ${apiKey}`, 'Content-Type': 'application/json' };
const pause = () => new Promise((r) => setTimeout(r, 200)); // stay under OneSignal's rate limit

// 0. No email may link to the page before it exists.
const page = await fetch(PREFERENCES_PAGE);
if (page.status !== 200) {
  const message = `${PREFERENCES_PAGE} answered HTTP ${page.status}: deploy the page first.`;
  if (apply) throw new Error(message);
  console.log(`Note: ${message}\n`);
}

// 1. Tags.
const response = await fetch(`${url}/rest/v1/email_preference_tokens?select=email,token&order=created_at.asc`, {
  headers: { apikey: key, Authorization: `Bearer ${key}` },
});
if (!response.ok) {
  throw new Error(
    `Supabase: HTTP ${response.status} ${await response.text()} — has supabase/email_preference_tokens.sql been run?`
  );
}
const rows: { email: string; token: string }[] = await response.json();
console.log(`1. Tags: ${rows.length} signups with a preference token`);

if (!apply) {
  console.log('   would delete last_name, then set pref_token, on each OneSignal user (subscriptions untouched)');
} else {
  let tagged = 0;
  const missing: string[] = [];
  const failures: string[] = [];
  for (const row of rows) {
    // Two requests, the deletion first: OneSignal won't add a tag to a user who is at the plan's
    // per-user tag limit until one has been deleted in a separate request.
    const cleared = await setUserTags(row.email, { last_name: '' }, { appId, apiKey });
    await pause();
    const result = cleared.success
      ? await setUserTags(row.email, { pref_token: row.token }, { appId, apiKey })
      : cleared;
    if (result.success) tagged++;
    else if (result.error.includes('HTTP 404')) missing.push(row.email);
    else failures.push(`${row.email}: ${result.error}`);
    await pause();
  }
  console.log(`   tagged ${tagged}/${rows.length}`);
  // Not in OneSignal means never emailed, so there is no link of theirs to fix.
  if (missing.length) console.log(`   not in OneSignal (skipped): ${missing.join(', ')}`);
  if (failures.length) {
    console.log('   failed:');
    for (const f of failures) console.log(`     ${f}`);
    console.log('\nStopped before the templates: fix the failures above and re-run.');
    process.exit(1);
  }
}

// 2. Templates.
type Template = { id: string; name: string; channel?: string; content?: Record<string, unknown> };
async function oneSignal(method: 'GET' | 'PATCH', path: string, body?: unknown) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: oneSignalHeaders,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`OneSignal ${method} ${path.split('?')[0]}: HTTP ${res.status} ${JSON.stringify(data)}`);
  return data;
}

/** Every field an email template has. The API doesn't say whether a PATCH keeps the ones left out. */
const EMAIL_FIELDS = [
  'email_subject',
  'email_preheader',
  'email_body',
  'email_from_name',
  'email_from_address',
  'email_reply_to_address',
  'email_bcc',
  'disable_email_click_tracking',
];

const { templates } = (await oneSignal('GET', `/templates?app_id=${appId}&limit=50&offset=0`)) as {
  templates: Template[];
};
console.log(`2. Templates: ${templates.length}`);
let problems = 0;
for (const summary of templates.filter((t) => t.channel === 'email')) {
  const template = (await oneSignal('GET', `/templates/${summary.id}?app_id=${appId}`)) as Template;
  const content = template.content ?? {};
  const next = withPreferencesLink(String(content.email_body ?? ''));
  if (!next) {
    console.log(`   ${template.name}: no single Unsubscribe link it recognises — left alone, fix by hand`);
    problems++;
    continue;
  }
  if (!next.changed) {
    console.log(`   ${template.name}: already points at the page`);
    continue;
  }
  if (!apply) {
    console.log(`   ${template.name}: would point Unsubscribe at the page`);
    continue;
  }

  const fields: Record<string, unknown> = { name: template.name, isEmail: true };
  for (const field of EMAIL_FIELDS) {
    const value = field === 'email_body' ? next.html : content[field];
    if (value !== null && value !== undefined) fields[field] = value;
  }
  await oneSignal('PATCH', `/templates/${template.id}?app_id=${appId}`, fields);
  await pause();

  const after = (await oneSignal('GET', `/templates/${template.id}?app_id=${appId}`)) as Template;
  const drifted = EMAIL_FIELDS.filter(
    (field) => field in fields && JSON.stringify(after.content?.[field]) !== JSON.stringify(fields[field])
  );
  if (after.name !== template.name) drifted.push('name');
  if (drifted.length) {
    console.log(`   ${template.name}: UPDATED BUT CHANGED ${drifted.join(', ')} — check it in OneSignal`);
    problems++;
  } else {
    console.log(`   ${template.name}: Unsubscribe now opens the page`);
  }
  await pause();
}

if (!apply) console.log('\nDRY RUN — nothing changed. Re-run with --apply.');
if (problems) process.exit(1);
