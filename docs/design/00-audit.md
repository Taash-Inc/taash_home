# Taash — Design & Platform Audit

**Scope:** `https://www.taash.tax/` and the local `main`-equivalent build of this repo.
**Date of capture:** 4 September 2026. **Local build:** Next.js 16.0.7 dev server on `:3001`. **Live build:** Next.js 16.0.7.
**Rule applied throughout:** every claim below cites `file:line`, a captured screenshot in `docs/design/screenshots/`, or a command and its output. Anything I could not verify from a primary source is marked `UNVERIFIED`.

---

## 0. Method

| What | How |
|---|---|
| Screenshots | Chrome 152 headless via CDP (`Page.captureScreenshot`, `captureBeyondViewport`), DPR 2–3, at 390 / 768 / 1280 / 1920 |
| Interaction states | Scripted through CDP: native value setters + `input` events so React state updates as it would for a real user |
| Contrast | Every rendered text node's computed `color` and its resolved composited background, normalised through a 1×1 canvas (so `oklch`/`lab` values are converted to sRGB before the WCAG relative-luminance formula) |
| Inventory | `grep -rhoE` over `components/` and `app/`, counted — not eyeballed |
| Tax arithmetic | The component's bracket logic transcribed verbatim into `scratchpad/taxmath.mjs` and run across an income sweep |

A first pass of the contrast audit mis-parsed Chrome's `lab()` colour output and produced false failures. The numbers in §4 are from the corrected canvas-normalised pass. I mention this because the corrected run is the only one I am reporting.

---

## 1. Visual inventory — what is actually in use

### 1.1 Vertical rhythm

Measured on the rendered page at 1280 (`scratchpad/rhythm.mjs`):

| Section | Height | padding-top | padding-bottom |
|---|---:|---|---|
| Hero | 810px | 112px | 64px |
| `#about` | 627px | 80px | 80px |
| `#features` | 842px | 80px | 80px |
| `#who-its-for` | 738px | 80px | 80px |
| **`#tax-estimator`** | **2304px** | **80px** | **80px** |
| `#download` | 660px | 80px | 80px |
| `#waitlist` | 1035px | 80px | 80px |
| `#resources` | 856px | 80px | 80px |

**Two distinct padding pairs across eight sections.** Source: `py-20` on `About.tsx:5`, `Features.tsx:64`, `WhoItsFor.tsx:26`, `TaxEstimator.tsx:250`, `AppDownload.tsx:20`, `WaitlistForm.tsx:104`, `Resources.tsx:24`, `HowItWorks.tsx:60`; `pt-28 pb-16` on `Hero.tsx:7`.

### 1.2 Radii, shadows, weights, sizes

| Token class | Distinct values in use | Counts |
|---|---|---|
| Border radius | **7** | `rounded-full` ×34, `rounded-lg` ×26, `rounded-2xl` ×19, `rounded-xl` ×13, `rounded` ×6, `rounded-3xl` ×5, `rounded-[50%]` ×1 |
| Shadow | **6** | `shadow-sm` ×10, `shadow` ×5, `hover:shadow-lg` ×5, `shadow-xl` ×4, `shadow-lg` ×2, `shadow-2xl` ×2 |
| Font weight | **3** | `font-bold` ×97, `font-medium` ×64, `font-semibold` ×8 |
| Font size | **11** | `text-sm` ×60, `text-xs` ×38, `text-2xl` ×37, `text-lg` ×34, `text-xl` ×12, `text-3xl` ×11, `md:text-4xl` ×8, `text-4xl` ×4, `md:text-5xl` ×4, `text-base` ×1, `md:text-3xl` ×1 |

`text-base` — the 16px default — is used **once** in the entire component tree. The page is written in 14px and 12px.

### 1.3 Colour actually rendered

Sampled from every element's computed styles on the live DOM (`scratchpad/rhythm.mjs`).

**Greens rendered: 5** — `#008236` ×56, `#00a63e` ×18, `#00c950` ×12, `#dbfce7` ×2, `#7bf1a8` ×2.
The declared token `--green: #22c55e` (`globals.css:23`) **does not appear on the page at all**. Those five are Tailwind v4's oklch `green-700/600/500/100/300`.

**Blues and neutrals rendered: 15** — including `#64748b` (slate-500) ×118 *and* `#6a7282` (gray-500) ×6, `#4a5565` (gray-600) ×22, `#364153` (gray-700) ×19, `#99a1af` (gray-400) ×10, alongside `#94a3b8` (slate-400) ×6.

**Two different neutral families — Tailwind `slate` and Tailwind `gray` — render on the same page.** Slate is blue-tinted, gray is not.

**Four different light blues:** `#dbeafe` (`--light-blue` token), `#C5E2FF` (badge colour, 5 sections), `#A3D3FF` (`Hero.tsx:67,145`), `#A2D2FF` (inside the icon artwork).

