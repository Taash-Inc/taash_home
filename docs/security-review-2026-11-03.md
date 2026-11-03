# Security review — November 3, 2026

Reviewed this landing site's Supabase permissions, server routes, signup integrations,
email preference tokens, browser rendering, tracked secrets and dependency advisories.
This is a focused source and configuration review, not an incident investigation or
a guarantee that every vulnerability has been found.

## Fixed in the live Supabase project

Project: `Taash_waitlist` (`pjiaiznpxwxpclbxfrot`). Applied the statements in
`supabase/migrations/20261103190000_lock_down_waitlist.sql` through the authenticated
SQL editor. The transaction completed successfully. No signup records were modified.

| Finding | Evidence before the fix | Result |
| --- | --- | --- |
| Critical: exposed signup copies | `waitlist_backup` and `failed_loops_syncs` had RLS disabled and full table grants to both browser roles. This matches Supabase's `0013_rls_disabled_in_public` check. | Enabled RLS and revoked browser/PUBLIC access. |
| Direct signup bypass | `waitlist` had an INSERT policy for PUBLIC with `WITH CHECK (true)`, allowing direct database inserts outside the server's CAPTCHA and validation. | Removed that policy; signups go through the server route. |
| Excessive privileges | All five signup tables granted browser roles privileges including TRUNCATE, which RLS does not protect. | Revoked all table privileges from PUBLIC, anon and authenticated. Explicitly retained server DML. |
| Backup function hardening | `backup_waitlist()` used an unqualified destination and had no fixed search path. | Qualified `public.waitlist_backup`, fixed the search path, retained security invoker, and revoked browser execution. |
| Future object exposure | Objects created by postgres automatically received browser grants. | Revoked those default table, sequence and function grants, including PostgreSQL's global PUBLIC function EXECUTE default. |

Live verification after the transaction:

- Security Advisor rerun: **0 errors, 0 warnings**.
- All five public tables have RLS enabled.
- Effective table and column privileges for anon/authenticated are false on all five.
- Service role retains SELECT, INSERT, UPDATE and DELETE on all five.
- The five informational "RLS enabled, no policy" entries are intentional: only
  the privileged server should access these tables.

`supabase/security-check.sql` contains read-only verification queries.
The existing environment uses an `sb_secret_` server key; its value was not printed.

Default privileges are per object-creating role. These changes cover `postgres`,
not `supabase_admin` or other future creators, and do not auto-enable RLS on future
tables. Every future table migration must explicitly enable RLS and grant only its
required server permissions. Review new objects with the verification query.

## Fixed in the repository; application deployment pending

- The retry endpoint now denies access when CRON_SECRET is missing or blank.
  Previously either GET or POST could run the privileged retry job in that state.
  The deployed environment's CRON_SECRET setting was not inspected.
- Signup responses no longer reveal whether an email is already registered or
  return inserted database rows. Duplicate requests do not schedule another sync.
- Signup and preference requests now enforce an 8 KiB limit on the actual body
  stream, JSON object shape and JSON content type. Signup field types and lengths
  are validated before provider calls; long email addresses are rejected instead
  of truncated. Cloudflare verification has a ten-second timeout.
- "Leave the waitlist" includes the legacy failed_loops_syncs copy before deleting
  the preference token. This applies to future deletion requests; it does not
  retroactively reconcile people who previously left.
- Added anti-framing and MIME-sniffing protections, a limited CSP, and explicit
  privacy/cache headers for preference and API routes. The CSP does not attempt
  a full script-source restriction. Disabled the framework identification header.

These application changes require merging and deployment. The database fix is
already live and works with the current server-side access model. Its SQL is
included as a record of the applied change; the application deployment does not
need another database change on this project.

## Dependency remediation

The initial full audit flagged one moderate minimatch advisory across 16 development
dependency entries: [GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249).
The approved lint migration replaces ESLint 9 and the legacy plugin bundle with
ESLint 10 and supported plugins. All remaining minimatch consumers use the patched
major (locked to 11.0.4 through the `^11.0.1` override).

The final full `npm audit --json --ignore-scripts` returned **zero advisories**, including
development dependencies. No production direct dependency version changed.
See `docs/lint-migration-2026-11-03.md` for compatibility and policy details.

## Validation and passing controls

- Disposable PostgreSQL 17 fixture reproduced the original access, then verified
  both browser roles are denied CRUD/TRUNCATE across all five tables, service signup
  still creates a backup, future postgres objects have no browser grants, and the
  migration can be applied twice. See `supabase/tests/waitlist-security.sql`.
- Independent database checks temporarily restored DML grants and confirmed that
  RLS independently blocks both roles on every table. A malicious temporary table
  and search path could not redirect a server backup. Mutation checks used dummy
  data in a network-isolated disposable container.
- Seven API/parser regression tests passed using actual handlers, the installed compiler
  API and real NextRequest/NextResponse, with external providers stubbed. An
  earlier independent pass also passed all nine adversarial tests, including byte
  boundaries, chunked/split UTF-8, malformed input, CAPTCHA/provider errors and
  malformed bearer credentials.
- A clean strict peer installation passed using Node 22.23.4 in a disposable
  container without production environment files. Native TypeScript 7, Next route
  generation and the production build's TypeScript 6 check all passed.
- All **103 Vitest tests and 25 Node tests passed**. The latter include security,
  lint configuration and dependency automation regressions.
- ESLint 10 completed with zero errors and 19 nonblocking warnings from the newly
  enabled React preset. These concern existing ref naming, static index keys,
  a server-rendered date, JSON-LD script markup and an animation timeout; no rules
  were suppressed to make the migration pass.
- The optimized Next.js production build passed, including prerendering blog posts.
  A local run of that build passed HTTP assertions for CSP/framing/MIME protections,
  disabled framework identification, private preference cache/referrer headers,
  unauthenticated cron denial and malformed signup rejection.
- The missing-secret regression was also run against the original retry handler
  from HEAD and failed because an unauthorized caller reached the queue.
- The initial native-binding and temporary-directory blockers were resolved with
  a clean Linux dependency installation and an executable scratch directory. The
  complete application tests, automation tests and production build then ran.
- No env files are tracked in current Git or its available history; no hardcoded
  privileged keys were found in the scanned source. Server secrets are not exposed
  through NEXT_PUBLIC variables. The public Supabase URL is expected to be public.
- Existing Turnstile verification fails closed in production and checks hostnames.
  Preference tokens are random, validated before lookup, and removed from analytics
  URLs. Preference changes require POST. No storage buckets or public views were present.

No production signup, email, Slack notification or destructive access probe was sent
by this review. Historical logs, prior data access, account MFA, deployment-provider
settings and other applications were not audited.

References: [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security),
[securing the Data API](https://supabase.com/docs/guides/api/securing-your-api).
