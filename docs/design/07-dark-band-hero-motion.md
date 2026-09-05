# Dark estimator band · dramatic hero · motion system

**Preview:** `previews/ledger-dark.html` — live, with a control strip along the bottom. Switch the hero circle between three treatments, toggle motion on / off / half-speed, and toggle parallax. The control strip is preview furniture, not part of the design.

---

## 1. A correction I owe you

In `06-scope-estimator-only.md` I wrote *"you cannot have a dark calculator inside a light page."* That was wrong — I conflated a dark **theme** with a dark **band**.

A permanently-dark *section* inside a light page is a well-established device (Stripe, Linear and Vercel all use it) and it is **better than either option I gave you**:

| | Dark band | Full dual theme | Light estimator |
|---|---|---|---|
| Needs a theme system | **No** | Yes | No |
| QA surface | **One** | Doubled | One |
| Calculator reads as a distinct instrument | **Yes** | No | No |
| `themeColor: '#0f172a'` promise | partially honoured | honoured | should be deleted |
| Added cost | **~0.5 day** | ~1.5 days + permanent premium | 0 |

So: **you were right, and it's cheap.** ~0.5 day, not the 1.5 days a real dual theme costs, because there is no toggle, no persistence, no second QA pass — the section is simply dark, always.

It also does the "more sophisticated / more techy" job on its own. The band change is the single biggest contributor to that in this whole set.

### Contrast inside the band — one thing the measurement caught

The panes are translucent white over `#0f172a`, which lightens the surface underneath them and lowers contrast:

| Surface | Composite |
|---|---|
| Band | `#0f172a` |
| Input pane `rgba(255,255,255,.035)` | `#171f31` |
| Result rail `rgba(255,255,255,.055)` | `#1c2436` |

| Token | vs band | vs pane | vs rail |
|---|---|---|---|
| Body `#f6f7f8` | 16.64 AA | 15.33 AA | 14.45 AA |
| Secondary `#c3c7ce` | 10.53 AA | 9.70 AA | 9.14 AA |
| Muted `#a6abb4` | 7.74 AA | 7.13 AA | 6.72 AA |
| Labels `#8a8f99` | 5.50 AA | 5.07 AA | 4.77 AA |
| **Brand blue `#3b82f6`** | **4.85 AA** | **4.47 ✗** | **4.21 ✗** |
| Blue `#76abff` | 7.68 AA | 7.08 AA | 6.67 AA |
| Positive `#22c55e` | 7.83 AA | 7.22 AA | 6.80 AA |
| **Negative `#f7463f`** | 5.02 AA | 4.62 AA | **4.36 ✗** |
| Teal `#82b1d6` | 7.83 AA | 7.21 AA | 6.80 AA |

**Rule that falls out of this:** `#3b82f6` is a **fill and focus-ring colour inside the band, never small text on a raised surface.** For links and small blue text on panes, use `blue-400 #76abff` (7.08:1). Same for the negative figure on the rail — it needs a lighter red than `#f7463f`. The preview already follows this; it's written down so it doesn't get lost in implementation.

White on `blue-600 #2c70df` = 4.68:1 for the primary button. Focus ring `#3b82f6` on the band = 4.85:1, well past the 3:1 non-text minimum.

---

## 2. The hero circle — three treatments

All three keep `hero-image.png` and the brand blue→yellow gradient. Switch between them live in the preview.

### 1 · Current
Production as it stands: a wide ellipse (`rounded-[50%]`, 1.44:1), flat `#A3D3FF → #FFEA66` gradient at full strength. Included as the baseline to compare against.

### 2 · Halo
True circle. A **conic-gradient ring rotates slowly around it** (22s), with a counter-rotating amber arc (34s) and a single orbiting node. Soft radial glow behind.

Honest note: **it reads much better in motion than in a still.** A screenshot catches the ring at an arbitrary angle, so the captures undersell it. Look at it live before judging.

### 3 · Aperture — **my recommendation**
The dramatic one. The circle is **oversized and bleeds off the right edge of the viewport**, with three concentric technical arcs — two that draw themselves in on load, one dashed ring rotating slowly (60s). A faint 34px grid sits behind, radially masked. The photo gets a **1px rim light and an inner top highlight**, which is what makes it read as an object rather than a cropped picture.

