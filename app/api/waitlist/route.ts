import { verifyTurnstile } from '@/lib/turnstile';
import { syncSignup } from '@/lib/waitlist-sync';
import { after, NextRequest, NextResponse } from 'next/server';

// Sanitize input: trim whitespace, limit length, remove potential XSS
function sanitize(input: string, maxLength: number = 255): string {
  return input.trim().slice(0, maxLength).replace(/[<>]/g, ''); // Remove angle brackets to prevent basic XSS
}

// Insert into Supabase using REST API
async function insertToSupabase(data: {
  full_name: string;
  email: string;
  profession: string;
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
      Prefer: 'return=representation',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('Supabase REST error:', response.status, errorData);

    // Check for duplicate email
    if (response.status === 409 || errorData?.code === '23505') {
      return { error: { code: '23505' } };
    }

    return { error: { message: errorData?.message || 'Insert failed' } };
  }

  const result = await response.json();
  return { data: result };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fullName, email, profession, monthlyIncome, turnstileToken } = body;

    // Verify Turnstile CAPTCHA
    if (!turnstileToken) {
      return NextResponse.json({ error: 'Please complete the CAPTCHA' }, { status: 400 });
    }

    const isValidToken = await verifyTurnstile(turnstileToken, {
      secret: process.env.TURNSTILE_SECRET_KEY,
      isDevelopment: process.env.NODE_ENV === 'development',
    });
    if (!isValidToken) {
      return NextResponse.json({ error: 'CAPTCHA verification failed' }, { status: 400 });
    }

    // Validate required fields
    if (!fullName || !email || !profession) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Sanitize inputs
    const sanitizedData = {
      fullName: sanitize(fullName, 100),
      email: sanitize(email, 255).toLowerCase(),
      profession: sanitize(profession, 100),
      monthlyIncome: monthlyIncome ? sanitize(monthlyIncome, 50) : null,
    };

    // Validate sanitized data isn't empty
    if (!sanitizedData.fullName || !sanitizedData.email || !sanitizedData.profession) {
      return NextResponse.json({ error: 'Invalid input data' }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(sanitizedData.email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    // Insert into Supabase using REST API
    const { data, error } = await insertToSupabase({
      full_name: sanitizedData.fullName,
      email: sanitizedData.email,
      profession: sanitizedData.profession,
      monthly_income: sanitizedData.monthlyIncome,
    });

    if (error) {
      // Handle duplicate email
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'This email is already on the waitlist!' },
          { status: 409 }
        );
      }
      console.error('Supabase error:', error);
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
        profession: sanitizedData.profession,
        monthlyIncome: sanitizedData.monthlyIncome,
      })
    );

    return NextResponse.json(
      { message: 'Successfully joined the waitlist!', data },
      { status: 201 }
    );
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
