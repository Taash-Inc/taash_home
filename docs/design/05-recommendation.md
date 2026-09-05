# Recommendation

> **SUPERSEDED IN PART — 4 Sep 2026.** Decision taken: adopt **Direction A · Ledger for the tax calculator only**; the rest of the page keeps its current design. §4 (Phased plan) and §5 (Open questions) below are replaced by **`06-scope-estimator-only.md`**. §1–§3 still stand.

**Reading order:** `00-audit.md` (what's wrong) → `03-tax-content-2026.md` (what's wrong with the numbers) → the three `01-direction-*.md` → `04-upgrade-plan.md` (platform) → this.
**Look at:** `previews/compare.html` — three live previews, two moments, two widths.

---

## 1. Comparison matrix

Scores are 1–5. The reasoning is the point; the numbers are shorthand.

| | **A · Ledger** | **B · Broadsheet** | **C · Daylight** |
|---|:--:|:--:|:--:|
| Modernity | **5** | 4 | 3 |
| Brand fit | 3.5 | 3 | **5** |
| Conversion potential | 4 | 3 | **5** |
| Accessibility | **5** | 4.5 | 4 |
| Implementation cost *(higher = cheaper)* | 2.5 | **4** | 3 |
| Maintenance burden *(higher = lighter)* | 2 | **5** | 3.5 |
| **Total** | **22** | **23.5** | **23.5** |

**The totals are a tie, which is why the reasoning matters more than the score.**

### Modernity — A 5 · B 4 · C 3

**A** is the current idiom for financial software: dense, monospaced figures, hairline rules, dual theme. It reads as a tool built by people who use tools.
**B** is contemporary in a different register — editorial restraint is having a real moment — but warm paper plus a serif carries a newspaper association that could read as *retro* rather than *considered*. High ceiling, real downside.
**C** scores lowest, and this is the finding that should worry you most: **warm consumer fintech with rounded cards, friendly photography and a stepped flow is the single most generated-looking vocabulary on the web.** It is what a model produces when asked for a fintech landing page. C is well-executed, but it is fighting the original complaint with the original complaint's own materials.

### Brand fit — A 3.5 · B 3 · C 5

**C** is closest to what Taash already is: warm photography of young Nigerians, the yellow, the friendly register. It promotes `#ffea66` — currently a decorative dot — into a real surface, and it is the only direction whose art direction makes `freelancers/creators/smes.png` the point rather than the garnish.
**A** preserves the *palette* best. The measured argument: `#3b82f6` is **3.68:1 on white (fails AA)** and **4.85:1 on `#0f172a` (passes)**. The company's primary blue only works as a text colour in dark mode. A also recovers `#4a7fa7` — the logo's own blue, present in no token today. But it duotones the photography, turning down the warmest thing the brand owns.
**B** preserves the hues but changes the feel most: a warm paper ground against a blue logo is a genuine shift.

### Conversion potential — A 4 · B 3 · C 5

All three fix the two structural holes: no CTA anywhere in the estimator, and an answer buried ~2,400px below the inputs.
**C** wins on the metric that matters here — time-to-first-number on a phone, which is where this audience is. Answer pinned from the first keystroke, 56px inputs, biggest CTAs.
**A** puts the answer beside the input on desktop and carries a persistent CTA in the rail. Its mobile solution — a sticky *bottom* bar — is the weakest of the three (see §2).
**B** is honest about its own cost: *"there is no visual pressure anywhere in this design."* For a page whose only job is signups, that is a real deduction.

### Accessibility — A 5 · B 4.5 · C 4

**A** is the only direction where **no body-size pairing falls in the 3.0–4.5 band** — the band the current site lives in — and it clears AA in both themes.
**B** gets a lot for free: 19px body, a 68ch measure, real `<table>` semantics for the worksheet, and essentially no motion (so the reduced-motion experience is identical to the default — the strongest possible 2.2.2 position). Deducted for input borders that measure 2.13:1 on paper and need a documented workaround, and for serif rendering on low-DPI Android.
**C** is fine but tightest: `sand-500` input borders at **3.01:1** have no margin against the 3:1 minimum, and text over photography depends on a scrim that hasn't been tested against the final grade.

