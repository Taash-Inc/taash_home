/**
 * Three reasons to trust a finance app, straight under the hero.
 *
 * Every claim is the product's own: the first two are the app's copy on its "Before you connect
 * your bank" and "Connect your bank" screens, and the third is the source cited in
 * lib/tax/brackets.ts. Keep them in step with the app; don't add a claim the app doesn't make.
 */
const ITEMS = [
  {
    title: 'Taash can never move your money',
    body: 'Bank access through Mono is read-only. It only reads transactions to keep your tax estimate up to date.',
    icon: (
      <path
        d='M7 10.5V8a5 5 0 0 1 10 0v2.5M6.5 10.5h11a1.5 1.5 0 0 1 1.5 1.5v7a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 19v-7a1.5 1.5 0 0 1 1.5-1.5zM12 14.5v2'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    ),
  },
  {
    title: 'Your data is encrypted',
    body: 'Encryption keeps your financial data secure, and you can unlink your bank at any time.',
    icon: (
      <path
        d='M12 3.5l7 2.8v5.2c0 4.3-3 7.8-7 9-4-1.2-7-4.7-7-9V6.3zM9 12l2 2 4-4.5'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    ),
  },
  {
    title: 'Built on the Nigeria Tax Act 2025',
    body: 'Estimates use the bands in the official gazette, in force from 1 January 2026.',
    icon: (
      <path
        d='M7 3.5h7.5L19 8v12.5H7zM14.5 3.5V8H19M10 12h6M10 15.5h6'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    ),
  },
];

export default function TrustStrip() {
  return (
    <section aria-label='Why you can trust Taash' className='border-y border-ink-200 bg-white'>
      <ul className='mx-auto grid max-w-7xl divide-y divide-ink-200 px-6 md:grid-cols-3 md:divide-x md:divide-y-0'>
        {ITEMS.map((item) => (
          <li key={item.title} className='flex gap-3.5 py-5 md:px-6 md:py-7 md:first:pl-0 md:last:pr-0'>
            <span className='grid size-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700'>
              <svg
                width='22'
                height='22'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='1.6'
                aria-hidden='true'>
                {item.icon}
              </svg>
            </span>
            <div>
              <p className='font-semibold text-ink-1000'>{item.title}</p>
              <p className='mt-1 text-sm leading-relaxed text-ink-700'>{item.body}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
