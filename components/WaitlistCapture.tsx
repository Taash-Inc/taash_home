'use client';

import { sendClientReport } from '@/lib/client-report';
import { PROFESSIONS } from '@/lib/professions';
import { clearJoined, markJoined, useWaitlistJoined } from '@/lib/waitlist-store';
import {
  GRACE_MS,
  initialVerifyState,
  verifyStep,
  type ClientCheck,
  type VerifyEvent,
} from '@/lib/waitlist-verify';
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile';
import { track } from '@vercel/analytics';
import Link from 'next/link';
import { useEffect, useId, useRef, useState } from 'react';

type Placement = 'hero' | 'section' | 'calculator';

const SHARE_URL =
  'https://www.taash.tax/?utm_source=whatsapp&utm_medium=referral&utm_campaign=waitlist_share';
const SHARE_TEXT = `I just joined the Taash waitlist. It keeps your income, expenses and tax in one place, built for Nigeria's new tax rules. Get early access: ${SHARE_URL}`;

/** Network failures are retried this many times, after these delays, before giving up. */
const RETRY_DELAYS_MS = [1500, 3000];

/**
 * The waitlist signup, used in the hero and in the section near the end of the page.
 *
 * Ad visitors arrive on phones inside Instagram's in-app browser. The old form asked for five
 * inputs plus a visible "Verify you are human" checkbox, 11 screens below the fold. This one
 * asks for a first name and an email (profession is an optional one-tap choice in the section
 * variant), and the Turnstile check runs invisibly in the background.
 *
 * The check is never a gate (lib/waitlist-verify.ts). It starts once the visitor has touched
 * or scrolled the page with the form nearby, so it has usually finished by the time they press
 * Join. If it hasn't, the submit waits at most GRACE_MS and then sends anyway, with the reason;
 * the server holds those signups for approval. Requests that can't reach the server are
 * retried, then reported (lib/client-report.ts) so a failure is never invisible.
 *
 * Inputs are uncontrolled and read with FormData at send time, so a Turnstile callback that
 * fires after a re-render can never send stale values.
 */