**Off-token hex literals in components: 18 occurrences, 7 distinct**

| Hex | Count | Files |
|---|---:|---|
| `#C5E2FF` | 5 | `About.tsx:9`, `Hero.tsx:13`, `Resources.tsx:28`, `WaitlistForm.tsx:131`, `WhoItsFor.tsx:30` |
| `#f8fafc` | 4 | `Features.tsx:64`, `Hero.tsx:7`, `TaxEstimator.tsx:250`, `TaxEstimator.tsx:685` |
| `#FFEA66` | 3 | `AppDownload.tsx:28`, `Hero.tsx:104`, `Hero.tsx:67` |
| `#A3D3FF` | 2 | `Hero.tsx:67`, `Hero.tsx:145` |
| `#4A7FA7` | 2 | `Hero.tsx:123`, `Hero.tsx:126` |
| `#e8f4fc` | 1 | `Features.tsx:67` |
| `#f1f5f9` | 1 | `AppDownload.tsx:23` |

Plus ~120 raw Tailwind palette classes (`text-green-700` ×10, `border-gray-200` ×10, `bg-gray-700` ×5, …) that bypass the token layer entirely.

### 1.4 The token system is not one system, and half of it is dead

```
$ grep -rn "lib/styles" app components lib
>>> lib/styles.ts is imported by ZERO files.
```

`lib/styles.ts` is 92 lines headed *"Centralized design tokens and styles for Taash — This file provides consistent styling across all components."* Nothing imports it. It is dead code, and its values have already drifted from `globals.css` (it declares `heading1` at `lg:text-[3.5rem]`; the actual Hero H1 is `lg:text-[3.25rem]`, `Hero.tsx:29`).

Of the 14 colour tokens declared in `globals.css:29-49`, usage counts are:

| Token | Uses | | Token | Uses |
|---|---:|---|---|---:|
| `text-gray` | 140 | | `text-light-gray` | 5 |
| `primary-dark` | 123 | | `yellow-accent` | 1 |
| `primary-blue` | 63 | | `primary-blue-hover` | **0** |
| `border-light` | 8 | | `lighter-blue` | **0** |
| `text-dark` | 6 | | `lightest-blue` | **0** |
| `light-blue` | 5 | | `green-light` | **0** |

Four of fourteen are never used. The real working palette is three tokens plus a hundred-odd ad-hoc classes.

### 1.5 Icons

**The five illustrative SVGs are not a set:**

| File | viewBox | aspect | stroke-width |
|---|---|---:|---|
| `connect-bank.svg` | 450×517 | 0.87 | 16.3227 |
| `categorise-expenses.svg` | 331×517 | 0.64 | 16.3227 |
| `get-tax-estimate.svg` | 70×66 | 1.06 | 1.5 |
| `save-monthly.svg` | 52×66 | 0.79 | 2 |
| `receipt-upload.svg` | 53×66 | 0.80 | 1.5 |

Five viewBoxes, five aspect ratios, an order-of-magnitude difference in coordinate scale, three stroke weights. All are then forced into square `w-14 h-14` boxes with `object-contain` (`Features.tsx:13,27,41,55`), so they render at different optical sizes and sit on no shared baseline.

Their fill palette — `#0A1832`, `#4A7FA7`, `#A2D2FF`, `#F6F9FE`, `#FDE52B` — shares nothing with the CSS tokens. `receipt-upload.svg` carries only two of the five colours, so it reads visually lighter than its neighbours.

**`logo.svg` is drawn in `#0A1832` and `#4A7FA7`. Neither is a design token.** `--primary-dark` is `#0f172a`, `--primary-blue` is `#3b82f6`. The brand mark and the interface are using different blues.

**Inline SVG: 34 across 11 components**, on viewBoxes of `24` (×18), `18` (×6), `16` (×3), `20`, `10`, with `strokeWidth` `1.5` (×19), `2` (×15), `3` (×2). Five grids, three weights.

### 1.6 Numerals

```
$ grep -rn "font-mono|tabular|variant-numeric" components/
  (no matches in components/)
```

Computed on the rendered estimator: money `<p>` elements resolve `font-variant-numeric: normal` and the proportional sans stack. **No tabular figures anywhere.** JetBrains Mono is loaded but used only in blog code blocks (`app/blogs/[slug]/page.tsx:90,127`).

---

## 2. The typography is not rendering at all

This is the finding I did not expect and it reframes the whole "looks generic" complaint.

**Observation.** `<h1>`, `<body>` and body copy all compute to:
```
ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", …
```
That is Tailwind's default stack — the OS UI font. Width-probe on the H1 string at 52px/700: **computed stack 625px, `system-ui` 625px, `"Space Grotesk"` 660px, `Arial` 658px.** The rendered text matches system-ui exactly and differs from Space Grotesk by 5.6%.

