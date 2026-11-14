import { logEvent } from '@/lib/log';
import { checkApproval } from '@/lib/signing';
import { approvePending, discardPending, getPending, isPendingId } from '@/lib/waitlist-pending';
import { postToSlack } from '@/lib/waitlist-sync';
import { NextRequest, NextResponse } from 'next/server';

/**
 * The approval link posted to Slack for an unverified signup (lib/waitlist-pending.ts).
 *
 * The link is signed and expires, so only someone who can see the Slack message can use it.
 * Opening it (GET) only shows the signup: Slack and email apps open links to preview them, and
 * that must never approve anything. Approving or discarding is a button press (POST), checked
 * against the same signature.
 */
type Link = { id: string; exp: number; sig: string };

function readLink(get: (name: string) => string | null): Link | null {
  const id = get('id');
  const exp = Number(get('exp'));
  const sig = get('sig');
  if (!isPendingId(id) || !Number.isSafeInteger(exp) || typeof sig !== 'string') return null;
  return { id, exp, sig };
}

function linkProblem(link: Link | null): string | null {
  if (!link) return 'This link is not valid.';
  const check = checkApproval(link.id, link.exp, link.sig);
  if (check === 'expired') return 'This link has expired. Approve the signup in Supabase (table waitlist_pending).';
  if (check !== 'ok') return 'This link is not valid.';
  return null;
}

export async function GET(request: NextRequest) {
  const link = readLink((name) => request.nextUrl.searchParams.get(name));
  const problem = linkProblem(link);
  if (problem || !link) return page('Link not valid', `<p>${escape(problem ?? '')}</p>`, 403);

  const row = await getPending(link.id);
  if (row === 'error') return page('Something went wrong', '<p>Could not load this signup. Try again in a minute.</p>', 500);
  if (!row) return page('Already handled', '<p>This signup was already approved or discarded.</p>');

  const hidden = `<input type="hidden" name="id" value="${escape(link.id)}"><input type="hidden" name="exp" value="${link.exp}"><input type="hidden" name="sig" value="${escape(link.sig)}">`;
  return page(
    'Approve this signup?',
    `<dl>
      <dt>Name</dt><dd>${escape(row.full_name)}</dd>
      <dt>Email</dt><dd>${escape(row.email)}</dd>
      <dt>Profession</dt><dd>${escape(row.profession ?? 'not given')}</dd>
    </dl>
    <p class="note">The Cloudflare human check didn't pass for this signup (${escape(row.reason)}). Approve it if it looks like a real person: they join the waitlist and get the welcome email. Discard it if it's spam.</p>
    <form method="post">${hidden}<button name="action" value="approve">Approve and send welcome email</button></form>
    <form method="post">${hidden}<button name="action" value="discard" class="secondary">Discard as spam</button></form>`
  );
}

export async function POST(request: NextRequest) {
  if (Number(request.headers.get('content-length') ?? 0) > 4096) {
    return page('Link not valid', '<p>Request too large.</p>', 413);
  }
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return page('Link not valid', '<p>This link is not valid.</p>', 400);
  }
  const value = (name: string) => {
    const v = form.get(name);
    return typeof v === 'string' ? v : null;
  };
  const link = readLink(value);
  const problem = linkProblem(link);
  if (problem || !link) return page('Link not valid', `<p>${escape(problem ?? '')}</p>`, 403);

  const action = value('action');
  if (action === 'discard') {
    const result = await discardPending(link.id);
    logEvent('info', 'waitlist.pending_discarded', { id: link.id, result });
    if (result === 'error') return page('Something went wrong', '<p>Could not discard it. Try again.</p>', 500);
    return page('Discarded', '<p>The signup was removed. Nothing was emailed.</p>');
  }
  if (action !== 'approve') return page('Link not valid', '<p>Unknown action.</p>', 400);

  const result = await approvePending(link.id);
  logEvent(result.status === 'error' ? 'error' : 'info', 'waitlist.pending_approved', {
    id: link.id,
    result: result.status,
  });
  if (result.status === 'missing') return page('Already handled', '<p>This signup was already approved or discarded.</p>');
  if (result.status === 'error') {
    return page('Something went wrong', `<p>Could not approve it: ${escape(result.error)}. Try again in a minute.</p>`, 500);
  }
  await postToSlack(
    result.status === 'approved'
      ? `✅ *Approved:* ${oneLine(result.row.full_name)} is now on the waitlist. The welcome email is on its way.`
      : `✅ *Approved:* ${oneLine(result.row.full_name)} was already on the waitlist, so nothing else was needed.`
  );
  return page(
    'Approved',
    result.status === 'approved'
      ? '<p>They are on the waitlist and the welcome email is on its way.</p>'
      : '<p>They were already on the waitlist. Nothing else was needed.</p>'
  );
}

const oneLine = (text: string) => text.replace(/\s+/g, ' ').trim();

function escape(text: string): string {
  return text.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] ?? c);
}

function page(title: string, body: string, status = 200): NextResponse {
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>${escape(title)} | Taash</title>
<style>
body{font:16px/1.5 system-ui,sans-serif;margin:0;background:#f8fafc;color:#0f172a}
main{max-width:30rem;margin:3rem auto;padding:0 1rem}
h1{font-size:1.5rem;margin:0 0 1rem}
dl{display:grid;grid-template-columns:auto 1fr;gap:.25rem 1rem;background:#fff;border:1px solid #e2e8f0;border-radius:.75rem;padding:1rem;margin:0 0 1rem}
dt{color:#475569}dd{margin:0;word-break:break-word}
.note{color:#334155;font-size:.95rem}
button{width:100%;min-height:3rem;margin-top:.75rem;border:0;border-radius:999px;background:#0f172a;color:#fff;font:600 1rem system-ui,sans-serif;cursor:pointer}
button.secondary{background:#fff;color:#0f172a;border:1px solid #cbd5e1}
</style></head><body><main><h1>${escape(title)}</h1>${body}</main></body></html>`;
  return new NextResponse(html, {
    status,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'private, no-store',
      'X-Robots-Tag': 'noindex, nofollow',
      'Referrer-Policy': 'no-referrer',
    },
  });
}