export default function WaitlistCapture({ placement }: { placement: Placement }) {
  const joined = useWaitlistJoined();
  const [joinedHere, setJoinedHere] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [turnstileWanted, setTurnstileWanted] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const turnstileRef = useRef<TurnstileInstance>(null);
  // Turnstile events can arrive before the visitor submits; lib/waitlist-verify.ts remembers them.
  const verifyRef = useRef(initialVerifyState);
  const startedRef = useRef(false);
  const graceTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const formId = useId();
  const compact = placement !== 'section';

  useEffect(() => () => clearTimeout(graceTimerRef.current), []);

  // Start the check early: once the visitor has interacted with the page (a tap, scroll or key)
  // while this form is on or near the screen. Not at page load, because loading Turnstile for
  // every visitor blocked the main thread for over a second on mid-range Android.
  useEffect(() => {
    const form = formRef.current;
    if (!form || turnstileWanted) return;
    let near = false;
    let interacted = false;
    const maybeStart = () => {
      if (near && interacted) setTurnstileWanted(true);
    };
    const observer = new IntersectionObserver(
      ([entry]) => {
        near = entry.isIntersecting;
        maybeStart();
      },
      { rootMargin: '300px 0px' }
    );
    observer.observe(form);
    const onInteract = () => {
      interacted = true;
      maybeStart();
    };
    const events = ['pointerdown', 'touchstart', 'scroll', 'keydown'] as const;
    for (const type of events) window.addEventListener(type, onInteract, { once: true, passive: true });
    return () => {
      observer.disconnect();
      for (const type of events) window.removeEventListener(type, onInteract);
    };
  }, [turnstileWanted]);

  const start = () => {
    setTurnstileWanted(true);
    if (startedRef.current) return;
    startedRef.current = true;
    track('Waitlist Start', { placement });
  };

  /** Send the signup, with a token if Cloudflare gave one, or with the reason it didn't. */
  const send = async (token: string | null, check: ClientCheck | null) => {
    clearTimeout(graceTimerRef.current);
    setBusy(true);

    const data = new FormData(formRef.current ?? undefined);
    const firstName = String(data.get('firstName') ?? '').trim();
    const profession = String(data.get('profession') ?? '') || null;
    const payload = JSON.stringify({
      fullName: firstName,
      email: String(data.get('email') ?? '').trim(),
      profession,
      turnstileToken: token,
      check,
      extra_info: String(data.get('extra_info') ?? ''),
    });

    try {
      const response = await postSignup(payload);
      const body: { error?: string } = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new SignupError(friendlyError(response.status, body.error), `http-${response.status}`);
      }

      track('Waitlist Joined', { placement, profession: profession ?? 'none', check: check ?? 'passed' });
      setJoinedHere(true);
      markJoined(firstName);
    } catch (err) {
      const signupError = err instanceof SignupError ? err : null;
      const code = signupError?.code ?? 'network';
      setError(signupError?.message ?? 'We couldn’t reach Taash. Check your connection and try again.');
      track('Waitlist Error', { placement, reason: code });
      // The server already alerts on its own failures (5xx); this covers the ones it never saw.
      if (code === 'network' || code.startsWith('http-5')) {
        sendClientReport({ type: 'signup-failed', reason: code, placement });
      }
    } finally {
      setBusy(false);
      // Tokens are single-use; start on the next one straight away.
      verifyRef.current = verifyStep(verifyRef.current, { type: 'sent' }).state;
      if (token) turnstileRef.current?.reset();
    }
  };

  const dispatch = (event: VerifyEvent) => {
    const { state, action } = verifyStep(verifyRef.current, event);
    verifyRef.current = state;
    switch (action.type) {
      case 'send':
        void send(action.token, null);
        break;
      case 'send-unverified':
        void send(null, action.check);
        break;
      case 'wait':
        setBusy(true);
        clearTimeout(graceTimerRef.current);
        graceTimerRef.current = setTimeout(() => dispatch({ type: 'timeout' }), GRACE_MS);
        break;
    }
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (busy) return;
    setError('');
    start();
    track('Waitlist Submit', { placement });
    dispatch({ type: 'submit' });
  };

  if (joined) {
    return (
      <JoinedPanel
        firstName={joined.firstName}
        placement={placement}
        takeFocus={joinedHere}
        onReset={() => {
          setJoinedHere(false);
          clearJoined();
        }}
      />
    );
  }

  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      onFocusCapture={start}
      aria-describedby={`${formId}-terms`}
      className='relative w-full'>
      <div className={compact ? 'grid gap-2.5 sm:grid-cols-2' : 'grid gap-4'}>
        <Field
          id={`${formId}-name`}
          label='First name'
          hideLabel={compact}
          name='firstName'
          placeholder={compact ? 'First name' : 'e.g. Ada'}
          autoComplete='given-name'
          autoCapitalize='words'
          enterKeyHint='next'
          maxLength={100}
          required
        />
        <Field
          id={`${formId}-email`}
          label='Email address'
          hideLabel={compact}
          name='email'
          type='email'
          inputMode='email'
          placeholder={compact ? 'Email address' : 'you@example.com'}
          autoComplete='email'
          autoCapitalize='none'
          autoCorrect='off'
          spellCheck={false}
          enterKeyHint='go'
          maxLength={255}
          required
        />
      </div>

      {compact ? null : (
        <fieldset className='mt-5'>
          <legend className='text-sm font-semibold text-ink-1000'>
            What do you do? <span className='font-normal text-ink-600'>(optional)</span>
          </legend>
          <div className='mt-2.5 flex flex-wrap gap-2'>
            {PROFESSIONS.map((p) => (
              <label key={p} className='cursor-pointer'>
                <input type='radio' name='profession' value={p} className='peer sr-only' />
                <span className='inline-flex min-h-10 items-center rounded-full border border-ink-300 bg-white px-4 text-sm font-medium text-ink-900 transition-[background-color,border-color,color,transform] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] select-none active:scale-[0.97] peer-checked:border-ink-1000 peer-checked:bg-ink-1000 peer-checked:text-white peer-focus-visible:ring-[3px] peer-focus-visible:ring-brand-600/40'>
                  {p}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <div role='alert' aria-live='assertive'>
        {error ? (
          <p className='mt-3 rounded-xl border border-negative-600/25 bg-negative-100 px-4 py-3 text-sm text-negative-700'>
            {error}
          </p>
        ) : null}
      </div>

      {/* Left empty by people: it's off-screen, skipped by Tab and hidden from screen readers.
          Bots fill in every field, and the server quietly drops signups that have it. */}
      <div aria-hidden='true' className='absolute top-auto -left-[9999px] size-px overflow-hidden'>
        <label>
          Leave this empty
          <input type='text' name='extra_info' tabIndex={-1} autoComplete='off' defaultValue='' />
        </label>
      </div>

      {/* Hidden unless Cloudflare wants a tap, and even then the visitor doesn't have to: a
          submit without a token is held for approval instead of being turned away. */}
      {turnstileWanted ? (
        <div className='mt-3 flex justify-center empty:hidden'>
          <Turnstile
            ref={turnstileRef}
            siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '1x00000000000000000000AA'}
            onWidgetLoad={() => dispatch({ type: 'started' })}
            onSuccess={(token) => dispatch({ type: 'token', token })}
            onError={() => dispatch({ type: 'error' })}
            onUnsupported={() => dispatch({ type: 'unsupported' })}
            onExpire={() => dispatch({ type: 'expire' })}
            onBeforeInteractive={() => dispatch({ type: 'interactive' })}
            options={{ theme: 'light', appearance: 'interaction-only', size: 'flexible' }}
          />
        </div>
      ) : null}

      <button
        type='submit'
        aria-disabled={busy}
        className='group mt-3 grid h-13 w-full grid-cols-[2.25rem_1fr_2.25rem] items-center gap-2 rounded-full bg-ink-1000 px-2 font-semibold text-white shadow-[0_10px_30px_-12px_rgb(15_23_42/0.55)] transition-[transform,background-color] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-ink-900 active:scale-[0.98] aria-disabled:cursor-wait aria-disabled:opacity-85'>
        <span aria-hidden='true' />
        <span>
          {busy ? 'Joining…' : 'Join the waitlist'}
        </span>
        <span className='grid size-9 place-items-center rounded-full bg-white/12 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-0.5'>
          {busy ? <Spinner /> : <ArrowIcon />}
        </span>
      </button>

      <ul className='mt-3.5 flex flex-wrap justify-center gap-x-4 gap-y-1.5 text-[13px] font-medium text-ink-800 sm:justify-start'>
        <li className='flex items-center gap-1.5'>
          <TickIcon /> Free to join
        </li>
        <li className='flex items-center gap-1.5'>
          <TickIcon /> Lifetime discount for early members
        </li>
      </ul>
      <p
        id={`${formId}-terms`}
        className='mt-2 text-center text-xs leading-relaxed text-ink-600 sm:text-left'>
        By joining you agree to get emails about Taash. Leave anytime.{' '}
        <Link href='/privacy' className='underline underline-offset-2 hover:text-ink-900'>
          Privacy policy
        </Link>
      </p>
    </form>
  );
}

class SignupError extends Error {
  constructor(
    message: string,
    readonly code: string
  ) {
    super(message);
  }
}

/** POST the signup, retrying only when the request never reached the server. */
async function postSignup(payload: string): Promise<Response> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
      });
    } catch (error) {
      if (attempt >= RETRY_DELAYS_MS.length) throw error;
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAYS_MS[attempt]));
    }
  }
}

