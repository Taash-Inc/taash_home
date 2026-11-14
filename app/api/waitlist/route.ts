import { logEvent } from '@/lib/log';
import { isProfession } from '@/lib/professions';
import { readJsonObject, RequestInputError } from '@/lib/request-json';
import { clientIp, hashIp, refFor } from '@/lib/signing';
import { verifyTurnstile } from '@/lib/turnstile';
import { alertRateLimit, approveUrl, savePending } from '@/lib/waitlist-pending';
import { announceSignup, postToSlack, syncSignup } from '@/lib/waitlist-sync';
import { isClientCheck } from '@/lib/waitlist-verify';
import { after, NextRequest, NextResponse } from 'next/server';

// Sanitize input: limit length, remove angle brackets (basic XSS), and collapse whitespace.
// Line breaks and tabs become single spaces: no name or email needs them, and left in they
// could add fake lines to the Slack alerts, which are one fact per line.
function sanitize(input: string, maxLength: number = 255): string {
  return input.slice(0, maxLength).replace(/[<>]/g, '').replace(/\s+/g, ' ').trim();
}

// Insert into Supabase using REST API
async function insertToSupabase(data: {
  full_name: string;
  email: string;
  profession: string | null;
  monthly_income: string | null;
}) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase configuration missing');
  }

  const response = await fetch(`${supabaseUrl}/rest/v1/waitlist`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    // Check for duplicate email
    if (response.status === 409 || errorData?.code === '23505') {
      return { error: { code: '23505' } };
    }

    return { error: { message: `Insert failed: HTTP ${response.status}${errorData?.code ? ` (${errorData.code})` : ''}` } };
  }

  return {};
}

const JOINED = { message: 'Successfully joined the waitlist!' };

