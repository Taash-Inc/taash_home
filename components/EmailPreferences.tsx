'use client';

import type { EmailPreference } from '@/lib/onesignal';
import Link from 'next/link';
import { useEffect, useRef, useState, type ReactNode } from 'react';

type Action = EmailPreference | 'leave';
type View = 'ask' | 'invite_only' | 'none' | 'resubscribed' | 'confirm_leave' | 'left';

const OPENING_VIEW: Record<EmailPreference, View> = {
  all: 'ask',
  invite_only: 'invite_only',
  none: 'none',
};
const VIEW_AFTER: Record<Action, View> = {
  all: 'resubscribed',
  invite_only: 'invite_only',
  none: 'none',
  leave: 'left',
};

const button =
  'block min-h-11 w-full rounded-lg px-5 py-3 text-center font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60';
// Yellow, not the site's ink button: it matches the emails, which is where everyone arrives from.
const primary = `${button} bg-signal-500 text-ink-1000 hover:brightness-95`;
const secondary = `${button} border border-ink-300 bg-white text-ink-1000 hover:bg-ink-50`;
const danger = `${button} bg-negative-700 text-white hover:bg-negative-600`;
const textLink =
  'font-medium text-brand-700 underline underline-offset-2 hover:text-brand-900 disabled:cursor-not-allowed disabled:opacity-60';

/**
 * The email preferences panel. Unsubscribing never touches the waitlist spot; only "Leave the
 * waitlist", behind a confirmation, deletes anything.
 */
