# Direction A — **Ledger**

> **Point of view:** the user is doing real financial work on their own money, and deserves an instrument that shows them everything at once — not a brochure that makes them scroll to find out what they owe.

Dual-theme, dark-capable. Dense, precise, monospaced figures, hairline rules instead of cards. The estimator stops being a form with results underneath and becomes a two-pane instrument with a live result rail.

---

## 1. Why it doesn't look AI-generated

Answered against each tell in `00-audit.md` §3.

| Tell | How this direction breaks it |
|---|---|
| **1 · Stock palette** | Nothing stays at a Tailwind default. Neutral is a bespoke cool ramp derived from `#0f172a` at chroma ×0.42 — measurably not `slate` (`#717680` vs slate-500 `#64748b`). One neutral family only. Green is reserved for exactly one meaning. |
| **2 · Uniform rhythm** | Five section scales (`--space-section-xs` → `-xl`). The estimator gets `160px`; About gets `72px`. Rhythm encodes importance. |
| **3 · Repeated template** | The centred badge→H2→subhead is used **twice** (About, Resources), not eight times. Estimator, Hero, Features and WhoItsFor each get a distinct structure — see §5. |
| **4 · Uniform cards** | Cards are nearly abolished. Content sits on ruled bands. The only elevated surfaces on the page are the estimator's result rail and the two modals. A blog teaser and a tax liability can no longer look alike because only one of them is on a raised surface. |
| **5 · Flat type scale** | A stated 1.25 ratio with 9 named steps, and the **result figure is the largest type in the section at 56px** — larger than the section H2 at 32px. The hierarchy inverts back the right way. |
| **6 · Decoration as structure** | Every floating dot and blob is deleted as decoration and **re-earned as data**: the hero's floating cards become a real miniature of the estimator's output. Nothing renders that doesn't carry a number or a label. |
| **7 · Estimator density** | This is the direction's whole thesis. Result adjacent to input, tabular figures, a real comparison with a shared baseline. §6. |
| **8 · Motion** | Motion is reduced to number transitions and disclosure. Auto-rotation is removed everywhere; carousels become user-driven. Full `prefers-reduced-motion` support. §7. |
| **9 · Iconography** | One 20×20 grid, 1.5px stroke, square terminals, single-colour `currentColor`. The five illustrative SVGs are re-framed rather than replaced — §5. |
| **10 · Font never renders** | Fixed. Space Grotesk display, JetBrains Mono for every figure — the mono is already downloaded and currently wasted. |

**The specific reason this reads as designed rather than generated:** generated layouts default to *centred, carded, evenly-spaced*. This direction is left-aligned, ruled, and unevenly spaced on purpose — and it puts a monospaced number at 56px where a generated layout would put a 36px centred heading.

---

## 2. Why dark-first, argued

The strongest single argument is a measured one from `00-audit.md` §4.1:

| | on `#ffffff` | on `#0f172a` |
|---|---|---|
| `#3b82f6` — the brand blue | **3.68:1 — fails AA** | **4.85:1 — passes AA** |

**The company's primary blue only works as a text colour in dark mode.** In light mode it must be darkened to `#2c70df` to be legible, which is no longer quite the brand colour. Dark is where the existing brand is most itself.

Supporting: `layout.tsx:111-114` already declares `themeColor: '#0f172a'` for `prefers-color-scheme: dark` — the site *promises* a dark theme to the OS and doesn't ship one. And a tax tool is used in long, concentrated sessions, which is the use case dark mode is actually for.

**Both themes ship.** Light remains the default so nothing regresses for existing visitors; dark activates on `prefers-color-scheme` plus a manual toggle in the header.

---

## 3. Token system

Every ratio below is computed, not estimated (`scratchpad/tokens.mjs`, OKLCH-derived, gamut-clamped, WCAG 2.1 relative luminance).

### Colour ramps

**Blue — brand hue preserved, `#3b82f6` pinned at step 500**

| Step | Hex | vs white | vs `#0f172a` | Role |
|---|---|---|---|---|
| 50 | `#f0f7ff` | 1.08 | 16.54 | dark-mode text on blue fills |
| 100 | `#e1eeff` | 1.17 | 15.20 | light tint surface |
| 200 | `#c7deff` | 1.37 | 13.02 | borders on tint |
| 300 | `#a5c8ff` | 1.71 | 10.46 | dark-mode secondary text |
| 400 | `#76abff` | 2.32 | 7.68 | dark-mode links |
| **500** | **`#3b82f6`** | 3.68 (large only) | **4.85 AA** | **brand. Fills, focus rings, dark-mode body links** |
| 600 | `#2c70df` | **4.68 AA** | 3.82 | **light-mode links and small text** |
| 700 | `#205ab9` | **6.51 AA** | 2.74 | light-mode pressed / headings |
| 800 | `#174692` | 9.02 AA | 1.98 | |
| 900 | `#0d3067` | 12.84 AA | 1.39 | |
| 950 | `#061d44` | 16.58 AA | 1.08 | dark surface tint |

