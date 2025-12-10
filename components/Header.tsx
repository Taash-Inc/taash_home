'use client';

import Image from 'next/image';
import Link from 'next/link';

export default function Header() {
  return (
    <header
      className='fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-border-light'
      role='banner'>
      <div className='max-w-7xl mx-auto px-6 py-4'>
        <nav className='flex items-center justify-between' aria-label='Main navigation'>
          {/* Logo */}
          <Link href='/' aria-label='Taash - Home'>
            <Image src='/logo.svg' alt='Taash' width={120} height={35} priority />
          </Link>

          {/* Navigation Links */}
          <div className='hidden md:flex items-center gap-8'>
            <Link
              href='#about'
              className='text-primary-dark hover:text-primary-blue transition-colors font-medium'>
              About
            </Link>
            <Link
              href='#features'
              className='text-primary-dark hover:text-primary-blue transition-colors font-medium'>
              Features
            </Link>
            <Link
              href='#who-its-for'
              className='text-primary-dark hover:text-primary-blue transition-colors font-medium'>
              Who It&apos;s For
            </Link>
            <Link
              href='#resources'
              className='text-primary-dark hover:text-primary-blue transition-colors font-medium'>
              Resources
            </Link>
          </div>

          {/* CTA Button */}
          <Link
            href='#waitlist'
            className='bg-primary-dark text-white px-5 py-2.5 rounded-full font-medium flex items-center gap-2 hover:bg-text-dark transition-colors'>
            Join Waitlist
            <svg
              width='16'
              height='16'
              viewBox='0 0 16 16'
              fill='none'
              xmlns='http://www.w3.org/2000/svg'>
              <path
                d='M4 12L12 4M12 4H6M12 4V10'
                stroke='currentColor'
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'
              />
            </svg>
          </Link>
        </nav>
      </div>
    </header>
  );
}
