# Dependency upgrades — October 28, 2026

The full npm audit went from **9 findings (1 critical, 6 high, 2 moderate) to 0**.
The production-only audit also reports 0. These are registry advisory results at
the time of verification, rather than a full application security review.

## Direct upgrades

| Package | Previous installed version | New version |
| --- | --- | --- |
| `next`, `eslint-config-next` | 16.3.4 | 16.4.3 |
| `react`, `react-dom` | 19.2.8 | 19.3.1 |
| `@sanity/client` | 8.5.0 | 8.13.0 |
| `@marsidev/react-turnstile` | 1.6.1 | 1.6.3 |
| `@typescript/native` (CLI alias) | Not installed | TypeScript 7.0.2 |
| `typescript` (compiler API alias) | 5.9.3 | `@typescript/typescript6` 6.0.2, exposing the 6.0.3 API |
| `vitest` | 4.1.11 | 5.0.5 |
| `@types/node` | 22.20.1 | 22.20.5 |
| `@types/react` | 19.2.18 | 19.3.0 |
| `@types/react-dom` | 19.2.7 | 19.3.0 |

Apart from the compatibility holds below, the other direct packages already
matched their registry `latest` releases.
The lockfile was refreshed through npm without overrides or forced peer resolution.

The remaining compatible dependencies were refreshed with `npm update
--strict-peer-deps`, including the full `typescript-eslint` family from 8.69.0 to
8.72.1, `axe-core` 4.13.0 to 4.14.0, `enhanced-resolve` 5.24.5 to 5.26.0,
`browserslist` 4.28.9 to 4.29.5, Babel helpers, and browser support data. The final
installed tree has no remaining updates reported as compatible by
`npm outdated --all --json`. Parent packages' version constraints are preserved.

## Security fixes in the resolved tree

| Audited package | Previous | New |
| --- | --- | --- |
| Next.js | 16.3.4 | 16.4.3 |
| `vitest`, `@vitest/mocker` | 4.1.11 | 5.0.5 |
| `brace-expansion` | 1.1.18 / 5.0.9 | 1.1.21 / 5.0.12 |
| `sharp` | 0.35.4 | 0.35.5 |
| `source-map-js` | 1.2.1 | 1.2.2 |
| `undici` | 7.29.1 | 7.30.1 |
| `vite` | 8.2.2 | 8.3.5 |
| `zod` | 4.5.4 | 4.6.7 |

