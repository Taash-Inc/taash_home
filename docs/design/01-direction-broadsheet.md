# Direction B — **Broadsheet**

> **Point of view:** the user isn't confused about software, they're confused about *tax*. What they need is not a better dashboard but a better explanation — set the way a good financial paper sets an explainer: calm, authoritative, generous with space, almost colourless.

Light only, warm paper ground, serif body copy, a type scale with real range, and colour used so sparingly that when it appears it means something. Cards are almost entirely replaced by rules and whitespace.

---

## 1. Why it doesn't look AI-generated

| Tell | How this direction breaks it |
|---|---|
| **1 · Stock palette** | The page isn't white. Ground is `#fcf6ee`, a **warm** paper neutral at OKLCH hue 75 — the opposite direction from Tailwind's cool `slate`. No default survives. Chroma is deliberately present in the greys (`#6c5e4b` is a warm brown-grey, not a grey), which is the single most visible break from a framework default. |
| **2 · Uniform rhythm** | Space is the primary compositional tool. Section spacing ranges 40px → 200px across six named steps, and the estimator gets the 200px. |
| **3 · Repeated template** | The centred badge is **deleted everywhere** — all eight instances. Sections are introduced by a rule and a left-aligned standfirst, the way an article introduces a section. Nothing is centred except the one pull-quote. |
| **4 · Uniform cards** | **There are no cards.** Not "fewer cards" — none, outside the two dialogs. Grouping is done with hairline rules, indentation and space. This is the most literal possible answer to "everything carries identical visual weight". |
| **5 · Flat type scale** | 1.333 (perfect fourth), ten steps, from 12px to 80px. That is a **6.7× range**; today's is 12px→52px with everything living at 14. The result figure is 80px. |
| **6 · Decoration as structure** | Zero decorative elements. No blobs, dots, glows, gradients, or floating pills anywhere in the design. Hierarchy is produced entirely by type size, weight, rule weight and space. |
| **7 · Estimator density** | Becomes a **worksheet** — a set-out calculation you can read top to bottom like a statement, with the answer as a display figure. §6. |
| **8 · Motion** | Almost none by design. §7. |
| **9 · Iconography** | Icons are nearly eliminated from the UI. The five illustrative SVGs survive as **editorial spot illustrations** at large size, which is what they were drawn for — their inconsistent grids stop mattering when they aren't lined up in a row of 56px boxes. |
| **10 · Font never renders** | Fixed, and typography is the whole direction. |

**The specific reason this reads as designed:** generated layouts reach for cards, badges and centring because those are the safe defaults. This direction's defining move is *subtraction* — it removes the card, the badge and the centre axis, which is the one thing a model-generated layout almost never does.

---

## 2. Token system

Ratios computed in `scratchpad/tokens.mjs`. **Contrast is quoted against the paper ground `#fcf6ee`, not white** — quoting against white would overstate every value, and this page is never white.

### The warm neutral ramp — OKLCH hue 75

| Step | Hex | vs paper `#fcf6ee` | vs `#f5ece1` | Role |
|---|---|---|---|---|
| 0 | `#fcf6ee` | — | — | **page ground** |
| 100 | `#f5ece1` | 1.06 | — | sunken band |
| 200 | `#e7dbcc` | 1.27 | 1.17 | **hairline rules** |
| 300 | `#d4c6b2` | 1.56 | 1.44 | heavy rules, dividers |
| 400 | `#baa993` | 2.13 | 1.96 | input borders |
| 500 | `#9e8d75` | 3.00 (large only) | 2.76 | placeholder text |
| 600 | `#84745e` | 4.21 (large only) | 3.87 | captions ≥19px only |
| **700** | **`#6c5e4b`** | **5.85 AA** | **5.38 AA** | **secondary text** |
| 800 | `#54493a` | 8.18 AA | 7.51 AA | body text alternative |
| 900 | `#3a3227` | 11.74 AA | 10.79 AA | subheads |
| **950** | **`#241f17`** | **15.24 AA** | **14.00 AA** | **body text and headings** |