White on `blue-600` = **4.68:1 AA**; white on `blue-700` = **6.51:1 AA**. Primary buttons use 600.

**Teal — the logo's own blue, recovered. `#4a7fa7` pinned at 600.**

Not a new colour: `logo.svg` and all five illustrative SVGs are drawn in `#4a7fa7`, which appears in no token today (`00-audit.md` §1.5). Promoting it to a ramp makes the mark and the interface agree for the first time.

| Step | Hex | vs white | vs `#0f172a` | Role |
|---|---|---|---|---|
| 100 | `#e2effa` | 1.17 | 15.27 | |
| 400 | `#82b1d6` | 2.28 | 7.83 | dark-mode secondary series |
| 500 | `#5f95be` | 3.22 | **5.55 AA** | dark-mode data text |
| **600** | **`#4a7fa7`** | 4.30 (large only) | 4.15 | **logo colour; icon artwork; chart series 2** |
| 700 | `#386485` | **6.31 AA** | 2.83 | light-mode data text |
| 900 | `#1c3649` | 12.55 AA | 1.42 | |

**Green — `#22c55e` pinned at 400. One meaning only: money you keep.**

| Step | Hex | vs white | vs `#0f172a` | Role |
|---|---|---|---|---|
| 100 | `#d8f6dd` | 1.16 | 15.43 | |
| **400** | **`#22c55e`** | 2.28 | **7.83 AA** | **brand green; dark-mode take-home figure** |
| 500 | `#00ac4a` | 3.00 | 5.95 AA | |
| 700 | `#00742e` | **5.94 AA** | 3.01 | **light-mode take-home figure** |

White on `green-700` = 5.94:1 AA.

**Red — the one new accent, justified**

The estimator must be able to say *"under the 2026 rules you pay ₦515,750 more"* (`03-tax-content-2026.md` §6). There is no negative colour in the token system — only a single raw `text-red-500` at `AnimatedTaxCard.tsx:88`. A tax tool that cannot express "this went up" is missing a primitive.

| Step | Hex | vs white | vs `#0f172a` | Role |
|---|---|---|---|---|
| 100 | `#ffe6e2` | 1.19 | 15.02 | |
| 500 | `#f7463f` | 3.56 | **5.02 AA** | dark-mode negative figure |
| **600** | **`#d52c29`** | **4.97 AA** | 3.59 | **light-mode negative figure; error text** |
| 700 | `#b01e1e` | 6.88 AA | 2.59 | |

White on `red-600` = 4.97:1 AA.

**Amber — from the existing yellow family, kept for warnings only**

`#ffea66` (hero/AppDownload) and `#fef9c3` (`--yellow-accent`) are unified into one ramp. Ink `#0f172a` on `#ffea66` = **14.63:1**; on `amber-100 #f8f0bb` = **15.45:1**. Used for the rent-cap warning (`TaxEstimator.tsx:595-607`) and nothing else.

**Neutral — bespoke cool ink ramp, derived from `#0f172a`, chroma ×0.42**

Replaces stock `slate` *and* the accidental second `gray` family (`00-audit.md` §1.3).

| Step | Hex | vs white | vs `#0f172a` | Role |
|---|---|---|---|---|
| 0 | `#ffffff` | — | 17.85 | light surface |
| 50 | `#f6f7f8` | 1.07 | 16.64 | light raised |
| 100 | `#ebedf0` | 1.17 | 15.22 | light sunken |
| 200 | `#dadce1` | 1.37 | 13.01 | **hairline rules (light)** |
| 300 | `#c3c7ce` | 1.70 | **10.53 AA** | dark-mode body text |
| 400 | `#a6abb4` | 2.31 | **7.74 AA** | dark-mode secondary text |
| 500 | `#8a8f99` | 3.25 | 5.50 AA | placeholder |
| 600 | `#717680` | **4.56 AA** | 3.91 | light-mode secondary text |
| 700 | `#5c6068` | **6.31 AA** | 2.83 | light-mode body text |
| 900 | `#303338` | 12.68 AA | 1.41 | |
| 950 | `#1e1f23` | 16.46 AA | 1.08 | dark raised surface |
| ink | `#0f172a` | 17.85 AA | — | **dark surface / light-mode headings** |