**Mechanism.** From the compiled stylesheet:
```css
@layer theme { :root, :host {
  --font-sans: var(--font-space-grotesk);
  --font-mono: var(--font-mono);          /* self-referential */
  …
} }
```
`--font-sans` is declared on `:root`, but `--font-space-grotesk` is defined by `next/font` on the **`<body>` class** (`layout.tsx:14-18`, applied at `layout.tsx:140`). A `var()` in a custom-property declaration resolves in the scope where it is declared — at `:root`, `--font-space-grotesk` does not exist. So `--font-sans` is invalid at computed-value time, `body { font-family: var(--font-sans), Arial, … }` (`globals.css:58`) is therefore invalid, and `font-family` falls back to the inherited default from `html`.

`--font-mono: var(--font-mono)` (`globals.css:52`) is a literal self-reference in the compiled output.

**Cost.** Both font files are `<link rel="preload" as="font">` on **every production page load**:
```
/_next/static/media/0c89a48fa5027cee-s.p.4564287c.woff2   22 KB
/_next/static/media/70bc3e132a0a741e-s.p.15008bfb.woff2   40 KB
```
**62 KB of render-blocking preloaded webfont, applied to no text on the homepage.**

So the site has no typographic identity — not because the wrong typeface was chosen, but because the chosen one never reaches the page. A meaningful share of the "AI-generated" read is simply *this*: the page is set in the operating system's default UI font.

---

## 3. Diagnosis — why it reads as AI-generated

Nine tells were proposed. Each is confirmed or refuted below on evidence.

### Tell 1 — Stock palette · **CONFIRMED, and worse than stated**

`--primary-blue: #3b82f6` is exactly Tailwind `blue-500`. `#0f172a`/`#1e293b`/`#64748b`/`#94a3b8`/`#e2e8f0`/`#f1f5f9` are exactly `slate-900/800/500/400/200/100`. Every neutral and the primary are framework defaults, unmodified.

But the sharper problem is not that the defaults were used — it is that they were then abandoned. Five greens render where one token was declared; two neutral families render simultaneously; four light blues exist; the logo's own blue is in none of them; 18 hex literals and ~120 raw palette classes sit outside the token layer; four declared tokens are dead. There is no ramp, so when body text lands on a tinted panel there is no "one step darker" to reach for — which is exactly why `#64748b` passes on white at 4.76:1 and fails on `#e8f4fc` at 4.26:1 (§4).

### Tell 2 — Uniform vertical rhythm · **CONFIRMED**

Two padding pairs across eight sections (§1.1). The tax estimator is 2,304px tall — 3.7× the next-largest content section — and is given exactly the same 80px of air as the 627px About block. Nothing in the page's rhythm says which section matters.

### Tell 3 — Repeated section template · **CONFIRMED — 8 of 8**

Centred pill badge → centred H2 → centred subhead appears in `Hero`, `About`, `Features`, `WhoItsFor`, `TaxEstimator`, `AppDownload`, `WaitlistForm`, `Resources`. Five of those badges are the same `#C5E2FF`. Four sections then drop into a 3- or 4-up card grid. The page has one layout idea, executed eight times.

### Tell 4 — Uniform card treatment · **CONFIRMED**

`rounded-2xl` + hairline border + `hover:shadow-lg` is applied identically to a feature card (`Features.tsx:127`), a persona card (`WhoItsFor.tsx:70`), a step card (`HowItWorks.tsx:76`), and a blog card. A tax result card (`TaxEstimator.tsx:689`) uses the same `rounded-2xl` + `shadow-sm`. A ₦1.2M tax liability and a blog teaser carry the same visual weight.

### Tell 5 — Flat type scale · **CONFIRMED, and inverted where it matters**

Body copy lives entirely between 12px and 24px; `text-sm` (14px) is the single most-used size at 60 occurrences. The real problem is ordering:

| Element | Size | |
|---|---:|---|
| "PAYE Tax Calculator" (section title) | 36px | `TaxEstimator.tsx:271` |
| "7% less tax" (marketing figure) | 30px | `TaxEstimator.tsx:839` |
| Annual tax ₦1,203,396 | 24px | `TaxEstimator.tsx:909` |
| **Monthly PAYE ₦100,283 — the answer** | **18px** | `TaxEstimator.tsx:915` |

The heading that tells the user nothing is **twice the size** of the number they came for. The largest figure in the results area is the savings percentage, which is the least actionable thing on screen.

### Tell 6 — Decoration standing in for structure · **CONFIRMED**

`Hero.tsx:104-145` adds a yellow circle, a 3px blue dot, a blue circle, and a 5px light-blue dot — four elements carrying zero information. `Hero.tsx:67` puts a blue→yellow gradient behind an ellipse-masked photo; at 1280 the mask edge cuts the laptop and leaves a hard yellow band (`screenshots/local-1280-fold.png`). The floating "₦45,600" and "₦128,400" cards show fabricated numbers presented in the same visual language as the real estimator output.

