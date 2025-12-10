import Image from 'next/image';

export default function HowItWorks() {
  const steps = [
    {
      icon: (
        <Image
          src='/connect-bank.svg'
          alt='Connect bank'
          width={56}
          height={64}
          className='w-14 h-14 object-contain'
        />
      ),
      title: 'Connect account',
      description: 'Link your bank or manually add transactions',
    },
    {
      icon: (
        <Image
          src='/categorise-expenses.svg'
          alt='Categorise expenses'
          width={56}
          height={64}
          className='w-14 h-14 object-contain'
        />
      ),
      title: 'Categorise expenses',
      description: 'AI automatically sorts and tags your spending',
    },
    {
      icon: (
        <Image
          src='/get-tax-estimate.svg'
          alt='Get tax estimate'
          width={56}
          height={64}
          className='w-14 h-14 object-contain'
        />
      ),
      title: 'Get tax estimate',
      description: 'See your tax obligations in real-time',
    },
    {
      icon: (
        <Image
          src='/save-monthly.svg'
          alt='Save monthly'
          width={56}
          height={64}
          className='w-14 h-14 object-contain'
        />
      ),
      title: 'Save monthly',
      description: 'Set aside funds based on smart recommendations',
    },
  ];

  return (
    <section className='py-20 bg-white'>
      <div className='max-w-7xl mx-auto px-6'>
        {/* Header */}
        <div className='text-center mb-16'>
          <h2 className='text-3xl md:text-4xl font-bold text-primary-dark mb-4'>How Taash Works</h2>
          <p className='text-text-gray text-lg max-w-2xl mx-auto'>
            Taash simplifies everything with AI—so you can stay compliant, stress-free, and in
            control of your money.
          </p>
        </div>

        {/* Steps Grid */}
        <div className='grid md:grid-cols-2 lg:grid-cols-4 gap-4'>
          {steps.map((step, index) => (
            <div
              key={index}
              className='bg-white border border-border-light rounded-2xl p-5 hover:shadow-lg transition-shadow flex flex-col'>
              <div className='mb-3 h-14 flex items-start'>{step.icon}</div>
              <h3 className='text-base font-semibold text-primary-dark mb-1'>{step.title}</h3>
              <p className='text-text-gray text-sm leading-relaxed'>{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