Every text token used at body size clears 4.5:1 on its own surface. **No pairing in this system sits between 3.0 and 4.5** — the band the current site lives in.

### Ready-to-paste `@theme`

```css
/* app/globals.css */
@import 'tailwindcss';

/* ---- FIX FIRST: the font variables must exist where --font-sans is declared.
   Today next/font puts them on <body>, but @theme emits --font-sans on :root,
   so the reference is unresolvable and the site renders in the OS UI font
   (see 00-audit.md §2). Move the next/font classes onto <html> in layout.tsx,
   OR declare the families literally as below. Literal is safer.            ---- */

@theme {
  /* type */
  --font-display: 'Space Grotesk', ui-sans-serif, system-ui, sans-serif;
  --font-sans:    'Space Grotesk', ui-sans-serif, system-ui, sans-serif;
  --font-mono:    'JetBrains Mono', ui-monospace, 'SF Mono', Menlo, monospace;

  /* type scale — 1.25 ratio, 16px base */
  --text-2xs:  0.694rem;  /* 11.1px  legal, table micro-labels */
  --text-xs:   0.8rem;    /* 12.8px  captions */
  --text-sm:   0.875rem;  /* 14px    dense UI, table cells */
  --text-base: 1rem;      /* 16px    body — the default, actually used */
  --text-lg:   1.25rem;   /* 20px    lead paragraphs */
  --text-xl:   1.5rem;    /* 24px    h3 */
  --text-2xl:  2rem;      /* 32px    h2 */
  --text-3xl:  2.5rem;    /* 40px    h1 (mobile) */
  --text-4xl:  3.5rem;    /* 56px    RESULT FIGURE + h1 (desktop) */

  --leading-tight: 1.08;  --leading-snug: 1.28;
  --leading-normal: 1.55; --leading-loose: 1.7;
  --tracking-tight: -0.022em; --tracking-figure: -0.01em;

  /* spacing — 4px base, named section scale */
  --spacing: 0.25rem;
  --space-section-xs: 3rem;   /* 48px  */
  --space-section-sm: 4.5rem; /* 72px  About */
  --space-section-md: 6rem;   /* 96px  default */
  --space-section-lg: 7.5rem; /* 120px Hero, Waitlist */
  --space-section-xl: 10rem;  /* 160px Tax estimator — the loud one */

  /* radii — 4 values, not 7 */
  --radius-none: 0;
  --radius-sm: 0.25rem;   /* inputs, chips */
  --radius-md: 0.5rem;    /* buttons, panels */
  --radius-lg: 0.875rem;  /* the estimator shell, modals */
  --radius-full: 9999px;  /* avatars only */

  /* elevation — rules first, shadow only for true overlays */
  --shadow-none: none;
  --shadow-rail: 0 1px 2px rgb(15 23 42 / 0.04), 0 8px 24px -12px rgb(15 23 42 / 0.12);
  --shadow-modal: 0 24px 64px -16px rgb(15 23 42 / 0.28);

  /* motion */
  --ease-out: cubic-bezier(0.22, 1, 0.36, 1);
  --ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
  --dur-instant: 90ms; --dur-fast: 150ms; --dur-base: 220ms; --dur-slow: 380ms;

  /* ---- colour ramps ---- */
  --color-blue-50:#f0f7ff;  --color-blue-100:#e1eeff; --color-blue-200:#c7deff;
  --color-blue-300:#a5c8ff; --color-blue-400:#76abff; --color-blue-500:#3b82f6;
  --color-blue-600:#2c70df; --color-blue-700:#205ab9; --color-blue-800:#174692;
  --color-blue-900:#0d3067; --color-blue-950:#061d44;

  --color-teal-100:#e2effa; --color-teal-400:#82b1d6; --color-teal-500:#5f95be;
  --color-teal-600:#4a7fa7; --color-teal-700:#386485; --color-teal-900:#1c3649;

  --color-green-100:#d8f6dd; --color-green-400:#22c55e;
  --color-green-500:#00ac4a; --color-green-700:#00742e;

  --color-red-100:#ffe6e2; --color-red-500:#f7463f;
  --color-red-600:#d52c29; --color-red-700:#b01e1e;

  --color-amber-100:#f8f0bb; --color-amber-300:#d9ca6a;
  --color-amber-500:#ffea66; --color-amber-700:#6e6100;

  --color-ink-50:#f6f7f8;  --color-ink-100:#ebedf0; --color-ink-200:#dadce1;
  --color-ink-300:#c3c7ce; --color-ink-400:#a6abb4; --color-ink-500:#8a8f99;
  --color-ink-600:#717680; --color-ink-700:#5c6068; --color-ink-800:#474a51;
  --color-ink-900:#303338; --color-ink-950:#1e1f23; --color-ink-1000:#0f172a;
}

/* ---- semantic layer: the only names components use ---- */
:root {
  --surface:        #ffffff;
  --surface-raised: var(--color-ink-50);
  --surface-sunken: var(--color-ink-100);
  --rule:           var(--color-ink-200);
  --rule-strong:    var(--color-ink-300);
  --text:           var(--color-ink-1000);   /* 17.85:1 */
  --text-secondary: var(--color-ink-700);    /*  6.31:1 */
  --text-muted:     var(--color-ink-600);    /*  4.56:1 */
  --accent:         var(--color-blue-600);   /*  4.68:1 */
  --accent-fill:    var(--color-blue-600);
  --on-accent:      #ffffff;                 /*  4.68:1 */
  --focus:          var(--color-blue-500);
  --positive:       var(--color-green-700);  /*  5.94:1 */
  --negative:       var(--color-red-600);    /*  4.97:1 */
  --warn-surface:   var(--color-amber-100);
  --warn-text:      var(--color-ink-1000);   /* 15.45:1 on amber-100 */
  color-scheme: light;
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme='light']) { --surface:#0f172a; --surface-raised:#1e1f23;
    --surface-sunken:#0b1220; --rule:#303338; --rule-strong:#474a51;
    --text:#f6f7f8; --text-secondary:var(--color-ink-300); --text-muted:var(--color-ink-400);
    --accent:var(--color-blue-500); --accent-fill:var(--color-blue-600); --on-accent:#ffffff;
    --focus:var(--color-blue-400); --positive:var(--color-green-400);
    --negative:var(--color-red-500); --warn-surface:#3a3305; --warn-text:var(--color-amber-100);
    color-scheme: dark; }
}
:root[data-theme='dark'] { /* identical block — manual toggle wins both ways */ }
```

