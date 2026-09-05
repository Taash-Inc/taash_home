import Image from 'next/image';

/**
 * No longer a client component. Its only reason to be one was a setInterval spinning the
 * badge icon forever — decorative, unbounded, running off-screen, and with no regard for
 * prefers-reduced-motion (00-audit.md §3 tell 8). Removing it also demotes this from an
 * 80px chapter to a 48px band, which is what a "coming soon" note is worth.
 */
export default function AppDownload() {
  return (
    <section id='download' className='border-b border-ink-200 py-12'>
      <div className='mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-8 px-6'>
        <div>
          <p className='inline-flex items-center gap-2 rounded-md bg-signal-500 px-3 py-1.5 text-xs font-bold tracking-[0.08em] text-ink-1000 uppercase'>
            Coming soon
          </p>
          <h2 className='mt-3 text-2xl font-bold tracking-tight text-ink-1000'>
            The Taash App is launching soon.
          </h2>
          <p className='mt-1.5 max-w-[46ch] text-[0.9375rem] text-ink-700'>
            Your automated tax and finance assistant is coming soon to iOS and Android to help you
            stay compliant with zero stress. Join the waitlist to get early access, updates, and
            priority features as we roll out in Nigeria.
          </p>
          {/* The store links pointed at '#'. Until the apps are listed, an honest disabled
              state beats a link that goes nowhere. */}
          <div className='mt-4 flex items-center gap-3'>
            <Image
              src='/app-store-badge.png'
              alt='Coming soon to the App Store'
              width={119}
              height={40}
              className='opacity-60 grayscale'
            />
            <Image
              src='/google-play-badge.png'
              alt='Coming soon to Google Play'
              width={147}
              height={57}
              className='opacity-60 grayscale'
            />
          </div>
        </div>
        <Image
          src='/phone-hand.png'
          alt='The Taash app on a phone'
          width={540}
          height={452}
          sizes='(min-width: 1024px) 280px, 40vw'
          className='hidden h-auto w-[min(280px,40vw)] -scale-x-100 sm:block'
        />
      </div>
    </section>
  );
}
