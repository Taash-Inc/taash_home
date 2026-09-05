# Final design & plan — hero frozen, everything else in scope

**Preview:** `previews/final.html` — the whole page, live. The strip at the bottom toggles motion and a dashed outline marking which sections change.
**Captures:** `screenshots/final-d-fullpage.png` · `final-m-fullpage.png` · plus one per section.

---

## 1. The assumption I'm working from

You said *"leave the hero alone… you can work on the other parts."* I've read that as: **hero frozen, every other section in scope.** That's a widening from the estimator-only plan, so if you actually meant "only the calculator, and stop suggesting hero changes," say so — the plan drops back to ~11 days and Phase 3 disappears.

Everything in the preview reflects the wider reading.

## 2. What's frozen

The hero is reproduced from production **verbatim** — same markup, same values:

| | |
|---|---|
| Ellipse | `border-radius: 50%`, **measured 1.44:1** in the preview — identical to production |
| Gradient | `linear-gradient(to bottom, #A3D3FF, #FFEA66)` at full strength |
| Image | `scale(1.5)`, `object-position: 66% 60%` |
| Badge | `#C5E2FF` pill |
| H1 | Forced `<br>`s preserved |
| Floating cards | ₦45,600 and ₦128,400, both kept |
| Decorations | Both dots and both circle icons kept |
| Spacing | `pt-28 pb-16`, `min-h-[90vh]` |

No arcs, no grid, no rim light, no parallax, no size change. It is the page you have.

### What freezing it costs

Four known defects live inside `Hero.tsx` and survive untouched:

| Defect | Line | Type |
|---|---|---|
| `always tax-ready.**B**uilt for` — missing space, live in production | `Hero.tsx:42` | copy |
| Accessible name reads *"Effortless Tax and**F**inance for**N**igeria's New**W**orkforce"* | `Hero.tsx:29-37` | WCAG 1.3.1 |
| `avatar-small.png` ships **1,195 KB** to render at 40×43px (`unoptimized`) | `Hero.tsx:98` | performance |
| `#22c55e` on white = **2.28:1** — "↑ 12% vs last month" | `AnimatedTaxCard.tsx:88` | **WCAG 1.4.3 AA failure** |

**After the fixes in §4, this is the only remaining AA text-contrast failure on the entire page.** All four are fixable without altering a single pixel of the layout — removing the `<br>`s keeps the same visible line breaks at every breakpoint, and the avatar fix is deleting one word. Tell me whether you want them.

## 3. What changes

| Section | Treatment |
|---|---|
| **Header** | Ledger tokens. Mobile menu gets a waitlist CTA at all scroll positions (fixes the hole at `Header.tsx:124-127`); `aria-expanded` added; `scroll-padding-top` so anchors clear the fixed bar |
| **About** | Sunken band, left-aligned statement, `about-hero.png` at 16:10 beside it. Copy unchanged. Yellow card and centred badge dropped |
| **HowItWorks** | **Reinstated.** Four ruled steps with numerals; `connect-bank.svg` stops being orphaned. All four SVGs used |
| **Features** | Four **ruled cells** — no card, no border, no `hover:shadow-lg`. Icon `alt` corrected to match headings |
| **WhoItsFor** | **Images un-swapped** and **"Creators" restored** as the third persona. Full 4:5 portraits, label over a scrim |
| **TaxEstimator** | **Dark band.** Two panes, sticky result rail, mono tabular figures, shared-baseline comparison, honest signed delta, waitlist handoff |
| **AppDownload** | Demoted from 80px to 48px. Yellow chip, store badges, `phone-hand.png`. Endless spin removed |
| **WaitlistForm** | Flat sunken band, wavy SVG dropped. Every field kept. **Privacy link points at `/privacy`** |
| **Resources** | Scroll-snap rail, **no auto-advance**, 44×44 prev/next, 24×24 dots |
| **Footer** | Ink band, tokens applied |

**Rhythm now varies:** 48px (AppDownload) → 72px (About, Resources) → 96px (HowItWorks, Features, WhoItsFor) → 120px (Estimator, Waitlist). The estimator is unambiguously the loud one — dark, and the only section on a contrasting ground.

**Motion is reduced** from the earlier proposal because the hero is frozen: scroll reveal with an 80ms stagger, comparison bars growing, input focus, CTA lift. No hero arcs, no parallax, no ring rotation. Full `prefers-reduced-motion` support, and the toggle in the preview shows exactly what that user gets.

