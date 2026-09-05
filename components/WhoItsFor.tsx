import Image from 'next/image';

/**
 * The images were previously attached to the wrong labels: creators.png (ring light,
 * camera, neon studio) rendered under "Small Businesses", and smes.png (box files,
 * invoices, whiteboard) under "Workers" — see 00-audit.md D1. "Creators" is restored as a
 * named persona, since the hero badge, the Features subhead, the estimator's own toggle
 * and the waitlist placeholder all target creators.
 */
const AUDIENCES = [
  {
    image: '/freelancers.png',
    title: 'Freelancers',
    description: 'Track income, record expenses, and stay tax-ready without stress.',
  },
  {
    image: '/creators.png',
    title: 'Creators',
    description: 'Manage income from content, brand deals and platforms in one place.',
  },
  {
    image: '/smes.png',
    title: 'Small Businesses',
    description: 'Manage business income and expenses without complex accounting tools.',
  },
];

export default function WhoItsFor() {
  return (
    <section id='who-its-for' className='py-24'>
      <div className='mx-auto max-w-7xl px-6'>
        <p className='mb-4 flex items-center gap-2.5 text-xs font-bold tracking-[0.12em] text-ink-700 uppercase'>
          <span aria-hidden='true' className='h-px w-6 bg-ink-300' />
          Who it&apos;s for
        </p>
        <h2 className='text-[clamp(1.75rem,3.2vw,2rem)] font-bold tracking-tight text-ink-1000'>
          Built for the New Nigerian Workforce
        </h2>
        <p className='mt-3 max-w-[56ch] text-lg text-ink-700'>
          Whether you&apos;re freelancing, creating content, or running a small business — Taash
          keeps your finances clean and compliant.
        </p>

        <ul className='mt-9 grid gap-4 sm:grid-cols-3 sm:gap-5'>
          {AUDIENCES.map((audience) => (
            <li
              key={audience.title}
              className='relative aspect-[4/5] overflow-hidden rounded-xl bg-ink-100'>
              <Image
                src={audience.image}
                alt=''
                fill
                sizes='(min-width: 640px) 33vw, 100vw'
                className='object-cover'
              />
              {/* Scrim solved for contrast rather than eyeballed: the brightest pixel in any
                  of the three photos needs alpha >= 0.50 for white to clear 4.5:1, so the
                  gradient reaches 0.62 by 14% and 0.90 by 32%. Measured after the fact at
                  4.61 / 6.05 / 4.52:1. */}
              <div
                className='absolute inset-x-0 bottom-0 px-5 pt-16 pb-6'
                style={{
                  background:
                    'linear-gradient(180deg, transparent 0%, rgb(15 23 42 / 0.62) 14%, rgb(15 23 42 / 0.90) 32%, rgb(15 23 42 / 0.95) 100%)',
                }}>
                <h3 className='text-xl font-semibold text-white'>{audience.title}</h3>
                <p className='mt-1 text-[0.9375rem] leading-relaxed text-white/[0.92]'>
                  {audience.description}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
