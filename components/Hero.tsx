import Link from 'next/link';
import HeroPhone from './hero/HeroPhone';
import WaitlistCapture from './WaitlistCapture';

export default function Hero() {
  return (
    <section className='flex items-center overflow-hidden bg-[#f8fafc] pt-24 pb-8 sm:pt-28 sm:pb-16 lg:min-h-[90vh]'>
      <div className='max-w-7xl mx-auto px-6 w-full'>
        <div className='grid items-center gap-8 lg:grid-cols-2 lg:gap-12'>
          {/* Left Content */}
          <div className='space-y-5 sm:space-y-6'>
            {/* Badge — the new tax law is the reason to care now. */}
            <div
              className='hero-rise inline-flex items-center gap-2 rounded-full bg-[#C5E2FF] px-3.5 py-1.5 text-sm font-medium text-primary-dark'
              style={{ '--rise-delay': '0ms' } as React.CSSProperties}>
              <span className='live-dot' aria-hidden='true' />
              Built for Nigeria&apos;s 2026 tax rules
            </div>

            {/* Headline. The forced <br>s are gone: they ran the accessible name together, and
                max-w + balance give the same breaks. */}
            <h1 className='max-w-[13ch] text-[2.375rem] leading-[1.08] font-bold tracking-tight text-balance text-primary-dark sm:text-5xl lg:text-[3.25rem] lg:leading-[1.12]'>
              Effortless Tax and Finance for Nigeria&apos;s New Workforce
            </h1>

            {/* Subheadline */}
            <p
              className='hero-rise max-w-md text-[1.0625rem] leading-relaxed text-text-gray sm:text-lg'
              style={{ '--rise-delay': '80ms' } as React.CSSProperties}>
              Taash turns your daily income and spending into tax-ready records, and shows what
              you owe as you go.
            </p>

            {/* Signup, above the fold on phones. Ad visitors used to have to find a form
                11 screens down. */}
            <div
              className='hero-rise max-w-md pt-1'
              style={{ '--rise-delay': '160ms' } as React.CSSProperties}>
              <div className='rounded-[1.75rem] bg-white/60 p-1.5 ring-1 ring-ink-1000/[0.06]'>
                <div className='rounded-[calc(1.75rem-0.375rem)] bg-white p-4 shadow-[0_18px_50px_-24px_rgb(15_23_42/0.35)] sm:p-5'>
                  <WaitlistCapture placement='hero' />
                </div>
              </div>
              <Link
                href='#tax-estimator'
                className='group mt-4 inline-flex min-h-11 items-center gap-1.5 font-semibold text-brand-700'>
                Or try the free 2026 tax calculator
                <span
                  aria-hidden='true'
                  className='transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-1'>
                  →
                </span>
              </Link>
            </div>
          </div>

          {/* Right: the app on a phone. */}
          <HeroPhone />
        </div>
      </div>
    </section>
  );
}