export default function EmailPreferences({
  token,
  maskedEmail,
  initial,
}: {
  token: string;
  maskedEmail: string;
  initial: EmailPreference;
}) {
  const [view, setView] = useState<View>(OPENING_VIEW[initial]);
  const [returnTo, setReturnTo] = useState<View>(OPENING_VIEW[initial]);
  const [changed, setChanged] = useState(false);
  const [pending, setPending] = useState<Action | null>(null);
  const [error, setError] = useState('');
  const heading = useRef<HTMLHeadingElement>(null);
  const focusHeading = useRef(false);

  // Each step replaces the panel, so focus moves to its heading: keyboard and screen-reader
  // users land on what just happened, not on a button that no longer exists.
  useEffect(() => {
    if (!focusHeading.current) return;
    focusHeading.current = false;
    heading.current?.focus();
  }, [view]);

  function show(next: View) {
    focusHeading.current = true;
    setError('');
    setView(next);
  }

  async function choose(action: Action) {
    if (pending) return;
    setPending(action);
    setError('');
    try {
      const response = await fetch('/api/email-preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, action }),
      });
      if (response.status === 404) {
        setError("This link doesn't work anymore. To stop emails from Taash, write to privacy@taash.tax.");
        return;
      }
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setChanged(true);
      show(VIEW_AFTER[action]);
    } catch {
      setError("That didn't save. Try again, or write to privacy@taash.tax.");
    } finally {
      setPending(null);
    }
  }

  const busy = pending !== null;
  const label = (action: Action, text: string) => (pending === action ? 'Saving…' : text);
  const act = (action: Action, className: string, text: string) => (
    <button type='button' className={className} disabled={busy} onClick={() => choose(action)}>
      {label(action, text)}
    </button>
  );

  const views: Record<View, { badge?: ReactNode; title: string; body?: string; actions: ReactNode; note?: string }> = {
    ask: {
      title: 'Unsubscribe from Taash emails?',
      actions: (
        <>
          {act('none', primary, 'Unsubscribe from all emails')}
          <p className='my-3 text-center text-sm text-ink-600'>or</p>
          <div className='rounded-xl border border-ink-200 bg-white p-4'>
            <p className='font-semibold text-ink-1000'>Only email me when my access is ready</p>
            <p className='mt-1 text-sm text-ink-700'>
              One email at launch. No updates or tax tips before then.
            </p>
            <div className='mt-4'>{act('invite_only', secondary, 'Keep just that one')}</div>
          </div>
        </>
      ),
      note: "Your waitlist spot is safe. Email choices don't affect your early access.",
    },
    invite_only: {
      badge: changed ? <Badge tone='positive'>Saved</Badge> : null,
      title: "You'll only hear from us at launch",
      body: "We'll send one email when your early access is ready. Nothing else until then.",
      actions: (
        <>
          {act('none', secondary, 'Unsubscribe from all emails')}
          <div className='mt-4'>{act('all', textLink, 'Get updates and tax tips again')}</div>
        </>
      ),
      note: 'Your waitlist spot is safe.',
    },
    none: {
      badge: changed ? <Badge tone='neutral'>Unsubscribed</Badge> : null,
      title: "You're unsubscribed",
      body: "You won't get any more emails from Taash, including the one that tells you your early access is ready.",
      actions: (
        <>
          {act('all', secondary, 'Resubscribe')}
          <div className='mt-4'>{act('invite_only', textLink, 'Only email me when my access is ready')}</div>
        </>
      ),
      note: 'Your waitlist spot is still saved.',
    },
    resubscribed: {
      badge: <Badge tone='positive'>Saved</Badge>,
      title: "You're back on the list",
      body: "You'll get your early-access invite, plus occasional updates and tax tips.",
      actions: (
        <>
          {act('none', secondary, 'Unsubscribe from all emails')}
          <div className='mt-4'>{act('invite_only', textLink, 'Only email me when my access is ready')}</div>
        </>
      ),
      note: 'Your waitlist spot is safe.',
    },
    confirm_leave: {
      title: 'Leave the waitlist?',
      body: "We'll delete your details and stop all emails. This can't be undone. To get early access later, you'd need to join again.",
      actions: (
        <>
          {act('leave', danger, 'Yes, remove me')}
          <button
            type='button'
            className={`${secondary} mt-3`}
            disabled={busy}
            onClick={() => show(returnTo)}>
            Keep my spot
          </button>
        </>
      ),
    },
    left: {
      badge: (
        <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' className='mb-3 size-7 text-positive-700' aria-hidden='true'>
          <circle cx='12' cy='12' r='9' />
          <path d='m8.5 12 2.5 2.5 4.5-5' />
        </svg>
      ),
      title: "You've left the waitlist",
      body: "We've deleted your details, and you won't hear from us again.",
      actions: (
        <Link href='/#waitlist' className={textLink}>
          Join again anytime at taash.tax
        </Link>
      ),
    },
  };
  const current = views[view];
  const hasFooter = view !== 'confirm_leave' && view !== 'left';

  return (
    // Keyed by view so each step gets fresh buttons: reusing the last step's would fade the
    // white "Unsubscribe" button into the red "Yes, remove me" through transition-colors.
    <div key={view}>
      {view !== 'left' ? (
        <p className='mb-2 text-sm text-ink-600'>Email preferences · {maskedEmail}</p>
      ) : null}
      {current.badge}
      <h1
        ref={heading}
        tabIndex={-1}
        className='text-2xl leading-tight font-bold text-ink-1000 focus:outline-none'>
        {current.title}
      </h1>
      {current.body ? <p className='mt-3 leading-relaxed text-ink-700'>{current.body}</p> : null}
      <div className='mt-6'>{current.actions}</div>

      <div role='alert' aria-live='assertive'>
        {error ? (
          <p className='mt-4 rounded-lg border border-negative-600/25 bg-negative-100 px-4 py-3 text-sm text-negative-700'>
            {error}
          </p>
        ) : null}
      </div>

      {current.note ? (
        <div className='mt-6 flex gap-3 rounded-lg bg-brand-100 px-4 py-3 text-sm leading-relaxed text-brand-900'>
          <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' className='mt-0.5 size-5 shrink-0' aria-hidden='true'>
            <path d='M12 3 20 6v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6z' />
            <path d='m9 12 2 2 4-4' />
          </svg>
          <p>{current.note}</p>
        </div>
      ) : null}

      {hasFooter ? (
        <div className='mt-6 flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-ink-200 pt-4 text-sm text-ink-600'>
          <button
            type='button'
            className={textLink}
            disabled={busy}
            onClick={() => {
              setReturnTo(view);
              show('confirm_leave');
            }}>
            Leave the waitlist instead
          </button>
          <span aria-hidden='true'>·</span>
          <Link href='/privacy' className={textLink}>
            Privacy policy
          </Link>
        </div>
      ) : null}
    </div>
  );
}

function Badge({ tone, children }: { tone: 'positive' | 'neutral'; children: ReactNode }) {
  const colours = tone === 'positive' ? 'bg-positive-100 text-positive-700' : 'bg-ink-100 text-ink-900';
  return (
    <p className={`mb-3 inline-block rounded-full px-3 py-1 text-xs font-semibold ${colours}`}>
      {children}
    </p>
  );
}