### Implementation cost — A 2.5 · B 4 · C 3

**A** ~13–17 days; dual theme roughly doubles visual QA, and the estimator is a restructure.
**B** ~11–14 days, and the estimator is structurally *simpler* than what exists — a worksheet has fewer components than six card types.
**C** ~12–16 days **plus 2–3 days of art direction**, and it has the highest variance: if the grading and re-crops get cut, what ships is worse than today because the existing images' flaws scale up.

### Maintenance burden — A 2 · B 5 · C 3.5

**A** dual theme means every future change is made and checked twice, forever, by one developer.
**B** single theme, no cards, fewest components, no image pipeline.
**C** single theme but three card tiers plus a build-time image pipeline to keep working.

---

## 2. The pick: **A · Ledger**

Committing to one, on four grounds.

**1. The complaint is loudest about the calculator, and A is the direction that most transforms it.** Your words: *"the tax calculator worst of all."* The estimator is also the only genuinely interactive, differentiated thing on the site — everything else is a marketing page. A is the only direction that treats it as an instrument: the answer sits beside the inputs, every figure is monospaced so `₦1,213,764` and `₦1,308,272` align digit-for-digit **across columns**, and the comparison gets a shared baseline so the difference is visible before either number is read.

**2. The strongest evidence-based argument in the whole audit points at A.** `#3b82f6` fails AA on white and passes on `#0f172a`. Every direction has to work around the brand blue in light mode; only A also gives it a surface where it is correct as-is. And `layout.tsx:111-114` already declares `themeColor: '#0f172a'` for dark — the site promises the OS a dark theme it does not have. A makes that promise true; B and C require deleting it.

**3. A breaks the specific tells that produced the complaint.** Generated layouts are centred, carded, evenly spaced. A is left-aligned, ruled and unevenly spaced, and it puts a 56px monospaced number where a generated layout puts a 36px centred heading. C is the direction most likely to land back in the same place — see §1, Modernity.

**4. The cost premium buys the thing you'd otherwise rebuild.** A is the most expensive by ~3 days, and roughly all of that is the estimator restructure. That work is not decorative — it's the fix for A1 (no CTA), A4 (answer buried) and tell 7 (density) simultaneously.

### One amendment to A, before it ships

**Move the mobile answer from a sticky bottom bar to a sticky top strip.** A's own document flags the risk honestly: iOS Safari's collapsing toolbar makes `position: sticky; bottom: 0` unreliable. B demonstrates the top variant works — it sits under the header, avoids the bottom-chrome problem entirely, and keeps reading order intact. Compare the two in `previews/compare.html` at Mobile 390. This is a correction to a weakness A already identifies, not a blend of directions.

### What choosing A costs you

Warmth, and the photography. A is a competent, slightly cold instrument. For a first-time filer who is anxious about tax, "serious financial tool" is not obviously the right first impression — and duotone-ing the photography turns down the most human asset the brand owns. **If the analytics in §5 show most sessions ending before the estimator, that assumption is wrong and C is the better bet.** I'd want that number before the build starts, not after.

### If you overrule me

Take **B**, not C. B is cheaper, lighter to maintain, more distinctive, and its worksheet is the clearest explanation of a tax calculation of the three. Its risk is a taste call — serif body — that you can settle in an hour by looking at `previews/broadsheet.html` on your phone. C's risk is structural and can't be looked away: it is the vocabulary the original complaint was about.

---

## 3. Fix regardless of direction

None of this depends on which way you go. Several are hours, not days.

### Correctness — these are wrong now

