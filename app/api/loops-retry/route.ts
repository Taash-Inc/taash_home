import { NextRequest, NextResponse } from 'next/server';

// Max retry attempts before giving up
const MAX_RETRIES = 3;

// Verify cron secret (optional but recommended for security)
function verifyCronSecret(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return true; // Skip verification if not configured

  const authHeader = request.headers.get('authorization');
  return authHeader === `Bearer ${cronSecret}`;
}

// Add contact to Loops.so
async function addToLoops(data: {
  email: string;
  first_name: string;
  last_name: string;
  profession: string;
  monthly_income: string | null;
}): Promise<{ success: boolean; error?: string }> {
  const apiKey = process.env.LOOPS_API_KEY;

  if (!apiKey) {
    return { success: false, error: 'Loops API key not configured' };
  }

  try {
    const response = await fetch('https://app.loops.so/api/v1/contacts/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        email: data.email,
        firstName: data.first_name,
        lastName: data.last_name,
        source: 'waitlist',
        userGroup: 'waitlist',
        profession: data.profession,
        monthlyIncome: data.monthly_income || '',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { success: false, error: errorData?.message || `HTTP ${response.status}` };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Get failed syncs from Supabase
async function getFailedSyncs(): Promise<{ data: any[]; error?: string }> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return { data: [], error: 'Supabase not configured' };
  }

  try {
    const response = await fetch(
      `${supabaseUrl}/rest/v1/failed_loops_syncs?retry_count=lt.${MAX_RETRIES}&order=created_at.asc&limit=50`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      }
    );

    if (!response.ok) {
      return { data: [], error: `Failed to fetch: ${response.status}` };
    }

    const data = await response.json();
    return { data };
  } catch (error) {
    return { data: [], error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Update retry count or delete on success
async function updateSyncRecord(
  id: string,
  success: boolean,
  errorMessage?: string
): Promise<void> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseKey) return;

  try {
    if (success) {
      // Delete the record on success
      await fetch(`${supabaseUrl}/rest/v1/failed_loops_syncs?id=eq.${id}`, {
        method: 'DELETE',
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      });
    } else {
      // Increment retry count and update error message
      await fetch(`${supabaseUrl}/rest/v1/failed_loops_syncs?id=eq.${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({
          retry_count: `retry_count + 1`,
          last_retry_at: new Date().toISOString(),
          error_message: errorMessage,
        }),
      });

      // Use RPC for increment since PATCH doesn't support expressions
      await fetch(`${supabaseUrl}/rest/v1/rpc/increment_retry_count`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({ row_id: id, new_error: errorMessage }),
      }).catch(() => {
        // Fallback: direct update with current count + 1
        // This is less atomic but works without RPC
      });
    }
  } catch (error) {
    console.error('Failed to update sync record:', error);
  }
}

// Fallback update without RPC
async function incrementRetryCount(
  id: string,
  currentCount: number,
  errorMessage: string
): Promise<void> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseKey) return;

  await fetch(`${supabaseUrl}/rest/v1/failed_loops_syncs?id=eq.${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
    },
    body: JSON.stringify({
      retry_count: currentCount + 1,
      last_retry_at: new Date().toISOString(),
      error_message: errorMessage,
    }),
  });
}

// Send Slack summary
async function sendSlackSummary(results: {
  total: number;
  succeeded: number;
  failed: number;
  maxRetriesReached: number;
}): Promise<void> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl || results.total === 0) return;

  const emoji = results.failed === 0 ? '✅' : '⚠️';

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `${emoji} *Loops Retry Summary*\n• Total processed: ${results.total}\n• Succeeded: ${results.succeeded}\n• Failed: ${results.failed}\n• Max retries reached: ${results.maxRetriesReached}`,
      }),
    });
  } catch (error) {
    console.error('Failed to send Slack summary:', error);
  }
}

export async function GET(request: NextRequest) {
  // Verify cron secret for security
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: failedSyncs, error } = await getFailedSyncs();

  if (error) {
    return NextResponse.json({ error }, { status: 500 });
  }

  if (failedSyncs.length === 0) {
    return NextResponse.json({ message: 'No failed syncs to retry', processed: 0 });
  }

  const results = {
    total: failedSyncs.length,
    succeeded: 0,
    failed: 0,
    maxRetriesReached: 0,
  };

  // Process each failed sync
  for (const sync of failedSyncs) {
    const loopsResult = await addToLoops({
      email: sync.email,
      first_name: sync.first_name,
      last_name: sync.last_name,
      profession: sync.profession,
      monthly_income: sync.monthly_income,
    });

    if (loopsResult.success) {
      // Delete from failed_loops_syncs on success
      await updateSyncRecord(sync.id, true);
      results.succeeded++;
    } else {
      // Update retry count
      const newRetryCount = (sync.retry_count || 0) + 1;
      await incrementRetryCount(
        sync.id,
        sync.retry_count || 0,
        loopsResult.error || 'Unknown error'
      );

      if (newRetryCount >= MAX_RETRIES) {
        results.maxRetriesReached++;
      }
      results.failed++;
    }

    // Small delay between requests to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  // Send Slack summary
  await sendSlackSummary(results);

  return NextResponse.json({
    message: 'Retry complete',
    ...results,
  });
}

// Also support POST for manual triggers
export async function POST(request: NextRequest) {
  return GET(request);
}
