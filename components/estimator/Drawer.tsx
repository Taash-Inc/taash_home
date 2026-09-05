'use client';

import { useCallback, useEffect, useId, useRef } from 'react';

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])';

/**
 * Side drawer on desktop, bottom sheet on mobile.
 *
 * Replaces a modal that had none of this: no role, no aria-modal, no focus trap, no
 * Escape, no focus restoration, no scroll lock, and a close button with no accessible
 * name (00-audit.md §4.3). Keeping the inputs visible while reading what counts is also
 * the point of a drawer over a centred dialog.
 */
export function Drawer({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const restoreTo = useRef<HTMLElement | null>(null);
  const titleId = useId();

  const trap = useCallback((e: KeyboardEvent) => {
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
  }, []);

  useEffect(() => {
    if (!open) return;
    restoreTo.current = document.activeElement as HTMLElement | null;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
        return;
      }
      trap(e);
    };

    document.addEventListener('keydown', onKey, true);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    // Focus the panel itself, so the drawer's own heading is what gets announced.
    panel.current?.focus();

    return () => {
      document.removeEventListener('keydown', onKey, true);
      document.body.style.overflow = prevOverflow;
      restoreTo.current?.focus?.();
    };
  }, [open, onClose, trap]);

  if (!open) return null;

  return (
    <div className='fixed inset-0 z-[60] flex justify-end'>
      <div
        className='absolute inset-0 bg-ink-1000/70 backdrop-blur-[2px]'
        onClick={onClose}
        aria-hidden='true'
      />
      <div
        ref={panel}
        role='dialog'
        aria-modal='true'
        aria-labelledby={titleId}
        tabIndex={-1}
        className='relative flex h-full w-full max-w-lg flex-col border-l border-white/10 bg-ink-950 shadow-[0_24px_64px_-16px_rgb(15_23_42/0.6)] focus:outline-none max-sm:mt-auto max-sm:h-auto max-sm:max-h-[85vh] max-sm:w-full max-sm:max-w-none max-sm:rounded-t-2xl max-sm:border-l-0'>
        <div className='flex items-start justify-between gap-4 border-b border-white/10 px-6 py-5'>
          <h3 id={titleId} className='text-xl font-bold text-white'>
            {title}
          </h3>
          <button
            type='button'
            onClick={onClose}
            aria-label={`Close ${title.toLowerCase()}`}
            className='-m-2 grid h-11 w-11 shrink-0 place-items-center rounded-full text-ink-300 transition-colors hover:bg-white/10 hover:text-white'>
            <svg width='20' height='20' viewBox='0 0 20 20' fill='none' aria-hidden='true'>
              <path
                d='M5 5l10 10M15 5L5 15'
                stroke='currentColor'
                strokeWidth='1.5'
                strokeLinecap='round'
              />
            </svg>
          </button>
        </div>
        <div className='min-h-0 flex-1 overflow-y-auto px-6 py-5'>{children}</div>
        <div className='border-t border-white/10 px-6 py-4'>
          <button
            type='button'
            onClick={onClose}
            className='min-h-11 w-full rounded-lg bg-brand-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-brand-700'>
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
