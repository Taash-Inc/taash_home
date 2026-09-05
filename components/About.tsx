import Image from 'next/image';

export default function About() {
  return (
    <section id='about' className='border-y border-ink-200 bg-ink-50 py-18'>
      <div className='mx-auto grid max-w-7xl items-center gap-10 px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14'>
        <div>
          <p className='mb-4 flex items-center gap-2.5 text-xs font-bold tracking-[0.12em] text-ink-700 uppercase'>
            <span aria-hidden='true' className='h-px w-6 bg-ink-300' />
            About us
          </p>
          <h2 className='text-[clamp(1.875rem,3.4vw,2.25rem)] font-bold tracking-tight text-ink-1000'>
            Why Taash Exists
          </h2>
          <p className='mt-4 max-w-[60ch] text-lg leading-relaxed text-ink-700'>
            Taash was built to remove confusion around tax and money management in Nigeria. Many
            freelancers, workers, and small business owners struggle to track income, record
            expenses, and know what they owe. We simplify this by turning everyday transactions
            into clear, usable records you can trust without accounting knowledge. No guesswork. No
            spreadsheets. Just clarity.
          </p>
        </div>
        <div className='relative aspect-[16/10] overflow-hidden rounded-xl bg-ink-100'>
          <Image
            src='/about-hero.png'
            alt='A Taash user reviewing their finances'
            fill
            sizes='(min-width: 1024px) 44vw, 100vw'
            className='object-cover object-[50%_18%]'
          />
        </div>
      </div>
    </section>
  );
}
