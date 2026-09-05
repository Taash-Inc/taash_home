'use client';

import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile';
import Link from 'next/link';
import { useCallback, useEffect, useId, useRef, useState } from 'react';

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])';

export default function WaitlistForm() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    profession: '',
    monthlyIncome: '',
    agreedToPolicy: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const turnstileRef = useRef<TurnstileInstance>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!turnstileToken) {
      setErrorMessage('Please complete the verification below before joining.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          profession: formData.profession,
          monthlyIncome: formData.monthlyIncome,
          turnstileToken,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to join waitlist');

      setShowSuccess(true);
      setFormData({
        fullName: '',
        email: '',
        profession: '',
        monthlyIncome: '',
        agreedToPolicy: false,
      });
      turnstileRef.current?.reset();
      setTurnstileToken(null);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Something went wrong. Please try again.'
      );
      turnstileRef.current?.reset();
      setTurnstileToken(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id='waitlist' className='border-b border-ink-200 bg-ink-50 py-24'>
      <div className='mx-auto max-w-xl px-6'>
        <div className='rounded-2xl border border-ink-200 bg-white p-8 md:p-10'>
          <p className='mb-4 flex items-center gap-2.5 text-xs font-bold tracking-[0.12em] text-ink-700 uppercase'>
            <span aria-hidden='true' className='h-px w-6 bg-ink-300' />
            Limited early access
          </p>
          <h2 className='text-[clamp(1.5rem,3vw,1.75rem)] font-bold tracking-tight text-ink-1000'>
            Get Early Access
          </h2>
          <p className='mt-2 text-[0.9375rem] text-ink-700'>
            Be among the first to experience Taash. Early members get lifetime discounts and
            priority support.
          </p>

          <form onSubmit={handleSubmit} className='mt-7'>
            <TextField
              label='Full Name'
              name='fullName'
              value={formData.fullName}
              onChange={handleChange}
              placeholder='John Doe'
              autoComplete='name'
              required
            />
            <TextField
              label='Email Address'
              name='email'
              type='email'
              value={formData.email}
              onChange={handleChange}
              placeholder='john@example.com'
              autoComplete='email'
              required
            />
            <TextField
              label='Profession'
              name='profession'
              value={formData.profession}
              onChange={handleChange}
              placeholder='e.g., Freelance Designer, Content Creator'
              required
            />
            <TextField
              label='Monthly Income'
              optional
              name='monthlyIncome'
              value={formData.monthlyIncome}
              onChange={handleChange}
              placeholder='e.g., ₦200,000 - ₦500,000'
            />

            <div className='mt-5 flex items-start gap-3'>
              <input
                type='checkbox'
                id='agreedToPolicy'
                name='agreedToPolicy'
                checked={formData.agreedToPolicy}
                onChange={handleChange}
                required
                className='mt-0.5 h-5 w-5 shrink-0 rounded border-ink-300 accent-brand-600'
              />
              <label htmlFor='agreedToPolicy' className='text-sm leading-relaxed text-ink-700'>
                I agree to receive updates about Taash and understand that my data will be handled
                according to the{' '}
                {/* This pointed at '#' while /privacy existed — users were asked to agree to a
                    policy they could not read (00-audit.md A6). */}
                <Link href='/privacy' className='text-brand-700 underline underline-offset-2'>
                  privacy policy
                </Link>
                .
              </label>
            </div>

            {/* Errors were rendered with no role and no live region, so nothing was announced. */}
            <div role='alert' aria-live='assertive'>
              {errorMessage ? (
                <p className='mt-5 rounded-lg border border-negative-600/25 bg-negative-100 px-4 py-3 text-sm text-negative-700'>
                  {errorMessage}
                </p>
              ) : null}
            </div>

            <div className='mt-5 flex justify-center'>
              <Turnstile
                ref={turnstileRef}
                siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '1x00000000000000000000AA'}
                onSuccess={(token) => setTurnstileToken(token)}
                onError={() => setTurnstileToken(null)}
                onExpire={() => setTurnstileToken(null)}
                options={{ theme: 'light' }}
              />
            </div>

            {/* The button is no longer disabled while Turnstile loads. A control that is
                disabled for reasons the user cannot see is worse than one that explains
                itself on submit. */}
            <button
              type='submit'
              disabled={isSubmitting}
              className='mt-5 min-h-11 w-full rounded-lg bg-ink-1000 px-6 py-3.5 font-semibold text-white transition-colors hover:bg-ink-900 disabled:cursor-not-allowed disabled:opacity-60'>
              {isSubmitting ? 'Joining…' : 'Join Waitlist'}
            </button>
          </form>
        </div>
      </div>

      <SuccessDialog open={showSuccess} onClose={() => setShowSuccess(false)} />
    </section>
  );
}