| Fix | Where | Impact |
|---|---|---|
| **Pension base → basic + housing + transport**, not gross | `TaxEstimator.tsx:105` | Understates tax by **₦10,368/yr** in the audited case. PRA 2014 s.4(1) + FCT-IRS |
| **"Annual Take-Home" must net off pension, NHF, NHIS** | `:143`, `:213` | Overstates by **₦1,027,800/yr** (₦85,650/mo) in the audited case |
| **Stop styling the new regime as better when it is worse** | `:805-807`, `:865`, `:899` | Above ≈₦20M/yr the user pays more, the banner silently vanishes, and a red strikethrough still crosses the *cheaper* number |
| **Implement the national-minimum-wage exemption** | `:94-167` | A ₦70,000/month earner is shown ₦6,000/yr of tax they don't owe |
| **Add basis + as-at date to the disclaimer, and lift it next to the result** | `:1033-1041` | Currently 12px at the foot of a 2,304px section |

### Content — live on `www.taash.tax` right now

| Fix | Where |
|---|---|
| **Persona images are swapped** — "Small Businesses" shows a creator, "Workers" shows an SME | `WhoItsFor.tsx:11-22` |
| Missing space after a full stop, two places | `Hero.tsx:42`, `AppDownload.tsx:86` |
| **Privacy-policy link on the consent checkbox points at `#`** while `/privacy` exists | `WaitlistForm.tsx:244` |
| H1's forced `<br>`s produce the accessible name *"Effortless Tax andFinance for…"* | `Hero.tsx:29-37` |
| Store badges link to `#` | `AppDownload.tsx:93,104` |
| Hero card cites "vs Q2 2024" / "vs 2023" on a 2026 site | `AnimatedTaxCard.tsx:22,30` |
| Feature icon `alt` contradicts the heading above it | `Features.tsx:9-28` |

### Accessibility — WCAG 2.1 AA failures

| Fix | Where |
|---|---|
| NHF toggle has **no name, role or state** — announces as "button" | `TaxEstimator.tsx:531-541` |
| Pension slider has **no accessible name** | `:509-517` |
| Both modals: no `role="dialog"`, no focus trap, no Escape, unnamed close button | `:1047-1219`, `WaitlistForm.tsx:282-326` |
| Two components auto-rotate with no pause (2.2.2); zero `prefers-reduced-motion` anywhere | `BlogCarousel.tsx:37`, `AnimatedTaxCard.tsx:53` |
| Carousel dots are 8×8px (2.5.8) | `BlogCarousel.tsx:95` |
| Form errors and success are not announced (4.1.3) | `WaitlistForm.tsx:251,282` |
| No `inputMode` — every currency field opens an alphabetic keyboard | repo-wide |

### Platform — from `04-upgrade-plan.md`

| Fix | Effort |
|---|---|
| **Delete `@supabase/supabase-js` + `lib/supabase.ts`** — unused; removes a high-severity production advisory with no upgrade | 30 min |
| **Bump `next` → 16.0.11** — fixes GHSA-w37m-7fhw-fmv9 on the current minor line | 1 h |
| **Fix `--font-sans`** — Space Grotesk has never rendered; 62 KB preloaded for nothing | 15 min |
| **Remove `unoptimized` from `avatar-small.png`** — 1,195 KB for a 40px slot, over half the page's bytes | 5 min |
| Delete `lib/styles.ts` — 92 lines of "centralized tokens", imported by zero files | 5 min |
| Pin Node (`.nvmrc` + `engines`); fix the 3 existing lint errors; add CI | half a day |
| **Extract `lib/tax/` + Vitest suite** | 1.5 days |

---

## 4. Phased plan

### Phase 0 — Foundations · ~3 days · independently shippable, invisible

Everything in §3 under Platform, plus the five correctness fixes and the content fixes. **Nothing here depends on the design choice.**

Sequence matters in one place: **extract `lib/tax/` and get the tests green *before* fixing the tax figures**, so each figure change is a red-to-green test rather than a hope. And ship the tax fixes **before** the redesign — shipping a changed number alongside a changed design makes any complaint unattributable.

