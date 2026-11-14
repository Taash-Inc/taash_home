'use client';

import { sendClientReport } from '@/lib/client-report';
import { useEffect } from 'react';

/**
 * Reports JavaScript errors from our own code in the visitor's browser (lib/client-report.ts),
 * so a broken button or form shows up in Slack and the Vercel logs instead of going unnoticed.
 *
 * Errors from other origins (browser extensions, in-app browser injections, third-party
 * scripts) arrive as a bare "Script error." with no file and are ignored: we can't act on them.
 */
export default function ErrorReporter() {
  useEffect(() => {
    const ours = (file: string | undefined) => !!file && file.startsWith(window.location.origin);
    const where = (file: string, line?: number) =>
      `${new URL(file).pathname.split('/').pop() ?? 'unknown'}${line ? `:${line}` : ''}`;

    const onError = (event: ErrorEvent) => {
      if (!ours(event.filename)) return;
      sendClientReport({
        type: 'js-error',
        reason: event.message || 'unknown error',
        source: where(event.filename, event.lineno),
      });
    };
    const onRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason;
      if (!(error instanceof Error)) return;
      const file = error.stack?.match(/(https?:\/\/[^\s)]+?):(\d+):\d+/);
      if (!file || !ours(file[1])) return;
      sendClientReport({
        type: 'js-error',
        reason: `Unhandled: ${error.message || error.name}`,
        source: where(file[1], Number(file[2])),
      });
    };

    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);
    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
    };
  }, []);
  return null;
}
