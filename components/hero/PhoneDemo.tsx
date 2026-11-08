'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { RENT_SAVING, SCAN_TOTAL, TAX_SAVED, WEEKLY } from './demo-figures';
import s from './PhoneDemo.module.css';
import { Ai, Home, Mark, naira, Receipt, Save, Scan } from './PhoneScreens';

/**
 * A 40-second tour of the app in four chapters, rebuilt from the real screen recording: swipe
 * expenses, scan a receipt, ask Taash AI, set tax aside. Tabs under the phone show where the tour
 * is and jump to a chapter; each chapter's caption and floating card stay up for the whole
 * chapter, so there is time to read them.
 *
 * Markup rather than video: sharp at any size, nothing to download on mobile data, and it starts
 * as server-rendered HTML. Figures come from the calculator's engine (demo-figures.ts).
 *
 * Motion is transform and opacity (plus one SVG ring), starts a beat after load, pauses off
 * screen, in background tabs and on the pause button (WCAG 2.2.2), and resumes where it left
 * off. Under reduced motion each tab shows a still of that chapter's result instead.
 */
type Scene = 'home' | 'mark' | 'scan' | 'receipt' | 'ai' | 'save';
type Step = {
  ms: number;
  scene: Scene;
  card?: 1 | 2;
  after?: boolean;
  toast?: boolean;
  tap?: 'review' | 'scan' | 'ai' | 'save' | 'pay';
  phase?: string;
  fade?: 'out' | 'reset';
};

const STEPS: readonly Step[] = [
  // Swipe
  { ms: 2800, scene: 'home' },
  { ms: 650, scene: 'home', tap: 'review' },
  { ms: 2200, scene: 'mark' },
  { ms: 2300, scene: 'mark', card: 1 },
  { ms: 1000, scene: 'mark', card: 2 },
  { ms: 4200, scene: 'home', card: 2, after: true, toast: true },
  // Scan
  { ms: 800, scene: 'home', card: 2, after: true, tap: 'scan' },
  { ms: 1500, scene: 'scan', card: 2, after: true, phase: 'frame' },
  { ms: 2100, scene: 'scan', card: 2, after: true, phase: 'reading' },
  { ms: 3000, scene: 'receipt', card: 2, after: true },
  { ms: 2800, scene: 'receipt', card: 2, after: true, phase: 'saved' },
  // Ask
  { ms: 800, scene: 'home', card: 2, after: true, tap: 'ai' },
  { ms: 1800, scene: 'ai', card: 2, after: true, phase: 'empty' },
  { ms: 1500, scene: 'ai', card: 2, after: true, phase: 'asked' },
  { ms: 1500, scene: 'ai', card: 2, after: true, phase: 'thinking' },
  { ms: 5000, scene: 'ai', card: 2, after: true, phase: 'answered' },
  // Save
  { ms: 800, scene: 'home', card: 2, after: true, tap: 'save' },
  { ms: 900, scene: 'save', card: 2, after: true, phase: 'start' },
  { ms: 2600, scene: 'save', card: 2, after: true, phase: 'fill' },
  { ms: 700, scene: 'save', card: 2, after: true, phase: 'pay', tap: 'pay' },
  { ms: 3400, scene: 'save', card: 2, after: true, phase: 'paid' },
  { ms: 450, scene: 'save', card: 2, after: true, phase: 'paid', fade: 'out' },
  { ms: 80, scene: 'home', fade: 'reset' },
];

const CHAPTERS = [
  {
    label: 'Swipe',
    start: 0,
    still: 5,
    title: 'Swipe to sort your expenses',
    body: 'Right if it counts for tax, left if it doesn’t. Your estimate updates as you go.',
    stat: { k: 'Estimated tax', v: `↓ ${naira(TAX_SAVED)}`, n: 'after two swipes' },
  },
  {
    label: 'Scan',
    start: 6,
    still: 10,
    title: 'Scan any receipt',
    body: 'Taash reads the merchant, amount and category, so you never type them in.',
    stat: { k: 'Receipt saved', v: naira(SCAN_TOTAL), n: 'Jumia · Work equipment' },
  },
  {
    label: 'Ask',
    start: 11,
    still: 15,
    title: 'Ask Taash AI',
    body: 'Answers from your own numbers, like reliefs you may be missing.',
    stat: { k: 'Relief found', v: `Saves ${naira(RENT_SAVING)}`, n: 'Rent relief' },
  },
  {
    label: 'Save',
    start: 16,
    still: 20,
    title: 'Know what to set aside',
    body: 'A weekly amount, so the 31 March deadline never catches you short.',
    stat: { k: 'On track', v: `${naira(WEEKLY)} a week`, n: 'Ready by 31 March' },
  },
] as const;

