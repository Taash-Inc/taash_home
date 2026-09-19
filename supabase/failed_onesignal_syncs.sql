-- Signups whose OneSignal sync failed, retried nightly by /api/onesignal-retry.
-- Same columns as failed_loops_syncs. Run once in the Supabase SQL editor before deploying.
create table if not exists public.failed_onesignal_syncs (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  first_name text,
  last_name text,
  profession text,
  monthly_income text,
  error_message text,
  retry_count integer default 0,
  created_at timestamptz default now(),
  last_retry_at timestamptz
);

-- No policies: only the service key (which bypasses RLS) can read or write it.
alter table public.failed_onesignal_syncs enable row level security;
