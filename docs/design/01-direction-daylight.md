# Direction C — **Daylight**

> **Point of view:** the user is a 26-year-old Lagos freelancer who has never filed a tax return, finds the whole subject slightly humiliating, and is on a phone. The job is not to look authoritative — it's to make tax feel survivable, and to get them to a number before they lose their nerve.

Warm, high-contrast, photography-led, mobile-first. The estimator becomes a short guided flow with an answer that is visible from the first keystroke and never leaves the screen.

---

## 1. Why it doesn't look AI-generated

| Tell | How this direction breaks it |
|---|---|
| **1 · Stock palette** | Ground is `#fcf6f2` — a warm sand at OKLCH hue 55. The neutral ramp is warm-tinted throughout (`#6b5d54`, not `#64748b`). And the brand's orphaned yellow `#ffea66` is promoted from a decorative dot to a **primary surface**, which is a colour move no framework default produces. |
| **2 · Uniform rhythm** | Six named section steps. But the bigger break: this direction uses **full-bleed colour and image bands** to separate sections, so rhythm is carried by surface changes as well as space. Two consecutive sections never share a ground. |
| **3 · Repeated template** | Badges survive — but only **three**, and they become part of the photography treatment rather than a centred pill above a centred H2. Section openings alternate between left-aligned-over-image, full-bleed statement, and centred, so no two adjacent sections share a structure. |
| **4 · Uniform cards** | Cards survive here (this direction is not anti-card) but split into **three explicit tiers** with different radii, elevation and ground: `result` (24px radius, raised, coloured), `content` (16px, flat on sand), `media` (0 radius, full-bleed image). A tax result and a blog teaser are now different objects by construction. |
| **5 · Flat type scale** | 1.28 ratio, nine steps, 12→64px. The answer figure is 64px and always the largest thing on screen. |
| **6 · Decoration as structure** | The floating dots and blobs go. What replaces them is **photography doing real work** — the existing images become full-bleed grounds that separate and identify sections, so the visual interest is carried by content rather than ornament. |
| **7 · Estimator density** | Reframed as a guided flow with a persistent answer. §5. |
| **8 · Motion** | Motion is used for *progress* — step transitions and the answer updating — not for decoration. §6. |
| **9 · Iconography** | One 24×24 grid, 2px stroke, rounded terminals — deliberately friendlier than A's 20/1.5/square. The five illustrative SVGs are kept **at large size in colour**, treated as the warm illustrated assets they are. |
| **10 · Font never renders** | Fixed. Space Grotesk everywhere, which is the right face for this register. |

**The specific reason this reads as designed:** generated marketing pages are photograph-*decorated* — a stock image inside a rounded card beside some text. This direction is photograph-*led*: images are full-bleed grounds that text sits on, cropped to specific people, colour-graded to one recipe. That requires art direction, and art direction is the thing a generated layout most visibly lacks.

---

## 2. Art direction on the existing images

This is the direction's distinguishing investment, so it gets its own section. **No image is replaced.** Every file in `public/` is kept and re-treated.

| Asset | Today | In Daylight |
|---|---|---|
| `hero-image.png` (3.5 MB) | Clipped into an ellipse over a blue→yellow gradient; the mask cuts the laptop and leaves a hard yellow band (`screenshots/local-1280-fold.png`) | **Full-bleed right half**, no mask. Cropped tighter to the subject's face and hands, warm grade (+8 warmth, lifted shadows), with a `sand → transparent` gradient scrim on the left edge so the H1 sits on it legibly. The ellipse and its gradient are deleted |
| `about-hero.png` (1.6 MB) | Inside a blue gradient box, `scale-90`, with a stale "Placeholder for actual image" comment | Full-bleed 21:9 band beneath the About copy, same grade |
| `phone-hand.png` (2.4 MB) | Right side of a grey card, mirrored, with the logo overlaid at hard-coded percentages | Kept, but on a **yellow `#ffea66` band** — the product shot finally gets a ground that flatters it. Logo overlay retained |
| `freelancers.png` / `creators.png` / `smes.png` | 224px-tall crops on top of white cards, **and two are attached to the wrong labels** | **Un-swapped.** Full-height 4:5 portraits, same warm grade, label set *over* the lower third on a scrim. These three images are the most human thing on the site and currently the least visible |
| `avatar-small.png` (1.2 MB → 40px, `unoptimized`) | Half-hidden behind an ellipse edge | Kept in the hero's social-proof line, `unoptimized` removed, served at 80px |
| Four step SVGs | 56px icons on cards, five different grids | **96px illustrated spots** in the reinstated HowItWorks, in colour. Their inconsistent grids are re-drawn to one 24px grid but their palette (`#0A1832 #4a7fa7 #A2D2FF #FDE52B`) is **kept and adopted into the tokens** rather than overridden |
| `logo.svg` / `logo-white.svg` | `#0A1832` + `#4a7fa7`, matching no token | Unchanged files — but `#4a7fa7` becomes a real token, so the mark and the UI agree |
| Store badges | Unchanged | Unchanged, on the yellow band |