### Tell 7 — Density and information design in the estimator · **CONFIRMED — the central failure**

Evidence: `screenshots/est-d-2-salary-filled.png`, `est-m-2-salary-filled.png`.

- **Where is the result?** 2,304 CSS px below the fold start on desktop; on mobile the section is **3,784 CSS px tall** — roughly 4.5 phone screens — and the answer sits ~2,400px below the last input.
- **Does the number update where the eye is?** No. Inputs are in the upper block; results are in a separate `bg-[#f8fafc]` block below (`TaxEstimator.tsx:685`). Typing a salary changes nothing in view.
- **Is the comparison legible as a comparison?** On desktop, two same-size, same-weight cards with three rows each and no shared baseline, no delta bar. **On mobile they stack vertically ~400px apart — you physically cannot see the two numbers at once.** The one section whose entire premise is comparison fails at the width where most of this audience is.
- **Typography appropriate to money?** None. Proportional figures, `font-variant-numeric: normal`, so `₦9,360,000` / `-₦1,507,800` / `₦7,852,200` are four different widths in a row meant to be scanned. JetBrains Mono is already paid for and unused.
- **Progression?** No. Six competing result containers stack in sequence: 4 summary cards → savings banner → 2 comparison cards → take-home card → 12 bracket rows. Everything is a `rounded-2xl` card, so nothing is the focus.
- **Semantic collision.** Green means "eyebrow badge", "you saved", "the new regime", "money you keep", "this input is a deduction" (`bg-green-50/30`, `TaxEstimator.tsx:567,589`), and "the bracket table's right column" — all at once. The tax **owed** is rendered in the same green as the savings.
- **A party-popper emoji sits in the bracket table** (`TaxEstimator.tsx:1024`).

### Tell 8 — Motion · **CONFIRMED as decorative and non-compliant**

```
$ grep -rn "reduced-motion|motion-safe|motion-reduce" app components lib
>>> ZERO occurrences anywhere in the codebase.
```

| Motion | Where | Purposeful? |
|---|---|---|
| `AnimatedTaxCard` fades through 10 fake figures every 4s | `AnimatedTaxCard.tsx:53-64` | Decorative. No pause. Its data cites "vs Q2 2024" and "vs 2023" on a 2026 site (`:22,30`) |
| `BlogCarousel` auto-advances every 5s | `BlogCarousel.tsx:37-39` | Decorative. No pause, no stop, no hover-halt |
| `AppDownload` badge spins 360° every 4s forever | `AppDownload.tsx:10-17` | Decorative. `rotation` grows unbounded; runs off-screen |
| `animate-shrink-width` 8s success-modal timer | `globals.css:84-95`, `WaitlistForm.tsx:314` | Purposeful, but auto-dismisses content |
| `hover:shadow-lg` | 5 components | Decorative; identical on every card type |

Two of these auto-update for longer than 5 seconds with no pause mechanism — a **WCAG 2.2.2 (Pause, Stop, Hide)** failure. None respects `prefers-reduced-motion`.

### Tell 9 — Iconography · **CONFIRMED as ad hoc** — see §1.5. Five artwork files on five grids at three stroke weights in a palette unrelated to the tokens; 34 inline SVGs on five more grids at three more weights.

### Additional tells found

**10 — The brand typeface never renders (§2).** The strongest single contributor to the generic read, and the cheapest to fix.

**11 — Content bugs visible in production.**
- `Hero.tsx:42` — "always tax-ready.**B**uilt for freelancers" — missing space, **confirmed live on `www.taash.tax`**.
- `AppDownload.tsx:86` — "with zero stress.**J**oin the waitlist" — same defect.
- **`WhoItsFor.tsx:11-22` — the persona images are swapped.** "Small Businesses" renders `/creators.png` (ring light, camera, neon studio); "Workers" renders `/smes.png` (box files, invoices, whiteboard). I opened both files to confirm.
- The same block drops **"Creators"** as a named persona — while the hero badge, the Features subhead, the estimator's own toggle and the waitlist placeholder all target creators.
- `WhoItsFor.tsx:8,14,20` declare a `gradient` property that the JSX never reads. Dead data.
- `Features.tsx:9-14,22-28` — icon `alt` text contradicts the heading it sits above ("Smart Expense Categorisation" over "Track Income"; "Tax Estimator" over "Record Expenses").
- The H1's forced `<br>`s (`Hero.tsx:31,33,35`) yield the accessible name **"Effortless Tax andFinance forNigeria's NewWorkforce"** — verified in the DOM on both local and live.

**12 — Decorative fake data in the same visual language as real output.** `AnimatedTaxCard` and the "Expenses This Month" card (`Hero.tsx:86-101`) render invented figures in the same card/typography treatment as the estimator's genuine results, with no "illustrative" marking.

---