Dark-mode ratios: `--text #f6f7f8` on `#0f172a` = 16.64:1 · `--text-secondary #c3c7ce` = 10.53:1 · `--text-muted #a6abb4` = 7.74:1 · `--accent #3b82f6` = 4.85:1 · `--positive #22c55e` = 7.83:1 · `--negative #f7463f` = 5.02:1. All AA.

---

## 4. Typography

**Keep Space Grotesk — and actually render it.** It was the brand's choice and it has never been on screen (`00-audit.md` §2). Changing a typeface the client has never seen working is the wrong order of operations. Fix it, look at it, change it later if it disappoints.

Restrict it to **display** — h1/h2/h3 and the result figure. It's a display grotesque; at 14px in a dense table its wide apertures and tall x-height cost legibility.

**Figures: JetBrains Mono, already downloaded and currently used only in blog code blocks.** Every naira amount, percentage, rate and bracket boundary is set in it with `font-variant-numeric: tabular-nums`. Zero new download cost — it is a pure recovery of 40 KB already being paid for.

```css
.figure { font-family: var(--font-mono);
          font-variant-numeric: tabular-nums slashed-zero;
          letter-spacing: var(--tracking-figure); font-feature-settings: 'zero' 1; }
```

Why mono rather than sans-with-tabular: in the two-column comparison the digits must align **across columns**, not just within one. Mono guarantees a shared advance width, so `₦1,294,448` and `₦1,203,396` line up digit-for-digit and the eye reads the difference without arithmetic. That is the single change that makes the comparison a comparison.

**Body text: the system UI stack.** Zero download, excellent at 14–16px, and correct rendering of ₦ across Android and iOS. Net font weight: **62 KB → ~40 KB**, and for the first time it's all used.

| Role | Face | Size | Weight | Leading |
|---|---|---|---|---|
| Result figure | JetBrains Mono | 56 / 40 mobile | 700 | 1.0 |
| h1 | Space Grotesk | 56 / 40 | 700 | 1.08 |
| h2 | Space Grotesk | 32 / 28 | 700 | 1.15 |
| h3 | Space Grotesk | 24 / 20 | 600 | 1.25 |
| Lead | system | 20 / 18 | 400 | 1.55 |
| Body | system | 16 | 400 | 1.6 |
| Dense UI / table | system | 14 | 400–500 | 1.45 |
| Figures in tables | JetBrains Mono | 14 | 500 | 1.45 |
| Legal | system | 12.8 | 400 | 1.5 |

