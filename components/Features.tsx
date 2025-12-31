import Image from 'next/image';
import Link from 'next/link';

export default function Features() {
  const features = [
    {
      icon: (
        <Image
          src='/categorise-expenses.svg'
          alt='Smart Expense Categorisation'
          width={56}
          height={64}
          className='w-14 h-14 object-contain'
        />
      ),
      title: 'Track Income',
      description:
        'See all your earnings in one place, from salary, freelance work, or business payments.',
    },
    {
      icon: (
        <Image
          src='/get-tax-estimate.svg'
          alt='Tax Estimator'
          width={56}
          height={64}
          className='w-14 h-14 object-contain'
        />
      ),
      title: 'Record Expenses',
      description:
        'Keep clear records of your spending so nothing gets missed when tax time comes.',
    },
    {
      icon: (
        <Image
          src='/save-monthly.svg'
          alt='Savings Tips'
          width={56}
          height={64}
          className='w-14 h-14 object-contain'
        />
      ),
      title: 'Know Your Tax',
      description: 'Get a clear estimate of what you may owe based on your income and expenses.',
    },
    {
      icon: (
        <Image
          src='/receipt-upload.svg'
          alt='Receipt Upload'
          width={56}
          height={64}
          className='w-14 h-14 object-contain'
        />
      ),
      title: 'Stay Organised',
      description:
        'Generate invoices, save receipts and records so your finances are always clean and ready.',
    },
  ];

  return (
    <section id='features' className='py-20 bg-[#f8fafc]'>
      <div className='max-w-6xl mx-auto px-6'>
        {/* Inner container with light blue background */}
        <div className='bg-[#e8f4fc] rounded-3xl px-8 py-12 md:px-12 md:py-16'>
          {/* Badge */}
          <div className='flex justify-center mb-6'>
            <div className='inline-flex items-center gap-2 bg-white text-primary-dark px-4 py-2 rounded-full text-sm font-bold border border-border-light'>
              <svg
                width='18'
                height='18'
                viewBox='0 0 18 18'
                fill='none'
                xmlns='http://www.w3.org/2000/svg'>
                <path
                  d='M7.5 2.25H2.25V7.5H7.5V2.25Z'
                  fill='#0A1832'
                  stroke='#0A1832'
                  strokeWidth='1.5'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                />
                <path
                  d='M15.75 2.25H10.5V7.5H15.75V2.25Z'
                  stroke='#0A1832'
                  strokeWidth='1.5'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                />
                <path
                  d='M15.75 10.5H10.5V15.75H15.75V10.5Z'
                  fill='#0A1832'
                  stroke='#0A1832'
                  strokeWidth='1.5'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                />
                <path
                  d='M7.5 10.5H2.25V15.75H7.5V10.5Z'
                  stroke='#0A1832'
                  strokeWidth='1.5'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                />
              </svg>
              FEATURES
            </div>
          </div>

          {/* Header */}
          <div className='text-center mb-12'>
            <h2 className='text-3xl md:text-4xl font-bold text-primary-dark mb-4'>
              Do Less, Manage Better
            </h2>
            <p className='text-text-gray text-lg max-w-2xl mx-auto'>
              Powerful tools designed for creators, freelancers, and small businesses across Africa.
            </p>
          </div>

          {/* Features Grid */}
          <div className='grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12'>
            {features.map((feature, index) => (
              <div
                key={index}
                className='bg-white rounded-2xl p-6 hover:shadow-lg transition-shadow'>
                <div className='mb-4'>{feature.icon}</div>
                <h3 className='text-lg font-semibold text-primary-dark mb-2'>{feature.title}</h3>
                <p className='text-text-gray text-sm'>{feature.description}</p>
              </div>
            ))}
          </div>

          {/* CTA Button */}
          <div className='flex justify-center'>
            <Link
              href='#waitlist'
              className='bg-primary-dark text-white px-8 py-3 rounded-lg font-medium hover:bg-text-dark transition-colors'>
              Get Early Access
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
