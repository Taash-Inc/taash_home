'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header
      className='fixed top-0 right-0 left-0 z-50 border-b border-ink-200 bg-white/95 backdrop-blur-sm'
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
              className='font-medium text-ink-1000 transition-colors hover:text-brand-700'>
              About
            </Link>
            <Link
              href='#features'
              className='font-medium text-ink-1000 transition-colors hover:text-brand-700'>
              Features
            </Link>
            <Link
              href='#who-its-for'
              className='font-medium text-ink-1000 transition-colors hover:text-brand-700'>
              Who It&apos;s For
            </Link>
            <Link
              href='#resources'
              className='font-medium text-ink-1000 transition-colors hover:text-brand-700'>
              Resources
            </Link>
          </div>

          {/* CTA Button - Desktop */}
          <Link
            href='#waitlist'
            className='hidden items-center gap-2 rounded-full bg-ink-1000 px-5 py-2.5 font-medium text-white transition-colors hover:bg-ink-900 sm:flex'>
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
            type='button'
            className='p-2 text-ink-1000 md:hidden'
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-expanded={mobileMenuOpen}
            aria-controls='mobile-menu'
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}>
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
          <div id='mobile-menu' className='mt-4 border-t border-ink-200 pt-4 pb-2 md:hidden'>
            <div className='flex flex-col gap-4'>
              <Link
                href='#about'
                onClick={() => setMobileMenuOpen(false)}
                className='py-2 font-medium text-ink-1000 transition-colors hover:text-brand-700'>
                About
              </Link>
              <Link
                href='#features'
                onClick={() => setMobileMenuOpen(false)}
                className='py-2 font-medium text-ink-1000 transition-colors hover:text-brand-700'>
                Features
              </Link>
              <Link
                href='#who-its-for'
                onClick={() => setMobileMenuOpen(false)}
                className='py-2 font-medium text-ink-1000 transition-colors hover:text-brand-700'>
                Who It&apos;s For
              </Link>
              <Link
                href='#resources'
                onClick={() => setMobileMenuOpen(false)}
                className='py-2 font-medium text-ink-1000 transition-colors hover:text-brand-700'>
                Resources
              </Link>
              <Link
                href='#waitlist'
                onClick={() => setMobileMenuOpen(false)}
                className='mt-2 block rounded-lg bg-ink-1000 px-5 py-3.5 text-center font-medium text-white transition-colors hover:bg-ink-900'>
                Join Waitlist
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
