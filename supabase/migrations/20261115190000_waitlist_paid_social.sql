-- Apply before deploying the website so both signup paths can write these fields.
begin;
set local lock_timeout = '5s';

alter table public.waitlist
  add column if not exists paid_social_platform text check (paid_social_platform in ('facebook', 'instagram')),
  add column if not exists paid_social_campaign text,
  add column if not exists paid_social_content text,
  add column if not exists paid_social_submitted_at timestamptz;

alter table public.waitlist_pending
  add column if not exists paid_social_platform text check (paid_social_platform in ('facebook', 'instagram')),
  add column if not exists paid_social_campaign text,
  add column if not exists paid_social_content text,
  add column if not exists paid_social_submitted_at timestamptz;

alter table public.waitlist_backup
  add column if not exists paid_social_platform text,
  add column if not exists paid_social_campaign text,
  add column if not exists paid_social_content text,
  add column if not exists paid_social_submitted_at timestamptz;

create or replace function public.backup_waitlist()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $function$
begin
  insert into public.waitlist_backup (
    id, full_name, email, profession, monthly_income, created_at,
    paid_social_platform, paid_social_campaign, paid_social_content, paid_social_submitted_at
  ) values (
    new.id, new.full_name, new.email, new.profession, new.monthly_income, new.created_at,
    new.paid_social_platform, new.paid_social_campaign, new.paid_social_content, new.paid_social_submitted_at
  );
  return new;
end;
$function$;

notify pgrst, 'reload schema';
commit;
