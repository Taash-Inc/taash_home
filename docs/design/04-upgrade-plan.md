# Platform, Dependency & Architecture Plan

**Verified:** 4 September 2026. Local Node **v22.19.0**, npm **11.6.0**. All version data from `npm outdated` / `npm view` run in this repo; all breaking-change claims cite a release note or advisory.

## Baseline — what is true today

| Check | Result |
|---|---|
| `npm run build` | ✅ **passes** (Next 16.0.7, Turbopack). 14 static pages, homepage prerendered `○ Static` |
| `npx eslint .` | ❌ **fails — 3 errors, 1 warning** (see §5) |
| TypeScript | ✅ clean (`Running TypeScript` passes during build) |
| CI | ❌ **none** — no `.github/workflows` |
| Tests | ❌ **none** |
| Client JS shipped | ~646 KB raw / **~196 KB gzipped** |
| `package.json` / `package-lock.json` last touched | **7 January 2026** (`112f8a2`) — eight months stale |
| Node pinned? | ❌ no `.nvmrc`, no `.node-version`, no `engines` field |
| `npm audit` | **15 total** (11 high) · **6 reach production** (5 high, 1 moderate) |

---

## 1. Security first — and most of it isn't an upgrade

Only **6** of the 15 advisories reach production (`npm audit --omit=dev`). Traced to source:

| Advisory | Sev | Dependency path | Fix |
|---|---|---|---|
| `next` — Server Actions source code exposure | high (npm) / **5.3 medium** (GitHub CVSS) | direct | **Bump `next` ≥ 16.0.9** |
| `sharp` — libvips CVEs | high | `next` → `sharp@0.34.5` | Bump `next` |
| `postcss` — XSS via unescaped `</style>` | high | `next@16.0.7` → `postcss@8.4.31`; `@tailwindcss/postcss` → `postcss@8.5.6` | Bump `next` + `tailwindcss` |
| `nanoid` — infinite loop on negative size | high | `@sanity/client` → `nanoid@3.3.11`; `postcss` → `nanoid` | Bump `@sanity/client` + `tailwindcss` |
| `ws` — uninitialised memory disclosure | high | `@supabase/supabase-js` → `@supabase/realtime-js` → `ws@8.18.3` | **Delete the dependency — see §2** |
| `follow-redirects` — auth header leak on cross-domain redirect | moderate | `@sanity/client` → `get-it@8.7.0` → `follow-redirects@1.15.11` | Bump `@sanity/client` |

