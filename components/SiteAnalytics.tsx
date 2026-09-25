'use client';

import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';

/**
 * Links to /email-preferences carry the person's private token in ?t=, and Vercel collects
 * query parameters, so the token is removed before any event leaves the browser.
 */
function withoutToken<T extends { url: string }>(event: T): T {
  const url = new URL(event.url, window.location.origin);
  if (url.pathname !== '/email-preferences' || !url.searchParams.has('t')) return event;
  url.searchParams.delete('t');
  return { ...event, url: url.toString() };
}

export default function SiteAnalytics() {
  return (
    <>
      <Analytics beforeSend={withoutToken} />
      <SpeedInsights beforeSend={withoutToken} />
    </>
  );
}
