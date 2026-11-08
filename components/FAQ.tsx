import { FAQ as HOME_FAQ, type FaqItem } from '@/lib/faq';

/**
 * Questions people search for, answered on the page. The FAQPage structured data in
 * StructuredData.tsx is generated from the same list, as Google requires. Native
 * <details> so every answer is in the HTML for search engines and works without JavaScript.
 */
export default function FAQ({
  items = HOME_FAQ,
  title = 'Questions about tax in Nigeria, answered',
  intro = 'Plain answers on the 2026 rules and how Taash helps.',
}: {
  items?: readonly FaqItem[];
  title?: string;
  intro?: string;
}) {
  return (
    <section id='faq' className='scroll-mt-20 bg-white py-20 lg:py-24'>
      <div className='mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16'>
        <div>
          <p className='text-xs font-bold tracking-[0.14em] text-ink-700 uppercase'>FAQ</p>
          <h2 className='mt-3 text-3xl font-bold tracking-tight text-balance text-ink-1000 md:text-[2.5rem] md:leading-[1.1]'>
            {title}
          </h2>
          <p className='mt-4 text-lg text-ink-700'>
            {intro}
          </p>
        </div>
        <div className='divide-y divide-ink-200 border-y border-ink-200'>
          {items.map(({ q, a }) => (
            <details key={q} className='group py-1'>
              <summary className='flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-3 text-left font-semibold text-ink-1000 [&::-webkit-details-marker]:hidden'>
                <h3 className='text-base'>{q}</h3>
                <span
                  aria-hidden='true'
                  className='grid size-8 shrink-0 place-items-center rounded-full bg-ink-100 text-ink-900 transition-transform duration-200 group-open:rotate-45'>
                  <svg width='14' height='14' viewBox='0 0 14 14' fill='none'>
                    <path d='M7 2v10M2 7h10' stroke='currentColor' strokeWidth='1.75' strokeLinecap='round' />
                  </svg>
                </span>
              </summary>
              <p className='pb-5 leading-relaxed text-ink-700'>{a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
