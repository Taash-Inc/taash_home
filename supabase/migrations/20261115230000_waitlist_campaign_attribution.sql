-- Apply before deploying campaign attribution. The existing Meta fields stay
-- available to the live website and reports during and after the rollout.
begin;
set local lock_timeout = '5s';

alter table public.waitlist
  add column if not exists campaign_source text,
  add column if not exists campaign_medium text,
  add column if not exists campaign_name text,
  add column if not exists campaign_content text,
  add column if not exists campaign_submitted_at timestamptz;

alter table public.waitlist_pending
  add column if not exists campaign_source text,
  add column if not exists campaign_medium text,
  add column if not exists campaign_name text,
  add column if not exists campaign_content text,
  add column if not exists campaign_submitted_at timestamptz;

alter table public.waitlist_backup
  add column if not exists campaign_source text,
  add column if not exists campaign_medium text,
  add column if not exists campaign_name text,
  add column if not exists campaign_content text,
  add column if not exists campaign_submitted_at timestamptz;

create or replace function public.backup_waitlist()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $function$
begin
  insert into public.waitlist_backup (
    id, full_name, email, profession, monthly_income, created_at,
    paid_social_platform, paid_social_campaign, paid_social_content, paid_social_submitted_at,
    campaign_source, campaign_medium, campaign_name, campaign_content, campaign_submitted_at
  ) values (
    new.id, new.full_name, new.email, new.profession, new.monthly_income, new.created_at,
    new.paid_social_platform, new.paid_social_campaign, new.paid_social_content, new.paid_social_submitted_at,
    new.campaign_source, new.campaign_medium, new.campaign_name, new.campaign_content, new.campaign_submitted_at
  );
  return new;
end;
$function$;

notify pgrst, 'reload schema';
commit;
