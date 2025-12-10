import Image from 'next/image';

export default function About() {
  return (
    <section id='about' className='py-20 bg-white'>
      <div className='max-w-7xl mx-auto px-6'>
        {/* Badge */}
        <div className='flex justify-center mb-8'>
          <div className='inline-flex items-center gap-2 bg-[#C5E2FF] border border-border text-primary-dark px-4 py-2 rounded-full text-sm font-bold'>
            <svg
              width='18'
              height='18'
              viewBox='0 0 18 18'
              fill='none'
              xmlns='http://www.w3.org/2000/svg'>
              <path
                d='M10.5 1.5H4.5C4.10218 1.5 3.72064 1.65804 3.43934 1.93934C3.15804 2.22064 3 2.60218 3 3V15C3 15.3978 3.15804 15.7794 3.43934 16.0607C3.72064 16.342 4.10218 16.5 4.5 16.5H13.5C13.8978 16.5 14.2794 16.342 14.5607 16.0607C14.842 15.7794 15 15.3978 15 15V6L10.5 1.5Z'
                fill='#0A1832'
                stroke='#0A1833'
                strokeWidth='1.5'
                strokeLinecap='round'
                strokeLinejoin='round'
              />
              <path
                d='M10.5 1.5V6H15'
                stroke='#C5E2FF'
                strokeWidth='1.5'
                strokeLinecap='round'
                strokeLinejoin='round'
              />
              <path
                d='M12 9.75H6'
                stroke='#C5E2FF'
                strokeWidth='1.5'
                strokeLinecap='round'
                strokeLinejoin='round'
              />
              <path
                d='M12 12.75H6'
                stroke='#C5E2FF'
                strokeWidth='1.5'
                strokeLinecap='round'
                strokeLinejoin='round'
              />
              <path
                d='M7.5 6.75H6.75H6'
                stroke='#C5E2FF'
                strokeWidth='1.5'
                strokeLinecap='round'
                strokeLinejoin='round'
              />
            </svg>
            ABOUT US
          </div>
        </div>

        {/* Main Card */}
        <div className='bg-yellow-accent rounded-3xl overflow-hidden'>
          <div className='grid lg:grid-cols-2'>
            {/* Left Content */}
            <div className='p-8 md:p-12 lg:p-16 flex flex-col justify-center'>
              <h2 className='text-3xl md:text-4xl font-bold text-primary-dark mb-6'>
                Why Taash Exists
              </h2>
              <p className='text-text-dark text-lg leading-relaxed'>
                Freelancers, creators, and small business owners across Africa struggle with one
                thing—<strong>financial clarity</strong>. They face tax confusion, unpredictable
                cash flow, and no simple way to track earnings, savings, or deadlines. Taash was
                built to fix that. We exist to simplify taxes, automate compliance, and give you a
                clear view of your finances—so you{' '}
                <strong>never miss a deadline, lose money, or stay confused again.</strong>
              </p>
            </div>

            {/* Right Image */}
            <div className='relative h-64 lg:h-auto'>
              <div className='absolute inset-0 bg-gradient-to-br from-light-blue to-blue-300'>
                {/* Placeholder for actual image */}
                <div className='w-full h-full flex items-center justify-center'>
                  <div className='relative w-full h-full flex items-end justify-center overflow-hidden'>
                    {/* Person illustration */}
                    <Image
                      src='/about-hero.png'
                      alt='Taash about'
                      fill
                      className='object-cover object-top scale-90'
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