Note `ink-600` at 4.21:1 **fails** at body size on paper. It is therefore restricted to ≥19px, and the semantic layer never maps it to body text. This is the kind of thing the current site gets wrong by not having a ramp at all.

### Colour — four accents, each with exactly one job

| Token | Hex | vs paper | Role — and only this role |
|---|---|---|---|
| `--accent` | `#205ab9` (blue-700) | **6.06 AA** | Links and interactive text. **Not** `blue-600` — that measures 4.36:1 on paper and fails |
| `--accent-fill` | `#205ab9` | white on it = **6.51 AA** | Primary button |
| `--brand` | `#3b82f6` (blue-500) | 3.03 — large/non-text only | The brand blue survives as a **rule and underline** colour and in the logo. Preserved, not used for text |
| `--positive` | `#00742e` (green-700) | **5.53 AA** | Take-home. One meaning |
| `--negative` | `#d52c29` (red-600) | **4.63 AA** | "You pay more". The one new accent — same justification as Direction A: the tool must be able to say a number went up |
| `--warn` | `#f8f0bb` surface | ink on it = **14.16 AA** | Rent-cap warning only |
| `--figure-teal` | `#386485` (teal-700) | **5.87 AA** | The logo's recovered blue, used for the comparison's second series |

Green appears **once** on the page. Today it appears in six unrelated meanings (`00-audit.md` §3 tell 7).

### Ready-to-paste `@theme`

```css
@import 'tailwindcss';

@theme {
  --font-display: 'Space Grotesk', ui-sans-serif, system-ui, sans-serif;
  --font-serif:   'Source Serif 4', Charter, 'Bitstream Charter', Georgia, serif;
  --font-sans:    'Source Serif 4', Charter, Georgia, serif;   /* body IS the serif */
  --font-ui:      ui-sans-serif, system-ui, -apple-system, sans-serif;
  --font-mono:    'JetBrains Mono', ui-monospace, Menlo, monospace;

  /* type scale — 1.333 perfect fourth, 16px base, 10 steps */
  --text-2xs:  0.75rem;    /* 12px    legal */
  --text-xs:   0.875rem;   /* 14px    captions, table micro */
  --text-sm:   1rem;       /* 16px    dense UI */
  --text-base: 1.1875rem;  /* 19px    BODY — editorial reading size */
  --text-lg:   1.5rem;     /* 24px    standfirst */
  --text-xl:   2rem;       /* 32px    h3 */
  --text-2xl:  2.625rem;   /* 42px    h2 */
  --text-3xl:  3.5rem;     /* 56px    h1 mobile */
  --text-4xl:  4.5rem;     /* 72px    h1 desktop */
  --text-5xl:  5rem;       /* 80px    the result figure */

  --leading-tight: 1.04; --leading-snug: 1.2;
  --leading-body: 1.62;  --leading-loose: 1.75;
  --tracking-display: -0.021em; --tracking-body: 0;
  --measure: 68ch;       /* enforced max line length for body copy */

  --spacing: 0.25rem;
  --space-section-2xs: 2.5rem;  /* 40px  AppDownload */
  --space-section-xs:  4rem;    /* 64px  */
  --space-section-sm:  5.5rem;  /* 88px  About, Resources */
  --space-section-md:  7.5rem;  /* 120px default */
  --space-section-lg:  10rem;   /* 160px Hero, Waitlist */
  --space-section-xl:  12.5rem; /* 200px Tax estimator */

  /* radii — essentially flat */
  --radius-none: 0;
  --radius-sm: 0.125rem;  /* 2px — inputs only */
  --radius-md: 0.25rem;   /* 4px — buttons */
  --radius-full: 9999px;  /* avatar only */

  /* elevation — rules, not shadows */
  --rule-hair: 1px; --rule-body: 2px; --rule-heavy: 4px;
  --shadow-dialog: 0 32px 80px -24px rgb(36 31 23 / 0.32);

  --ease-out: cubic-bezier(0.2, 0, 0, 1);
  --dur-fast: 120ms; --dur-base: 200ms;

  --color-paper:    #fcf6ee;
  --color-paper-2:  #f5ece1;
  --color-ink-200:#e7dbcc; --color-ink-300:#d4c6b2; --color-ink-400:#baa993;
  --color-ink-500:#9e8d75; --color-ink-600:#84745e; --color-ink-700:#6c5e4b;
  --color-ink-800:#54493a; --color-ink-900:#3a3227; --color-ink-950:#241f17;

  --color-blue-500:#3b82f6; --color-blue-700:#205ab9; --color-blue-800:#174692;
  --color-teal-700:#386485;
  --color-green-700:#00742e; --color-green-800:#005b21;
  --color-red-600:#d52c29;  --color-red-700:#b01e1e;
  --color-amber-100:#f8f0bb;
}

:root {
  --surface: var(--color-paper);
  --surface-sunken: var(--color-paper-2);
  --rule: var(--color-ink-200);
  --rule-strong: var(--color-ink-300);
  --text: var(--color-ink-950);            /* 15.24:1 */
  --text-secondary: var(--color-ink-700);  /*  5.85:1 */
  --text-caption: var(--color-ink-600);    /*  4.21:1 — ≥19px ONLY */
  --accent: var(--color-blue-700);         /*  6.06:1 */
  --on-accent: #ffffff;                    /*  6.51:1 */
  --focus: var(--color-blue-700);
  --positive: var(--color-green-700);      /*  5.53:1 */
  --negative: var(--color-red-600);        /*  4.63:1 */
  color-scheme: light;
}
```