## 4. Accessibility (WCAG 2.1 AA)

### 4.1 Contrast — 16 real failures

Corrected, canvas-normalised, on rendered text. 61 distinct combinations measured.

| Ratio | Need | Size/Wt | Foreground on background | Sample | Where |
|---:|---:|---|---|---|---|
| 2.22 | 4.5 | 12/400 | `#00c950` on `#ffffff` | "12% vs last month" | `AnimatedTaxCard.tsx:88` |
| 2.22 | 4.5 | 12/700 | `#ffffff` on `#00c950` | "NEW" badge ×2 | `TaxEstimator.tsx:901,1000` |
| 2.56 | 4.5 | 12/400 | `#94a3b8` on `#ffffff` | blog dates | `--text-light-gray` |
| **2.75** | 4.5 | 14/500 | `#3b82f6` on `#C5E2FF` | "Limited Early Access" | `WaitlistForm.tsx:131` |
| 2.93 | 4.5 | 14/700 | `#00a63e` on `#dbfce7` | "0% 🎉" | `TaxEstimator.tsx:1024` |
| 3.08 | 4.5 | 12/400 | `#00a63e` on `#f8fafc` | "Annual Tax" ×3 | `TaxEstimator.tsx:908` |
| 3.21 | 4.5 | 12/500 | `#ffffff` on `#4e8ef7` | blog category chips | `BlogCarousel` |
| **3.68** | 4.5 | 12/400 | `#3b82f6` on `#ffffff` | "View" reliefs toggle | `TaxEstimator.tsx:703` |
| **3.68** | 4.5 | 14/400 | `#3b82f6` on `#ffffff` | "privacy policy" link | `WaitlistForm.tsx:244` |
| 4.26 | 4.5 | 18/400 | `#64748b` on `#e8f4fc` | Features subhead | `Features.tsx:117` |
| 4.32 | 4.5 | 16/500 | `#64748b` on `#f3f4f6` | "Creator / Self-Employed" | `TaxEstimator.tsx:341` |
| 4.32 | 4.5 | 14/500 | `#64748b` on `#f3f4f6` | "Annual" toggle | `TaxEstimator.tsx:391` |
| 4.34 | 4.5 | 18/400 | `#64748b` on `#f1f5f9` | AppDownload body | `AppDownload.tsx:84` |
| 4.39 | 4.5 | 12/400 | `#6a7282` on `#f3f4f6` | "Annual Tax" ×3 | `TaxEstimator.tsx:864` |
| 4.50 | 4.5 | 14/500 | `#008236` on `#dbfce7` | "NTA 2025 vs PITA" | `TaxEstimator.tsx:254` |
| 4.50 | 4.5 | 14/400 | `#008236` on `#dbfce7` | "First ₦800,000" | `TaxEstimator.tsx:1019` |

**The headline item: `--primary-blue` `#3b82f6` on white is 3.68:1 and fails AA for normal text.** It is the brand's primary and it is used for links. On the badge blue it drops to 2.75:1.

`--text-gray` `#64748b` passes on white by 0.26 (4.76:1) and **fails on every tinted surface the site uses**. That is a ramp problem, not four isolated bugs.

A further 16 combinations pass by less than 0.6 — the palette has no headroom.

### 4.2 Name, Role, Value — two outright failures (WCAG 4.1.2)

**NHF toggle** (`TaxEstimator.tsx:531-541`). Read from the live DOM:
```json
{"text":"","ariaLabel":null,"role":null,"ariaChecked":null,"ariaPressed":null}
```
A `<button>` with no text, no `aria-label`, no `role="switch"`, no state attribute. Its visible `<label>` (`:527`) has no `htmlFor` and the button has no `id`. A screen reader announces **"button"** — no name, no indication of on/off.

**Pension slider** (`TaxEstimator.tsx:509-517`):
```json
{"id":"(none)","ariaLabel":"(none)","labelledby":"(none)"}
```
Its `<label>` (`:505`) has no `htmlFor`. Announced as "slider, 8" with no indication it is the pension rate. Keyboard operation itself works (arrow keys), and `:focus-visible` does apply a ring — but the control is unnamed.

### 4.3 Modals — both fail (WCAG 2.1.2, 2.4.3, 4.1.2)

Deductions modal (`TaxEstimator.tsx:1047-1219`) and success modal (`WaitlistForm.tsx:282-326`), both:
- no `role="dialog"`, no `aria-modal="true"`, no `aria-labelledby`
- **no focus trap** — Tab walks straight out into the page behind
- **no Escape handler**
- no focus restoration to the trigger on close
- no background scroll lock
- the deductions modal's close button (`:1061-1073`) contains only an SVG — **no accessible name**
- dismissal is on a `<div>`'s `onClick` (`:1050`) — not keyboard reachable

### 4.4 Other