**One grade recipe** applied to all five photographs: warm white balance, lifted blacks (never pure black), slightly desaturated greens, protected skin tones. Applied as a build-time transform, not a CSS filter, so it survives `next/image` optimisation.

---

## 3. Token system

### Warm sand neutral — OKLCH hue 55, chroma ×0.7

Text uses the brand ink `#0f172a` rather than a warm near-black, so the brand's darkest value is preserved exactly.

| Step | Hex | vs sand `#fcf6f2` | vs `#f5ece6` | Role |
|---|---|---|---|---|
| 0 | `#fcf6f2` | — | — | **page ground** |
| 100 | `#f5ece6` | 1.06 | — | sunken band |
| 200 | `#e7dbd3` | 1.26 | 1.16 | borders |
| 300 | `#d4c5bb` | 1.55 | 1.43 | strong borders |
| 500 | `#9e8c80` | 3.01 (large only) | 2.77 | placeholder |
| 600 | `#847368` | 4.23 (large only) | 3.89 | captions ≥19px only |
| **700** | **`#6b5d54`** | **5.91 AA** | **5.43 AA** | **secondary text** |
| 800 | `#544841` | 8.24 AA | 7.57 AA | |
| 900 | `#3a312c` | 11.84 AA | 10.89 AA | |
| **ink** | **`#0f172a`** | **16.67 AA** | **15.32 AA** | **body text and headings — brand dark, unchanged** |

### Accents

| Token | Hex | Contrast | Role |
|---|---|---|---|
| `--accent` | `#205ab9` blue-700 | **6.08:1** on sand | Links, interactive text. `blue-600` measures 4.37:1 on sand and **fails**, so it isn't used for text |
| `--accent-fill` | `#2c70df` blue-600 | white on it = **4.68:1** | Primary button fill |
| `--brand-blue` | `#3b82f6` | 3.06 on sand — non-text only | Preserved as fill, focus ring, illustration |
| `--sun` | `#ffea66` | ink on it = **14.63:1** | **Promoted to a primary surface.** Currently a decorative dot at `Hero.tsx:104` and a badge at `AppDownload.tsx:28`; here it becomes a full section ground |
| `--sun-soft` | `#fef9c3` (`--yellow-accent`) | ink on it = 16.0 | Softer tint — reunites the two unrelated yellows into one family |
| `--teal` | `#4a7fa7` | `teal-700 #386485` = **5.89:1** for text | The logo's blue, recovered. Illustration and secondary data |
| `--positive` | `#00742e` green-700 | **5.54:1** on sand; white on it **5.94:1** | Take-home. One meaning only |
| `--negative` | `#d52c29` red-600 | **4.64:1** on sand | "You pay more" — the one new accent, same justification as A and B |

### Ready-to-paste `@theme`