Next.js includes the image optimization, Server Actions, cache isolation, and
`next/og` fixes listed in the original audit. See the upstream
[16.4.1 security release](https://github.com/vercel/next.js/releases/tag/v16.4.1),
[16.3.8 security release](https://github.com/vercel/next.js/releases/tag/v16.3.8),
and [16.3.6 security release](https://github.com/vercel/next.js/releases/tag/v16.3.6).

The Node.js pin in `.nvmrc` moves from 22.19.0 to **22.23.4**, keeping the existing
Node 22 runtime family. This is a separate
[Node security release](https://nodejs.org/en/blog/release/v22.23.4), covering TLS,
DNS, HTTP, crypto, and bundled libraries; npm audit does not check the Node binary.
CI consumes this pin through `actions/setup-node`.

## Compatibility adjustments and improvements

- TypeScript 6 changes automatic global type discovery. `tsconfig.json` now
  explicitly includes `node`, as recommended by the
  [TypeScript 6 migration notes](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-6-0.html).
  Strict checking stays enabled.
- TypeScript 7.0.2 supplies the `tsc` command through the `@typescript/native` npm
  alias. The `typescript` dependency aliases `@typescript/typescript6`, which
  provides `tsc6` and the JavaScript compiler API for ESLint and editor plugins.
  This follows Microsoft's
  [side-by-side migration guidance](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/#running-side-by-side-with-typescript-6.0).
  The compatibility wrapper is version 6.0.2; its resolved compiler/API is 6.0.3.
- `npm run typecheck` runs `next typegen` before TypeScript 7, generating route
  declarations and `next-env.d.ts` on a fresh checkout. `prebuild` runs that check
  automatically before every `npm run build`, including deployment builds.
  Next.js then performs its own check with the compatibility compiler. Build
  type errors remain enabled, and both compiler checks must pass.
- Vitest 5 clears mock call history before each test and fails unawaited async
  assertions. The existing suite passes with these defaults. Its new artifact
  directory, `.vitest/`, is ignored. See the
  [Vitest migration guide](https://vitest.dev/guide/migration/).
- `npm run audit` is now a CI gate after `npm ci`, so newly reported advisories
  fail the check.
- CI now uses [checkout 7.0.1](https://github.com/actions/checkout/releases/tag/v7.0.1)
  and [setup-node 7.1.0](https://github.com/actions/setup-node/releases/tag/v7.1.0),
  pinned to their full release commit hashes. The workflow grants read access to
  repository contents, disables persisted checkout credentials, and installs
  with `npm ci --strict-peer-deps`. The actions use their own Node 24 runtime;
  setup-node installs the app's Node 22.23.4 pin on the hosted Ubuntu runner.
- [Next.js 16.4](https://nextjs.org/blog/next-16-4) includes default Turbopack
  optimizations and smaller production output. No new experimental flags or
  caching model migration were required.
- React 19.3 makes View Transitions, Fragment refs, and Trusted Types integration
  available. Installing it does not itself enforce a Trusted Types policy.
  See the [React 19.3 announcement](https://react.dev/blog/2026/09/09/react-19-3).
- The Turnstile patch fixes callback lifetime during script loading; the Sanity
  client includes updated transport dependencies and additional typed APIs.
  The app's current public-content queries need no migration. See
  [Turnstile releases](https://github.com/marsidev/react-turnstile/releases) and
  [Sanity client releases](https://github.com/sanity-io/client/releases).

## Versions intentionally held

- **ESLint 9.39.5:** the latest `eslint-plugin-react` and
  `eslint-plugin-jsx-a11y` peer ranges, along with `eslint-plugin-import`, accept
  ESLint 9 but exclude ESLint 10. All three are required by `eslint-config-next`.
  ESLint 10.13.0 would violate those
  peer ranges. npm warns that ESLint 9 is no longer supported; this remains a
  tooling maintenance limitation, with no current npm audit finding. ESLint
  stays on major 9 as requested until the plugins officially support 10.
- **TypeScript 6 compiler API:** `typescript-eslint` requires
  `>=4.8.4 <6.1.0`. The compatibility package supplies this API while the app's
  explicit typecheck uses TypeScript 7. Removing the compatibility package
  requires upstream support for the newer compiler API or a linting migration.
- **Node 22 types:** `@types/node` stays on major 22 to match `.nvmrc`; the
  registry's major 26 describes a different runtime.

## Verification

Project checks and the production server used Node **22.23.4** and npm
**10.9.9**, after a clean `npm ci --strict-peer-deps`:

- Compiler selection — `tsc --version` reports 7.0.2; `tsc6 --version` and the
  compatibility API report 6.0.3.
- `npm run typecheck` — passed with TypeScript 7 and generated Next.js types.
- `npm run lint` — passed.
- `npm test` — 6 files, 103 tests passed.
- `npm run build` — passed with Next.js 16.4.3 and Turbopack; 16 pages generated.
- `npm run audit` and `npm audit --omit=dev` — 0 vulnerabilities.
- `npm ls --all --json` — no missing or invalid peer dependencies. npm labels
  two optional WebAssembly helpers (`@emnapi/runtime`, `@img/sharp-wasm32`) as
  extraneous on this macOS install; the native image path works. Installed
  dependency engine ranges all accept Node 22.23.4.
- A disposable source copy without `next-env.d.ts` or `.next` successfully ran
  `npm run typecheck`, confirming the fresh-checkout path.
- A deliberate type error in that disposable copy failed `npm run build` with
  TS2322 during `prebuild`, before production bundling. The copy was removed.
- Workflow YAML parsed successfully; action commit pins match the verified
  release tags. The workflow uses only read access to repository contents.
- Production server on localhost: home, blog listing, an existing blog post,
  email preferences, privacy, terms, robots, and sitemap returned HTTP 200.
- Image optimization returned HTTP 200 with a WebP image, exercising Sharp.
- Invalid waitlist and email-preference requests returned HTTP 400; an
  unauthenticated revalidation request returned HTTP 401.
- `git diff --check` — passed.

Successful signup, email delivery, preference changes, and scheduled retry flows
were not exercised against external services. Their existing unit tests passed.
Hosted Linux validation is tracked by the pull request's CI check. Production
deployment remains a separate step.

To use the updated local runtime and locked dependencies:

```sh
nvm install
nvm use
npm ci --strict-peer-deps
npm run audit
```
