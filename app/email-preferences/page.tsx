import EmailPreferences from '@/components/EmailPreferences';
import {
  findEmailByToken,
  isPreferenceToken,
  maskEmail,
  preferencesConfig,
} from '@/lib/email-preferences';
import { getEmailPreference, type EmailPreference } from '@/lib/onesignal';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Email preferences',
  // Every visit carries someone's token in ?t=: keep it out of search results, and out of the
  // Referer header sent to any site linked from here.
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
};

type Loaded =
  | { kind: 'found'; token: string; maskedEmail: string; preference: EmailPreference }
  | { kind: 'invalid' }
  | { kind: 'unavailable' };

/** Reads only. Every change is a button press that POSTs to /api/email-preferences. */
async function load(token: string | string[] | undefined): Promise<Loaded> {
  if (!isPreferenceToken(token)) return { kind: 'invalid' };
  const config = preferencesConfig();
  const found = await findEmailByToken(token, config.db);
  if (!found.success) {
    console.error('Email preferences: token lookup failed:', found.error);
    return { kind: 'unavailable' };
  }
  if (!found.email) return { kind: 'invalid' };

  const current = await getEmailPreference(found.email, config.oneSignal);
  if (!current.success) console.error('Email preferences: could not read OneSignal:', current.error);
  // If OneSignal can't be read, the page still opens on its first question: its main button
  // unsubscribes, which is what most people came to do, and repeating it is harmless.
  return {
    kind: 'found',
    token,
    maskedEmail: maskEmail(found.email),
    preference: current.success ? current.preference : 'all',
  };
}

export default async function EmailPreferencesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const state = await load((await searchParams).t);

  return (
    <main className='min-h-screen bg-brand-50'>
      <header className='bg-ink-1000'>
        <div className='mx-auto flex max-w-md px-5 py-4'>
          <Link href='/' className='rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white'>
            <Image src='/logo-white.svg' alt='Taash home' width={104} height={30} priority />
          </Link>
        </div>
      </header>

      <div className='mx-auto max-w-md px-5 py-10'>
        {state.kind === 'found' ? (
          <EmailPreferences
            token={state.token}
            maskedEmail={state.maskedEmail}
            initial={state.preference}
          />
        ) : (
          <Notice
            title={
              state.kind === 'invalid'
                ? "This link doesn't work anymore"
                : "We can't load your email preferences right now"
            }
            body={
              state.kind === 'invalid'
                ? 'It may be from an old email, or this address already left the waitlist.'
                : 'Try again in a few minutes.'
            }
          />
        )}
      </div>
    </main>
  );
}

function Notice({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <h1 className='text-2xl leading-tight font-bold text-ink-1000'>{title}</h1>
      <p className='mt-3 leading-relaxed text-ink-700'>
        {body} To stop emails from Taash, write to{' '}
        <a
          href='mailto:privacy@taash.tax'
          className='font-medium text-brand-700 underline underline-offset-2'>
          privacy@taash.tax
        </a>
        .
      </p>
    </div>
  );
}