**Single theme, deliberately.** A paper ground is the direction's entire premise; inverting it produces a different design, not a dark variant. `viewport.themeColor` should drop its dark entry rather than promise a theme that doesn't exist (`layout.tsx:111-114`).

---

## 3. Typography — the direction's whole argument

**Display: Space Grotesk, finally rendering.** Kept for h1/h2/h3 — a geometric grotesque at 42–72px is confident and distinctive, and it's the brand's existing choice.

**Body: change to a serif — Source Serif 4.** This is the one direction that argues for a new face, and the argument is specific:

- The site's job in About, Features, WhoItsFor and the Resources posts is **explanation at length**. Space Grotesk's wide apertures and near-uniform stroke make 19px paragraphs tiring; it was drawn for display.
- A transitional serif at 19px/1.62 on a warm ground is the most readable long-form setting available, and it carries the *authority* register a tax explainer wants. This is why the FT, Stripe's long-form docs and most financial journalism set body in serif.
- **Licence: SIL Open Font License 1.1** — free for commercial use, embeddable, no attribution required in the product.
- **Cost:** variable weight axis, Latin subset, ~38 KB woff2 for the 400–600 range via `next/font`. Combined with Space Grotesk (22 KB) and JetBrains Mono (40 KB) that's ~100 KB — **up from today's 62 KB, but today's 62 KB renders nothing** (`00-audit.md` §2). Real delta against a *working* baseline is +38 KB.
- If that's unacceptable, the fallback stack `Charter, Georgia, serif` is genuinely good and ships at 0 KB. Charter is present on macOS/iOS, Georgia effectively everywhere.

**Numerals.** Source Serif 4 has lining figures by default and supports `tnum`. But for the estimator's aligned columns the direction still uses **JetBrains Mono**, for the same reason as Direction A: cross-column digit alignment needs a shared advance width.

```css
.figure   { font-family: var(--font-mono); font-variant-numeric: tabular-nums slashed-zero; }
.figure-lg{ font-family: var(--font-display); font-variant-numeric: tabular-nums;
            font-feature-settings: 'tnum' 1; }  /* the 80px result — display face, tabular */
```

The 80px headline figure uses **Space Grotesk with `tnum`**, not mono — at that size the mono reads as a code listing, and Space Grotesk's tabular figures are well drawn. Mono is used from 24px down.

