import Image from 'next/image';

const STEPS = [
  {
    src: '/connect-bank.svg',
    title: 'Connect account',
    description: 'Link your bank or manually add transactions',
  },
  {
    src: '/categorise-expenses.svg',
    title: 'Categorise expenses',
    description: 'AI automatically sorts and tags your spending',
  },
  {
    src: '/get-tax-estimate.svg',
    title: 'Get tax estimate',
    description: 'See your tax obligations in real-time',
  },
  {
    src: '/save-monthly.svg',
    title: 'Save monthly',
    description: 'Set aside funds based on smart recommendations',
  },
];

export default function HowItWorks() {
  return (
    <section id='how-it-works' className='py-24'>
      <div className='mx-auto max-w-7xl px-6'>
        <p className='mb-4 flex items-center gap-2.5 text-xs font-bold tracking-[0.12em] text-ink-700 uppercase'>
          <span aria-hidden='true' className='h-px w-6 bg-ink-300' />
          How it works
        </p>
        <h2 className='text-[clamp(1.75rem,3.2vw,2rem)] font-bold tracking-tight text-ink-1000'>
          How Taash Works
        </h2>
        <p className='mt-3 max-w-[56ch] text-lg text-ink-700'>
          Taash simplifies everything with AI—so you can stay compliant, stress-free, and in
          control of your money.
        </p>

        <ol className='mt-9 grid border-t border-ink-200 md:grid-cols-2 lg:grid-cols-4'>
          {STEPS.map((step, i) => (
            <li
              key={step.title}
              className='border-b border-ink-200 py-6 pr-6 lg:border-r lg:border-b-0 lg:px-6 lg:first:pl-0 lg:last:border-r-0'>
              <span className='font-mono text-xs font-bold tracking-[0.1em] text-brand-700'>
                {String(i + 1).padStart(2, '0')}
              </span>
              <Image
                src={step.src}
                alt=''
                width={52}
                height={52}
                className='my-3.5 h-13 w-13 object-contain'
                style={{ width: 52, height: 52 }}
              />
              <h3 className='text-[1.0625rem] font-semibold text-ink-1000'>{step.title}</h3>
              <p className='mt-1.5 text-[0.9375rem] leading-relaxed text-ink-700'>
                {step.description}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