| Issue | Evidence | Criterion |
|---|---|---|
| Carousel + tax card auto-advance, no pause | `BlogCarousel.tsx:37`, `AnimatedTaxCard.tsx:53` | 2.2.2 Pause Stop Hide |
| No `prefers-reduced-motion` anywhere | grep: 0 hits | 2.3.3 (AAA) + best practice |
| Carousel dots are 8×8 CSS px | `BlogCarousel.tsx:95` `w-2 h-2` | 2.5.8 Target Size (WCAG 2.2 AA) |
| Form error not announced | `WaitlistForm.tsx:251-255` — no `role="alert"`/`aria-live` | 4.1.3 Status Messages |
| Success state not announced | `WaitlistForm.tsx:282` — no live region | 4.1.3 |
| Success modal auto-dismisses at 8s | `WaitlistForm.tsx:27-29` | 2.2.1 Timing Adjustable (mitigated: manual close exists) |
| Currency inputs open an alphabetic keyboard | grep: **zero** `inputMode` in the repo | Not a violation; a significant mobile-usability defect |
| Anchor targets land under the fixed header | `Header.tsx:24` fixed; grep: zero `scroll-mt`/`scroll-padding` | 2.4.3-adjacent |
| Mobile menu toggle has no `aria-expanded`/`aria-controls` | `Header.tsx:80-83` | 4.1.2 |
| Reliefs "View" toggle has no `aria-expanded` | `TaxEstimator.tsx:701-705` | 4.1.2 |
| H1 accessible name is a run-on string | `Hero.tsx:29-37` | 1.3.1 |

**Heading order: PASSES.** H1 → H2 → H3 with no skipped levels across all 21 headings.

**`maximumScale: 5` (`layout.tsx:117`): NOT a violation — refuted.** WCAG 1.4.4 requires 200%; 500% is permitted. It is unnecessary and I would drop it, but it does not fail AA and should not be reported as such.

**Focus visibility: PASSES, but by accident.** Real Tab traversal shows every interactive element receiving Chrome's default `outline: auto 1px`. The site defines a designed focus ring only on the waitlist inputs (`WaitlistForm.tsx:175` `focus:ring-2`); the estimator uses `focus:border-primary-blue` with `focus:ring-0` (`TaxEstimator.tsx:426`), which changes a border rather than adding a ring. Everywhere else the browser default is doing the work.

---

## 5. Conversion

The page exists to collect waitlist signups. The estimator is the highest-intent moment on it — a user who has typed their salary has self-identified as exactly the target customer.

```
$ grep -n "waitlist|href=|<Link" components/TaxEstimator.tsx
>>> ZERO links and ZERO CTAs in the entire 1,222-line TaxEstimator.
```

**The estimator hands off to nothing.** After computing that they owe ₦100,283/month, the user is shown a 12-row bracket reference table and a disclaimer. The next CTA is in the *next* section. That is the single largest conversion defect on the page.

Other drop-off risks:

1. **The mobile menu has no CTA above the fold.** The desktop "Join Waitlist" button is `hidden sm:flex` (`Header.tsx:59-61`), and the mobile menu's CTA is gated behind `showMobileWaitlist` — `scrollY > 200` (`Header.tsx:14,124-127`). At the top of the page on a phone, opening the menu shows four nav links and no way to join.
2. **The consent checkbox's privacy-policy link goes to `#`** (`WaitlistForm.tsx:244`) — while `/privacy` exists (`app/privacy/page.tsx`). The user is asked to agree to a policy they cannot read. That is a consent-quality problem, not only a UX one.
3. **Both store badges link to `#`** (`AppDownload.tsx:93,104`).
4. **Submit stays disabled until Turnstile resolves** (`WaitlistForm.tsx:273`) with no explanation of why.
5. **The waitlist asks for four fields, three required**, including a free-text "Profession" — before the product exists.

---

## 6. Correctness defects in the estimator

Reported, not changed, per brief. Full tax-figure verification is in `03-tax-content-2026.md`.

### 6.1 "Annual Take-Home" overstates net pay

`TaxEstimator.tsx:143` — `takeHome = grossIncome - annualTax`. It does not subtract the pension, NHF and NHIS the employee actually pays. From the captured filled state (`screenshots/est-d-2-salary-filled.png`, all figures on screen):

```
gross                9,360,000
tax (NTA 2025)       1,203,396
displayed take-home  8,156,604   = 9,360,000 − 1,203,396
pension                748,800   ┐
NHF                    135,000   ├ actually deducted from pay
NHIS                   144,000   ┘
true net             7,128,804
OVERSTATED BY        1,027,800/yr  (₦85,650/month)
```

The label says "Annual Take-Home". It is gross-less-tax, which is not take-home.

The two paths also disagree: salary uses `gross − tax` (`:143`), creator uses `gross − expenses − tax` (`:213`).

### 6.2 Above ~₦20M/yr the "new" regime costs more, and the UI still says it is better

