import Link from 'next/link';

export default function Resources() {
  const articles = [
    {
      title: 'Top 5 Deductible Expenses for Freelancers',
      description:
        'Learn which expenses you can legally claim to reduce your tax bill in Nigeria, Ghana, Kenya, and South Africa.',
      readTime: '5 min read',
      gradient: 'from-orange-100 to-amber-50',
    },
    {
      title: '2025 Tax Reforms Explained',
      description:
        "What's changed in African tax laws this year and how it affects freelancers and creators.",
      readTime: '5 min read',
      gradient: 'from-gray-100 to-slate-50',
    },
    {
      title: 'How to register your TIN.',
      description:
        'Step-by-step guide to getting your Tax Identification Number across different African countries.',
      readTime: '5 min read',
      gradient: 'from-blue-100 to-cyan-50',
    },
  ];

  return (
    <section id='resources' className='py-20 bg-white'>
      <div className='max-w-7xl mx-auto px-6'>
        {/* Badge */}
        <div className='flex justify-center mb-6'>
          <div className='inline-flex items-center gap-2 bg-[#C5E2FF] text-primary-dark px-4 py-2 rounded-full text-sm font-bold'>
            <svg
              width='18'
              height='18'
              viewBox='0 0 18 18'
              fill='none'
              xmlns='http://www.w3.org/2000/svg'>
              <path
                d='M10.5 1.5H4.5C4.10218 1.5 3.72064 1.65804 3.43934 1.93934C3.15804 2.22064 3 2.60218 3 3V15C3 15.3978 3.15804 15.7794 3.43934 16.0607C3.72064 16.342 4.10218 16.5 4.5 16.5H13.5C13.8978 16.5 14.2794 16.342 14.5607 16.0607C14.842 15.7794 15 15.3978 15 15V6L10.5 1.5Z'
                fill='#0A1832'
                stroke='#0A1832'
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
            RESOURCES
          </div>
        </div>

        {/* Header */}
        <div className='text-center mb-12'>
          <h2 className='text-3xl md:text-4xl font-bold text-primary-dark mb-4'>
            Learn About Taxes the Easy Way
          </h2>
          <p className='text-text-gray text-lg max-w-2xl mx-auto'>
            Tax compliance doesn&apos;t have to be confusing. Our guides break down complex topics
            into simple, actionable advice.
          </p>
        </div>

        {/* Articles Grid */}
        <div className='grid md:grid-cols-3 gap-6 mb-12'>
          {articles.map((article, index) => (
            <article
              key={index}
              className='bg-white border border-border-light rounded-2xl overflow-hidden hover:shadow-lg transition-shadow cursor-pointer'>
              {/* Image placeholder */}
              <div
                className={`h-48 bg-gradient-to-br ${article.gradient} flex items-center justify-center`}>
                <svg
                  viewBox='0 0 100 80'
                  fill='none'
                  xmlns='http://www.w3.org/2000/svg'
                  className='w-24 h-20'>
                  {/* Laptop illustration */}
                  <rect x='10' y='5' width='80' height='50' rx='4' className='fill-border-light' />
                  <rect x='15' y='10' width='70' height='40' className='fill-primary-dark' />
                  <rect x='20' y='15' width='30' height='4' className='fill-primary-blue' />
                  <rect x='20' y='22' width='50' height='2' className='fill-text-gray' />
                  <rect x='20' y='27' width='45' height='2' className='fill-text-gray' />
                  <rect x='20' y='32' width='40' height='2' className='fill-text-gray' />
                  <path d='M5 55 L95 55 L90 70 L10 70 Z' className='fill-border' />
                  <rect x='35' y='58' width='30' height='3' rx='1' fill='#cbd5e1' />
                </svg>
              </div>
              <div className='p-6'>
                <h3 className='text-lg font-semibold text-primary-dark mb-2'>{article.title}</h3>
                <p className='text-text-gray text-sm mb-4'>{article.description}</p>
                <span className='text-xs text-text-light-gray'>{article.readTime}</span>
              </div>
            </article>
          ))}
        </div>

        {/* CTA Button */}
        <div className='flex justify-center'>
          <Link
            href='#'
            className='inline-flex items-center gap-2 bg-white text-primary-dark px-6 py-3 rounded-lg font-medium border border-border hover:bg-border-light transition-colors'>
            Visit Blog
            <svg
              width='16'
              height='16'
              viewBox='0 0 16 16'
              fill='none'
              xmlns='http://www.w3.org/2000/svg'>
              <path
                d='M3 8H13M13 8L9 4M13 8L9 12'
                stroke='currentColor'
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'
              />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
