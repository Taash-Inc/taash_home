import { logEvent } from '@/lib/log';
import { syncWaitlistAdSpend } from '@/lib/waitlist-ad-spend';
import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 120;

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret?.trim() || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await syncWaitlistAdSpend();
    return NextResponse.json(result, { status: result.failed ? 502 : 200 });
  } catch {
    logEvent('error', 'waitlist.ad_spend_job_failed');
    return NextResponse.json({ error: 'Ad spend sync failed' }, { status: 502 });
  }
}
