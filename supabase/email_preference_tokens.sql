-- One secret token per signup address, carried by the Unsubscribe link in every email
-- (taash.tax/email-preferences?t=<token>). Run once in the Supabase SQL editor before deploying.
--
-- The token lives in its own table rather than as a column on waitlist: waitlist_backup mirrors
-- waitlist row for row, and a new column on waitlist could break whatever does the copying.
create table if not exists public.email_preference_tokens (
  email text primary key,
  -- Two v4 UUIDs without their dashes: 64 hex characters, 244 random bits, no extension needed.
  token text not null unique
    default replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''),
  created_at timestamptz not null default now()
);

-- No policies: only the service key (which bypasses RLS) can read or write it.
alter table public.email_preference_tokens enable row level security;

-- Tokens for everyone already on the waitlist; new signups get theirs as they sync.
insert into public.email_preference_tokens (email)
select email from public.waitlist
on conflict (email) do nothing;
