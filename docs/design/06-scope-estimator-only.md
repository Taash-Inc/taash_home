# Revised scope — Direction A, tax calculator only

**Decision (4 Sep 2026):** adopt **Direction A · Ledger** for `components/TaxEstimator.tsx` only. The rest of the page keeps its current design; the hero in particular is staying as it is.

This supersedes §4 of `05-recommendation.md`.

---

## 1. What the narrower scope changes about Direction A

### ~~Dark mode is dropped~~ — **REVISED, see `07-dark-band-hero-motion.md`**

> I originally wrote that you cannot have a dark calculator inside a light page. That was wrong — I conflated a dark *theme* with a dark *band*. An always-dark estimator **section** needs no theme system, costs ~0.5 day, and is the better answer. `07` supersedes this subsection; the rest of the document stands.

The paragraph below described dropping dark mode entirely. Kept for the record.

**Being straight about this:** one of my four stated reasons for picking A was that `#3b82f6` fails AA on white (3.68:1) and passes on `#0f172a` (4.85:1) — the brand blue is only correct as text in dark mode. Dropping dark mode **removes that argument**. The pick still stands on its primary ground, which was your own reason too: A is the direction that most transforms the calculator. But I don't want that reason quietly disappearing from the file.

Two consequences:
- Inside the estimator, links and small text use **`blue-600 #2c70df` (4.68:1 on white)**, not `#3b82f6`. The brand blue survives as button fill, focus ring and chart colour, where 3:1 is the applicable threshold.
- `layout.tsx:111-114` declares `themeColor: '#0f172a'` for `prefers-color-scheme: dark` and no dark styles exist. With dark mode off the table, **that entry should be removed** — it currently promises the OS a theme the site does not have.

**Saving: ~1.5 days of build and QA, and the entire ongoing maintenance premium.**

### The token layer becomes additive, not a replacement

Ledger's `@theme` was written to replace the page's palette. Scoped to one section, it instead lands **alongside** the existing tokens. Nothing that `Hero`, `About`, `Features`, `WhoItsFor`, `AppDownload`, `WaitlistForm`, `Resources`, `Header` or `Footer` reads is touched, so those sections cannot shift.

I checked whether two neutral families on one page would clash. They don't:

| Existing (Tailwind slate) | Proposed (ink, derived from `#0f172a`) | Difference |
|---|---|---|
| `--text-gray #64748b` — hue 218°, sat 51% | `ink-600 #717680` — hue 221°, sat 24% | **1.04:1** |
| `--text-dark #1e293b` — 222°, 70% | `ink-900 #303338` — 219°, 25% | 1.15:1 |
| `--border #e2e8f0` — 215°, 13% | `ink-200 #dadce1` — 223°, 7% | 1.11:1 |
| `--text-light-gray #94a3b8` — 217°, 38% | `ink-500 #8a8f99` — 221°, 20% | 1.27:1 |

Same hue family throughout (215–223°); the proposed ramp is simply a **desaturated slate**. Corresponding steps differ by 1.04–1.27:1, which is indistinguishable when adjacent. No visible seam at the section boundary.

**Do not delete the old tokens in this pass.** They're load-bearing for nine components that aren't changing. `lib/styles.ts` is still safe to delete — it's imported by zero files.

### Section rhythm: a smaller bump than Ledger proposed

Ledger gave the estimator `--space-section-xl` (160px) against neighbours at 80px. With every neighbour keeping `py-20`, a 2× jump would read as a mistake rather than emphasis.

**Use 112px (`py-28`).** Enough to signal that the section is more important than the blog carousel, not so much that it looks detached. Also replace the current `bg-gradient-to-b from-white to-[#f8fafc]` (`TaxEstimator.tsx:250`) with a **flat sunken band plus hairline top and bottom rules**, so the section reads as a distinct object against the white sections either side.

### Icons

Only the estimator's **11 inline SVGs** get normalised to one 20px grid at 1.5px stroke. The other 23 inline SVGs and the five illustrative files keep their current inconsistency. Contained, and invisible unless you're comparing sections deliberately.

---

## 2. The one thing that leaks out of scope: the font

**This needs your decision before Phase 0.**

The brand typeface has never rendered. `@theme` emits `--font-sans: var(--font-space-grotesk)` on `:root`, but `next/font` defines that variable on `<body>` — a descendant — so the reference is unresolvable and the page falls back to the OS UI font (`00-audit.md` §2). Verified by measurement: the H1 string at 52px/700 renders **625px wide**, identical to `system-ui`, and 35px narrower than Space Grotesk's 660px.