function friendlyError(status: number, message?: string): string {
  if (status === 429) return message || 'Too many signups right now. Please try again in a few minutes.';
  if (message === 'Invalid email format')
    return 'That email address doesn’t look right. Please check it and try again.';
  if (status >= 500) return 'Something went wrong on our side. Please try again in a moment.';
  return message || 'Something went wrong. Please try again.';
}

function Field({
  id,
  label,
  hideLabel,
  ...input
}: { id: string; label: string; hideLabel?: boolean } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label
        htmlFor={id}
        className={hideLabel ? 'sr-only' : 'mb-1.5 block text-sm font-semibold text-ink-1000'}>
        {label}
      </label>
      <input
        id={id}
        className='h-12 w-full rounded-xl border border-ink-300 bg-ink-50 px-4 text-base text-ink-1000 transition-[border-color,box-shadow,background-color] duration-200 placeholder:text-ink-600 focus:border-brand-600 focus:bg-white focus:ring-[3px] focus:ring-brand-600/25 focus:outline-none'
        {...input}
      />
    </div>
  );
}

function JoinedPanel({
  firstName,
  placement,
  takeFocus,
  onReset,
}: {
  firstName: string;
  placement: Placement;
  takeFocus: boolean;
  onReset: () => void;
}) {
  const headingRef = useRef<HTMLParagraphElement>(null);
  const [copied, setCopied] = useState<'' | 'yes' | 'no'>('');

  useEffect(() => {
    if (takeFocus) headingRef.current?.focus();
  }, [takeFocus]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(SHARE_URL);
      setCopied('yes');
    } catch {
      setCopied('no');
    }
    track('Waitlist Share', { placement, channel: 'copy' });
  };

  return (
    <div className='joined-in text-center'>
      <div className='mx-auto grid size-14 place-items-center rounded-full bg-positive-100'>
        <svg width='28' height='28' viewBox='0 0 24 24' fill='none' aria-hidden='true'>
          <path
            className='joined-tick'
            d='M5 13l4 4L19 7'
            stroke='#00742e'
            strokeWidth='2.5'
            strokeLinecap='round'
            strokeLinejoin='round'
          />
        </svg>
      </div>
      <p
        ref={headingRef}
        tabIndex={-1}
        role='status'
        className='mt-4 text-2xl font-bold tracking-tight text-ink-1000 focus:outline-none'>
        You&apos;re on the list{firstName ? `, ${firstName}` : ''}!
      </p>
      <p className='mx-auto mt-2 max-w-sm text-ink-700'>
        Check your inbox for a confirmation email. Early members get a lifetime discount when
        Taash launches.
      </p>
      <a
        href={`https://wa.me/?text=${encodeURIComponent(SHARE_TEXT)}`}
        target='_blank'
        rel='noopener noreferrer'
        onClick={() => track('Waitlist Share', { placement, channel: 'whatsapp' })}
        className='mt-5 inline-flex h-12 w-full items-center justify-center gap-2.5 rounded-full bg-[#25D366] px-6 font-semibold text-ink-1000 transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.98]'>
        <WhatsAppIcon />
        Tell a friend on WhatsApp
      </a>
      {/* Link box with a Copy button: the referral pattern people know from v0, Replit and
          Flodesk. It shows the short address; the copied link carries the UTM tags. */}
      <div className='mt-3 flex items-center gap-2 rounded-full border border-ink-200 bg-ink-50 py-1 pr-1 pl-4'>
        <span className='min-w-0 flex-1 truncate text-left text-sm font-medium text-ink-800'>
          www.taash.tax
        </span>
        <button
          type='button'
          onClick={copy}
          className='inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-ink-1000 px-4 text-sm font-semibold text-white transition-[transform,background-color] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-ink-900 active:scale-[0.97]'>
          {copied === 'yes' ? <TickIcon /> : <CopyIcon />}
          {copied === 'yes' ? 'Copied' : 'Copy link'}
        </button>
      </div>
      <p aria-live='polite' className={copied === 'no' ? 'mt-2 text-xs text-ink-600' : 'sr-only'}>
        {copied === 'yes'
          ? 'Link copied'
          : copied === 'no'
            ? 'Couldn’t copy in this browser. Share www.taash.tax instead.'
            : ''}
      </p>
      <button
        type='button'
        onClick={onReset}
        className='mt-1 min-h-11 text-sm text-ink-600 underline-offset-2 hover:text-ink-900 hover:underline'>
        Not you? Use another email
      </button>
    </div>
  );
}