```css
@import 'tailwindcss';

@theme {
  --font-display: 'Space Grotesk', ui-sans-serif, system-ui, sans-serif;
  --font-sans:    'Space Grotesk', ui-sans-serif, system-ui, sans-serif;
  --font-mono:    'JetBrains Mono', ui-monospace, Menlo, monospace;

  /* type scale — 1.28 ratio, 17px base (mobile-first, deliberately large) */
  --text-2xs:  0.75rem;    /* 12px legal */
  --text-xs:   0.875rem;   /* 14px captions */
  --text-sm:   1rem;       /* 16px dense UI, labels */
  --text-base: 1.0625rem;  /* 17px BODY */
  --text-lg:   1.375rem;   /* 22px lead */
  --text-xl:   1.75rem;    /* 28px h3 */
  --text-2xl:  2.25rem;    /* 36px h2 */
  --text-3xl:  2.875rem;   /* 46px h1 mobile */
  --text-4xl:  4rem;       /* 64px h1 desktop + THE ANSWER */

  --leading-tight:1.06; --leading-snug:1.24; --leading-body:1.58;
  --tracking-tight:-0.02em; --tracking-figure:-0.015em;

  --spacing: 0.25rem;
  --space-section-2xs:3rem;   /* 48px  AppDownload */
  --space-section-xs: 4rem;   /* 64px  */
  --space-section-sm: 5rem;   /* 80px  About, Resources */
  --space-section-md: 6.5rem; /* 104px default */
  --space-section-lg: 8rem;   /* 128px Hero, Waitlist */
  --space-section-xl:10.5rem; /* 168px Tax estimator */

  /* radii — three tiers, and they mean different things */
  --radius-media: 0;         /* full-bleed imagery */
  --radius-content: 1rem;    /* 16px content cards */
  --radius-result: 1.5rem;   /* 24px the answer card + primary CTAs */
  --radius-control: 0.75rem; /* 12px inputs, buttons */
  --radius-full: 9999px;     /* avatars, chips */

  --shadow-content: 0 1px 2px rgb(15 23 42 / 0.04);
  --shadow-result:  0 2px 4px rgb(15 23 42 / 0.05), 0 16px 40px -16px rgb(15 23 42 / 0.18);
  --shadow-dialog:  0 32px 80px -24px rgb(15 23 42 / 0.30);

  --ease-out: cubic-bezier(0.22,1,0.36,1);
  --ease-spring: cubic-bezier(0.34,1.4,0.64,1);
  --dur-fast:150ms; --dur-base:260ms; --dur-slow:420ms;

  --color-sand-0:#fcf6f2;  --color-sand-100:#f5ece6; --color-sand-200:#e7dbd3;
  --color-sand-300:#d4c5bb;--color-sand-500:#9e8c80; --color-sand-600:#847368;
  --color-sand-700:#6b5d54;--color-sand-800:#544841; --color-sand-900:#3a312c;
  --color-ink:#0f172a;

  --color-blue-500:#3b82f6; --color-blue-600:#2c70df; --color-blue-700:#205ab9;
  --color-sun:#ffea66;      --color-sun-soft:#fef9c3;
  --color-teal-500:#5f95be; --color-teal-600:#4a7fa7; --color-teal-700:#386485;
  --color-green-700:#00742e;--color-green-400:#22c55e;
  --color-red-600:#d52c29;
}

:root {
  --surface: var(--color-sand-0);
  --surface-sunken: var(--color-sand-100);
  --surface-sun: var(--color-sun);
  --surface-raised: #ffffff;
  --border: var(--color-sand-200);
  --text: var(--color-ink);                /* 16.67:1 */
  --text-secondary: var(--color-sand-700); /*  5.91:1 */
  --text-caption: var(--color-sand-600);   /*  4.23:1 — ≥19px ONLY */
  --accent: var(--color-blue-700);         /*  6.08:1 */
  --accent-fill: var(--color-blue-600);    /*  white 4.68:1 */
  --on-accent: #ffffff;
  --focus: var(--color-blue-600);
  --positive: var(--color-green-700);      /*  5.54:1 */
  --negative: var(--color-red-600);        /*  4.64:1 */
  color-scheme: light;
}
```

**Light only, argued.** Warmth is the direction's entire proposition and it does not survive inversion — a warm dark theme reads as sepia, and a cool dark theme abandons the point. Direction A is where dark belongs. `viewport.themeColor`'s dark entry should be dropped rather than left promising a theme that doesn't exist.

---

## 4. Typography

**Keep Space Grotesk, and this is the direction it actually suits.** It's a geometric grotesque with warm, slightly quirky details — friendly without being childish, which is exactly this register. It has never rendered (`00-audit.md` §2); fixing it costs one line and gives this direction its voice for free.

**No new typeface. Net font weight goes down**, because the third family isn't needed as body: **62 KB → ~62 KB**, but for the first time all of it is used.

**Numerals.** Space Grotesk with `font-variant-numeric: tabular-nums` for the 64px answer and all inline figures — the face's own figures are well-drawn and staying in one family keeps the warm register. **JetBrains Mono is used only inside the comparison table**, where cross-column digit alignment genuinely requires a shared advance width. This is a narrower use of mono than A or B, and deliberate: mono reads as technical, and this direction is trying not to.