const chapterOf = (step: number) => {
  for (let i = CHAPTERS.length - 1; i >= 0; i--) if (step >= CHAPTERS[i].start) return i;
  return 0;
};
const chapterMs = (i: number) => {
  const end = i + 1 < CHAPTERS.length ? CHAPTERS[i + 1].start : STEPS.length;
  return STEPS.slice(CHAPTERS[i].start, end).reduce((sum, step) => sum + step.ms, 0);
};

const START_DELAY_MS = 1400;

function subscribeMotion(notify: () => void) {
  const query = window.matchMedia('(prefers-reduced-motion: reduce)');
  query.addEventListener('change', notify);
  return () => query.removeEventListener('change', notify);
}
const getReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function subscribeVisibility(notify: () => void) {
  document.addEventListener('visibilitychange', notify);
  return () => document.removeEventListener('visibilitychange', notify);
}
const getPageVisible = () => document.visibilityState === 'visible';

export default function PhoneDemo() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(0);
  const [stillChapter, setStillChapter] = useState(0);
  const [started, setStarted] = useState(false);
  const [onScreen, setOnScreen] = useState(false);
  const [userPaused, setUserPaused] = useState(false);
  // Bumped whenever a chapter starts, so its tab's progress bar restarts from empty.
  const [entry, setEntry] = useState(0);
  // Time left on the current step when it was paused, so a resume carries on rather than
  // restarting the step (and the tab's progress bar stays in step with the screen).
  const remainingRef = useRef<{ step: number; ms: number } | null>(null);
  const reduced = useSyncExternalStore(subscribeMotion, getReducedMotion, () => false);
  const pageVisible = useSyncExternalStore(subscribeVisibility, getPageVisible, () => false);
  const playing = started && onScreen && pageVisible && !userPaused && !reduced;

  useEffect(() => {
    const timer = setTimeout(() => setStarted(true), START_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting), {
      threshold: 0.3,
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!playing) return;
    // Only a pause leaves time behind for this same step; a jump or advance starts it fresh.
    const left = remainingRef.current;
    const ms = left && left.step === step ? left.ms : STEPS[step].ms;
    remainingRef.current = null;
    const startedAt = performance.now();
    let advanced = false;
    const timer = setTimeout(() => {
      advanced = true;
      remainingRef.current = null;
      const next = (step + 1) % STEPS.length;
      if (chapterOf(next) !== chapterOf(step)) setEntry((e) => e + 1);
      setStep(next);
    }, ms);
    return () => {
      clearTimeout(timer);
      if (!advanced) {
        remainingRef.current = { step, ms: Math.max(0, ms - (performance.now() - startedAt)) };
      }
    };
  }, [playing, step]);

  const goTo = (i: number) => {
    remainingRef.current = null;
    setStillChapter(i);
    setStep(CHAPTERS[i].start);
    setEntry((e) => e + 1);
  };

  const shownStep = reduced ? CHAPTERS[stillChapter].still : step;
  const current = STEPS[shownStep];
  const chapter = reduced ? stillChapter : chapterOf(step);

  return (
    <div
      ref={rootRef}
      className={s.root}
      data-scene={current.scene}
      data-card={current.card ?? 0}
      data-after={current.after ? 'true' : undefined}
      data-toast={current.toast ? 'true' : undefined}
      data-tap={current.tap}
      data-phase={current.phase}
      data-fade={current.fade}>
      {/* Cropped with a fade on phones so the demo doesn't push the page down. */}
      <div
        className='hero-rise relative max-h-[27.5rem] overflow-hidden [mask-image:linear-gradient(to_bottom,black_80%,transparent)] sm:max-h-none sm:overflow-visible sm:[mask-image:none]'
        style={{ '--rise-delay': '120ms' } as React.CSSProperties}>
        <div className='mx-auto w-[15.75rem] rounded-[2.9rem] bg-ink-1000 p-[9px] shadow-[0_40px_80px_-32px_rgb(15_23_42/0.6)] sm:w-[17rem]'>
          <div aria-hidden='true' className={s.screen}>
            <span className={s.island} />
            <div className={s.stage}>
              <Home />
              <Mark remaining={22 - (current.card ?? 0)} />
              <Scan />
              <Receipt />
              <Ai />
              <Save />
            </div>
          </div>
        </div>
      </div>

      {/* One floating card per chapter, beside the phone from sm up. Decorative: the caption
          under the phone carries the same message in text. */}
      <div aria-hidden='true' className='absolute top-[16%] -right-28 z-20 hidden w-[11rem] sm:block lg:-right-40'>
        {CHAPTERS.map((c, i) => (
          <div
            key={c.label}
            className={`absolute inset-x-0 top-0 rounded-2xl bg-white p-3.5 shadow-[0_20px_40px_-20px_rgb(15_23_42/0.35)] ring-1 ring-ink-1000/5 transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${i === chapter ? 'opacity-100' : 'pointer-events-none translate-y-2 opacity-0'}`}>
            <p className='text-[0.6875rem] font-medium text-ink-600'>{c.stat.k}</p>
            <p className='mt-0.5 text-base leading-snug font-bold tracking-tight text-ink-1000 tabular-nums'>{c.stat.v}</p>
            <p className='mt-0.5 text-[0.6875rem] text-ink-700'>{c.stat.n}</p>
          </div>
        ))}
      </div>

      {/* Chapter tabs, the pause button and the caption. */}
      <div className='relative mx-auto mt-5 w-[18.5rem] sm:mt-6'>
        <div className='flex items-center gap-2'>
          {reduced ? null : (
            <button
              type='button'
              onClick={() => setUserPaused((p) => !p)}
              aria-label={userPaused ? 'Play the app tour' : 'Pause the app tour'}
              className='grid size-11 shrink-0 cursor-pointer place-items-center'>
              <span className='grid size-8 place-items-center rounded-full bg-white text-ink-900 shadow-[0_4px_14px_-4px_rgb(15_23_42/0.35)] ring-1 ring-ink-1000/10 transition-transform duration-200 hover:scale-105 active:scale-95'>
                {userPaused ? (
                  <svg width='12' height='12' viewBox='0 0 12 12' fill='currentColor' aria-hidden='true'>
                    <path d='M3 1.8v8.4a.6.6 0 0 0 .92.5l6.5-4.2a.6.6 0 0 0 0-1L3.92 1.3A.6.6 0 0 0 3 1.8z' />
                  </svg>
                ) : (
                  <svg width='12' height='12' viewBox='0 0 12 12' fill='currentColor' aria-hidden='true'>
                    <rect x='2.5' y='1.5' width='2.4' height='9' rx='0.8' />
                    <rect x='7.1' y='1.5' width='2.4' height='9' rx='0.8' />
                  </svg>
                )}
              </span>
            </button>
          )}
          <div className='grid flex-1 grid-cols-4 gap-1.5' role='group' aria-label='App tour chapters'>
            {CHAPTERS.map((c, i) => (
              <button
                key={c.label}
                type='button'
                onClick={() => goTo(i)}
                aria-current={i === chapter ? 'step' : undefined}
                className='group flex min-h-11 cursor-pointer flex-col justify-center gap-1.5'>
                <span className='relative block h-1 overflow-hidden rounded-full bg-ink-200'>
                  {i < chapter ? <span className='absolute inset-0 rounded-full bg-ink-1000' /> : null}
                  {i === chapter ? (
                    <span
                      key={entry}
                      className='tour-fill absolute inset-0 origin-left rounded-full bg-ink-1000'
                      style={
                        {
                          '--tour-ms': `${chapterMs(i)}ms`,
                          animationPlayState: playing ? 'running' : 'paused',
                          ...(reduced ? { animation: 'none' } : {}),
                        } as React.CSSProperties
                      }
                    />
                  ) : null}
                </span>
                <span
                  className={`text-xs font-semibold transition-colors ${i === chapter ? 'text-ink-1000' : 'text-ink-600 group-hover:text-ink-900'}`}>
                  {c.label}
                </span>
              </button>
            ))}
          </div>
        </div>
        <div className='relative mt-2 grid text-center'>
          {CHAPTERS.map((c, i) => (
            <div
              key={c.label}
              aria-hidden={i !== chapter}
              className={`[grid-area:1/1] transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${i === chapter ? 'opacity-100' : 'translate-y-1 opacity-0'}`}>
              <p className='font-semibold text-ink-1000'>{c.title}</p>
              <p className='mt-0.5 text-sm leading-snug text-ink-700'>{c.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