I also fixed the treatment that was bleaching the subject: the tint is now `rgba(32,90,185,.42) → transparent → rgba(255,234,102,.34)` with the image at `contrast(1.07) saturate(1.1)`, instead of a flat 55% yellow wash. Compare `screenshots/hero-v3.png` against `screenshots/hero-v1.png`.

**Why 3 over 2:** the drama comes from *scale and cropping*, which survives a still image, a slow connection and reduced-motion. Halo's drama is entirely in the animation, so it disappears in all three of those cases.

---

## 3. Motion system

The brief was "techy and sophisticated." Sophisticated motion is **restrained and purposeful** — motion that explains something. Everything below either shows a state change or reveals structure. Nothing loops for decoration except the hero ring, which is ambient and slow.

| # | Motion | Where | Duration | Why it earns its place |
|---|---|---|---|---|
| 1 | **Digit roll** on the result | Result rail | 550ms, staggered 55ms/digit | The number is the product. Rolling digits show it *computing*, and tabular figures mean zero layout shift |
| 2 | **Comparison bars grow** from zero | Comparison panel | 900ms, 140ms apart | Shows the two regimes being measured against each other |
| 3 | **Scroll reveal**, 18px rise + fade | Section blocks | 700ms, 90ms stagger | Structure arrives in reading order |
| 4 | **Arcs draw in** | Hero (Aperture) | 1.6s, staggered | One-shot on load; suggests instrument calibration |
| 5 | **Ring rotation** | Hero | 22s / 34s / 60s | Ambient only. Slow enough to read as alive, not as animation |
| 6 | **Pointer parallax** on the floating cards | Hero | 500ms ease-out, ±14px | Depth. Pointer-only — never fires on touch |
| 7 | **Input focus** border + 3px ring | Estimator | 180ms | Feedback |
| 8 | **CTA lift** 1px + glow | Handoff button | 200ms | Affordance |

**Easing:** `cubic-bezier(.22, 1, .36, 1)` throughout — a fast-out, long-settle curve. It is the single thing that most separates "sophisticated" from "bouncy".

**What I deliberately did not add:** scroll-jacking, text scramble/typewriter effects, count-up on marketing statistics, tilt-on-hover cards, animated gradient meshes, or a custom cursor. Each of those is more likely to make a financial tool look *less* trustworthy, not more.

### Reduced motion

```css
@media (prefers-reduced-motion: reduce){
  *,*::before,*::after{ animation-duration:.001ms!important; animation-iteration-count:1!important;
                        transition-duration:.001ms!important; }
  .rv{ opacity:1; transform:none; }
}
```

Every animation has a static end state, so **nothing is lost**: digits render at their final value, bars render at full width, revealed blocks are simply visible, arcs are drawn. The parallax handler also checks `matchMedia('(prefers-reduced-motion: reduce)')` at call time and returns early — a CSS-only guard wouldn't stop the JS from writing transforms.

Toggle "Motion: Off" in the preview to see exactly what a reduced-motion user gets. It is the same page, still.

### Performance

Everything animates `transform` and `opacity` only — no layout or paint thrash. The conic rings are single composited elements. The grid overlays are CSS gradients, not images. Scroll reveal uses one `IntersectionObserver` that unobserves each element after it fires, so there is no scroll handler at all. Pointer parallax is the only per-frame work and it is pointer-gated.

**Added weight: ~2 KB of CSS, ~1.5 KB of JS. No libraries.**

---

## 4. What this does to the phases

Net **+1 day** on the ~11-day plan → **≈12 days**.

| Phase | Was | Now | Change |
|---|---|---|---|
| 0 · Foundations | 3 d | **3 d** | — |
| 1 · Scoped tokens | 0.5 d | **0.5 d** | Dark band values added; no theme system |
| 2 · Estimator | 5.5 d | **6 d** | +0.5 d for the dark band and its motion |
| 2b · **Hero circle + motion** | — | **1.5 d** | **new** — Aperture treatment, arcs, parallax, reveal |
| 4 · Platform catch-up | 1.5 d | **1.5 d** | — |