```css
.figure { font-variant-numeric: tabular-nums; letter-spacing: var(--tracking-figure); }
.figure-mono { font-family: var(--font-mono); font-variant-numeric: tabular-nums slashed-zero; }
```

| Role | Face | Size | Weight | Leading |
|---|---|---|---|---|
| The answer | Space Grotesk `tnum` | 64 / 46 | 700 | 1.0 |
| h1 | Space Grotesk | 64 / 46 | 700 | 1.06 |
| h2 | Space Grotesk | 36 / 28 | 700 | 1.14 |
| h3 | Space Grotesk | 28 / 22 | 600 | 1.22 |
| Lead | Space Grotesk | 22 / 20 | 400 | 1.5 |
| Body | Space Grotesk | 17 | 400 | 1.58 |
| Labels / UI | Space Grotesk | 16 | 500 | 1.4 |
| Comparison figures | JetBrains Mono | 16 | 500 | 1.45 |
| Legal | Space Grotesk | 12 | 400 | 1.5 |

Body at 17px, one step above the 16px default and three steps above today's most-used 14px.

---

## 5. Section-by-section

**Loud:** the tax estimator — 168px, on the sunken band, with the only 64px figure outside the hero.
**Quieter than today:** AppDownload (80→48px), About (80→80px but flattened), Resources (80→80px).

Ground alternates so no two adjacent sections share a surface: `sand → white → sand-100 → image → sand → sun → sand-100 → sand`.

| Section | Treatment | Ground | Space |
|---|---|---|---|
| **Header** | Warm, low. Wordmark, four links, one pill CTA at `--radius-result`. **Waitlist CTA always visible in the mobile menu.** `aria-expanded` added. `scroll-padding-top` added | sand, translucent | 60px |
| **Hero** | H1 left over the left 45%, `hero-image.png` **full-bleed right 55%** with a sand scrim. Ellipse, gradient and all four decorative dots deleted. The two floating cards **survive, relabelled "Example"**, sitting on the scrim edge — plus a social-proof line using `avatar-small.png`. H1 `<br>`s removed; missing space repaired | sand + photo | `lg` 128px |
| **About** | Copy at 22px on a 60ch measure, left; `about-hero.png` full-bleed 21:9 beneath. Yellow card and badge removed — the copy is unchanged | white | `sm` 80px |
| **HowItWorks** | **Reinstated.** Four steps in a horizontal band, the SVGs at 96px **in their original colour** with big numerals. Their palette is now in the tokens, so they belong | sand-100 | `md` 104px |
| **Features** | 2×2 on desktop, 1-up on mobile. `content` tier cards: 16px radius, flat, hairline, no hover-shadow. Icon alt corrected | sand | `md` 104px |
| **WhoItsFor** | Three **full-height 4:5 portraits**, label over the lower third on a scrim. `media` tier — 0 radius, full-bleed. **Images un-swapped**, dead `gradient` prop removed | image | `md` 104px |
| **TaxEstimator** | §6. The loud one | sand-100 | `xl` 168px |
| **AppDownload** | Slim band on **`--sun`** — the yellow finally does real work. `phone-hand.png` right, badges left, spin removed, real hrefs or an honest disabled state | sun `#ffea66` | `2xs` 48px |
| **WaitlistForm** | Wavy SVG replaced by a flat sand-100 band. Single column, 48px-tall inputs, all fields kept. **Privacy link → `/privacy`.** `role="alert"` on errors, live region on success | sand-100 | `lg` 128px |
| **Resources / BlogCarousel** | Scroll-snap rail, **no auto-advance**, 44×44 prev/next, 24×24 dots, no duplicated DOM. Badge/H2/subhead retained here — one of three | sand | `sm` 80px |
| **Footer** | Ink band, `logo-white.svg` | ink | 96px |

### Asset inventory — the remaining files

§2 covers the photography. For completeness, the vector assets:

