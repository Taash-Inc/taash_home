import { browserOf, isReportType, scrub } from '@/lib/client-report';
import { logEvent } from '@/lib/log';
import { readJsonObject, RequestInputError } from '@/lib/request-json';
import { postToSlack } from '@/lib/waitlist-sync';
import { NextRequest, NextResponse } from 'next/server';

const PLACEMENTS = new Set(['hero', 'section', 'calculator']);
const SLACK_REPEAT_MS = 15 * 60 * 1000;
const SLACK_PER_HOUR = 20;

/**
 * Reports from visitors' browsers (lib/client-report.ts). Anyone can call this, so it only
 * accepts small, fixed-shape reports from our own pages, re-scrubs the text, and caps how often
 * it posts to Slack. Every report is logged to Vercel as `client.report`.
 */
export async function POST(request: NextRequest) {
  // Same-origin only: our pages send an Origin header with every POST.
  const origin = request.headers.get('origin');
  if (!origin || !sameHost(origin, request.nextUrl.host)) {
    return new NextResponse(null, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await readJsonObject(request, 2048);
  } catch (error) {
    return new NextResponse(null, { status: error instanceof RequestInputError ? error.status : 400 });
  }
  const { type, reason, placement, source, path } = body;
  if (
    !isReportType(type) ||
    typeof reason !== 'string' || !reason.trim() || reason.length > 400 ||
    (placement != null && (typeof placement !== 'string' || !PLACEMENTS.has(placement))) ||
    (source != null && (typeof source !== 'string' || source.length > 200)) ||
    (path != null && (typeof path !== 'string' || !path.startsWith('/') || path.length > 200))
  ) {
    return new NextResponse(null, { status: 400 });
  }

  const report = {
    type,
    reason: scrub(reason),
    placement: placement ?? null,
    source: typeof source === 'string' ? scrub(source).slice(0, 120) : null,
    path: typeof path === 'string' ? scrub(path).slice(0, 120) : null,
    browser: browserOf(request.headers.get('user-agent') ?? ''),
  };
  logEvent('error', 'client.report', report);

  if (slackAllowed(`${report.type}:${report.reason}`, Date.now())) {
    await postToSlack(
      `${report.type === 'signup-failed' ? '🚨 *A visitor could not reach the signup*' : '⚠️ *Error on the website*'}\n• What: ${report.type}, ${report.reason}${report.placement ? `\n• Form: ${report.placement}` : ''}${report.source ? `\n• Where: ${report.source}` : ''}\n• Page: ${report.path ?? 'unknown'}\n• Browser: ${report.browser}\nRepeats of this exact problem are muted for 15 minutes; all of them are in the Vercel logs (\`client.report\`).`
    );
  }
  return new NextResponse(null, { status: 204 });
}

function sameHost(origin: string, host: string | null): boolean {
  try {
    return !!host && new URL(origin).host === host;
  } catch {
    return false;
  }
}

// Per server instance: the same problem posts once per 15 minutes, and no more than 20 posts an
// hour overall, so a crash loop or someone calling this directly can't flood Slack.
const lastPosted = new Map<string, number>();
let hourStart = 0;
let postedThisHour = 0;
function slackAllowed(key: string, now: number): boolean {
  if (now - hourStart > 60 * 60 * 1000) {
    hourStart = now;
    postedThisHour = 0;
  }
  if (postedThisHour >= SLACK_PER_HOUR) return false;
  if (now - (lastPosted.get(key) ?? 0) < SLACK_REPEAT_MS) return false;
  if (lastPosted.size > 500) lastPosted.clear();
  lastPosted.set(key, now);
  postedThisHour++;
  return true;
}