function TextField({
  label,
  optional,
  name,
  value,
  onChange,
  ...rest
}: {
  label: string;
  optional?: boolean;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value' | 'name'>) {
  const id = useId();
  return (
    <div className='mb-4'>
      <label htmlFor={id} className='mb-1.5 block text-sm font-semibold text-ink-1000'>
        {label}
        {optional ? <span className='ml-1 font-normal text-ink-600'>(optional)</span> : null}
      </label>
      <input
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        className='min-h-11 w-full rounded-lg border border-ink-300 px-4 py-3 text-ink-1000 transition placeholder:text-ink-500 focus:border-brand-600 focus:ring-[3px] focus:ring-brand-600/25 focus:outline-none'
        {...rest}
      />
    </div>
  );
}

/**
 * The old success state auto-dismissed after 8 seconds with no dialog semantics, no focus
 * management and no announcement. It now stays until dismissed — WCAG 2.2.1 — and behaves
 * like a dialog.
 */
function SuccessDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const panel = useRef<HTMLDivElement>(null);
  const restoreTo = useRef<HTMLElement | null>(null);
  const titleId = useId();

  const onKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key !== 'Tab' || !panel.current) return;
      const items = [...panel.current.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
        (el) => el.offsetParent !== null
      );
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (!open) return;
    restoreTo.current = document.activeElement as HTMLElement | null;
    document.addEventListener('keydown', onKey, true);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panel.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey, true);
      document.body.style.overflow = prev;
      restoreTo.current?.focus?.();
    };
  }, [open, onKey]);

  if (!open) return null;

  return (
    <div className='fixed inset-0 z-[60] flex items-center justify-center p-4'>
      <div className='absolute inset-0 bg-ink-1000/60' onClick={onClose} aria-hidden='true' />
      <div
        ref={panel}
        role='dialog'
        aria-modal='true'
        aria-labelledby={titleId}
        tabIndex={-1}
        className='relative w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-[0_24px_64px_-16px_rgb(15_23_42/0.28)] focus:outline-none'>
        <div className='mx-auto mb-5 grid h-14 w-14 place-items-center rounded-full bg-positive-100'>
          <svg width='26' height='26' viewBox='0 0 24 24' fill='none' aria-hidden='true'>
            <path
              d='M5 13l4 4L19 7'
              stroke='#00742e'
              strokeWidth='2.5'
              strokeLinecap='round'
              strokeLinejoin='round'
            />
          </svg>
        </div>
        <h3 id={titleId} className='text-2xl font-bold text-ink-1000'>
          You&apos;re on the list
        </h3>
        <p className='mt-2.5 text-ink-700'>
          Thanks for joining the Taash waitlist. We&apos;ll keep you updated on our progress and
          let you know when early access is available.
        </p>
        <button
          type='button'
          onClick={onClose}
          className='mt-6 min-h-11 w-full rounded-lg bg-ink-1000 px-6 py-3 font-semibold text-white transition-colors hover:bg-ink-900'>
          Close
        </button>
      </div>
    </div>
  );
}
