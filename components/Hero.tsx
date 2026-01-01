import Image from 'next/image';
import Link from 'next/link';
import AnimatedTaxCard from './AnimatedTaxCard';

export default function Hero() {
  return (
    <section className='pt-28 pb-16 bg-[#f8fafc] overflow-hidden min-h-[90vh] flex items-center'>
      <div className='max-w-7xl mx-auto px-6 w-full'>
        <div className='grid lg:grid-cols-2 gap-12 items-center'>
          {/* Left Content */}
          <div className='space-y-6'>
            {/* Badge */}
            <div className='inline-flex items-center gap-2 bg-[#C5E2FF] text-primary-dark px-4 py-2 rounded-full text-sm font-medium'>
              <svg
                width='16'
                height='16'
                viewBox='0 0 16 16'
                fill='none'
                xmlns='http://www.w3.org/2000/svg'>
                <path
                  d='M8.49995 4.5C8.49995 5.16304 8.23656 5.79893 7.76772 6.26777C7.29888 6.73661 6.66299 7 5.99995 7C5.33691 7 4.70102 6.73661 4.23218 6.26777C3.76334 5.79893 3.49995 5.16304 3.49995 4.5C3.49995 3.83696 3.76334 3.20107 4.23218 2.73223C4.70102 2.26339 5.33691 2 5.99995 2C6.66299 2 7.29888 2.26339 7.76772 2.73223C8.23656 3.20107 8.49995 3.83696 8.49995 4.5ZM10.9 12.006C11.0099 12.548 10.552 13 9.99995 13H1.99995C1.44695 13 0.98995 12.548 1.09795 12.006C1.328 10.8758 1.94159 9.85974 2.83482 9.13C3.72805 8.40027 4.84603 8.00165 5.99945 8.00165C7.15287 8.00165 8.27085 8.40027 9.16408 9.13C10.0573 9.85974 10.6709 10.8758 10.901 12.006M14.002 12H12.412C12.4033 11.9027 12.39 11.806 12.372 11.71C12.1805 10.7666 11.7819 9.87755 11.205 9.107C11.94 8.9042 12.7246 8.98889 13.3995 9.34386C14.0743 9.69882 14.5886 10.2974 14.838 11.018C15.018 11.54 14.555 12 14.002 12ZM12 8C12.5304 8 13.0391 7.78929 13.4142 7.41421C13.7892 7.03914 14 6.53043 14 6C14 5.46957 13.7892 4.96086 13.4142 4.58579C13.0391 4.21071 12.5304 4 12 4C11.4695 4 10.9608 4.21071 10.5857 4.58579C10.2107 4.96086 9.99995 5.46957 9.99995 6C9.99995 6.53043 10.2107 7.03914 10.5857 7.41421C10.9608 7.78929 11.4695 8 12 8Z'
                  fill='black'
                />
              </svg>
              Made for Nigerian Freelancers
            </div>

            {/* Headline */}
            <h1 className='text-4xl md:text-5xl lg:text-[3.25rem] font-bold text-primary-dark leading-[1.15] tracking-tight'>
              Effortless Tax and
              <br />
              Finance for
              <br />
              Nigeria's New
              <br />
              Workforce
            </h1>

            {/* Subheadline */}
            <p className='text-lg text-text-gray max-w-md leading-relaxed'>
              Taash turns daily income and spending into clear records that are always
              tax-ready.Built for freelancers, workers, creators, and small businesses in Nigeria.
            </p>

            {/* CTA Buttons */}
            <div className='flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2 w-full sm:w-auto'>
              <Link
                href='#waitlist'
                className='bg-primary-dark text-white px-6 sm:px-7 py-3.5 rounded-lg font-medium hover:bg-text-dark transition-colors text-center w-full sm:w-auto'>
                Join Waitlist
              </Link>
              <Link
                href='#tax-estimator'
                className='bg-white text-primary-dark px-6 sm:px-7 py-3.5 rounded-lg font-medium border border-gray-200 hover:bg-gray-50 transition-colors text-center w-full sm:w-auto'>
                Try Tax Estimator
              </Link>
            </div>
          </div>

          {/* Right Content - Hero Image */}
          <div className='relative lg:h-[620px]'>
            {/* Main Hero Image Container */}
            <div className='relative h-full flex items-center justify-center'>
              {/* Large Gradient Ellipse Background with clipped image - wider ellipse shape */}
              <div className='relative w-[340px] h-[298px] sm:w-[450px] sm:h-[320px] md:w-[650px] md:h-[450px] lg:w-[750px] lg:h-[520px] rounded-[50%] overflow-hidden mx-auto'>
                {/* Gradient background - matching Figma */}
                <div className='absolute inset-0 bg-gradient-to-b from-[#A3D3FF] to-[#FFEA66]'></div>

                {/* Hero Image - centered and covering full ellipse */}
                <div className='absolute inset-0'>
                  <Image
                    src='/hero-image.png'
                    alt='African freelancer working on laptop'
                    fill
                    className='object-cover scale-150'
                    style={{ objectPosition: '66% 60%' }}
                    priority
                  />
                </div>
              </div>

              {/* Floating Card - Monthly Tax Estimate */}
              <AnimatedTaxCard />

              {/* Floating Card - Expenses This Month */}
              <div className='absolute bottom-16 right-0 md:right-4 bg-white rounded-2xl shadow-xl p-3 sm:p-4 z-20 flex items-center gap-2 sm:gap-3 hidden sm:flex'>
                <div>
                  <p className='text-xs text-text-gray mb-1'>Expenses This Month</p>
                  <p className='text-xl sm:text-2xl font-bold text-primary-dark'>₦128,400</p>
                </div>
                <div className='w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden bg-gradient-to-br from-green-400 to-teal-500 flex-shrink-0'>
                  <Image
                    src='/avatar-small.png'
                    alt='User avatar'
                    width={40}
                    height={40}
                    className='object-cover'
                    unoptimized
                  />
                </div>
              </div>

              {/* Yellow Calculator/Percentage Icon - Top Right */}
              <div className='absolute top-8 right-8 md:right-16 w-10 h-10 sm:w-14 sm:h-14 bg-[#FFEA66] rounded-full flex items-center justify-center z-20 shadow-lg hidden sm:flex'>
                <svg
                  width='24'
                  height='24'
                  viewBox='0 0 24 24'
                  fill='none'
                  xmlns='http://www.w3.org/2000/svg'>
                  <path
                    d='M13.9883 7.23047H9.98828C6.81828 7.23047 4.23828 9.81047 4.23828 12.9805V17.9805C4.23828 20.0505 5.91828 21.7305 7.98828 21.7305H15.9883C18.0583 21.7305 19.7383 20.0505 19.7383 17.9805V12.9805C19.7383 9.81047 17.1583 7.23047 13.9883 7.23047ZM8.23828 12.4805C8.23828 11.7905 8.79828 11.2305 9.48828 11.2305C10.1783 11.2305 10.7383 11.7905 10.7383 12.4805C10.7383 13.1705 10.1783 13.7305 9.48828 13.7305C8.79828 13.7305 8.23828 13.1705 8.23828 12.4805ZM9.98828 17.7305C9.79828 17.7305 9.60828 17.6605 9.45828 17.5105C9.16828 17.2205 9.16828 16.7405 9.45828 16.4505L13.4583 12.4505C13.7483 12.1605 14.2283 12.1605 14.5183 12.4505C14.8083 12.7405 14.8083 13.2205 14.5183 13.5105L10.5183 17.5105C10.3683 17.6605 10.1783 17.7305 9.98828 17.7305ZM14.4883 18.7305C13.7983 18.7305 13.2383 18.1705 13.2383 17.4805C13.2383 16.7905 13.7983 16.2305 14.4883 16.2305C15.1783 16.2305 15.7383 16.7905 15.7383 17.4805C15.7383 18.1705 15.1783 18.7305 14.4883 18.7305Z'
                    fill='#0A1832'
                  />
                  <path
                    d='M8.35837 5.93181C8.88837 5.81181 9.42837 5.74181 9.98837 5.74181H13.9884C14.5484 5.74181 15.0984 5.81181 15.6184 5.93181L16.6884 3.27181C16.8284 2.92181 16.6884 2.52181 16.3584 2.34181C16.0284 2.16181 15.6184 2.24181 15.3884 2.54181C14.8784 3.22181 14.0784 3.24181 13.9884 3.24181C13.1384 3.24181 12.6384 2.61181 12.5884 2.54181C12.3084 2.16181 11.6684 2.16181 11.3884 2.54181C10.8784 3.22181 10.0784 3.24181 9.98837 3.24181C9.13837 3.24181 8.63837 2.61181 8.58837 2.54181C8.35837 2.24181 7.94837 2.15181 7.61837 2.34181C7.28837 2.52181 7.14837 2.92181 7.28837 3.27181L8.35837 5.93181Z'
                    fill='#0A1832'
                  />
                </svg>
              </div>

              {/* Small Blue Dot - Top Right */}
              <div className='absolute top-6 right-32 w-3 h-3 bg-[#4A7FA7] rounded-full z-20 hidden md:block'></div>

              {/* Blue Mobile Banking Icon - Left Side */}
              <div className='absolute -left-4 md:-left-8 top-[60%] w-10 h-10 sm:w-14 sm:h-14 bg-[#4A7FA7] rounded-full flex items-center justify-center z-20 shadow-lg hidden sm:flex'>
                <svg
                  width='24'
                  height='24'
                  viewBox='0 0 24 24'
                  fill='none'
                  xmlns='http://www.w3.org/2000/svg'>
                  <path
                    d='M13.9883 16.3488C12.8083 16.3488 11.6183 16.0287 10.4683 15.4087C9.40828 14.8387 8.73828 13.7387 8.73828 12.5287V8.72875C8.73828 7.65875 9.26828 6.65875 10.1483 6.03875C10.6883 5.65875 11.3183 5.46875 11.9783 5.46875C12.3583 5.46875 12.7383 5.53875 13.0883 5.66875C13.4083 5.78875 13.6983 5.84875 13.9883 5.84875C14.3683 5.82875 14.7183 5.72875 15.2383 5.53875C15.3883 5.47875 15.5483 5.42875 15.7283 5.35875V4.96875C15.7283 3.44875 14.4983 2.21875 12.9783 2.21875H4.98828C3.46828 2.21875 2.23828 3.44875 2.23828 4.96875V18.9688C2.23828 20.4887 3.46828 21.7188 4.98828 21.7188H12.9883C14.5083 21.7188 15.7383 20.4887 15.7383 18.9688V16.0988C15.2383 16.2388 14.6783 16.3387 14.0083 16.3387H13.9783L13.9883 16.3488ZM9.98828 18.7288H7.98828C7.57828 18.7288 7.23828 18.3887 7.23828 17.9787C7.23828 17.5687 7.57828 17.2287 7.98828 17.2287H9.98828C10.3983 17.2287 10.7383 17.5687 10.7383 17.9787C10.7383 18.3887 10.3983 18.7288 9.98828 18.7288Z'
                    fill='white'
                  />
                  <path
                    d='M20.11 6.25047C19.36 6.20047 18.6 6.25047 17.87 6.36047C16.97 6.51047 16.33 6.74047 15.77 6.95047C15.15 7.18047 14.65 7.32047 14 7.35047C13.53 7.35047 13.06 7.26047 12.58 7.08047C12.06 6.89047 11.47 6.96047 11.01 7.28047C10.53 7.61047 10.25 8.15047 10.25 8.73047V12.5305C10.25 13.1805 10.61 13.7705 11.19 14.0805C12.12 14.5805 13.07 14.8405 14 14.8405H14.03C14.95 14.8405 15.61 14.6005 16.3 14.3505C16.83 14.1605 17.37 13.9605 18.13 13.8305C18.71 13.7305 19.31 13.7005 19.91 13.7305C20.38 13.7605 20.87 13.5805 21.22 13.2405C21.57 12.9105 21.76 12.4605 21.76 11.9805V7.98047C21.76 7.06047 21.04 6.29047 20.13 6.23047L20.11 6.25047Z'
                    fill='white'
                  />
                </svg>
              </div>

              {/* Light Blue Dot - Bottom Right */}
              <div className='absolute bottom-8 right-24 w-5 h-5 bg-[#A3D3FF] rounded-full z-20 hidden md:block'></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