function ArrowIcon() {
  return (
    <svg width='16' height='16' viewBox='0 0 16 16' fill='none' aria-hidden='true'>
      <path
        d='M3 8h10m0 0L9 4m4 4l-4 4'
        stroke='currentColor'
        strokeWidth='1.75'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  );
}

function Spinner() {
  return (
    <svg className='animate-spin' width='16' height='16' viewBox='0 0 16 16' aria-hidden='true'>
      <circle cx='8' cy='8' r='6' fill='none' stroke='currentColor' strokeOpacity='0.3' strokeWidth='2' />
      <path d='M14 8a6 6 0 0 0-6-6' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg width='14' height='14' viewBox='0 0 16 16' fill='none' aria-hidden='true'>
      <rect x='5.25' y='5.25' width='8' height='8' rx='2' stroke='currentColor' strokeWidth='1.5' />
      <path
        d='M10.75 5.25V4.5a1.75 1.75 0 0 0-1.75-1.75H4.5A1.75 1.75 0 0 0 2.75 4.5V9a1.75 1.75 0 0 0 1.75 1.75h.75'
        stroke='currentColor'
        strokeWidth='1.5'
      />
    </svg>
  );
}

function TickIcon() {
  return (
    <svg width='14' height='14' viewBox='0 0 16 16' fill='none' aria-hidden='true'>
      <circle cx='8' cy='8' r='8' fill='#d8f6dd' />
      <path
        d='M4.75 8.25l2 2 4.5-4.5'
        stroke='#00742e'
        strokeWidth='1.6'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg width='20' height='20' viewBox='0 0 24 24' aria-hidden='true' fill='currentColor'>
      <path d='M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 18.15h-.01a8.23 8.23 0 0 1-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.23 8.25-8.23a8.2 8.2 0 0 1 5.83 2.42 8.18 8.18 0 0 1 2.41 5.82c0 4.54-3.7 8.23-8.23 8.23Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.12-.17.25-.64.81-.78.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.14.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.23.25-.87.85-.87 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.14-1.18-.06-.1-.22-.16-.47-.29Z' />
    </svg>
  );
}
