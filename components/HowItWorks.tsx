import AppPreview from './how-it-works/AppPreview';

export default function HowItWorks() {
  return (
    <section id='how-it-works' className='py-24'>
      <div className='mx-auto max-w-7xl px-6'>
        <p className='mb-4 flex items-center gap-2.5 text-xs font-bold tracking-[0.12em] text-ink-700 uppercase'>
          <span aria-hidden='true' className='h-px w-6 bg-ink-300' />
          How it works
        </p>
        <h2 className='text-[clamp(1.75rem,3.2vw,2rem)] font-bold tracking-tight text-balance text-ink-1000'>
          From receipt to <span className='whitespace-nowrap'>tax-ready</span> in five steps
        </h2>
        <p className='mt-3 max-w-[56ch] text-lg text-ink-700'>
          A 30-second look inside the Taash app, launching soon on iOS and Android.
        </p>
        <AppPreview />
      </div>
    </section>
  );
}