**The hero you like is currently rendering in the operating system's default font.** Fixing the variable is one line, but it changes the typography of the entire page — including the hero.

I captured both so you can judge rather than take my word:

- `screenshots/fontfix-before-current.png` — production today
- `screenshots/fontfix-after-spacegrotesk.png` — the same hero with the fix applied

**My read: it improves it.** Space Grotesk is tighter and more distinctive than the system font, the wordmark and the headline finally agree, and the curly apostrophe in "Nigeria's" renders properly. But it is a change to a section you asked me not to change, so it's your call.

Three options:

| | What happens | Font weight shipped |
|---|---|---|
| **A — Fix globally** *(recommended)* | Whole page gets Space Grotesk. Hero changes as shown in the screenshots | 62 KB, all of it used |
| **B — Scope the fix to the estimator** | Hero stays byte-identical. Estimator gets Space Grotesk + JetBrains Mono | 62 KB, ~half used |
| **C — Don't fix it** | Nothing changes. The estimator also renders in the system font | 62 KB, ~40 KB used (mono only) |

Option C is the only one I'd argue against: it keeps preloading a webfont that renders nowhere on the homepage. Between A and B, look at the two screenshots and decide.

**JetBrains Mono is unaffected by this choice.** It already loads and works; the estimator simply starts using it for figures, which is where roughly all of its value was always going to be.

---

## 3. Revised phases

**≈ 11 days, down from 19.**

### Phase 0 — Foundations · ~3 days · unchanged, ships independently

Nothing here is a design change, so the narrower scope doesn't touch it.

| | Effort |
|---|---|
| Delete `@supabase/supabase-js` + `lib/supabase.ts` — unused; clears a high-severity production advisory | 30 min |
| Bump `next` → 16.0.11 — fixes GHSA-w37m-7fhw-fmv9 | 1 h |
| Fix `--font-sans` — **per your decision in §2** | 15 min |
| Remove `unoptimized` from `avatar-small.png` — 1,195 KB for a 40px slot | 5 min |
| Delete `lib/styles.ts` | 5 min |
| Add `scroll-padding-top` so "Try Tax Estimator" doesn't land under the fixed header | 5 min |
| Pin Node (`.nvmrc` + `engines`); fix the 3 lint errors; add CI | half a day |
| **Extract `lib/tax/` + Vitest suite** | 1.5 days |
| **Fix the five tax defects** under the new tests | half a day |

Still ship the tax fixes **before** the redesign, so a changed number and a changed design don't land together.

### Phase 1 — Scoped token layer · ~0.5 day *(was 2 days)*

Add Ledger's ramps and semantic layer to `globals.css` **alongside** the existing tokens. No dark blocks, no theme toggle, no `Header`/`Footer` restyle. Nothing consumes the new tokens yet, so this is a no-op deploy that de-risks Phase 2.

### Phase 2 — The estimator · ~5.5 days *(was 7)* · the whole job now

Rebuild `TaxEstimator.tsx` against `lib/tax/`: two-pane layout with a sticky result rail, monospaced tabular figures, shared-baseline comparison, drawer instead of modal, the section-ground and 112px spacing change, and the waitlist handoff. All 25 instruments per the mapping table in `01-direction-ledger.md` §6.

**Mobile amendment stands:** sticky **top** strip, not a bottom bar — iOS Safari's collapsing toolbar makes `position: sticky; bottom: 0` unreliable, and `previews/compare.html` at Mobile 390 shows the top variant working.

*Risk: highest in the plan, and now the only risky phase. Mitigations unchanged — `lib/tax/` is tested first, build on a preview deployment, compare against production with real numbers before cutover, test sticky behaviour on a real iPhone.*

### Phase 3 — ~~Marketing sections~~ · **removed** *(was 5 days)*

### Phase 4 — Platform catch-up · ~1.5 days *(was 2)*

`next` → 16.3.4, `@sanity/client` v8 + `@portabletext/react` v8 (needs the Node pin from Phase 0). Image re-encode drops to just the four oversized PNGs — no full-bleed work needed. `AnimatedTaxCard` and `AppDownload` stay client components, because their animations aren't being removed (see §4).

---

## 4. What stays broken