| Role | Face | Size | Weight | Leading |
|---|---|---|---|---|
| Result figure | Space Grotesk `tnum` | 80 / 56 | 700 | 1.0 |
| h1 | Space Grotesk | 72 / 56 | 700 | 1.04 |
| h2 | Space Grotesk | 42 / 32 | 600 | 1.12 |
| h3 | Space Grotesk | 32 / 24 | 600 | 1.2 |
| Standfirst | Source Serif 4 | 24 | 400 | 1.45 |
| **Body** | **Source Serif 4** | **19** | 400 | **1.62** |
| Dense UI / labels | system sans | 16 | 500 | 1.45 |
| Figures in tables | JetBrains Mono | 16 | 500 | 1.45 |
| Legal | system sans | 12 | 400 | 1.5 |

Body at 19px with a 68ch measure. Today: 14px is the most-used size and there is no measure constraint at all.

---

## 4. Section-by-section

**Loud:** the tax estimator, at 200px, on the sunken paper band, with the only 80px figure on the page.
**Quieter than today:** AppDownload (80→40px), About (80→88px but no badge and no card), Resources (80→88px), Features (80→120px but flattened to a list).

| Section | Treatment | Space |
|---|---|---|
| **Header** | A rule, not a bar. Wordmark left, four links, one CTA. No blur, no shadow, no pill. Mobile CTA always present. `aria-expanded` added. | 56px |
| **Hero** | **Asymmetric editorial opening.** H1 at 72px across ~9 columns, standfirst at 24px beneath it in serif, two CTAs. `hero-image.png` runs **full-bleed down the right third**, no ellipse mask, no gradient, no floating cards, no dots. The two floating cards **relocate** into a small figure beneath the standfirst, set as a captioned statistic — retained, but as editorial furniture. `avatar-small.png` appears there. | `lg` 160px |
| **About** | A pull-quote. "Why Taash Exists" at 42px, the paragraph at 24px on a 60ch measure, `about-hero.png` full-bleed beneath at 21:9. The yellow card is gone; the copy is unchanged. | `sm` 88px |
| **HowItWorks** | **Reinstated** as a numbered editorial list — big numerals, the four SVGs at 96px as spot illustrations rather than 56px icons. This is the treatment their inconsistent grids can actually survive. | `md` 120px |
| **Features** | Not a grid. A **four-item definition list**: term at 32px, description at 19px, hairline between. `categorise-expenses.svg` etc. at 72px in the left margin. Alt text corrected. | `md` 120px |
| **WhoItsFor** | Three **full-bleed portraits** at 4:5, label and description set beneath in the margin — no card, no border, no shadow. **Images un-swapped.** | `md` 120px |
| **TaxEstimator** | §5. | `xl` 200px |
| **AppDownload** | One rule, one line of copy, two badges, `phone-hand.png` small at the right. Spin removed. | `2xs` 40px |
| **WaitlistForm** | Wavy SVG deleted. A ruled form on the sunken band, single column, generous. Every field kept. Privacy link fixed. `role="alert"` on errors. | `lg` 160px |
| **Resources / BlogCarousel** | Becomes an **index**: a ruled list of posts with date, title at 24px, category. Auto-rotation gone. Carousel retained as an optional horizontal rail on mobile only, user-driven. | `sm` 88px |
| **Footer** | Rules and text. `logo-white.svg` on an ink band. | 96px |

### Asset inventory — every file in `public/`, explicitly

| File | Treatment in Broadsheet |
|---|---|
| `hero-image.png` | Kept. Ellipse and gradient deleted; runs full-bleed down the right third, ungraded |
| `about-hero.png` | Kept. Full-bleed 21:9 band under the About pull-quote |
| `phone-hand.png` | Kept, small, right of the 40px AppDownload rule band |
| `freelancers.png` | Kept. Full-bleed 4:5 portrait, "Freelancers" |
| `creators.png` | Kept — **re-attached to "Creators"** (`00-audit.md` D1) |
| `smes.png` | Kept — **re-attached to "Small Businesses"** |
| `avatar-small.png` | Kept in the hero's captioned statistic figure. `unoptimized` removed |
| `connect-bank.svg` | Kept at **96px as an editorial spot** — HowItWorks step 1. Its odd 450×517 grid stops mattering at this size |
| `categorise-expenses.svg` | Kept at 96px — HowItWorks step 2; 72px in the Features definition list |
| `get-tax-estimate.svg` | Kept at 96px — HowItWorks step 3; 72px in Features |
| `save-monthly.svg` | Kept at 96px — HowItWorks step 4; 72px in Features |
| `receipt-upload.svg` | Kept at 72px in Features |
| `logo.svg` | Unchanged. Header |
| `logo-white.svg` | Unchanged. Footer, on the ink band |
| `app-store-badge.png` / `google-play-badge.png` | Kept. Real `href`s or an honest disabled state |
| `og-image.png`, `icon.svg`, `favicon.ico` | Unchanged |

