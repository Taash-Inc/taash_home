import { NextRequest, NextResponse } from 'next/server';

// Sanitize input: trim whitespace, limit length, remove potential XSS
function sanitize(input: string, maxLength: number = 255): string {
  return input.trim().slice(0, maxLength).replace(/[<>]/g, ''); // Remove angle brackets to prevent basic XSS
}

// Verify Turnstile token
async function verifyTurnstile(token: string): Promise<boolean> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;

  if (!secretKey || secretKey === 'your-secret-key-here') {
    // Skip verification in development if not configured
    console.warn('Turnstile not configured, skipping verification');
    return true;
  }

  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        secret: secretKey,
        response: token,
      }),
    });

    const data = await response.json();
    return data.success === true;
  } catch (error) {
    console.error('Turnstile verification error:', error);
    return false;
  }
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

    const isValidToken = await verifyTurnstile(turnstileToken);
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

    return NextResponse.json(
      { message: 'Successfully joined the waitlist!', data },
      { status: 201 }
    );
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