Ratio **1.25**, nine steps. Current site: eleven ad-hoc sizes with body living at 14px and `text-base` used once.

---

## 5. Section-by-section

**Which section is loud:** the **tax estimator** — `--space-section-xl` (160px), full-bleed on a contrasting surface, the only place a 56px figure appears.
**Which get less than today:** About (80→72px and no badge), AppDownload (80→48px, it is a "coming soon" note, not a chapter), Resources (80→72px).

| Section | Treatment | Space |
|---|---|---|
| **Header** | Unchanged structure. Adds theme toggle, `aria-expanded` on the menu button, and **a waitlist CTA visible in the mobile menu at all scroll positions** (fixes `00-audit.md` A5). Backdrop blur stays. `scroll-padding-top` added so anchors clear it. | 64px tall |
| **Hero** | Two-column stays. `hero-image.png` keeps its ellipse mask but the gradient becomes a **duotone in `ink-1000`→`teal-600`**, so the photo stops competing with the UI. The four decorative dots are deleted; the two floating cards **survive and become honest** — relabelled "Example" and restyled as a miniature of the real result rail, using the same mono figures. `avatar-small.png` stays, `unoptimized` removed. H1 loses its forced `<br>`s (fixes the run-on accessible name); the "tax-ready.Built" space is repaired. | `lg` 120px |
| **About** | Loses the badge and the centred template. Becomes a **full-bleed statement**: 32px text on `--surface-sunken`, `about-hero.png` as a bleeding right-edge duotone. Copy unchanged. | `sm` 72px |
| **HowItWorks** | **Reinstated** (`00-audit.md` §9). Becomes a numbered horizontal band with a connecting rule — the four SVGs are normalised into one 20px grid and recoloured to `currentColor` (`teal-600`), so `connect-bank.svg` stops being orphaned. | `md` 96px |
| **Features** | Grid stays 4-up but cards become **ruled cells** — no border, no shadow, a top hairline each. Icon alt text corrected to match headings. | `md` 96px |
| **WhoItsFor** | **Images un-swapped** (`00-audit.md` D1). Three full-height duotone portraits with the label set *over* the image rather than in a card below. The dead `gradient` property is removed. `freelancers/creators/smes.png` all retained, re-cropped 4:5. | `md` 96px |
| **TaxEstimator** | §6. The loud one. | `xl` 160px |
| **AppDownload** | Demoted to a slim band: badge, one line, two store badges, `phone-hand.png` at the right. Endless spin removed. Store links get real hrefs or an honest disabled state. Copy unchanged except the missing space. | `xs` 48px |
| **WaitlistForm** | Wavy SVG background replaced by a flat `--surface-sunken` band with a single top rule. Every field retained. **Privacy link points at `/privacy`.** Errors get `role="alert"`; success gets a live region and a proper dialog. | `lg` 120px |
| **BlogCarousel / Resources** | Auto-rotation removed; becomes a **scroll-snap rail** with real prev/next buttons (44×44) and dots at 24×24. Duplicated DOM nodes gone. Badge/H2/subhead template retained here — one of only two places it appears. | `sm` 72px |
| **Footer** | Unchanged apart from tokens. | 96px |

### Asset inventory — every file in `public/`, explicitly

| File | Treatment in Ledger |
|---|---|
| `hero-image.png` | Kept. Ellipse mask retained, gradient replaced by an `ink-1000 → teal-600` duotone so the photo recedes behind the UI |
| `about-hero.png` | Kept. Bleeds off the right edge of the About band, same duotone |
| `phone-hand.png` | Kept. Right of the slim AppDownload band, unmirrored, logo overlay retained |
| `freelancers.png` | Kept. "Freelancers" card, re-cropped 4:5, duotone, label over image |
| `creators.png` | Kept — **re-attached to "Creators"**, the label it was drawn for (`00-audit.md` D1) |
| `smes.png` | Kept — **re-attached to "Small Businesses"** |
| `avatar-small.png` | Kept in the hero's example card. `unoptimized` removed so it stops shipping 1,195 KB for a 40px slot |
| `connect-bank.svg` | Kept. Re-drawn to the 20px grid, `currentColor` in `teal-600`; step 1 of the reinstated HowItWorks |
| `categorise-expenses.svg` | Kept. Same normalisation; HowItWorks step 2 **and** Features "Track Income" |
| `get-tax-estimate.svg` | Kept. Same; HowItWorks step 3 **and** Features "Record Expenses" |
| `save-monthly.svg` | Kept. Same; HowItWorks step 4 **and** Features "Know Your Tax" |
| `receipt-upload.svg` | Kept. Same; Features "Stay Organised". Gains the two palette colours it is currently missing so it stops reading lighter than its siblings |
| `logo.svg` | Unchanged file. Its `#4a7fa7` is now a real token, so mark and UI agree for the first time |
| `logo-white.svg` | Unchanged. Footer, and the dark theme's header |
| `app-store-badge.png` / `google-play-badge.png` | Kept, unchanged artwork. Real `href`s or an honest disabled state instead of `#` |
| `og-image.png`, `icon.svg`, `favicon.ico` | Unchanged |