*Risk: low. Highest-value hours in the whole plan.*

### Phase 1 — Token foundation · ~2 days · shippable alone

Land Ledger's `@theme` block, the semantic layer, both themes, the theme toggle, and the icon normalisation (one 20px grid, 1.5px stroke, `currentColor`). Apply to `Header` and `Footer` only.

*Why alone: it proves the token system on two low-risk components and gives you something to look at before the expensive part. Risk: low.*

### Phase 2 — The estimator · ~7 days · the whole point

Rebuild against `lib/tax/`. Two-pane layout, sticky result rail, mono figures, shared-baseline comparison, drawer instead of modal, **sticky top strip on mobile** (§2 amendment), and the waitlist handoff.

*Risk: **highest in the plan.** Mitigations: `lib/tax/` is already extracted and tested, so the arithmetic can't regress silently; build behind a flag or on a branch deployed to a preview URL and compare against production with real numbers before cutting over; test the sticky behaviour on a real iPhone, not a simulator.*

### Phase 3 — Marketing sections · ~5 days

Hero (duotone, decorations removed, floating cards made honest), About, Features, WhoItsFor (images un-swapped), AppDownload (demoted to 48px), WaitlistForm, Resources (auto-rotation removed). **Reinstate `HowItWorks`** — it's the only section explaining mechanism, and without it `connect-bank.svg` is orphaned.

*Risk: low. Each section is independent; ship them one at a time if you want.*

### Phase 4 — Platform catch-up · ~2 days

`next` → 16.3.4, `@sanity/client` v8 + `@portabletext/react` v8 (needs the Node pin from Phase 0), image re-encode and `sizes`, `AnimatedTaxCard` and `AppDownload` → server components.

*Risk: low-medium. The Sanity pair touches only `lib/sanity.ts` and one blog page.*

### Deferred

ESLint 10 (after lint is green). **TypeScript 7 — blocked** until 7.1 ships the compiler API; upgrading now breaks typescript-eslint and therefore linting.

**Total ≈ 19 days.** Phase 0 alone fixes every correctness and security defect in the audit and can ship this week.

---

## 5. Open questions — I need these before implementation starts

1. **What do the analytics say?** Vercel Analytics has been installed since at least January (`layout.tsx:142`) and I have no access. Specifically: what share of sessions are mobile, what share scroll to `#tax-estimator`, and what share reach `#waitlist`? **If most sessions end before the estimator, my pick is wrong and C is the better bet.** This is the single question most likely to change the recommendation.

2. **Is the art-direction budget real?** Not for Ledger — for knowing whether C was ever viable. C without image work ships worse than today.

3. **Are the `HowItWorks` claims accurate?** It asserts bank connection and AI categorisation as capabilities. On a pre-launch waitlist page that may be aspirational. I can't verify it from the repo, and it changes whether the section returns as-is.

4. **Do you want the "you save vs PITA" story kept as a headline?** I've argued it should be demoted to a secondary, signed panel: PITA stopped being a live alternative on 1 January 2026, and above ≈₦20M/yr the framing is actively false. If it's load-bearing for marketing, say so and I'll design around it honestly rather than removing it.

5. **Who owns the tax figures?** Two are wrong now. Someone needs to sign off on the corrected pension base and the minimum-wage exemption — ideally a Nigerian tax adviser, not me. My sourcing is in `03-tax-content-2026.md`; the NHF base (basic vs monthly income) is still marked `UNVERIFIED`.

6. **Is dark mode wanted, or just permitted?** It's ~30% of Ledger's cost and all of its ongoing maintenance premium. If nobody will ever look at it, take Ledger's light theme only and drop the `themeColor` dark entry — the direction survives intact and gets meaningfully cheaper.

7. **Store links.** `AppDownload.tsx:93,104` point at `#`. Real URLs, or an honest "coming soon" disabled state?
