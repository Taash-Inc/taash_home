'use client';

import { sendClientReport } from '@/lib/client-report';
import { useEffect } from 'react';

/**
 * Last resort when the root layout itself crashes. It replaces the whole document, so it can't
 * rely on the site's fonts or styles. The crash is still reported.
 */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    sendClientReport({
      type: 'render-error',
      reason: `Layout: ${error.digest ? `${error.message} (digest ${error.digest})` : error.message || 'unknown error'}`,
    });
  }, [error]);

  return (
    <html lang='en-NG'>
      <body style={{ fontFamily: 'system-ui, sans-serif', textAlign: 'center', padding: '4rem 1rem' }}>
        <h1>Something went wrong</h1>
        <p>We&rsquo;ve been told about it.</p>
        <button type='button' onClick={reset} style={{ padding: '0.75rem 1.5rem', borderRadius: 999 }}>
          Try again
        </button>
      </body>
    </html>
  );
}