---

## 6. The tax estimator

### Layout

**Desktop ≥1024px — two panes, 58 / 42.**

```
┌──────────────────────────────────────────┬───────────────────────────┐
│  INPUTS (scrolls)                        │  RESULT RAIL (sticky)     │
│                                          │                           │
│  ○ Salary earner   ● Creator             │   YOU OWE, 2026           │
│  ○ Monthly  ● Annual                     │   ₦100,283  /month        │  ← 56px mono
│  ─────────────────────────────────────   │   ₦1,203,396 /year        │
│  INCOME                                  │   ─────────────────────   │
│   Basic salary        ₦ 450,000          │   Gross        9,360,000  │  ← tabular,
│   Housing             ₦ 180,000          │   Reliefs     −1,507,800  │    right-aligned,
│   Transport           ₦  90,000          │   Taxable      7,852,200  │    shared decimal
│   Other allowances    ₦  60,000          │   Effective        12.9%  │
│  ─────────────────────────────────────   │   ─────────────────────   │
│  RELIEFS                    [What counts?]│   Take-home   7,128,804  │  ← green, correct
│   Pension  ▓▓▓▓▓▓▓░ 8%      691,200      │                 /year     │
│   NHF          [on]         135,000      │   ─────────────────────   │
│   NHIS                ₦  12,000          │   ▸ How this compares to  │
│   Annual rent         ₦2,400,000         │     the old PITA rules    │
│     relief 20%, max ₦500,000  480,000    │                           │
│  ─────────────────────────────────────   │   [ Track this with Taash │
│  ▸ Reliefs breakdown                     │     — join the waitlist ] │  ← THE HANDOFF
│  ▸ 2026 tax bands                        │                           │
└──────────────────────────────────────────┴───────────────────────────┘
```

The rail is `position: sticky; top: 88px`. **Type a digit anywhere on the left and the 56px figure on the right changes in view.** That is the entire fix for `00-audit.md` A4.

**Mobile <1024px — inputs full width, result rail becomes a sticky bottom summary bar.**

```
┌─────────────────────────────┐
│  (inputs, one column)       │
│                             │
├─────────────────────────────┤
│ YOU OWE   ₦100,283/mo   ▲   │  ← sticky bottom, 72px, always visible
└─────────────────────────────┘
   tap ▲ → expands to full result sheet
```

The bar is visible from the moment the first field has a value. The user never scrolls to find their number. Expanding gives the full breakdown, the comparison, and the CTA.

### How the comparison is visualised

Two figures on a **shared horizontal baseline**, mono, same scale, with the delta stated in words and colour:

```
2026 · Nigeria Tax Act    ████████████████████░░░░  ₦1,203,396
Pre-2026 · PITA rules     ██████████████████████░░  ₦1,294,448

            ₦91,052 less under the 2026 rules
```

and when it inverts (above ≈₦20M/yr, `03-tax-content-2026.md` §6):

```
2026 · Nigeria Tax Act    ████████████████████████  ₦6,323,350
Pre-2026 · PITA rules     ██████████████████████░░  ₦5,807,600

            ₦515,750 MORE under the 2026 rules        ← --negative
```

Bars share a baseline, so the difference is visible before either number is read. The strikethrough is gone. "OLD/NEW" become dates. The panel is **collapsed by default** — the primary answer is "what you owe in 2026", per `03-tax-content-2026.md` §6.

### Deductions modal → **drawer**

Modal becomes a right-side drawer on desktop, bottom sheet on mobile, so the user keeps their inputs in view while reading what counts. Proper `role="dialog"`, `aria-modal`, focus trap, Escape, focus restoration, named close button — all four current failures fixed.

