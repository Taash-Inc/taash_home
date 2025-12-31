'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function AppDownload() {
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    // Spin clockwise every 5 seconds
    const interval = setInterval(() => {
      setRotation((prev) => prev + 360);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <section id='download' className='py-20 bg-white'>
      <div className='max-w-7xl mx-auto px-6'>
        {/* Grey background card */}
        <div className='bg-[#f1f5f9] rounded-3xl overflow-hidden relative'>
          <div className='flex flex-col lg:flex-row'>
            {/* Left Content */}
            <div className='flex-1 text-center lg:text-left p-8 md:p-12 lg:p-16'>
              {/* Coming Soon Badge - Yellow */}
              <div className='inline-flex items-center gap-2 bg-[#FFEA66] text-primary-dark px-4 py-2 rounded-full text-sm font-bold mb-6'>
                <svg
                  width='18'
                  height='18'
                  viewBox='0 0 18 18'
                  fill='none'
                  xmlns='http://www.w3.org/2000/svg'
                  className='transition-transform duration-1000 ease-in-out'
                  style={{ transform: `rotate(${rotation}deg)`, transformOrigin: 'center' }}>
                  <g clipPath='url(#clip0_307_1781)'>
                    <path d='M3.75 16.5H14.25Z' fill='black' />
                    <path
                      d='M3.75 16.5H14.25'
                      stroke='black'
                      strokeWidth='1.5'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                    />
                    <path
                      d='M3.75 1.5H14.25'
                      stroke='black'
                      strokeWidth='1.5'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                    />
                    <path
                      d='M12.75 16.5V13.371C12.7499 12.9732 12.5918 12.5917 12.3105 12.3105L9 9L5.6895 12.3105C5.40818 12.5917 5.25008 12.9732 5.25 13.371V16.5'
                      fill='black'
                    />
                    <path
                      d='M12.75 16.5V13.371C12.7499 12.9732 12.5918 12.5917 12.3105 12.3105L9 9L5.6895 12.3105C5.40818 12.5917 5.25008 12.9732 5.25 13.371V16.5'
                      stroke='black'
                      strokeWidth='1.5'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                    />
                    <path
                      d='M5.25 1.5V4.629C5.25008 5.02679 5.40818 5.40826 5.6895 5.6895L9 9L12.3105 5.6895C12.5918 5.40826 12.7499 5.02679 12.75 4.629V1.5'
                      stroke='black'
                      strokeWidth='1.5'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                    />
                  </g>
                  <defs>
                    <clipPath id='clip0_307_1781'>
                      <rect width='18' height='18' fill='black' />
                    </clipPath>
                  </defs>
                </svg>
                COMING SOON
              </div>

              <h2 className='text-3xl md:text-4xl font-bold text-primary-dark mb-4'>
                The Taash App is launching soon.
              </h2>
              <p className='text-lg text-text-gray max-w-lg mx-auto lg:mx-0 mb-8'>
                Your automated tax and finance assistant is coming soon to iOS and Android to help
                you stay compliant with zero stress.Join the waitlist to get early access, updates,
                and priority features as we roll out in Nigeria.
              </p>

              {/* App Store Badges */}
              <div className='flex flex-row items-center justify-center lg:justify-start gap-3 sm:gap-4'>
                {/* App Store */}
                <Link href='#' aria-label='Download on the App Store'>
                  <Image
                    src='/app-store-badge.png'
                    alt='Download on the App Store'
                    width={140}
                    height={42}
                    className='h-[36px] sm:h-[42px] w-auto'
                  />
                </Link>

                {/* Google Play - bigger to visually match App Store */}
                <Link href='#' aria-label='Get it on Google Play'>
                  <Image
                    src='/google-play-badge.png'
                    alt='Get it on Google Play'
                    width={140}
                    height={42}
                    className='h-[50px] sm:h-[60px] w-auto'
                  />
                </Link>
              </div>
            </div>

            {/* Right Content - Phone with Hand */}
            <div className='flex-1 relative min-h-[350px] sm:min-h-[400px] md:min-h-[500px] hidden sm:flex justify-center md:justify-end items-end'>
              <div className='relative w-[280px] sm:w-[350px] md:w-[450px] lg:w-[595px] translate-y-6 sm:translate-y-9 translate-x-4 sm:translate-x-8 md:translate-x-12 lg:translate-x-19'>
                <Image
                  src='/phone-hand.png'
                  alt='Taash app on phone'
                  width={533}
                  height={584}
                  className='w-full h-auto -scale-x-100'
                  priority
                />
                {/* Taash Logo centered on phone screen */}
                <div
                  className='absolute flex items-center justify-center pointer-events-none'
                  style={{
                    top: '26%',
                    left: '19.5%',
                    width: '40%',
                    height: '25%',
                  }}>
                  <svg
                    width='97'
                    height='28'
                    viewBox='0 0 97 28'
                    fill='none'
                    xmlns='http://www.w3.org/2000/svg'
                    className='w-[50px] sm:w-[65px] md:w-[85px]'>
                    <g clipPath='url(#clip0_311_1989)'>
                      <path
                        d='M0 7.5965C6.65056e-05 7.25544 0.361379 7.0361 0.663416 7.19357L12.1862 13.202L23.4698 7.31812C23.7719 7.16065 24.1332 7.38026 24.1332 7.72136V19.9987C24.1332 20.3398 23.7719 20.5594 23.4698 20.402L11.9467 14.3929L0.663416 20.2771C0.361352 20.4346 0 20.2149 0 19.8738V7.5965Z'
                        fill='#0A1832'
                      />
                      <path
                        d='M11.9373 0H11.9373C9.43377 0 7.4043 2.03275 7.4043 4.54028V4.54032C7.4043 7.04785 9.43377 9.0806 11.9373 9.0806H11.9373C14.4408 9.0806 16.4703 7.04785 16.4703 4.54032V4.54028C16.4703 2.03275 14.4408 0 11.9373 0Z'
                        fill='#4A7FA7'
                      />
                      <path
                        d='M7.48438 23.218C7.48438 20.7105 9.51383 18.6777 12.0173 18.6777C14.5208 18.6777 16.5503 20.7105 16.5503 23.218C16.5503 25.7256 14.5208 27.7583 12.0173 27.7583C9.51383 27.7583 7.48438 25.7256 7.48438 23.218Z'
                        fill='#4A7FA7'
                      />
                      <path
                        d='M30.7148 5.88574V3.2959H46.0276V5.88574H39.7933V24.1009H36.978V5.88574H30.7148Z'
                        fill='#0A1832'
                      />
                      <path
                        d='M48.7978 24.4466C45.7814 24.4466 44 22.7488 44 20.1877C44 17.5979 45.9248 15.9864 49.2289 15.7274L53.6532 15.3821V14.9793C53.6532 12.6196 52.2453 11.7851 50.3491 11.7851C48.0797 11.7851 46.7867 12.7923 46.7867 14.4901H44.4308C44.4308 11.5549 46.8443 9.62695 50.464 9.62695C53.9405 9.62695 56.2961 11.4686 56.2961 15.267V15.3821V17.5768V24.1013H53.9977L53.7104 21.8279C52.9924 23.4394 51.0675 24.4466 48.7978 24.4466ZM49.5735 22.3459C52.1305 22.3459 53.6818 20.6769 53.6818 18.0295L56.2961 17.5768L50.0908 17.5691C47.7062 17.7993 46.7291 18.7201 46.7291 20.1014C46.7291 21.5977 47.8211 22.3459 49.5735 22.3459Z'
                        fill='#0A1832'
                      />
                      <path
                        d='M62.7089 24.4466C59.6922 24.4466 57.9111 22.7488 57.9111 20.1877C57.9111 19.0018 58.3146 18.021 59.0694 17.2813C59.963 16.4057 61.3489 15.8679 63.1397 15.7274L67.564 15.3821V14.9793C67.564 12.6196 66.1565 11.7851 64.2603 11.7851C61.9905 11.7851 60.6979 12.4969 60.6979 14.1946H58.3419C58.3419 11.2595 60.7551 9.62695 64.3751 9.62695C67.8513 9.62695 70.2072 11.4686 70.2072 15.267V24.1013H67.9089L67.6216 21.8279C66.9032 23.4394 64.9783 24.4466 62.7089 24.4466ZM63.4846 22.3459C66.0413 22.3459 67.5929 20.6769 67.5929 18.0295L70.2072 17.2813L64.0016 17.5691C61.617 17.7993 60.6403 18.7201 60.6403 20.1014C60.6403 21.5977 61.7319 22.3459 63.4846 22.3459Z'
                        fill='#0A1832'
                      />
                      <path
                        d='M71.3613 20.0151H73.947C73.947 21.4538 75.0389 22.3171 76.8199 22.3171C78.7161 22.3171 79.8081 21.5402 79.8081 20.2453C79.8081 19.2957 79.3483 18.7201 77.8829 18.3461L75.4124 17.7705C72.913 17.1662 71.7348 15.9289 71.7348 13.857C71.7348 11.2672 73.9184 9.62695 77.021 9.62695C80.0954 9.62695 82.1064 11.3535 82.1637 14.0297H79.578C79.5208 12.6196 78.5727 11.7276 76.9351 11.7276C75.24 11.7276 74.2919 12.4758 74.2919 13.7707C74.2919 14.7203 74.9813 15.3534 76.3605 15.6987L78.831 16.303C81.2156 16.8785 82.3937 17.972 82.3937 20.0726C82.3937 22.7488 80.0954 24.4466 76.7627 24.4466C73.4586 24.4466 71.3613 22.6912 71.3613 20.0151Z'
                        fill='#0A1832'
                      />
                      <path
                        d='M86.652 24.0722H83.9512V3.2959H86.652V12.1877C87.5425 10.6626 89.2377 9.62663 91.4208 9.62663C95.0122 9.62663 96.736 11.8999 96.736 15.4969V24.1009H94.0355V16.1012C94.0355 13.2524 92.6852 12.1014 90.6741 12.1014C88.0595 12.1014 86.652 14.0006 86.652 16.4177V24.0722Z'
                        fill='#0A1832'
                      />
                      <path
                        d='M56.2959 15.3818V17.5765L59.0685 17.281C59.962 16.4054 61.348 15.8676 63.1388 15.7271L67.5631 15.3818H56.2959Z'
                        fill='#0A1832'
                      />
                    </g>
                    <defs>
                      <clipPath id='clip0_311_1989'>
                        <rect width='97' height='28' fill='white' />
                      </clipPath>
                    </defs>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
