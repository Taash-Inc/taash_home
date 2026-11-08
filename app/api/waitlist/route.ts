import { verifyTurnstile } from '@/lib/turnstile';
import { isProfession } from '@/lib/professions';
import { postToSlack, syncSignup } from '@/lib/waitlist-sync';
import { readJsonObject, RequestInputError } from '@/lib/request-json';
import { after, NextRequest, NextResponse } from 'next/server';

// Sanitize input: trim whitespace, limit length, remove potential XSS
function sanitize(input: string, maxLength: number = 255): string {
  return input.trim().slice(0, maxLength).replace(/[<>]/g, ''); // Remove angle brackets to prevent basic XSS
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

export async function POST(request: NextRequest) {
  try {
    const body = await readJsonObject(request);
    const { fullName, email, profession, monthlyIncome, turnstileToken } = body;

    // Verify Turnstile CAPTCHA
    if (typeof turnstileToken !== 'string' || !turnstileToken || turnstileToken.length > 2048) {
      return NextResponse.json({ error: 'Please complete the CAPTCHA' }, { status: 400 });
    }

    // Validate shapes and lengths before contacting providers. Never truncate an address
    // into a different person's email, or allow a non-string to reach sanitize().
    if (
      typeof fullName !== 'string' || fullName.length > 100 ||
      typeof email !== 'string' || email.length > 255 ||
      // Only the form's own choices; '' and null mean "not given".
      (profession != null && profession !== '' && !isProfession(profession)) ||
      (monthlyIncome != null && (typeof monthlyIncome !== 'string' || monthlyIncome.length > 50))
    ) {
      return NextResponse.json({ error: 'Invalid input data' }, { status: 400 });
    }

    const isValidToken = await verifyTurnstile(turnstileToken, {
      secret: process.env.TURNSTILE_SECRET_KEY,
      isDevelopment: process.env.NODE_ENV === 'development',
    });
    if (!isValidToken) {
      return NextResponse.json({ error: 'CAPTCHA verification failed' }, { status: 400 });
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
        return NextResponse.json({ message: 'Successfully joined the waitlist!' }, { status: 201 });
      }
      saveError = error?.message;
    } catch (error) {
      saveError = error instanceof Error ? error.message : String(error);
    }

    if (saveError) {
      // Unlike a OneSignal failure, nothing parks a signup that never reached the database: it
      // used to be logged and lost. Slack gets the details so someone can add the person by hand.
      console.error('Waitlist signup could not be saved:', saveError);
      const reason = saveError;
      after(() =>
        postToSlack(
          `🚨 *Waitlist signup could not be saved*\n• Name: ${sanitizedData.fullName}\n• Email: ${sanitizedData.email}\n• Profession: ${sanitizedData.profession ?? 'not given'}\n• Error: ${reason}\nAdd them to the waitlist by hand.`
        )
      );
      return NextResponse.json({ error: 'Failed to join waitlist' }, { status: 500 });
    }

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

    return NextResponse.json(
      { message: 'Successfully joined the waitlist!' },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof RequestInputError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