### Empty state

Not blank. The rail shows the structure with `—` placeholders and one line: *"Enter your income to see what you owe in 2026."* The 2026 bands table is expanded by default when empty and collapses once a figure exists — reference material when it's useful, out of the way when it isn't.

### Handoff to the waitlist

The rail ends with a persistent CTA. Once a result exists it becomes specific: **"Taash tracks this all year — join the waitlist"**, and the waitlist form pre-fills `monthlyIncome` from the estimator. This is the single highest-value change in the whole redesign (`00-audit.md` A1).

### Old → new mapping — all 25 instruments

| # | Today | Line | In Ledger |
|---|---|---|---|
| 1 | Salary/Creator toggle | `:309-375` | Radio group, top of input pane. Equal-width, no text wrap |
| 2 | Monthly/Annual toggle | `:379-398` | Second radio group, same row |
| 3 | Basic salary | `:420` | Input pane, INCOME. `inputMode="numeric"` |
| 4 | Housing allowance | `:442` | INCOME |
| 5 | Transport allowance | `:464` | INCOME |
| 6 | Other allowances | `:486` | INCOME — **excluded from the pension base** (`03-tax-content-2026.md` §4) |
| 7 | Pension slider | `:509` | RELIEFS. Gains `id` + `<label for>`, `aria-valuetext` "8 percent, ₦691,200". Max raised above 8 (statutory minimum, not a cap) |
| 8 | NHF toggle | `:531` | RELIEFS. Becomes `role="switch"` + `aria-checked` + a real name |
| 9 | NHIS amount | `:561` | RELIEFS |
| 10 | Annual rent + cap warning | `:583-607` | RELIEFS. Warning uses `--warn-surface` (15.45:1) |
| 11 | Gross income (creator) | `:629` | INCOME, creator variant |
| 12 | Business expenses (creator) | `:667` | INCOME, creator variant. **Rent relief added to this path** |
| 13 | Info button | `:284`,`:648` | "What counts?" text button beside RELIEFS — a real label, not a bare ⓘ |
| 14 | Deductions modal | `:1047` | Drawer / bottom sheet |
| 15 | Gross income card | `:689` | Rail line 1 of the breakdown |
| 16 | Total reliefs card + View | `:697-716` | Rail line 2; "View" becomes the `▸ Reliefs breakdown` disclosure with `aria-expanded` |
| 17 | Taxable income card | `:718` | Rail line 3 |
| 18 | Effective rate card | `:727` | Rail line 4 |
| 19 | Reliefs breakdown | `:737-800` | Disclosure under the rail — every line item retained |
| 20 | Tax savings banner | `:804-850` | Becomes the **signed delta line** under the comparison bars. Renders in both directions |
| 21 | OLD PITA card | `:854-896` | Comparison bar 2 + its three figures, in the collapsed panel |
| 22 | NEW NTA card | `:898-926` | Promoted: its monthly figure **is** the 56px headline |
| 23 | Annual take-home | `:929-958` | Rail, below a rule, in `--positive`. **Arithmetic corrected** to net off pension/NHF/NHIS |
| 24 | Brackets comparison | `:962-1031` | `▸ 2026 tax bands` disclosure; PITA column moves inside the comparison panel. 🎉 removed |
| 25 | Disclaimer | `:1033` | Short form under the result figure + full text at section foot (`03-tax-content-2026.md` §7) |

Nothing removed. Twelve things move into progressive disclosure; the result moves up.

---

## 7. Motion and interaction

