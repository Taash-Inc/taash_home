-- LOCAL DISPOSABLE DATABASE ONLY. Creates a synthetic copy of the affected schema.
\set ON_ERROR_STOP on
create role anon;
create role authenticated;
create role service_role bypassrls;
grant usage on schema public to anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  grant all on tables to anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  grant execute on functions to anon, authenticated, service_role;

create table public.waitlist (
  id uuid primary key default gen_random_uuid(), full_name text, email text unique,
  profession text, monthly_income text, created_at timestamptz default now()
);
create table public.waitlist_backup (like public.waitlist including all);
create table public.failed_loops_syncs (id uuid primary key default gen_random_uuid(), email text);
create table public.failed_onesignal_syncs (like public.failed_loops_syncs including all);
create table public.email_preference_tokens (email text primary key, token text);
alter table public.waitlist enable row level security;
alter table public.failed_onesignal_syncs enable row level security;
alter table public.email_preference_tokens enable row level security;
create policy "Allow anonymous inserts" on public.waitlist for insert with check (true);
create function public.backup_waitlist() returns trigger language plpgsql as $$
begin insert into waitlist_backup values (new.*); return new; end;
$$;
create trigger waitlist_backup_trigger after insert on public.waitlist
  for each row execute function public.backup_waitlist();

-- Prove the fixture reproduces the reported missing protection.
set role anon;
insert into public.waitlist (email) values ('before@example.invalid');
select * from public.waitlist_backup;
reset role;

\ir ../migrations/20261103190000_lock_down_waitlist.sql
-- Reapplying is safe.
\ir ../migrations/20261103190000_lock_down_waitlist.sql
\ir ../migrations/20261113190000_waitlist_pending.sql
\ir ../migrations/20261113190000_waitlist_pending.sql

do $$
declare principal text; tab text; statement text;
begin
  foreach principal in array array['anon','authenticated'] loop
    foreach tab in array array['waitlist','waitlist_backup','failed_loops_syncs',
                              'failed_onesignal_syncs','email_preference_tokens',
                              'waitlist_pending'] loop
      foreach statement in array array[
        format('select * from public.%I', tab),
        format('insert into public.%I (email) values (''attacker@example.invalid'')', tab),
        format('update public.%I set email = ''attacker@example.invalid''', tab),
        format('delete from public.%I', tab),
        format('truncate public.%I', tab)
      ] loop
        execute format('set local role %I', principal);
        begin
          execute statement;
          raise exception 'Unexpected access: % %', principal, statement;
        exception when insufficient_privilege then null;
        end;
        reset role;
      end loop;
    end loop;
  end loop;
  if exists (select 1 from pg_tables where schemaname='public' and not rowsecurity) then
    raise exception 'RLS is missing';
  end if;
end;
$$;

set role service_role;
insert into public.waitlist (email, full_name) values ('server@example.invalid','Test Person');
insert into public.email_preference_tokens values ('server@example.invalid','dummy-token');
insert into public.waitlist_pending (full_name, email, reason) values ('Held Person','held@example.invalid','no-token:pending');
delete from public.waitlist_pending where email='held@example.invalid';
update public.email_preference_tokens set token='updated' where email='server@example.invalid';
delete from public.failed_loops_syncs where email='server@example.invalid';
reset role;
do $$
begin
  if not exists (select 1 from public.waitlist_backup where email='server@example.invalid') then
    raise exception 'Service signup failed to reach backup';
  end if;
  if has_function_privilege('anon','public.backup_waitlist()','EXECUTE')
     or has_function_privilege('authenticated','public.backup_waitlist()','EXECUTE') then
    raise exception 'Browser roles can execute backup function';
  end if;
end;
$$;

-- RLS still denies reads/writes if a future migration accidentally restores DML grants.
begin;
grant select, insert, update, delete on all tables in schema public to anon, authenticated;
set local role anon;
do $$
begin
  if exists (select 1 from public.waitlist) then raise exception 'RLS leaked signup'; end if;
  begin
    insert into public.waitlist (email) values ('rls@example.invalid');
    raise exception 'RLS allowed insert';
  exception when insufficient_privilege then null;
  end;
end;
$$;
rollback;

create table public.future_internal (id int);
create function public.future_internal_function() returns int language sql as 'select 1';
do $$
begin
  if has_table_privilege('anon','public.future_internal','SELECT')
     or has_table_privilege('authenticated','public.future_internal','INSERT')
     or has_function_privilege('anon','public.future_internal_function()','EXECUTE')
     or has_function_privilege('authenticated','public.future_internal_function()','EXECUTE') then
    raise exception 'Future objects received public privileges';
  end if;
end;
$$;
select 'PASS: browser CRUD/TRUNCATE denied; RLS denies; server signup and backup work; future grants denied' as result;