Sweeping the component's own arithmetic (`scratchpad/taxmath.mjs`, basic 55% / housing 22% / transport 12% / other 11%, rent ₦2.4M):

| Gross/yr | Old PITA | NTA 2025 | Δ | Banner |
|---:|---:|---:|---:|---|
| 1,800,000 | 124,688 | 52,688 | +72,000 | shown (58%) |
| 9,360,000 | 1,330,520 | 1,230,450 | +100,070 | shown (8%) |
| 18,000,000 | 2,795,000 | 2,754,825 | +40,175 | shown (1%) |
| **24,000,000** | 3,802,400 | 3,896,700 | **−94,300** | **hidden** |
| 36,000,000 | 5,807,600 | 6,323,350 | **−515,750** | **hidden** |
| 72,000,000 | 11,823,200 | 14,122,500 | **−2,299,300** | **hidden** |

Crossover ≈ **₦19.9M/yr gross** for this relief profile (it moves with rent relief and the basic-pay proportion).

Verified in the browser at ₦36M/yr (`screenshots/est-d-6-highincome-banner-hidden.png`): savings banner absent (`false`), and yet **the OLD card still draws a red strikethrough through ₦5,807,600** (`TaxEstimator.tsx:865`) and the NEW card keeps its green "better" styling — while the new figure is ₦515,750 *worse*. The new effective rate (17.6%) is rendered in green next to the old (16.1%) in grey.

The conditional at `:805-807` hides the banner when savings ≤ 0, so the page simply goes quiet rather than saying "under the new rules you pay more."

### 6.3 Smaller items

| Item | Location | Note |
|---|---|---|
| Pension clamp is dead code | `:105` vs slider `max='8'` (`:512`) | `Math.min(rate, 8%)` can never bind |
| Pension base | `:105` uses **gross** | **CONFIRMED WRONG.** PRA 2014 s.4(1) and FCT-IRS both compute on basic+housing+transport. Understates tax by ₦10,368/yr in the demo case. See `03-tax-content-2026.md` §4 |
| Rent is not multiplied | `:114` vs NHIS `:111` | Correct given the "Annual Rent Paid" label, but inconsistent within the same block |
| ~~Old CRA base~~ | `:129-131` | **WITHDRAWN.** FCT-IRS's own worked example computes CRA on the Consolidated Salary, which is what the code does. See `03-tax-content-2026.md` §2 |
| Creator path has no rent relief | `:181-233` | Rent relief is not employment-specific; see `03-tax-content-2026.md` |
| Bracket data duplicated | `:5-23` (logic) and `:979-1012` (display) | Two sources of truth for the same numbers |

---

## 7. Performance

| Finding | Evidence |
|---|---|
| **`avatar-small.png` transfers 1,195 KB to render at 40×43 px** | `Hero.tsx:92-99` sets `unoptimized`, bypassing the image optimiser. Source is 724×778. It is **over half the page's 2,234 KB** of resources |
| 62 KB of webfont preloaded, applied to nothing | §2 |
| Source PNGs are 1.2–3.5 MB | `hero-image.png` 3.5 MB, `phone-hand.png` 2.4 MB, `about-hero.png` 1.6 MB, `og-image.png` 1.5 MB |
| `about-hero.png` and `phone-hand.png` render upscaled | 341×315 → 554×357 and 540×452 → 595×499 at 1280 (dev server; re-check against a production build) |
| Scroll listener unthrottled, not passive | `Header.tsx:17` — `setState` on every scroll event |
| `AppDownload` interval runs forever, off-screen, unbounded | `AppDownload.tsx:10-17` |
| Carousel duplicates DOM nodes | `BlogCarousel.tsx:59` — duplicate links for screen readers |
| Mobile layout flips after hydration | `BlogCarousel.tsx:23-28` — `isMobile` resolved in an effect |

**`npm audit`: 15 vulnerabilities (11 high).** Includes **`next` — "Next Server Actions Source Code Exposure" (high)**, fixed in 16.3.4. Details in `04-upgrade-plan.md`.

---

## 8. Findings ranked by impact

Each line: what it is → what fixing it changes for the user.

### Tier A — costs signups or gives wrong numbers

| # | Finding | Evidence | Fixing it means |
|---|---|---|---|
| A1 | Estimator has no CTA at all | grep: 0 links in 1,222 lines | The highest-intent moment on the site stops dead-ending |
| A2 | "Annual Take-Home" overstates net pay by ₦1,027,800/yr | `:143` + on-screen figures | Users stop budgeting against a number that is a million naira too high |
| A3 | Above ~₦20M/yr the new regime costs more; UI still signals "better" | `:805-807,865` + sweep | Higher earners stop being told they saved money when they did not |
| A4 | The answer is ~2,400px below the inputs; comparison unviewable on mobile | `est-m-2-salary-filled.png`, 3,784px tall | The user sees their number while typing, on the device they actually use |
| A5 | No waitlist CTA in the mobile menu above 200px scroll | `Header.tsx:14,59-61,124-127` | Phone users at the top of the page can sign up |
| A6 | Consent checkbox links to `#`, not `/privacy` | `WaitlistForm.tsx:244` | Consent becomes informed; removes a compliance exposure |

