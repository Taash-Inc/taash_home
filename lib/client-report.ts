/**
 * Problems that happen in the visitor's browser, where our server would otherwise never hear
 * about them: a signup request that couldn't reach us, a JavaScript error, a page that crashed.
 * The browser sends a small report to /api/client-report, which logs it to Vercel and alerts
 * Slack. Reports carry fixed codes and scrubbed error text only, never what the visitor typed.
 */
export const REPORT_TYPES = ['signup-failed', 'js-error', 'render-error'] as const;
export type ReportType = (typeof REPORT_TYPES)[number];
export const isReportType = (value: unknown): value is ReportType =>
  typeof value === 'string' && (REPORT_TYPES as readonly string[]).includes(value);

export type ClientReport = {
  type: ReportType;
  /** A fixed code for signup failures ("network", "http-500"), or scrubbed error text. */
  reason: string;
  placement?: string;
  /** Where in the code a JavaScript error happened: file name and line, no query strings. */
  source?: string;
};

export const MAX_REASON = 160;

/**
 * Remove anything that could identify a person from error text before it leaves the browser:
 * email addresses, long digit runs (phone, card or account numbers), query strings and fragments
 * on any link, and tokens. Keeps enough of the message to know what broke.
 */
export function scrub(text: string): string {
  return text
    .replace(/[^\s@]+@[^\s@]+/g, '[email]')
    // Any link, absolute or relative (/email-preferences?t=… carries a private token): keep
    // the path, drop the query string and fragment.
    .replace(/(\/[^\s?#]*)[?#]\S*/g, '$1?[…]')
    .replace(/\b[A-Za-z0-9_-]{32,}\b/g, '[token]')
    .replace(/\d{4,}/g, '[number]')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_REASON);
}

/** A coarse browser label: enough to spot "it only breaks in Instagram on Android". */
export function browserOf(ua: string): string {
  const os = /Android/i.test(ua) ? 'Android' : /iPhone|iPad|iPod/i.test(ua) ? 'iOS' : /Mac OS X/i.test(ua) ? 'Mac' : /Windows/i.test(ua) ? 'Windows' : 'other OS';
  const app = /Instagram/i.test(ua)
    ? 'Instagram in-app'
    : /FBAN|FBAV|FB_IAB|FBIOS/i.test(ua)
      ? 'Facebook in-app'
      : /Edg\//.test(ua)
        ? 'Edge'
        : /CriOS|Chrome\//.test(ua)
          ? 'Chrome'
          : /Firefox|FxiOS/.test(ua)
            ? 'Firefox'
            : /Safari\//.test(ua)
              ? 'Safari'
              : 'other browser';
  return `${app} on ${os}`;
}

let sent = 0;
/** At most this many reports per page view, so a crash loop can't flood anything. */
const MAX_PER_PAGE = 5;

/** Send a report without delaying the page; survives the visitor closing the tab. */
export function sendClientReport(report: ClientReport): void {
  if (typeof window === 'undefined' || sent >= MAX_PER_PAGE) return;
  sent++;
  const body = JSON.stringify({ ...report, reason: scrub(report.reason), path: window.location.pathname });
  try {
    const blob = new Blob([body], { type: 'application/json' });
    if (navigator.sendBeacon?.('/api/client-report', blob)) return;
  } catch {
    // Fall through to fetch.
  }
  fetch('/api/client-report', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: true,
  }).catch(() => {
    // Nothing more we can do from here; the analytics event is the backup.
  });
}