Choosing this scope leaves the following unaddressed. Split by whether fixing them would actually change any design.

### Defect fixes that change no design — I'd still do these

Each is minutes, and none alters a layout you've said you like.

| Fix | Where |
|---|---|
| **Persona images are swapped** — "Small Businesses" shows a creator, "Workers" shows an SME | `WhoItsFor.tsx:11-22` |
| **Privacy-policy link on the consent checkbox points at `#`** while `/privacy` exists | `WaitlistForm.tsx:244` |
| Missing space after a full stop, live in production | `Hero.tsx:42`, `AppDownload.tsx:86` |
| H1's forced `<br>`s produce the accessible name *"Effortless Tax andFinance for…"* | `Hero.tsx:29-37` — removable without changing the visible line breaks |
| Store badges link to `#` | `AppDownload.tsx:93,104` |
| Feature icon `alt` contradicts its heading | `Features.tsx:9-28` |
| Hero card cites "vs Q2 2024" / "vs 2023" on a 2026 site | `AnimatedTaxCard.tsx:22,30` — data only |
| Form errors and success not announced (`role="alert"`, live region) | `WaitlistForm.tsx:251,282` |
| Mobile menu toggle missing `aria-expanded` | `Header.tsx:80-83` |

### Accessibility failures that survive this scope

These are **WCAG 2.1 AA failures outside the estimator**. Worth knowing you're carrying them:

| Failure | Where | Criterion |
|---|---|---|
| `BlogCarousel` auto-advances every 5s, `AnimatedTaxCard` every 4s — **no pause mechanism** | `BlogCarousel.tsx:37`, `AnimatedTaxCard.tsx:53` | **2.2.2 Pause, Stop, Hide** |
| Zero `prefers-reduced-motion` support outside the estimator | repo-wide | 2.3.3 |
| Carousel dots are 8×8 px | `BlogCarousel.tsx:95` | 2.5.8 Target Size |
| Success modal: no `role="dialog"`, no focus trap, no Escape | `WaitlistForm.tsx:282-326` | 2.1.2, 4.1.2 |
| `#3b82f6` on `#C5E2FF` = **2.75:1** ("Limited Early Access") | `WaitlistForm.tsx:131` | 1.4.3 |
| `#94a3b8` on white = 2.56:1 (blog dates) · `#00c950` on white = 2.22:1 (hero card) · `#64748b` on `#e8f4fc` = 4.26:1 | `BlogCarousel`, `AnimatedTaxCard.tsx:88`, `Features.tsx:117` | 1.4.3 |

The 2.2.2 failures are the ones I'd flag hardest — they're the clearest AA breaches on the page, and adding a pause control to the carousel is perhaps two hours.

### Conversion issue that survives

**The mobile menu has no waitlist CTA above 200px of scroll.** The desktop button is `hidden sm:flex` (`Header.tsx:59-61`) and the menu's CTA is gated behind `scrollY > 200` (`:14,124-127`). On a phone at the top of the page, opening the menu shows four links and no way to join. That's a `Header` change, so it's out of scope — but it's a one-line condition removal, not a redesign.

### Design findings now accepted as-is

Uniform `py-20` rhythm across the other eight sections (tell 2) · the centred badge → H2 → subhead template in seven of eight (tell 3) · identical `rounded-2xl` + `hover:shadow-lg` card treatment (tell 4) · the hero's four decorative dots and blobs (tell 6) · inconsistent icon grids outside the estimator (tell 9) · `HowItWorks` stays commented out, so `connect-bank.svg` stays orphaned.

---

## 5. Open questions — reduced to four

Three of the seven in `05-recommendation.md` are now moot (art-direction budget, `HowItWorks` claims, dark mode — answered by this scope).

1. **Font: option A, B or C in §2?** Blocks Phase 0. Look at the two screenshots.
2. **Do you want the "you save vs PITA" story kept as a headline?** I've argued it should become a secondary, signed panel — PITA stopped being a live alternative on 1 January 2026, and above ≈₦20M/yr the framing is false. If it's load-bearing for marketing, say so and I'll design it honestly rather than demoting it.
3. **Who signs off on the corrected tax figures?** Two are wrong now. Ideally a Nigerian tax adviser, not me. Sourcing is in `03-tax-content-2026.md`; the NHF base is still `UNVERIFIED`.
4. **Do you want the nine defect fixes in §4?** They change no design. I'd default to yes unless you say otherwise.
