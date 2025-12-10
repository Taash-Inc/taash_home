'use client';

import { useEffect, useState } from 'react';

// Realistic tax data scenarios
const taxScenarios = [
  {
    label: 'Monthly Tax Estimate',
    amount: 45600,
    change: 12,
    period: 'vs last month',
    positive: true,
  },
  { label: 'Monthly Tax Estimate', amount: 52300, change: 8, period: 'vs October', positive: true },
  {
    label: 'Monthly Tax Estimate',
    amount: 38900,
    change: 15,
    period: 'vs September',
    positive: false,
  },
  { label: 'Quarterly Tax Due', amount: 142500, change: 5, period: 'vs Q2 2024', positive: true },
  {
    label: 'Quarterly Tax Due',
    amount: 128700,
    change: 11,
    period: 'vs last quarter',
    positive: false,
  },
  { label: 'Annual Tax Estimate', amount: 547200, change: 18, period: 'vs 2023', positive: true },
  {
    label: 'Annual Tax Estimate',
    amount: 489600,
    change: 7,
    period: 'vs last year',
    positive: false,
  },
  {
    label: 'Monthly Tax Estimate',
    amount: 61200,
    change: 23,
    period: 'vs November',
    positive: true,
  },
  { label: 'Monthly Tax Estimate', amount: 43800, change: 4, period: 'vs August', positive: false },
  { label: 'Tax Savings Found', amount: 28500, change: 34, period: 'this quarter', positive: true },
];

export default function AnimatedTaxCard() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);

      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % taxScenarios.length);
        setIsAnimating(false);
      }, 300);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG').format(amount);
  };

  const current = taxScenarios[currentIndex];

  return (
    <div className='absolute top-24 -left-8 md:-left-4 bg-white rounded-2xl shadow-xl p-4 z-20 min-w-[180px]'>
      <p
        className={`text-xs text-text-gray mb-1 transition-opacity duration-300 ${
          isAnimating ? 'opacity-0' : 'opacity-100'
        }`}>
        {current.label}
      </p>
      <p
        className={`text-2xl font-bold text-primary-dark transition-all duration-300 ${
          isAnimating ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'
        }`}>
        ₦{formatCurrency(current.amount)}
      </p>
      <p
        className={`text-xs flex items-center gap-1 mt-1 transition-all duration-300 ${
          current.positive ? 'text-green-500' : 'text-red-500'
        } ${isAnimating ? 'opacity-0' : 'opacity-100'}`}>
        <svg
          width='10'
          height='10'
          viewBox='0 0 10 10'
          fill='none'
          xmlns='http://www.w3.org/2000/svg'
          className={`transition-transform duration-300 ${current.positive ? '' : 'rotate-180'}`}>
          <path
            d='M5 8V2M5 2L2 5M5 2L8 5'
            stroke='currentColor'
            strokeWidth='1.5'
            strokeLinecap='round'
            strokeLinejoin='round'
          />
        </svg>
        {current.change}% {current.period}
      </p>
    </div>
  );
}
