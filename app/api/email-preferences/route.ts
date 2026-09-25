import {
  findEmailByToken,
  isPreferenceToken,
  leaveWaitlist,
  preferencesConfig,
} from '@/lib/email-preferences';
import { setEmailPreference, type EmailPreference } from '@/lib/onesignal';
import { postToSlack } from '@/lib/waitlist-sync';
import { after, NextRequest, NextResponse } from 'next/server';

type Action = EmailPreference | 'leave';
const ACTIONS: readonly string[] = ['all', 'invite_only', 'none', 'leave'];

function isAction(value: unknown): value is Action {
  return typeof value === 'string' && ACTIONS.includes(value);
}

/**
 * The buttons on /email-preferences. Changes only ever happen here, on a POST. The page itself
 * just reads, because mail scanners open the links in an email to check them, and a page that
 * acted on being opened would unsubscribe people who never clicked anything.
 */
export async function POST(request: NextRequest) {
  const body: unknown = await request.json().catch(() => null);
  const { token, action } = (body ?? {}) as { token?: unknown; action?: unknown };
  if (!isPreferenceToken(token) || !isAction(action)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const config = preferencesConfig();
  const found = await findEmailByToken(token, config.db);
  if (!found.success) return failed(action, null, found.error);
  if (!found.email) {
    return NextResponse.json({ error: 'This link is no longer valid' }, { status: 404 });
  }

  const result =
    action === 'leave'
      ? await leaveWaitlist(found.email, config)
      : await setEmailPreference(found.email, action, config.oneSignal);
  if (!result.success) return failed(action, found.email, result.error);
  return NextResponse.json({ ok: true });
}

/** A failed change is someone who asked to stop and still can't, so a person is told to do it. */
function failed(action: Action, email: string | null, error: string) {
  console.error(`Email preferences (${action}) failed:`, error);
  after(() =>
    postToSlack(
      `⚠️ *Email preference change failed*\n• Action: ${action}\n• Email: ${email ?? 'unknown (token lookup failed)'}\n• Error: ${error}\nThe person saw an error; make the change for them by hand.`
    )
  );
  return NextResponse.json({ error: "That didn't save" }, { status: 502 });
}