| File | Treatment in Daylight |
|---|---|
| `connect-bank.svg` | Kept **in full colour at 96px** — HowItWorks step 1. Re-drawn to one 24px grid; its palette is adopted into the tokens rather than overridden |
| `categorise-expenses.svg` | Kept at 96px — HowItWorks step 2; also Features "Track Income" |
| `get-tax-estimate.svg` | Kept at 96px — HowItWorks step 3; also Features "Record Expenses" |
| `save-monthly.svg` | Kept at 96px — HowItWorks step 4; also Features "Know Your Tax" |
| `receipt-upload.svg` | Kept — Features "Stay Organised". Gains the two palette colours it currently lacks |
| `logo.svg` / `logo-white.svg` | Unchanged files; `#4a7fa7` becomes a token |
| `app-store-badge.png` / `google-play-badge.png` | Kept on the yellow band. Real `href`s or an honest disabled state |
| `og-image.png`, `icon.svg`, `favicon.ico` | Unchanged |

---

## 6. The tax estimator — a guided flow with a permanent answer

The premise: the current estimator asks for ten numbers before it says anything. This one **answers after the first number** and keeps answering.

**Mobile (the primary target) — three steps, answer pinned to the top.**

```
┌──────────────────────────────────┐
│  YOU'LL OWE                      │  ← pinned from step 2 onward,
│  ₦101,147 /month                 │    64px, tabular, updates live
│  ₦1,213,764 a year               │
├──────────────────────────────────┤
│  ●───────○───────○               │  ← 3 steps, always tappable,
│  You    Income   Claims          │    never a wizard you're trapped in
├──────────────────────────────────┤
│  STEP 2 · WHAT YOU EARN          │
│                                  │
│  Basic salary                    │
│  ┌────────────────────────────┐  │
│  │ ₦  450,000                 │  │  ← 56px tall, numeric keypad
│  └────────────────────────────┘  │
│  Housing allowance               │
│  ┌────────────────────────────┐  │
│  │ ₦  180,000                 │  │
│  └────────────────────────────┘  │
│  … transport, other …            │
│                                  │
│  [ Next — what you can claim ]   │
└──────────────────────────────────┘
```

Steps are **navigation, not gating**: all three are always reachable, nothing is validated-and-blocked, and a user who only fills in basic salary still gets a real answer with a quiet note that adding reliefs will lower it. Every field remains on one continuous scroll on desktop; the steps become three labelled bands with the answer card sticky in the right margin.

**Desktop ≥1024px:** the three bands run down the left 60%, the answer card sits sticky in the right 40% at `--radius-result` with `--shadow-result` — the only strongly elevated object on the page.

### The answer card

```
┌────────────────────────────────────┐
│  YOU'LL OWE IN 2026                │
│                                    │
│  ₦101,147                          │  ← 64px
│  a month · ₦1,213,764 a year       │
│  ────────────────────────────────  │
│  You keep     ₦598,003 a month     │  ← --positive
│  Effective rate            12.9%   │
│  ────────────────────────────────  │
│  Gross        ₦9,360,000           │
│  Reliefs     −₦1,450,200  ▸ break  │
│  Taxable      ₦7,909,800           │
│  ────────────────────────────────  │
│  ▸ Compared with the old rules     │
│  ▸ The 2026 tax bands              │
│  ────────────────────────────────  │
│  Estimate only, not tax advice.    │
│  Nigeria Tax Act 2025, in force    │
│  1 Jan 2026. Figures as at 4 Sep.  │
│  ────────────────────────────────  │
│  ┌──────────────────────────────┐  │
│  │  Keep this up to date →      │  │  ← THE HANDOFF
│  │  Join the waitlist            │  │
│  └──────────────────────────────┘  │
└────────────────────────────────────┘
```

### The comparison, when opened

Same honest treatment as A and B, but conversational rather than charted:

> **Compared with the old rules**
> Before 2026 you'd have paid **₦1,294,448**. Under the Nigeria Tax Act you pay **₦1,213,764** — **₦80,684 less**.
> *The old rules no longer apply; this is for context.*

and when it inverts:

> Before 2026 you'd have paid **₦5,807,600**. Under the Nigeria Tax Act you pay **₦6,323,350** — **₦515,750 more**.

Set in `--negative`, in a full sentence. No strikethrough, no OLD/NEW badges, no green card claiming a win that isn't there (`03-tax-content-2026.md` §6).

### Deductions modal → **bottom sheet**

Native-feeling on mobile, which is where this direction lives; a centred dialog on desktop. All current content retained. Proper `role="dialog"`, focus trap, Escape, restoration, named close.

### Empty state