Icons are *not* normalised in this direction — at 72–96px as editorial spots, their differing grids read as illustration rather than as an inconsistent icon set. This is the one direction where the icon problem is solved by scale instead of redrawing, which saves roughly a day.

---

## 5. The tax estimator — as a worksheet

The premise: a tax calculation *is* a document. Set it as one.

**Desktop ≥1024px — a single centred column, 720px wide, read top to bottom.**

```
                    WHAT YOU'LL OWE IN 2026
                    ────────────────────────────────────────

                    I am a  [ Salary earner ] [ Creator ]
                    Figures  [ Monthly ] [ Annual ]

                    INCOME                                            ─────
                      Basic salary                            450,000
                      Housing allowance                       180,000
                      Transport allowance                      90,000
                      Other allowances                         60,000
                                                            ─────────
                      Gross annual income                   9,360,000

                    LESS RELIEFS                        What counts? ─────
                      Pension  8% of basic, housing, transport  691,200
                      National Housing Fund  2.5% of basic      135,000
                      NHIS                                      144,000
                      Rent relief  20% of ₦2,400,000, max ₦500,000  480,000
                                                            ─────────
                      Total reliefs                        −1,450,200

                      Taxable income                        7,909,800
                    ────────────────────────────────────────────────────

                    TAX DUE, 2026

                         ₦101,147                                ← 80px
                         per month · ₦1,213,764 per year

                      Effective rate  12.9%
                      Take-home       ₦7,176,036/yr · ₦598,003/mo

                    Estimate only, not tax advice. Nigeria Tax Act 2025,
                    in force 1 January 2026. Figures as at 4 Sep 2026.
                    ────────────────────────────────────────────────────
                    ▸ How this compares to the pre-2026 PITA rules
                    ▸ The 2026 tax bands

                    ┌──────────────────────────────────────────────┐
                    │  Taash keeps this worksheet up to date        │
                    │  all year.        [ Join the waitlist ]       │
                    └──────────────────────────────────────────────┘
```

Inputs sit **inline in the worksheet** — the value column is editable. Typing in "Basic salary" updates "Gross annual income" two rows down and the 80px figure below. Everything is on one page; nothing is behind a tab.

**Mobile:** the same worksheet, one column, with a **sticky top strip** showing `TAX DUE ₦101,147/mo` once any value exists. Top rather than bottom: it sits under the header, avoids iOS Safari's bottom toolbar problem entirely, and keeps the reading order intact.

The worksheet is ~1,100 CSS px on mobile versus today's **3,784**, because the four summary cards, the savings banner, the two comparison cards, the take-home card and twelve bracket rows all become either worksheet lines or disclosures.

### Comparison, when opened

```
▾ How this compares to the pre-2026 PITA rules

  Under the pre-2026 rules you would have paid    ₦1,294,448
  Under the 2026 Nigeria Tax Act you pay          ₦1,213,764
                                                  ──────────
  Difference                                        ₦80,684 less

  The pre-2026 rules no longer apply. This comparison is
  shown for context only.
```

Set as a statement, not two competing cards. When the difference inverts it reads *"₦515,750 **more**"* in `--negative` with the same neutral framing — no strikethrough, no green card, no "OLD/NEW" badges (`03-tax-content-2026.md` §6).

### Deductions modal → **inline**

The modal is dissolved. "What counts?" is a disclosure that expands **within the RELIEFS block**, listing the same items. Nothing to trap focus in, nothing to escape from, and the user reads the explanation next to the field it explains. The creator variant expands in the same place with the expense list. Both retain all current content including the Pro Tip.