## 4. Accessibility — measured, not asserted

78 distinct text/background combinations audited on the rendered page. Two real failures found **in my own design**, both fixed:

| Found | Fix |
|---|---|
| Eyebrow labels `ink-600 #717680` on the `#f6f7f8` sunken band = **4.25:1** — passes on white (4.56) but fails on tint | Moved to `ink-700 #5c6068` |
| White text over the persona photos — the scrim was too transparent where the heading sits | Scrim re-solved (see below) |

**On the scrim.** My DOM-based audit can't see through an image, so I measured the real thing: rendered the section with the text hidden, screenshotted it, and sampled the actual pixels with `sharp`.

| Portrait | Worst-case background under the text | White text |
|---|---|---|
| Freelancers | before `rgb(220,212,188)` → after `rgb(118,117,114)` | 1.48 → **4.61:1 PASS** |
| Creators | before `rgb(213,169,87)` → after `rgb(115,96,62)` | 2.18 → **6.05:1 PASS** |
| Small Businesses | before `rgb(210,214,219)` → after `rgb(112,119,129)` | 1.46 → **4.52:1 PASS** |

Solved for the required alpha rather than guessing: the brightest pixel in any of the three photos needs **α ≥ 0.50** for white to clear 4.5:1. The gradient now reaches 0.62 at 14% and 0.90 by 32%, so the heading sits at ≈0.70 and the body text at ≥0.90.

**Being straight about the tool:** three entries still show as failures in my automated pass (`#f8f0bb on #fffcec`, `#8a8f99 on #b8b8b8`, and the two `.who` ones). Those are **compositing artifacts** — the script mis-resolves translucent layers over the dark band and can't see images. I verified each by hand: the amber warning is 13.4:1 on the real rail, the `₦` glyph is 5.5:1, and the overlay text is measured above. I'm listing them so you know the raw output isn't clean and why.

Also fixed page-wide: `role="switch"` + `aria-checked` + a real name on the NHF toggle, `id`/`<label for>`/`aria-valuetext` on the pension slider, `aria-expanded` on every disclosure, `inputMode="numeric"` on every currency field, 44×44 minimum targets, and no auto-advancing content anywhere outside the frozen hero.

## 5. Revised phases — **≈15.5 days**

| Phase | Days | Ships alone? |
|---|---|---|
| **0 · Foundations** — delete unused `@supabase/supabase-js` (clears a high-severity advisory), `next` → 16.0.11, avatar fix, `lib/styles.ts` deletion, Node pin, lint + CI, **extract `lib/tax/` + Vitest**, **fix the five tax defects** | **3** | yes |
| **1 · Token foundation** — Ledger `@theme`, semantic layer, icon normalisation; applied to Header and Footer first | **1** | yes |
| **2 · Estimator, dark band** — rebuild against `lib/tax/`, sticky rail, mono figures, honest comparison, handoff | **6** | yes |
| **3 · Marketing sections** — About, HowItWorks (reinstated), Features, WhoItsFor, AppDownload, WaitlistForm, Resources | **5** | yes, one at a time |
| **4 · Platform catch-up** — `next` → 16.3.4, Sanity v8 + PortableText v8, image re-encode, two components → server components | **1.5** | yes |

Phase 2 is the only high-risk phase; `lib/tax/` being extracted and tested in Phase 0 is what de-risks it. Every phase is independently shippable — you can stop after any of them and the site is coherent.

Deferred: ESLint 10 (after lint is green); **TypeScript 7 blocked** until 7.1 ships the compiler API.

## 6. The one decision still blocking Phase 0

**The font.** Everything you've approved in these previews renders in **Space Grotesk**. Production renders in the OS system font, because `--font-sans` never resolves (`00-audit.md` §2).

- Fix it globally → the whole page including the frozen hero gets Space Grotesk. The hero's *layout* is untouched, but its *type* changes. Compare `screenshots/fontfix-before-current.png` and `fontfix-after-spacegrotesk.png`.
- Scope it to the non-hero sections → the hero stays byte-identical and the rest matches these previews. Costs a slightly awkward split, and the hero keeps rendering in a font nobody chose.

**I'd fix it globally.** But "frozen hero" arguably means frozen type too, so it's yours to call.

Also still open, neither blocking: whether the "you save vs PITA" story stays a headline (I've demoted it to a signed, honest panel), and who signs off on the corrected tax figures.