The answer card is present from the start, showing `₦—` and *"Tell us what you earn and we'll work it out."* Step 1 (You) is two taps — salary/creator and monthly/annual — so the user reaches a number within about fifteen seconds of arriving.

### Old → new mapping — all 25 instruments

| # | Today | Line | In Daylight |
|---|---|---|---|
| 1 | Salary/Creator toggle | `:309-375` | **Step 1**, two large tappable cards with the persona illustrations. Fixes today's uneven text-wrap |
| 2 | Monthly/Annual toggle | `:379-398` | **Step 1**, segmented control beneath |
| 3–6 | Basic / Housing / Transport / Other | `:420-495` | **Step 2**, 56px inputs, `inputMode="numeric"` |
| 7 | Pension slider | `:509` | **Step 3.** Labelled, `aria-valuetext`, 44px thumb. Base corrected to basic+housing+transport; max raised above 8 |
| 8 | NHF toggle | `:531` | **Step 3.** `role="switch"`, `aria-checked`, named |
| 9 | NHIS | `:561` | **Step 3** |
| 10 | Annual rent + cap warning | `:583-607` | **Step 3.** Warning on `--sun-soft` (16.0:1) |
| 11–12 | Gross income / expenses (creator) | `:629,:667` | **Step 2**, creator variant. **Rent relief added to this path** |
| 13 | Info button | `:284,:648` | "What can I claim?" text button at the head of Step 3 |
| 14 | Deductions modal | `:1047` | Bottom sheet / dialog |
| 15 | Gross income card | `:689` | Answer card, breakdown line 1 |
| 16 | Total reliefs card + View | `:697-716` | Answer card line 2; "View" becomes `▸ break` with `aria-expanded` |
| 17 | Taxable income card | `:718` | Answer card line 3 |
| 18 | Effective rate card | `:727` | Answer card, under "You keep" |
| 19 | Reliefs breakdown | `:737-800` | Disclosure inside the answer card — all line items retained |
| 20 | Savings banner | `:804-850` | The signed sentence in the comparison disclosure. Renders both ways |
| 21 | OLD PITA card | `:854-896` | Comparison disclosure, with its three figures in mono |
| 22 | NEW NTA card | `:898-926` | Its monthly figure **is** the 64px answer |
| 23 | Take-home | `:929-958` | "You keep", directly under the answer. **Arithmetic corrected** |
| 24 | Brackets comparison | `:962-1031` | `▸ The 2026 tax bands` disclosure; PITA bands inside the comparison. 🎉 removed |
| 25 | Disclaimer | `:1033` | **Inside the answer card**, above the CTA, with basis and date |

Nothing removed. The step structure is navigation over existing content, not a reduction of it.

---

## 7. Motion and interaction

