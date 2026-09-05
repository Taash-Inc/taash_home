import Image from 'next/image';
import Link from 'next/link';

// alt='' throughout: each icon sits directly above the heading it illustrates, so naming it
// again only adds noise for a screen reader. The previous alt text also contradicted the
// heading — "Smart Expense Categorisation" above "Track Income" (00-audit.md D6).
const FEATURES = [
  {
    src: '/categorise-expenses.svg',
    title: 'Track Income',
    description:
      'See all your earnings in one place, from salary, freelance work, or business payments.',
  },
  {
    src: '/get-tax-estimate.svg',
    title: 'Record Expenses',
    description:
      'Keep clear records of your spending so nothing gets missed when tax time comes.',
  },
  {
    src: '/save-monthly.svg',
    title: 'Know Your Tax',
    description: 'Get a clear estimate of what you may owe based on your income and expenses.',
  },
  {
    src: '/receipt-upload.svg',
    title: 'Stay Organised',
    description:
      'Generate invoices, save receipts and records so your finances are always clean and ready.',
  },
];

export default function Features() {
  return (
    <section id='features' className='border-y border-ink-200 bg-ink-50 py-24'>
      <div className='mx-auto max-w-7xl px-6'>
        <p className='mb-4 flex items-center gap-2.5 text-xs font-bold tracking-[0.12em] text-ink-700 uppercase'>
          <span aria-hidden='true' className='h-px w-6 bg-ink-300' />
          Features
        </p>
        <h2 className='text-[clamp(1.75rem,3.2vw,2rem)] font-bold tracking-tight text-ink-1000'>
          Do Less, Manage Better
        </h2>
        <p className='mt-3 max-w-[56ch] text-lg text-ink-700'>
          Powerful tools designed for creators, freelancers, and small businesses across Africa.
        </p>

        <div className='mt-9 grid md:grid-cols-2 lg:grid-cols-4'>
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className='border-t border-ink-300 py-6 pr-6 lg:px-5 lg:first:pl-0'>
              <Image
                src={feature.src}
                alt=''
                width={48}
                height={48}
                className='mb-4 object-contain'
                style={{ width: 48, height: 48 }}
              />
              <h3 className='text-[1.0625rem] font-semibold text-ink-1000'>{feature.title}</h3>
              <p className='mt-1.5 text-[0.9375rem] leading-relaxed text-ink-700'>
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        <div className='mt-9'>
          <Link
            href='#waitlist'
            className='inline-flex min-h-11 items-center rounded-lg bg-ink-1000 px-7 py-3 font-semibold text-white transition-colors hover:bg-ink-900'>
            Get Early Access
          </Link>
        </div>
      </div>
    </section>
  );
}