**The hero work re-opens `Hero.tsx`,** which you'd previously ruled out of scope. Worth being explicit: this touches the layout you said you liked. The copy, the headline, the two CTAs, the badge and both floating cards all stay exactly as they are — what changes is the circle's size, crop, tint and surrounding arcs.

Since `Hero.tsx` is open anyway, the defect fixes in that file (the `tax-ready.Built` missing space, the forced `<br>`s that produce the run-on accessible name, and `unoptimized` on the 1,195 KB avatar) come essentially free.

`themeColor: '#0f172a'` at `layout.tsx:113` can now stay — the page genuinely has a dark region. It is still not a full dark theme, so it remains a partial promise.

---

---

## ✅ DECIDED — 4 Sep 2026

| | Chosen |
|---|---|
| Estimator | **Dark band** |
| Hero treatment | **Aperture, on the existing ellipse shape** (variant 4 in the preview) |
| Motion | **On** (full speed) |
| Parallax | **Keep** |

### What "Aperture on the ellipse" means in practice

The shape stays exactly what production has today — `border-radius: 50%` at a **1.44:1 ellipse**, verified at 1.44 in the rendered preview. What changes around it:

| | Production today | Aperture (ellipse) |
|---|---|---|
| Size | `w-[750px] h-[520px]` fixed at `lg` | `clamp(340px, 46vw, 840px)` — **scales with the viewport and bleeds off the right edge** |
| Arcs | none | Three concentric **ellipses** matching the 1.44 ratio: two draw themselves in on load (1.7s, staggered), one dashed |
| Rotating element | none | **Travelling dashes** along the dashed ellipse (2.6s loop) |
| Grid | none | 34px grid behind, radially masked to an ellipse |
| Edge | hard mask cut | **1px rim light + inner top highlight**, so it reads as an object rather than a cropped picture |
| Tint | flat `#A3D3FF → #FFEA66` at full strength | `rgba(59,130,246,.34) → rgba(163,211,255,.16) → transparent → rgba(255,234,102,.40)`, image at `contrast(1.07) saturate(1.1)` |

**One design note worth recording.** The circle version rotated its dashed ring. **An ellipse cannot rotate** — it wobbles, because the radius varies around the path. So the dashed ring instead animates `stroke-dashoffset`, making the dashes travel *along* the ellipse. That reads as data moving through an instrument, and it is the better effect regardless of shape. It also degrades more gracefully: a travelling dash paused mid-cycle looks correct, a paused rotation looks arbitrary.

### Two things I got wrong on the way, corrected in the preview

1. **First attempt clipped his head.** Tightening the crop to `scale(1.54) / 60% 54%` pushed the subject up and out of the ellipse. Reverted to `scale(1.42) / 64% 52%`, which keeps him fully framed.
2. **First attempt didn't bleed at 1920.** A fixed `min(620px, 104vw)` capped out on wide viewports, so the drama disappeared exactly where there was most room for it. Now `clamp(340px, 46vw, 840px)` — verified bleeding at 1920, 1440 and 1280, and scaling down cleanly to 768 and 390.

Captures: `hero-v4-1920.png` · `hero-v4-1440.png` · `hero-v4-1280.png` · `hero-v4-768.png` · `hero-v4-mobile.png`.

### Parallax, kept — with its guard

±14px on the two floating cards, 500ms ease-out. **Pointer events only**, so it never fires on touch, and the handler checks `matchMedia('(prefers-reduced-motion: reduce)')` at call time — a CSS guard alone wouldn't stop JS writing transforms.

### Still open

The font decision from `06` §2 — global fix vs estimator-only. `screenshots/fontfix-before-current.png` vs `fontfix-after-spacegrotesk.png`. Everything else in this document is settled.

## 5. ~~What I need from you~~ — answered above, except the font

1. **Hero circle: 1, 2 or 3?** Open the preview and switch between them. My recommendation is 3 · Aperture.
2. **Motion: On, or Slow ½×?** The preview has both. Slow reads as more expensive; On reads as more alive.
3. **Parallax on the floating cards — keep?** It's the most "effect-like" thing in the set and the easiest to cut.
4. **Still outstanding from `06`:** the font decision (global fix vs estimator-only — see `screenshots/fontfix-*.png`), whether the "you save vs PITA" story stays a headline, and who signs off on the corrected tax figures.