/**
 * Joins the waitlist. A signup is never turned away because the Cloudflare human check didn't
 * finish on the visitor's phone (slow networks, in-app browsers): the form sends whatever it
 * has, and this route decides.
 *
 * - Check passed: saved to the waitlist, welcome email sent, Slack ping.
 * - Check missing or rejected: saved to `waitlist_pending` (rate-limited), no email, and Slack
 *   gets an approval link. The visitor sees the same success screen either way.
 * - Hidden "extra_info" field filled in: a bot. It gets the same success answer and is dropped.
 *
 * Logs go to Vercel as JSON lines (lib/log.ts) and never contain names, emails or IPs; the
 * details are only in Slack.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await readJsonObject(request);
    const { fullName, email, profession, monthlyIncome, turnstileToken, check, extra_info: honeypot } = body;

    // Validate shapes and lengths before contacting providers. Never truncate an address
    // into a different person's email, or allow a non-string to reach sanitize().
    if (
      typeof fullName !== 'string' || fullName.length > 100 ||
      typeof email !== 'string' || email.length > 255 ||
      // Only the form's own choices; '' and null mean "not given".
      (profession != null && profession !== '' && !isProfession(profession)) ||
      (monthlyIncome != null && (typeof monthlyIncome !== 'string' || monthlyIncome.length > 50)) ||
      // The token may be missing (the check didn't finish), but never anything but a string.
      (turnstileToken != null && (typeof turnstileToken !== 'string' || turnstileToken.length > 2048)) ||
      (check != null && typeof check !== 'string') ||
      (honeypot != null && (typeof honeypot !== 'string' || honeypot.length > 500))
    ) {
      return NextResponse.json({ error: 'Invalid input data' }, { status: 400 });
    }

    // Validate required fields. Profession became optional: the forms now ask only for a first
    // name and an email, with profession as an optional one-tap choice.
    if (!fullName || !email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Sanitize inputs
    const sanitizedData = {
      fullName: sanitize(fullName, 100),
      email: sanitize(email, 255).toLowerCase(),
      profession: isProfession(profession) ? profession : null,
      monthlyIncome: monthlyIncome ? sanitize(monthlyIncome, 50) : null,
    };

    // Validate sanitized data isn't empty
    if (!sanitizedData.fullName || !sanitizedData.email) {
      return NextResponse.json({ error: 'Invalid input data' }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(sanitizedData.email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    // The field is hidden from people (off-screen, skipped by the keyboard and screen readers),
    // so only a bot fills it in. Same answer as a real signup, so the bot learns nothing.
    if (honeypot?.trim()) {
      logEvent('warn', 'waitlist.honeypot', {});
      return NextResponse.json(JOINED, { status: 201 });
    }

    const ref = refFor(sanitizedData.email);
    const verified = turnstileToken
      ? await verifyTurnstile(turnstileToken, {
          secret: process.env.TURNSTILE_SECRET_KEY,
          isDevelopment: process.env.NODE_ENV === 'development',
        })
      : false;

    if (!verified) {
      const reason = turnstileToken ? 'rejected' : `no-token:${isClientCheck(check) ? check : 'unknown'}`;
      return holdForApproval(sanitizedData, reason, ref, request.headers);
    }

    // Insert into Supabase using REST API
    let saveError: string | undefined;
    try {
      const { error } = await insertToSupabase({
        full_name: sanitizedData.fullName,
        email: sanitizedData.email,
        profession: sanitizedData.profession,
        monthly_income: sanitizedData.monthlyIncome,
      });
      // A duplicate gets the same answer as a new signup, so the form can't be used to test
      // whether an address is on the list.
      if (error?.code === '23505') {
        logEvent('info', 'waitlist.duplicate', { ref });
        return NextResponse.json(JOINED, { status: 201 });
      }
      saveError = error?.message;
    } catch (error) {
      saveError = error instanceof Error ? error.message : String(error);
    }

    if (saveError) return saveFailed(sanitizedData, saveError, ref, 'verified');

    // Add to OneSignal and send the confirmation email once the response has gone out, so the
    // visitor never waits on it. `after` keeps the function alive until this finishes; the old
    // Loops call was an un-awaited promise, which Vercel can cut off once the response is sent.
    const nameParts = sanitizedData.fullName.split(' ');
    after(() =>
      syncSignup({
        email: sanitizedData.email,
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || '',
        profession: sanitizedData.profession ?? '',
        monthlyIncome: sanitizedData.monthlyIncome,
      })
    );
    // A Slack ping for each new person. Kept apart from the sync so neither can hold up the other.
    after(() => announceSignup(sanitizedData));
    logEvent('info', 'waitlist.saved', { ref, verified: true });

    return NextResponse.json(JOINED, { status: 201 });
  } catch (error) {
    if (error instanceof RequestInputError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    logEvent('error', 'waitlist.unexpected_error', {
      error: error instanceof Error ? error.name : 'unknown',
    });
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

type Signup = { fullName: string; email: string; profession: string | null; monthlyIncome: string | null };

/** The check didn't pass: keep them for approval instead of turning them away. */
async function holdForApproval(signup: Signup, reason: string, ref: string, headers: Headers) {
  const ipHash = hashIp(clientIp(headers));
  // The database enforces the hourly limits inside this insert (see lib/waitlist-pending.ts).
  const result = await savePending({ ...signup, reason, ipHash });
  if (!result.saved && 'rateLimited' in result) {
    logEvent('warn', 'waitlist.rate_limited', { ref, scope: result.rateLimited });
    after(() => alertRateLimit(result.rateLimited));
    return NextResponse.json(
      { error: 'Too many signups right now. Please try again in a few minutes.' },
      { status: 429 }
    );
  }
  if (!result.saved && 'duplicate' in result) {
    logEvent('info', 'waitlist.pending_duplicate', { ref, reason });
    return NextResponse.json(JOINED, { status: 201 });
  }
  if (!result.saved) return saveFailed(signup, result.error, ref, `unverified, ${reason}`);

  logEvent('warn', 'waitlist.pending', { ref, reason, id: result.id });
  const link = result.id ? approveUrl(result.id) : null;
  after(() => announceSignup(signup, { reason, approveUrl: link }));
  return NextResponse.json(JOINED, { status: 201 });
}

/**
 * Nothing parks a signup that never reached the database, so Slack gets the details for someone
 * to add the person by hand. The visitor is told it failed, so they can try again.
 */
function saveFailed(signup: Signup, error: string, ref: string, kind: string) {
  logEvent('error', 'waitlist.save_failed', { ref, kind, error: error.slice(0, 120) });
  after(() =>
    postToSlack(
      `🚨 *Waitlist signup could not be saved* (${kind})\n• Name: ${signup.fullName}\n• Email: ${signup.email}\n• Profession: ${signup.profession ?? 'not given'}\n• Error: ${error}\nAdd them to the waitlist by hand.`
    )
  );
  return NextResponse.json({ error: 'Failed to join waitlist' }, { status: 500 });
}
