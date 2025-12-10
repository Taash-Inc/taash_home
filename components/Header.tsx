'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

          {/* Navigation Links - Desktop */}
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

          {/* CTA Button - Desktop */}
          <Link
            href='#waitlist'
            className='hidden sm:flex bg-primary-dark text-white px-5 py-2.5 rounded-full font-medium items-center gap-2 hover:bg-text-dark transition-colors'>
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

          {/* Mobile Menu Button */}
          <button
            className='md:hidden p-2 text-primary-dark'
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label='Toggle menu'>
            {mobileMenuOpen ? (
              <svg width='24' height='24' fill='none' stroke='currentColor' strokeWidth='2'>
                <path d='M6 6l12 12M6 18L18 6' strokeLinecap='round' />
              </svg>
            ) : (
              <svg width='24' height='24' fill='none' stroke='currentColor' strokeWidth='2'>
                <path d='M4 6h16M4 12h16M4 18h16' strokeLinecap='round' />
              </svg>
            )}
          </button>
        </nav>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className='md:hidden pt-4 pb-2 border-t border-border-light mt-4'>
            <div className='flex flex-col gap-4'>
              <Link
                href='#about'
                onClick={() => setMobileMenuOpen(false)}
                className='text-primary-dark hover:text-primary-blue transition-colors font-medium py-2'>
                About
              </Link>
              <Link
                href='#features'
                onClick={() => setMobileMenuOpen(false)}
                className='text-primary-dark hover:text-primary-blue transition-colors font-medium py-2'>
                Features
              </Link>
              <Link
                href='#who-its-for'
                onClick={() => setMobileMenuOpen(false)}
                className='text-primary-dark hover:text-primary-blue transition-colors font-medium py-2'>
                Who It&apos;s For
              </Link>
              <Link
                href='#resources'
                onClick={() => setMobileMenuOpen(false)}
                className='text-primary-dark hover:text-primary-blue transition-colors font-medium py-2'>
                Resources
              </Link>
              <Link
                href='#waitlist'
                onClick={() => setMobileMenuOpen(false)}
                className='bg-primary-dark text-white px-5 py-3 rounded-full font-medium text-center hover:bg-text-dark transition-colors mt-2'>
                Join Waitlist
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