### Tier B — brand identity

| # | Finding | Evidence | Fixing it means |
|---|---|---|---|
| B1 | **Space Grotesk never renders; 62 KB preloaded for nothing** | §2 | The site acquires a typographic identity — and stops paying for one it doesn't use |
| B2 | Logo blue `#4A7FA7` is not in the palette | `logo.svg` vs `globals.css:6-7` | Mark and interface stop disagreeing |
| B3 | Two neutral families, five greens, four light blues rendered | §1.3 | One coherent surface instead of an assembled one |
| B4 | `lib/styles.ts` is dead code, already drifted | grep: 0 imports | One source of truth |
| B5 | Icons on five grids at three stroke weights | §1.5 | Icons read as a family |
| B6 | 8 of 8 sections use the same badge/heading/grid template | §3 tell 3 | Sections earn distinct treatment; the estimator can be the loud one |

### Tier C — accessibility

| # | Finding | Evidence |
|---|---|---|
| C1 | NHF toggle has no name, role or state | live DOM read |
| C2 | Pension slider has no accessible name | live DOM read |
| C3 | Both modals: no dialog role, no focus trap, no Escape, unnamed close button | `:1047-1219`, `:282-326` |
| C4 | 16 contrast failures; brand blue at 3.68:1 on white | §4.1 |
| C5 | Two auto-rotating components with no pause; zero reduced-motion support | `BlogCarousel.tsx:37`, `AnimatedTaxCard.tsx:53` |
| C6 | Carousel dots 8×8px | `BlogCarousel.tsx:95` |
| C7 | Form errors and success not announced | `WaitlistForm.tsx:251,282` |
| C8 | No `inputMode` — alphabetic keyboard for every currency field | grep: 0 |

### Tier D — content

| # | Finding | Evidence |
|---|---|---|
| D1 | **Persona images swapped** — "Small Businesses" shows a creator, "Workers" shows an SME | `WhoItsFor.tsx:11-22`, files opened |
| D2 | Missing space after full stop, **live in production**, two places | `Hero.tsx:42`, `AppDownload.tsx:86` |
| D3 | "Creators" dropped as a persona while the rest of the page targets creators | `WhoItsFor.tsx:4-23` |
| D4 | H1 accessible name is run-on | `Hero.tsx:29-37` |
| D5 | Hero card cites "vs Q2 2024" / "vs 2023" on a 2026 site | `AnimatedTaxCard.tsx:22,30` |
| D6 | Feature icon `alt` contradicts its heading | `Features.tsx:9-28` |
| D7 | Store badges link to `#` | `AppDownload.tsx:93,104` |
| D8 | Dead `gradient` data; stale "Placeholder for actual image" comment; "after 5 seconds" comment on an 8s timer | `WhoItsFor.tsx:8`, `About.tsx:77`, `WaitlistForm.tsx:24` |

### Tier E — performance

| # | Finding | Evidence |
|---|---|---|
| E1 | 1,195 KB avatar for a 40px slot — half the page's bytes | `Hero.tsx:98` |
| E2 | 62 KB unused preloaded fonts | §2 |
| E3 | 1.2–3.5 MB source PNGs | `ls -la public/` |
| E4 | 11 high-severity npm advisories incl. `next` | `npm audit` |

---

## 9. On `HowItWorks`

Currently commented out at `app/page.tsx:24`. **It should come back**, for three reasons: it is the only section that explains the mechanism rather than the benefit; its four steps are the only place the four SVG step icons are used, so without it `connect-bank.svg` is orphaned entirely; and the page currently jumps from "why we exist" straight to "what it does" with no "how". It needs the icon-set work in §1.5 first — reinstating it as-is re-imports the inconsistency.

Note it also asserts bank connection and AI categorisation as live capabilities on a pre-launch waitlist page. Whether that is accurate is a product question I cannot verify from the repo — flagging it as one for you.

---

## 10. What I could not verify

| Item | What would settle it |
|---|---|
| Whether `about-hero.png` / `phone-hand.png` upscaling persists in production | A `next build && next start` capture; the dev-mode optimiser behaves differently |
| Whether the pension base should be gross or basic+housing+transport | Pension Reform Act 2014 s.4(1) — see `03-tax-content-2026.md` |
| Whether bank connection / AI categorisation claims in `HowItWorks` are accurate | Product decision |
| Real-user drop-off between estimator and waitlist | Vercel Analytics is installed (`layout.tsx:142`) but I have no access to its data. Worth pulling before choosing a direction |
