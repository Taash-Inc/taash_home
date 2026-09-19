/**
 * One-off import of existing waitlist signups into OneSignal.
 *
 * Signups made before the OneSignal integration exist only in Supabase. This adds each of them
 * as a OneSignal user with the same tags a new signup gets, so they fall into the Waitlist
 * segment and the welcome Journey picks them up. It never sends the confirmation email — they
 * joined long ago and have already had it, or were never promised one.
 *
 * Dry run (prints what it would do):
 *   node --env-file=.env.local scripts/backfill-onesignal.ts
 * Apply:
 *   node --env-file=.env.local scripts/backfill-onesignal.ts --apply
 *
 * Re-running is safe: users are keyed by email, so an existing one is updated, not duplicated.
 */
import { upsertWaitlistUser, type WaitlistContact } from '../lib/onesignal.ts';

type WaitlistRow = {
  email: string;
  full_name: string | null;
  profession: string | null;
  monthly_income: string | null;
  created_at: string;
};

const apply = process.argv.includes('--apply');
const { NEXT_PUBLIC_SUPABASE_URL: url, SUPABASE_SERVICE_KEY: key } = process.env;
const config = { appId: process.env.ONESIGNAL_APP_ID, apiKey: process.env.ONESIGNAL_API_KEY };

if (!url || !key) throw new Error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY');
if (!config.appId || !config.apiKey) throw new Error('Set ONESIGNAL_APP_ID and ONESIGNAL_API_KEY');

const response = await fetch(
  `${url}/rest/v1/waitlist?select=email,full_name,profession,monthly_income,created_at&order=created_at.asc`,
  { headers: { apikey: key, Authorization: `Bearer ${key}` } }
);
if (!response.ok) throw new Error(`Supabase: HTTP ${response.status} ${await response.text()}`);
const rows: WaitlistRow[] = await response.json();

const contacts: WaitlistContact[] = rows.map((row) => {
  const parts = (row.full_name ?? '').trim().split(/\s+/);
  return {
    email: row.email.trim().toLowerCase(),
    firstName: parts[0] ?? '',
    lastName: parts.slice(1).join(' '),
    profession: row.profession ?? '',
    monthlyIncome: row.monthly_income,
  };
});

console.log(`${contacts.length} waitlist rows, ${new Set(contacts.map((c) => c.email)).size} unique emails`);
console.log(`Oldest: ${rows.at(0)?.created_at?.slice(0, 10)} · newest: ${rows.at(-1)?.created_at?.slice(0, 10)}`);

if (!apply) {
  console.log('\nDRY RUN — nothing sent. Re-run with --apply to import.\n');
  for (const c of contacts.slice(0, 5)) {
    console.log(`  would upsert ${c.email} tags={first_name:${c.firstName}, profession:${c.profession}}`);
  }
  if (contacts.length > 5) console.log(`  … and ${contacts.length - 5} more`);
  process.exit(0);
}

let ok = 0;
const failures: string[] = [];
for (const contact of contacts) {
  const result = await upsertWaitlistUser(contact, config);
  if (result.success) ok++;
  else failures.push(`${contact.email}: ${result.error}`);
  await new Promise((r) => setTimeout(r, 200)); // stay under OneSignal's rate limit
}

console.log(`\nImported ${ok}/${contacts.length}`);
if (failures.length) {
  console.log('Failed:');
  for (const f of failures) console.log(`  ${f}`);
  process.exit(1);
}