| Element | Behaviour | Duration |
|---|---|---|
| Result figure on input | Digits cross-fade in place; no counting-up, no layout shift (tabular figures guarantee stable width) | `--dur-fast` 150ms |
| Comparison bars | Width transition on `transform: scaleX` | `--dur-base` 220ms, `--ease-out` |
| Disclosures | Height + opacity | 220ms |
| Drawer / sheet | Slide + backdrop fade | 380ms in, 220ms out |
| Theme toggle | `View Transitions API` circular wipe from the button, with a static fallback | 380ms |
| Mobile summary bar | Slides up when the first value is entered | 220ms |
| Carousel | User-driven scroll-snap only. **No auto-advance** | — |
| `AnimatedTaxCard` | Rotation **removed**; shows one honest example, labelled | — |
| `AppDownload` spin | **Removed** | — |

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 1ms !important; animation-iteration-count: 1 !important;
    transition-duration: 1ms !important; scroll-behavior: auto !important;
  }
  /* result figure still updates — it just swaps rather than fades */
}
```

Reduced motion loses no information: every animated state has a static equivalent, and the two auto-rotating components are gone for everyone, which resolves the WCAG 2.2.2 failure at source rather than conditionally.

---

## 8. Accessibility — how it meets AA

Not a promise; the mechanisms.

- **Contrast.** Every semantic token's ratio is in §3 and no body-size pairing sits below 4.5:1 in either theme. The 3.0–4.5 band the current site occupies is empty by construction.
- **1.4.11 Non-text contrast.** Rules at `ink-200` on white are 1.37:1 — decorative only. Every *interactive* boundary (input borders, switch tracks, focus rings) uses `ink-400` (2.31:1) minimum against `ink-50`, and focus rings use `blue-500`/`blue-400` at ≥3:1 against both surfaces.
- **2.4.7 Focus visible.** One designed ring: `outline: 2px solid var(--focus); outline-offset: 2px`. Replaces the browser default that is currently doing the work everywhere (`00-audit.md` §4.4).
- **4.1.2 Name/Role/Value.** NHF becomes `role="switch"` with `aria-checked` and a real label; the pension slider gains `id`/`<label for>`/`aria-valuetext`; the reliefs disclosure and mobile menu gain `aria-expanded`; the modal close button gains a name.
- **2.1.2 / 2.4.3.** Drawer and success dialog: `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, focus trap, Escape, focus restoration, scroll lock.
- **4.1.3 Status messages.** Result figure in `aria-live="polite" aria-atomic` — announced as "You owe ₦100,283 per month" after a 500ms debounce, not on every keystroke. Form errors `role="alert"`.
- **2.2.2 Pause Stop Hide.** No auto-advancing content exists.
- **2.5.8 Target size.** 44×44 minimum for all controls; carousel dots go 8px → 24px.
- **1.3.1.** H1 forced line breaks removed, so the accessible name reads as a sentence.
- **Mobile input.** `inputMode="numeric"` on every currency field.
- **Dark mode.** Both themes carry the full token set; `color-scheme` set so form controls and scrollbars follow.

**Honest limits.** Turnstile's iframe contrast is Cloudflare's, not ours — the `theme` option gets set per active theme, which is the extent of our control. And AA is a floor: the 56px mono result figure at 17.85:1 is well past it, which is the point.

---

## 9. Cost

| | |
|---|---|
| **Files touched** | `app/globals.css` (rewrite), `app/layout.tsx` (font fix + theme script), all 11 components, plus new `lib/tax/` and `components/estimator/*` |
| **Effort** | ~13–17 developer-days. `TaxEstimator` is ~7 of them: it is a restructure, not a restyle |
| **Risk** | **Medium-high.** The estimator rewrite is the risk. Dual-theme roughly doubles the visual QA surface |
| **Biggest win** | The result rail. Fixes A1 and A4 together |

**What could go wrong**

1. **The sticky rail fights mobile browser chrome.** iOS Safari's collapsing toolbar makes `position: sticky; bottom: 0` unreliable. Mitigation: `dvh` units and a tested fallback; budget a day for real-device testing.
2. **Dark mode ships half-done.** The photography is the hard part — `hero-image.png` and the three persona shots have light backgrounds that glare on a dark surface. The duotone treatment is what makes dark viable; if that's cut, dark mode should be cut with it.
3. **The estimator rewrite regresses the arithmetic.** Mitigation: extract `lib/tax/` as pure functions with unit tests **before** touching the UI (`04-upgrade-plan.md`). Bracket maths is where being wrong costs a user money.
4. **Mono figures read as "developer tool"** to a non-technical audience. Mitigation is restraint — mono for figures only, never for labels or prose.
5. **Density fails for low-literacy users.** The direction assumes the user wants more information on screen. If Vercel Analytics shows most sessions ending before the estimator, that assumption is wrong and Direction C is the better bet.

---

## 10. What it sacrifices

**Warmth.** This is a competent, slightly cold instrument. It will read as trustworthy and serious, and it will not read as friendly. For a first-time freelancer who is anxious about tax and has never filed, "serious financial tool" may be exactly the wrong first impression — it can amplify the intimidation the product exists to remove.

**It also sacrifices photographic impact.** Duotone-ing the existing photography makes it recede so the data can lead. Those images are the most human thing on the site, and this direction deliberately turns them down.

**And it is the most expensive of the three,** because dual-theme plus an estimator restructure is two projects. If only one can ship this quarter, the estimator is the half that matters — the theme can wait.