| Element | Behaviour | Duration |
|---|---|---|
| Answer figure | Digits roll to the new value; tabular figures keep width stable, so no reflow | `--dur-base` 260ms, `--ease-out` |
| Step change | Horizontal slide + fade, with the step indicator advancing | 260ms |
| Answer card appearing | Rises and settles once, on first value only | 420ms, `--ease-spring` |
| Bottom sheet | Slide up, backdrop fade, drag-to-dismiss | 420ms in, 260ms out |
| Disclosures | Height + fade | 260ms |
| Input focus | Border colour + 2px ring | 150ms |
| Carousel | Scroll-snap, user-driven. **No auto-advance** | — |
| `AnimatedTaxCard` | Rotation **removed**; one static example, labelled | — |
| `AppDownload` spin | **Removed** | — |

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration:1ms!important; animation-iteration-count:1!important;
                           transition-duration:1ms!important; scroll-behavior:auto!important; }
}
```

Under reduced motion the digit roll becomes an instant swap and step changes become instant — **no information is lost**, because the step indicator and the answer are both static text. The spring on the answer card is the only purely expressive motion in the design and it fires once per session.

---

## 8. Accessibility — how it meets AA

- **Contrast measured on sand, not white.** Every token in §3 is quoted against `#fcf6f2`. Two colours that pass on white fail here and are excluded from text: `blue-600` (4.37:1) and `sand-600` at body size (4.23:1, permitted ≥19px only).
- **17px body and 56px inputs.** Larger defaults are the cheapest accessibility win available, and this direction takes it.
- **1.4.11 Non-text contrast.** Input borders use `sand-500` (3.01:1) at rest — just over the 3:1 minimum, which is tight; focus goes to `blue-600` with a 2px ring at 4.37:1 against sand. Flagged as needing verification on real hardware, because 3.01 has no margin.
- **The yellow band.** Ink on `#ffea66` = **14.63:1**. Yellow is a common accessibility trap; this pairing is safe because the text is the brand's near-black, never white. White on `#ffea66` would be 1.2:1 and is prohibited in the token layer.
- **2.4.7 Focus.** `outline: 2px solid var(--focus); outline-offset: 2px`.
- **4.1.2.** NHF `role="switch"` + `aria-checked` + name; pension slider `id`/`<label for>`/`aria-valuetext`; disclosures and mobile menu `aria-expanded`; sheet close button named.
- **2.1.2.** Bottom sheet and success dialog: `role="dialog"`, `aria-modal`, trap, Escape, restoration, scroll lock.
- **4.1.3.** Answer figure `aria-live="polite" aria-atomic`, debounced 500ms — "You'll owe ₦101,147 a month". Errors `role="alert"`.
- **The step control** is a `tablist`/`tab`/`tabpanel` with roving tabindex, arrow-key navigation, and `aria-selected`. **Steps never gate** — critical, because a wizard that blocks progress on validation is a screen-reader trap.
- **2.5.8.** All targets ≥44×44; slider thumb 44px; carousel dots 8→24px.
- **2.2.2.** No auto-advancing content.
- **1.3.1.** H1 `<br>`s removed.
- **Mobile input.** `inputMode="numeric"` throughout — the single biggest usability fix for this direction's primary device.

**Honest limits.** Text over photography is the risk: the hero scrim must be tested against the actual grade, and if any headline lands below 4.5:1 the scrim gets stronger — the design yields to the ratio, not the other way round. The `sand-500` input border at 3.01:1 has effectively no margin and should be re-measured after the grade is finalised.

---

## 9. Cost

| | |
|---|---|
| **Files touched** | `globals.css`, `layout.tsx`, all 11 components, `lib/tax/`, `components/estimator/*`, **plus a one-off image pipeline pass** |
| **Effort** | ~12–16 developer-days, **plus ~2–3 days of art direction** (grading, re-cropping, re-drawing the four SVGs to one grid) |
| **Risk** | **Medium.** Engineering is the simplest of the three — no dual theme, no sticky rail on mobile. The risk sits in the image work |
| **Biggest win** | Time-to-first-number on a phone. Fixes A1 and A4 and is the only direction that targets the actual device |

**What could go wrong**

1. **The image work doesn't happen.** This direction is *photography-led*; if the grade and re-crops get cut for time, what ships is Direction C with the current images at larger size — which is worse than today, because the flaws scale up. **This direction is not worth starting without the art-direction budget committed.**
2. **The source images can't take full-bleed.** They appear to be AI-generated (`00-audit.md` §11 context); at 1920px full-bleed, hands and text artefacts become visible. Needs a hard look at 100% before committing, and possibly a reshoot budget.
3. **Steps read as a wizard.** Users dislike being walked. Mitigated by making steps navigational rather than gating, but if testing shows people expect one long form, collapse to Direction B's single scroll — the tokens survive that change.
4. **Warm sand looks dirty on cheap displays.** `#fcf6f2` on an uncalibrated budget Android can read as a yellowed white. Test on real hardware.
5. **The friendly register undersells the accuracy.** For an SME owner with a real tax bill, "survivable and warm" may read as "toy". This direction optimises for the freelancer, not the SME — and `WhoItsFor` names SMEs as an audience.

---

## 10. What it sacrifices

**Authority.** This is the least serious-looking of the three. For a product handling money and statutory calculations, warmth trades against the perception of rigour — and the audit found the calculations are currently *wrong* in two places (`03-tax-content-2026.md`). Looking friendly while being inaccurate is a worse position than looking plain while being inaccurate.

**Density for returning users.** The stepped flow is excellent the first time and slower the fifth. A user re-checking one number has to move through structure they no longer need.

**Dark mode**, given up entirely — the warmth doesn't invert.

**And it sacrifices the most if under-resourced.** A and B degrade gracefully when the budget is cut; a photography-led direction without photography work degrades badly. It is the highest-ceiling and lowest-floor of the three.
