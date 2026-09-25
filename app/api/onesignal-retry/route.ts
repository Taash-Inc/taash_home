import { MAX_RETRIES, getFailedSyncs, postRetrySummary, retryFailedSync } from '@/lib/waitlist-sync';
import { NextRequest, NextResponse } from 'next/server';

// Verify cron secret (optional but recommended for security)
function verifyCronSecret(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return true; // Skip verification if not configured

  const authHeader = request.headers.get('authorization');
  return authHeader === `Bearer ${cronSecret}`;
}

/**
 * Nightly retry of signups whose OneSignal sync failed (see vercel.json). A retry repeats the
 * whole sync, which is safe: the OneSignal user is only created if missing, the confirmation
 * email is deduplicated by OneSignal, and anyone who has left the waitlist is skipped
 * (retryFailedSync).
 */
export async function GET(request: NextRequest) {
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

  const results = { total: failedSyncs.length, succeeded: 0, failed: 0, left: 0, maxRetriesReached: 0 };

  for (const sync of failedSyncs) {
    const outcome = await retryFailedSync(sync);
    if (outcome === 'synced') results.succeeded++;
    else if (outcome === 'left') results.left++;
    else {
      if ((sync.retry_count ?? 0) + 1 >= MAX_RETRIES) results.maxRetriesReached++;
      results.failed++;
    }

    // Small delay between requests to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  await postRetrySummary(results);

  return NextResponse.json({ message: 'Retry complete', ...results });
}

// Also support POST for manual triggers
export async function POST(request: NextRequest) {
  return GET(request);
}