The success dialog remains a real dialog — it's the one place a modal is right.

### Old → new mapping — all 25 instruments

| # | Today | Line | In Broadsheet |
|---|---|---|---|
| 1 | Salary/Creator toggle | `:309-375` | Two radio buttons under the title |
| 2 | Monthly/Annual toggle | `:379-398` | Second radio pair, same row |
| 3–6 | Basic / Housing / Transport / Other | `:420-495` | INCOME block, editable value column, `inputMode="numeric"` |
| 7 | Pension slider | `:509` | RELIEFS row — slider inline in the value column, labelled, `aria-valuetext`. Base corrected to basic+housing+transport |
| 8 | NHF toggle | `:531` | RELIEFS row — `role="switch"`, named |
| 9 | NHIS | `:561` | RELIEFS row |
| 10 | Annual rent + cap warning | `:583-607` | RELIEFS row; warning inline on `--warn` |
| 11–12 | Gross income / expenses (creator) | `:629,:667` | Same worksheet, creator INCOME variant. **Rent relief added** |
| 13 | Info button | `:284,:648` | "What counts?" disclosure — a labelled link, not a bare ⓘ |
| 14 | Deductions modal | `:1047` | **Inline disclosure**, all content retained |
| 15 | Gross income card | `:689` | INCOME subtotal line |
| 16 | Total reliefs card + View | `:697-716` | RELIEFS subtotal line — always visible, so the "View" toggle is unnecessary |
| 17 | Taxable income card | `:718` | Worksheet line above the rule |
| 18 | Effective rate card | `:727` | Line under the result figure |
| 19 | Reliefs breakdown | `:737-800` | **Promoted** — it *is* the RELIEFS block now, no longer hidden |
| 20 | Savings banner | `:804-850` | The signed "Difference" line in the comparison disclosure |
| 21 | OLD PITA card | `:854-896` | Comparison disclosure, line 1 |
| 22 | NEW NTA card | `:898-926` | Its monthly figure is the 80px result |
| 23 | Take-home | `:929-958` | Line under the result. **Arithmetic corrected** |
| 24 | Brackets comparison | `:962-1031` | `▸ The 2026 tax bands` disclosure; PITA bands inside the comparison. 🎉 removed |
| 25 | Disclaimer | `:1033` | **Directly under the result figure**, at 12px on paper (15.24:1), with basis and date |

Nothing removed. The reliefs breakdown is *promoted* from hidden to primary, which is the direction's signature move.

---

## 6. Motion

Deliberately minimal. This direction's credibility comes from stillness.

