'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  // The links used to be bare #anchors, which broke on every page but the homepage. Pages with
  // their own waitlist section keep the in-page jump; the rest go to the homepage's.
  const pathname = usePathname();
  const waitlistHref = pathname === '/' || pathname === '/tax-calculator' ? '#waitlist' : '/#waitlist';

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
              href='/#about'
              className='font-medium text-ink-1000 transition-colors hover:text-brand-700'>
              About
            </Link>
            <Link
              href='/#features'
              className='font-medium text-ink-1000 transition-colors hover:text-brand-700'>
              Features
            </Link>
            <Link
              href='/tax-calculator'
              className='font-medium text-ink-1000 transition-colors hover:text-brand-700'>
              Tax calculator
            </Link>
            <Link
              href='/#who-its-for'
              className='font-medium text-ink-1000 transition-colors hover:text-brand-700'>
              Who It&apos;s For
            </Link>
            <Link
              href='/#resources'
              className='font-medium text-ink-1000 transition-colors hover:text-brand-700'>
              Resources
            </Link>
          </div>

          <div className='flex items-center gap-1 sm:gap-3'>
            {/* CTA — visible on phones too. It was hidden below 640px, which is where 85% of
                ad visitors are, so once they scrolled past the hero there was no way to join. */}
            <Link
              href={waitlistHref}
              className='flex items-center gap-1.5 rounded-full bg-ink-1000 px-4 py-2 text-sm font-semibold text-white transition-[transform,background-color] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-ink-900 active:scale-[0.97] sm:gap-2 sm:px-5 sm:py-2.5 sm:text-base sm:font-medium'>
              Join waitlist
              <svg
                width='16'
                height='16'
                viewBox='0 0 16 16'
                fill='none'
                aria-hidden='true'
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
              className='-mr-2 p-2 text-ink-1000 md:hidden'
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
          </div>
        </nav>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div id='mobile-menu' className='mt-4 border-t border-ink-200 pt-4 pb-2 md:hidden'>
            <div className='flex flex-col gap-4'>
              <Link
                href='/#about'
                onClick={() => setMobileMenuOpen(false)}
                className='py-2 font-medium text-ink-1000 transition-colors hover:text-brand-700'>
                About
              </Link>
              <Link
                href='/#features'
                onClick={() => setMobileMenuOpen(false)}
                className='py-2 font-medium text-ink-1000 transition-colors hover:text-brand-700'>
                Features
              </Link>
              <Link
                href='/tax-calculator'
                onClick={() => setMobileMenuOpen(false)}
                className='py-2 font-medium text-ink-1000 transition-colors hover:text-brand-700'>
                Tax calculator
              </Link>
              <Link
                href='/#who-its-for'
                onClick={() => setMobileMenuOpen(false)}
                className='py-2 font-medium text-ink-1000 transition-colors hover:text-brand-700'>
                Who It&apos;s For
              </Link>
              <Link
                href='/#resources'
                onClick={() => setMobileMenuOpen(false)}
                className='py-2 font-medium text-ink-1000 transition-colors hover:text-brand-700'>
                Resources
              </Link>
              <Link
                href={waitlistHref}
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
