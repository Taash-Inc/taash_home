'use client';

import { sendClientReport } from '@/lib/client-report';
import Link from 'next/link';
import { useEffect } from 'react';

/**
 * Shown when a page crashes while rendering, in place of Next.js's bare error screen. The crash
 * is reported (lib/client-report.ts) so it reaches Slack and the Vercel logs.
 */
export default function PageError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    sendClientReport({
      type: 'render-error',
      reason: error.digest ? `${error.message} (digest ${error.digest})` : error.message || 'unknown error',
    });
  }, [error]);

  return (
    <main className='mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 px-4 text-center'>
      <h1 className='text-2xl font-semibold text-ink-1000'>Something went wrong</h1>
      <p className='text-ink-700'>We&rsquo;ve been told about it. Try again, or go back to the homepage.</p>
      <div className='flex gap-3'>
        <button
          type='button'
          onClick={reset}
          className='min-h-11 rounded-full bg-ink-1000 px-5 font-semibold text-white hover:bg-ink-900'>
          Try again
        </button>
        <Link
          href='/'
          className='inline-flex min-h-11 items-center rounded-full border border-ink-300 px-5 font-semibold text-ink-1000'>
          Homepage
        </Link>
      </div>
    </main>
  );
}
