import { logEvent } from '@/lib/log';
import { readJsonObject, RequestInputError } from '@/lib/request-json';
import { checkConfirm } from '@/lib/signing';
import { slackValue } from '@/lib/slack-text';
import { verifyTurnstile } from '@/lib/turnstile';
import { approvePending, isPendingId } from '@/lib/waitlist-pending';
import { postToSlack } from '@/lib/waitlist-sync';
import { after, NextRequest, NextResponse } from 'next/server';

/**
 * Approves a held signup when Cloudflare's check finishes late.
 *
 * On slow phones the check is often still running when the form gives up waiting (3 s) and sends
 * the signup without it, so the signup is held for approval. The form keeps the check running;
 * if it passes, the browser sends the token here with the signed handle it got back
 * (lib/signing.ts, valid 10 minutes). Both must be valid, so this is exactly as strong as a
 * signup that passed the check in time: a bot without a Cloudflare token gets nothing.
 */
export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await readJsonObject(request, 4096);
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request' }, { status: error instanceof RequestInputError ? error.status : 400 });
  }

  const { confirm, turnstileToken } = body;
  const [id, exp, signature, ...extra] = typeof confirm === 'string' ? confirm.split('.') : [];
  const expiresAt = Number(exp);
  if (
    extra.length > 0 || !isPendingId(id) || !Number.isSafeInteger(expiresAt) || typeof signature !== 'string' ||
    typeof turnstileToken !== 'string' || !turnstileToken || turnstileToken.length > 2048
  ) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const handle = checkConfirm(id, expiresAt, signature);
  if (handle === 'expired') {
    logEvent('info', 'waitlist.late_check_expired', { id });
    return NextResponse.json({ error: 'Expired' }, { status: 410 });
  }
  if (handle !== 'ok') return NextResponse.json({ error: 'Invalid request' }, { status: 400 });

  const verified = await verifyTurnstile(turnstileToken, {
    secret: process.env.TURNSTILE_SECRET_KEY,
    isDevelopment: process.env.NODE_ENV === 'development',
  });
  if (!verified) {
    logEvent('warn', 'waitlist.late_check_rejected', { id });
    return NextResponse.json({ error: 'Verification failed' }, { status: 400 });
  }

  const result = await approvePending(id);
  logEvent(result.status === 'error' ? 'error' : 'info', 'waitlist.auto_approved', { id, result: result.status });

  if (result.status === 'error') {
    // approvePending puts the row back, so the Slack link still works for a manual approval.
    return NextResponse.json({ error: 'Could not confirm' }, { status: 500 });
  }
  if (result.status === 'approved' || result.status === 'already-on-list') {
    const name = slackValue(result.row.full_name);
    after(() =>
      postToSlack(
        result.status === 'approved'
          ? `✅ *Auto-approved:* ${name}. Cloudflare's check finished a few seconds after they pressed Join, so they're on the waitlist and the welcome email is on its way. Nothing for you to do; the approval link above now says it's handled.`
          : `✅ *Auto-approved:* ${name} was already on the waitlist. Nothing for you to do.`
      )
    );
  }
  // 'missing': someone already approved or discarded it from Slack. Nothing to change.
  return NextResponse.json({ ok: true });
}