**Note on severity.** npm reports the Next advisory as *high*; [GHSA-w37m-7fhw-fmv9](https://github.com/advisories/GHSA-w37m-7fhw-fmv9) itself scores it **CVSS 5.3 Medium**. The advisory describes a crafted request to any App Router endpoint returning compiled Server Function source — business logic, not secrets, "unless they were hardcoded directly into Server Function code." This repo's route handlers read secrets from `process.env`, so exposure is limited to logic. It is tracked upstream as **CVE-2025-55183**, a React issue affecting **React 19.2.0** — the exact version pinned here.

**Fixed in `16.0.9`**, which is on the *current minor line*. `16.0.11` is the latest 16.0.x. So the security fix is a **patch bump**, not a minor — this is the single highest-value, lowest-risk change in this document and should not wait for the redesign.

---

## 2. Delete before you upgrade

**`@supabase/supabase-js` is never used at runtime. Remove it.**

```
$ grep -rn "lib/supabase" app components lib
>>> lib/supabase.ts is imported by ZERO files.
```

- `lib/supabase.ts` (6 lines) is the only file importing the package, and nothing imports `lib/supabase.ts`.
- The real integration is raw `fetch` against PostgREST — `app/api/waitlist/route.ts:160-166` posts to `${supabaseUrl}/rest/v1/waitlist` with `apikey` / `Authorization` headers. Same at `:102-107` for `failed_loops_syncs`.
- `lib/supabase.ts:4` reads `NEXT_PUBLIC_SUPABASE_ANON_KEY`, which is **absent from `.env.local`**. Had anything imported it, `createClient(url, undefined!)` would have thrown at module load.

Deleting `lib/supabase.ts` and the dependency:
- removes a **high-severity production advisory** (`ws`) with no upgrade at all,
- removes an entire 2.87 → 2.115 upgrade obligation,
- removes a dead env var and the confusion of two apparent Supabase access paths.

**This is the only line item here that makes the system smaller. Do it first.**

---

## 3. Tier 1 — safe patch and minor, batch them

All within existing semver ranges. One PR.

```bash
npm i next@16.0.11 eslint-config-next@16.0.11 \
      react@19.2.8 react-dom@19.2.8 \
      tailwindcss@4.3.3 @tailwindcss/postcss@4.3.3 \
      @sanity/client@7.27.0 @sanity/image-url@2.1.1 \
      @marsidev/react-turnstile@1.6.1
npm i -D eslint@9.39.5 @types/react@19.2.18 @types/react-dom@19.2.7 @types/node@20.19.43
npm rm @supabase/supabase-js      # see §2
```

| Package | From → To | Behavioural notes |
|---|---|---|
| `next` + `eslint-config-next` | 16.0.7 → **16.0.11** | **Security fix.** Patch line, no API change. Deliberately *not* 16.3.4 — see Tier 2 |
| `react` / `react-dom` | 19.2.0 → 19.2.8 | Patch. Carries the upstream CVE-2025-55183 fix |
| `tailwindcss` + `@tailwindcss/postcss` | 4.1.17 → 4.3.3 | Minor. **Check before merging:** the compiled CSS currently renders Tailwind's oklch `green-*` and `gray-*` families (`00-audit.md` §1.3). A Tailwind minor can shift default palette values, which would move rendered colours. Re-run the contrast script after upgrading |
| `@sanity/client` | 7.14 → 7.27 | Minor. Clears `follow-redirects` and `nanoid`. Try this before v8 |
| `@sanity/image-url` | 2.0.2 → 2.1.1 | Minor. `lib/sanity.ts:2` uses the named `createImageUrlBuilder` export, which 2.1 retains |
| `@marsidev/react-turnstile` | 1.4.0 → 1.6.1 | Minor. `WaitlistForm.tsx:3` uses only `Turnstile` + `TurnstileInstance` |
| `eslint` | 9.39.1 → 9.39.5 | Patch |
| `@types/*` | patch/minor | `@types/node` stays on **20.x** deliberately — see Tier 3 |

**Verify after:** `npm run build`, `npx eslint .`, `npm audit --omit=dev` (expect 0), and re-run `scratchpad/contrast.mjs` against the dev server to confirm no rendered colour moved.

---

## 4. Tier 2 — majors, one row each

### `next` 16.0.11 → 16.3.4

| | |
|---|---|
| **Breaking changes** | Three minors of accumulated change. No API removal affecting this repo's surface (App Router, `next/image`, `next/font`, `next/link`, route handlers, `revalidate`, `sitemap`/`robots`) |
| **Blast radius** | `next.config.ts`, `app/layout.tsx`, `app/page.tsx`, `app/api/*`, all `next/image` uses (10 files) |
| **Migration** | Bump, build, walk the four breakpoints, re-check the image-optimiser output |
| **Recommendation** | **Do it with the redesign, not before.** The security fix is already in 16.0.11. Taking three minors while also rewriting every component makes a regression impossible to attribute. |

### `@sanity/client` 7.27 → 8.5.0

| | |
|---|---|
| **Breaking changes** | **ESM-only** — CJS bundle, `./dist/*.cjs` and the CJS main entry are removed. **Node ≥ 22.12** (`engines: {"node":">=22.12.0"}`, verified via `npm view`); Node 20 left LTS in April 2026. Sanity's own note: *"For most users this will be an uneventful upgrade."* |
| **Blast radius** | **One file** — `lib/sanity.ts`. Uses only `createClient` and `.fetch()`, neither of which changed |
| **Migration** | Add `engines: {"node": ">=22.12"}` + `.nvmrc`, confirm Vercel's Node runtime is 22.12+, bump, build |
| **Recommendation** | **Safe, but gated on the Node pin.** Do it in the same PR as the `engines` field |

### `@portabletext/react` 6.2 → 8.0.1

| | |
|---|---|
| **Breaking changes** | **React 19 required** (`peerDependencies.react: "^19"`, verified) — the build loads `react/compiler-runtime`. **CJS exports removed**, ESM-only. **Node ≥ 22.12** |
| **Blast radius** | **One file** — `app/blogs/[slug]/page.tsx:4` imports `PortableText` and `PortableTextComponents`. That file also carries the repo's only two `font-mono` uses (`:90`, `:127`) |
| **Migration** | Repo is already on React 19.2.0, so the peer is satisfied. Bump, rebuild the three blog pages, eyeball rendering |
| **Recommendation** | **Do it with `@sanity/client` v8** — same Node gate, same subsystem, one QA pass. Skips v7 entirely, which is fine: v7→v8 adds no separate migration for this usage |

### `@vercel/analytics` 1.6.1 → 2.0.1 · `@vercel/speed-insights` 1.3.1 → 2.0.0

| | |
|---|---|
| **Breaking changes** | Functionally none for this repo. v2 introduces *resilient intake* — endpoints are discovered dynamically rather than at a fixed path. Vercel's note: *"Existing implementations will continue working as before"*, and to get resilient intake you "only need to update your packages and deploy". `speed-insights` 2.0.0 (10 March 2026) also relicenses Apache-2.0 → MIT. The other v2 additions are Nuxt-specific |
| **Blast radius** | **Two lines** — `app/layout.tsx:8-9`, subpath imports `@vercel/analytics/next` and `@vercel/speed-insights/next`, both retained |
| **Migration** | Bump. Deploy. Confirm events still land in the Vercel dashboard |
| **Recommendation** | **Do it now, with Tier 1.** Genuinely low risk, and resilient intake means fewer events lost to ad-blockers — which matters, because §8 recommends using this data to choose a direction |

---

## 5. Tier 3 — deliberate choices

### TypeScript 5.9.3 → 7.0.2 — **wait**

TypeScript 7.0 (8 July 2026) replaces the JS compiler with a native Go port, 8–12× faster on full builds. `npm outdated` offers 5.9 → 7, so this repo would absorb **both** 6.0's and 7.0's breaking changes at once.

Checked against this repo's `tsconfig.json`:

| TS 7 change | This repo | Status |
|---|---|---|
| `target: es5` removed | `"target": "ES2017"` | ✅ fine |
| `moduleResolution: node` removed | `"moduleResolution": "bundler"` | ✅ fine |
| `baseUrl` removed | not set; `paths` used standalone | ✅ fine |
| `strict` on by default | `"strict": true` already | ✅ fine |
| AMD/UMD/SystemJS output removed | `"module": "esnext"` | ✅ fine |
| **`types` defaults to `[]`** | **not set** — currently pulls in all `@types/*` | ⚠️ **must set explicitly**, e.g. `"types": ["node"]` |

So the config migration is one line. **The blocker is elsewhere:** TypeScript 7.0 ships **no public compiler API** (Microsoft says 7.1 will add one), and typescript-eslint therefore stays pinned to TS 6. This repo lints through `eslint-config-next/typescript` → typescript-eslint (`eslint.config.mjs:3`).

**Upgrading to TS 7 breaks linting.** Recommendation: **stay on 5.9 until TS 7.1 ships the new compiler API and typescript-eslint supports it.** Re-evaluate then. There is no benefit here worth a broken lint pipeline — this is a 5,500-line codebase where compile speed is not a problem.

### ESLint 9.39 → 10.10 — **do it, but after the redesign**

| ESLint 10 change | This repo | Status |
|---|---|---|
| Legacy `.eslintrc` support fully removed | already flat config (`eslint.config.mjs`, `defineConfig`) | ✅ **the big one doesn't apply** |
| Node `^20.19 \|\| ^22.13 \|\| >=24` | local 22.19 | ✅ fine |
| Several formatters moved out of core | default formatter only | ✅ fine |
| Config resolution now starts from each linted file's directory | single root config | ✅ fine |
| `eslint-config-next@16.3.4` peer | `eslint >=9.0.0` — permits 10 by range | ⚠️ permitted ≠ tested |

Low risk, but **fix the existing failures first** — `npx eslint .` is already red:

```
app/api/loops-retry/route.ts:59:50   error  Unexpected any                @typescript-eslint/no-explicit-any
app/blogs/[slug]/page.tsx:236:14     warning  Unused eslint-disable directive
app/blogs/[slug]/page.tsx:238:49     error  Unexpected any                @typescript-eslint/no-explicit-any
components/Hero.tsx:34:22            error  `'` can be escaped            react/no-unescaped-entities
```

`Hero.tsx:34` is the `Nigeria's` apostrophe — the same line whose forced `<br>`s produce the run-on accessible name (`00-audit.md` D4). All three directions rewrite that H1, so this error disappears as a side effect.

### `@types/node` 20 → 26 — **wait, then pin**

Jumping to 26 means declaring a Node 26 runtime. Pin Node explicitly first (§6), then move `@types/node` to match. Meanwhile the 20.19.43 patch is enough.

---

## 6. Node runtime must be pinned before the Sanity upgrades

Both `@sanity/client@8` and `@portabletext/react@8` require **Node ≥ 22.12**. This repo pins nothing — no `.nvmrc`, no `.node-version`, no `engines`. Vercel therefore picks the project default, which can change under you.

```jsonc
// package.json
"engines": { "node": ">=22.12.0" }
```
```
// .nvmrc
22.19.0
```

Set the matching Node version in Vercel → Project Settings → General → Node.js Version **before** merging Tier 2. Without this, the Sanity upgrades are a deploy-time failure waiting to happen.

---

## 7. Architecture debt worth fixing while we're in these files

### 7.1 Two token systems, one of them dead

`lib/styles.ts` is 92 lines headed *"Centralized design tokens"* and is **imported by zero files** (`00-audit.md` §1.4). Its values have already drifted from `globals.css` — it declares `heading1` at `lg:text-[3.5rem]`; the real Hero H1 is `lg:text-[3.25rem]` (`Hero.tsx:29`).

**Delete `lib/styles.ts`.** `globals.css` `@theme` is the single source of truth in Tailwind v4, and each direction in Phase 5 ships a complete replacement.

### 7.2 The `--font-sans` bug must be fixed regardless of direction

`@theme` emits `--font-sans: var(--font-space-grotesk)` on `:root`, but `next/font` defines `--font-space-grotesk` on `<body>` (`layout.tsx:140`) — a descendant. The reference is unresolvable in the scope where it is declared, so the site renders in the OS UI font while preloading 62 KB of unused webfont (`00-audit.md` §2). `--font-mono: var(--font-mono)` (`globals.css:52`) is self-referential in the compiled output.

Two fixes; take the second:
1. Move the `next/font` variable classes from `<body>` to `<html>`.
2. **Declare the families literally in `@theme`** and keep `next/font` only for the `@font-face` and preload. Less magic, cannot silently regress.

**This is a two-line fix with the largest single visual payoff in the audit.**

### 7.3 Extract the tax logic — before any UI work

`components/TaxEstimator.tsx` is 1,222 lines: bracket data, arithmetic, formatting, state and markup in one client component. Bracket data exists **twice** — `:5-23` drives calculation, `:979-1012` renders the display table. Two sources of truth for numbers that cost users money.

```
lib/tax/
  index.ts        TAX_YEAR = 2026; FIGURES_AS_AT = '2026-09-04'
  brackets.ts     NTA_2026, PITA_PRE_2026 — the ONLY definition, consumed by both maths and UI
  reliefs.ts      pension (basic+housing+transport), nhf, nhis, rentRelief, minimumWageExemption
  compute.ts      computeSalaryTax(input): TaxResult   — pure
                  computeCreatorTax(input): TaxResult  — pure
  format.ts       formatNaira, formatPercent
```

Pure functions, no React. This makes next year's change a **data edit**, and makes §7.6 possible. It also makes the three fixes in `03-tax-content-2026.md` (pension base, minimum-wage exemption, take-home arithmetic) testable rather than hopeful.

**Do this before the redesign.** It is independently shippable, invisible to users, and de-risks every direction.

### 7.4 Two client components exist only for decorative animation

Verified — both have **zero event handlers**:

| Component | Hooks | Handlers | Why it's `'use client'` |
|---|---|---|---|
| `AnimatedTaxCard.tsx` | `useState`, `useEffect` | **0** | A 4s `setInterval` rotating 10 fake figures |
| `AppDownload.tsx` | `useState`, `useEffect` | **0** | A 4s `setInterval` spinning a badge icon forever |

All three directions delete both animations. **Both then become server components** — less client JS, and it resolves the WCAG 2.2.2 failure at source. `Header`, `TaxEstimator`, `WaitlistForm` and `BlogCarousel` are genuinely interactive and stay client.

### 7.5 Images

| Fix | Evidence |
|---|---|
| **Remove `unoptimized` from `avatar-small.png`** (`Hero.tsx:98`) | Transfers **1,195 KB** to render at 40×43 px — over half the page's 2,234 KB |
| Re-encode sources | `hero-image.png` 3.5 MB, `phone-hand.png` 2.4 MB, `about-hero.png` 1.6 MB, `og-image.png` 1.5 MB. All are 1024²-ish PNGs that should be WebP/AVIF |
| Add `sizes` to every `fill` image | None currently set; the optimiser requests `w=3840` for a 554px slot |
| Re-check upscaling on a production build | Dev server showed `about-hero.png` at 341×315 natural rendering into 554×357. Marked `UNVERIFIED` in `00-audit.md` §7 — confirm against `next build && next start` |
| Set `formats: ['image/avif','image/webp']` in `next.config.ts` | Currently only `remotePatterns` is configured |

### 7.6 Dark mode

`layout.tsx:111-114` declares `themeColor: '#0f172a'` for `prefers-color-scheme: dark`, and **no dark styles exist** — the site promises the OS a dark theme it doesn't have.

Resolve it either way:
- **Direction A (Ledger)** ships dual-theme — the declaration becomes true.
- **Directions B and C** are single-theme by design — then **remove the dark `themeColor` entry**.

Leaving it as-is is the one option that stays wrong.

### 7.7 Smaller items

| Item | Location |
|---|---|
| `vercel.json` caches only `/favicon.ico` and `*.svg`; PNGs get no explicit policy | `vercel.json:12-30` |
| Scroll listener unthrottled and non-passive | `Header.tsx:17` |
| `revalidate = 3600` on the homepage, but its content is fully static | `app/page.tsx:14` — only `Resources` is dynamic; consider `revalidate` on that boundary alone |
| `baseline-browser-mapping` warns on every build | `npm i -D baseline-browser-mapping@latest` |
| No `.nvmrc`, no CI | §6, §8 |

---

## 8. Testing — the minimum worth having

There are none. Given `03-tax-content-2026.md` found the pension base wrong and the minimum-wage exemption missing, the priority is unambiguous.

**Add Vitest and test `lib/tax/` only.** Not components, not e2e — the arithmetic.

```bash
npm i -D vitest @vitest/coverage-v8
```

| Test | Why |
|---|---|
| Each of the six NTA bands at its exact boundary (₦800,000 / ₦800,001 / ₦3,000,000 …) | Off-by-one at a boundary is the classic bracket bug |
| Each of the six pre-2026 PITA bands at its boundary | Same, for the comparison |
| `₦0` income → `₦0` tax, both paths | Empty state |
| Pension = 8% of **basic+housing+transport**, not gross | The confirmed defect. Assert against `03-tax-content-2026.md` §4: ₦691,200, **not** ₦748,800 |
| Rent relief = `min(20% × rent, 500_000)`; assert the cap binds at rent > ₦2.5M | Cap logic |
| NHF = 2.5% of basic; zero when disabled | |
| Minimum-wage exemption: ₦70,000/month → ₦0 tax | Currently returns ₦6,000 |
| Take-home = gross − tax − pension − NHF − NHIS | Currently overstated by ₦1,027,800 in the demo case |
| Regime crossover: at ₦36M gross, NTA > PITA, and the delta is **negative** | Guards the honest-comparison requirement |
| Golden-file: the demo profile reproduces the audited figures exactly | Locks the transcription |

Roughly **25 assertions, half a day**, and it covers every place where being wrong costs a user money.

Then add CI — there is none:

```yaml
# .github/workflows/ci.yml
on: [push, pull_request]
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version-file: '.nvmrc', cache: npm }
      - run: npm ci
      - run: npx tsc --noEmit
      - run: npx eslint .          # fix the 3 existing errors first
      - run: npx vitest run
      - run: npm run build
```

Deliberately **no visual regression testing** at this stage — the whole design is about to change, so snapshots would be noise.

---

## 9. Recommended sequence

### Before the redesign — ships independently, invisible to users

| # | Change | Effort | Risk |
|---|---|---|---|
| 1 | **Delete `@supabase/supabase-js` + `lib/supabase.ts`** — clears a high-severity prod advisory | 30 min | Very low |
| 2 | **Tier 1 batch** incl. `next@16.0.11` — clears the remaining five prod advisories | 2 h | Low |
| 3 | **Fix `--font-sans`** — Space Grotesk finally renders | 15 min | Very low |
| 4 | **Remove `unoptimized` from the avatar** — halves page weight | 5 min | Very low |
| 5 | Pin Node (`.nvmrc` + `engines`), set it in Vercel | 30 min | Low |
| 6 | Fix the 3 lint errors; add CI | 2 h | Low |
| 7 | **Extract `lib/tax/` + Vitest suite** (§7.3, §8) | 1.5 d | Low — pure refactor under test |
| 8 | **Fix the three tax defects** under the new tests | 0.5 d | Low |
| 9 | Delete `lib/styles.ts` | 5 min | Very low |
| 10 | `@vercel/analytics`/`speed-insights` v2 | 30 min | Very low |

**~3 days.** Items 1–4 could ship this afternoon. Item 7 is the one that de-risks everything after it.

Do **8 before the redesign**, not with it: shipping a tax fix and a visual rewrite together means any complaint about a changed number is unattributable.

### With the redesign

| # | Change | Note |
|---|---|---|
| 11 | `next` → 16.3.4 + `eslint-config-next` | Three minors, absorbed while every component is being touched anyway |
| 12 | `@sanity/client` v8 + `@portabletext/react` v8 | Same Node gate, same subsystem, one QA pass. **Requires #5** |
| 13 | Image re-encode, `sizes`, AVIF/WebP | Directions B and C use full-bleed imagery; do it as part of the art direction |
| 14 | `AnimatedTaxCard` + `AppDownload` → server components | Falls out of removing the animations |
| 15 | Resolve `themeColor` — ship dark (A) or drop the declaration (B/C) | |

### After

| # | Change | Gate |
|---|---|---|
| 16 | ESLint 10 | After the redesign settles and lint is green |
| 17 | `@types/node` 26 | After the Node runtime is deliberately raised |
| 18 | **TypeScript 7** | **Blocked** until 7.1 ships the compiler API and typescript-eslint supports it. Re-evaluate; do not force |

---

## Sources

- [GHSA-w37m-7fhw-fmv9 — Next.js Server Actions Source Code Exposure](https://github.com/advisories/GHSA-w37m-7fhw-fmv9) — CVSS 5.3; upstream CVE-2025-55183; fixed in 16.0.9 among others.
- [Sanity changelog — Node 22+ ESM-only support and refined upload, proxy, and error handling](https://www.sanity.io/docs/changelog/6c3650a7-8317-458f-bfa6-44c1ca4c9095) — `@sanity/client` v8 breaking changes.
- [portabletext/react-portabletext — releases & CHANGELOG](https://github.com/portabletext/react-portabletext/releases) — v8: React 19 peer, ESM-only, Node ≥22.12.
- [vercel/analytics releases](https://github.com/vercel/analytics/releases) and [vercel/speed-insights releases](https://github.com/vercel/speed-insights/releases) — v2.0.
- [Vercel changelog — Improved data collection for Web Analytics and Speed Insights with resilient intake](https://vercel.com/changelog/improved-data-collection-for-web-analytics-and-speed-insights-with-resilient) — "existing implementations will continue working as before".
- [ESLint v10.0.0 released](https://eslint.org/blog/2026/02/eslint-v10.0.0-released/) and [Migrate to v10.0.0](https://github.com/eslint/eslint/blob/main/docs/src/use/migrate-to-10.0.0.md).
- [TypeScript 7.0 RC: The Go-Native Compiler Has Landed](https://www.digitalapplied.com/blog/typescript-7-0-rc-go-native-compiler-2026-upgrade-guide) and [TypeScript 7 is out — the native Go port](https://typescriptpro.com/blog/typescript-version-7-2026-07-08) — no public compiler API in 7.0; typescript-eslint pinned to TS 6.
- Version and engine data: `npm outdated`, `npm view <pkg> engines|peerDependencies`, `npm ls <pkg>`, `npm audit --omit=dev`, run in this repo on 4 September 2026.
