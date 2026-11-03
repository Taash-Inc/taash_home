-- Read-only verification. Expected: five tables, RLS true, browser access false,
-- server_dml true, no public policies, and the backup function locked down.
select c.relname as table_name, c.relrowsecurity as rls_enabled,
  has_table_privilege('anon', c.oid, 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER') as anon_has_access,
  has_table_privilege('authenticated', c.oid, 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER') as authenticated_has_access,
  has_any_column_privilege('anon', c.oid, 'SELECT,INSERT,UPDATE,REFERENCES') as anon_has_column_access,
  has_any_column_privilege('authenticated', c.oid, 'SELECT,INSERT,UPDATE,REFERENCES') as authenticated_has_column_access,
  (select bool_and(has_table_privilege('service_role',c.oid,privilege))
   from unnest(array['SELECT','INSERT','UPDATE','DELETE']) privilege) as server_dml
from pg_class c join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relkind in ('r','p') order by c.relname;

select * from pg_policies where schemaname='public';

select p.oid::regprocedure as function_name, p.prosecdef as security_definer,
  p.proconfig as settings,
  has_function_privilege('anon',p.oid,'EXECUTE') as anon_execute,
  has_function_privilege('authenticated',p.oid,'EXECUTE') as authenticated_execute
from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public' and p.proname='backup_waitlist';