| Element | Behaviour | Duration |
|---|---|---|
| Result figure | Instant swap. **No transition** — tabular figures mean no reflow, and a settling number undermines the document metaphor | 0 |
| Worksheet subtotals | Instant | 0 |
| Disclosures | Height only, no fade | `--dur-base` 200ms |
| Links / buttons | Colour and underline-thickness on hover | `--dur-fast` 120ms |
| Success dialog | Opacity only | 200ms |
| Sticky mobile strip | Appears without animation | 0 |
| Carousels | **Removed.** Resources becomes a static index | — |
| `AnimatedTaxCard` rotation | **Removed** — becomes one static captioned figure | — |
| `AppDownload` spin | **Removed** | — |

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration:1ms!important; animation-iteration-count:1!important;
                           transition-duration:1ms!important; scroll-behavior:auto!important; }
}
```

Because there is essentially no motion, the reduced-motion experience is **identical** to the default. That is the strongest possible compliance position for 2.2.2 and 2.3.3: nothing to pause because nothing moves.

---

## 7. Accessibility — how it meets AA

- **Contrast measured against paper, not white.** Every semantic token in §2 is quoted on `#fcf6ee`. Two colours that pass on white **fail** on paper and were excluded: `blue-600` (4.36:1) and `ink-600` at body size (4.21:1). `ink-600` is permitted only ≥19px where the large-text threshold of 3:1 applies with margin.
- **Body at 19px.** Larger default text is an accessibility feature before it's a style one — it reduces the number of users who need to zoom at all.
- **68ch measure** enforced on all body copy — WCAG 1.4.8 (AAA) territory, cheap to get here.
- **1.4.11 Non-text contrast.** Input borders `ink-400` = 2.13:1 on paper, which is **below** the 3:1 requirement for interactive boundaries — so inputs use `ink-500` (3.00:1) at rest and `ink-700` (5.85:1) on focus. Flagged because a hairline aesthetic makes this easy to get wrong.
- **2.4.7 Focus.** `outline: 2px solid var(--focus); outline-offset: 3px` — `blue-700` at 6.06:1 on paper, well past the 3:1 minimum.
- **4.1.2.** NHF `role="switch"` + `aria-checked` + name; pension slider `id`/`<label for>`/`aria-valuetext`; disclosures `aria-expanded`; mobile menu `aria-expanded`/`aria-controls`.
- **2.1.2.** Only one dialog remains (success). Full trap, Escape, restoration. The deductions modal is dissolved into inline content, which removes an entire class of failure rather than fixing it.
- **4.1.3.** Result figure `aria-live="polite"`, debounced 500ms. Errors `role="alert"`.
- **2.5.8.** All targets ≥44×44; the worksheet's editable cells are full-row height.
- **1.3.1.** The worksheet is a real `<table>` with `<th scope="row">` — so a screen-reader user gets "Rent relief, 480,000" as an associated pair, which the current stack of `<div>`s does not provide.
- **Mobile input.** `inputMode="numeric"` throughout.

**Honest limits.** Source Serif 4 at 19px is excellent on desktop and good on modern phones, but on low-DPI Android the serifs thin out; the `Charter/Georgia` fallback is the safety net and should be tested on a real budget Android device before this ships. Serif body is also the direction's biggest untested assumption for this specific audience.

---

## 8. Cost

| | |
|---|---|
| **Files touched** | `globals.css` (rewrite), `layout.tsx` (fonts), all 11 components, `lib/tax/`, `components/estimator/*` |
| **Effort** | ~11–14 developer-days. Estimator ~5 — the worksheet is structurally *simpler* than what exists |
| **Risk** | **Medium.** Single theme, no sticky rail, few moving parts. The risk is aesthetic acceptance, not engineering |
| **Biggest win** | The worksheet. It is the only one of the three that makes the calculation *comprehensible* rather than just visible |

**What could go wrong**

1. **Serif body is rejected on sight.** The most likely failure, and it's a taste call, not a technical one. Mitigation: build the preview first and look at it on a phone before committing. Fallback is the system sans at the same scale — the direction survives, slightly diminished.
2. **"Editorial" reads as "old" to a young Nigerian audience.** A paper ground and serif type carry a newspaper association that may land as dated rather than authoritative for 25-year-old creators. This is the central bet.
3. **Removing all cards removes scannability.** Some users scan for boxes. Rules and space demand more reading. If analytics show short sessions, this direction is fighting the user.
4. **The full-bleed photography needs better source images.** At full-bleed, `hero-image.png` and the persona shots will show their AI-generated origins much more plainly than they do inside a 56px-radius card. This direction is the least forgiving of the existing art.
5. **Warm ground shifts the brand.** `#fcf6ee` against a `#3b82f6` logo is a real change in feel, even though the hue is preserved. Worth checking against any print or app collateral.

---

## 9. What it sacrifices

**Density and glanceability.** This is a document, and documents are read, not scanned. A returning user who just wants to re-check a number will find Direction A faster.

**Dark mode.** Given up entirely and on purpose. The paper ground is the design.

**The photography's colour.** Full-bleed and unfiltered means the existing images must carry themselves at scale. Where Direction C art-directs them and Direction A duotones them, this direction simply enlarges them — which is the most flattering treatment if they're good and the most exposing if they're not.

**Product energy.** This is the calmest of the three, and calm is the opposite of urgency. For a waitlist page whose job is to convert, restraint has a cost — there is no visual pressure anywhere in this design.
