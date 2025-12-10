'use client';

import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

export default function WaitlistForm() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    profession: '',
    monthlyIncome: '',
    agreedToPolicy: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const turnstileRef = useRef<TurnstileInstance>(null);

  // Auto-dismiss modal after 5 seconds
  useEffect(() => {
    if (showSuccessModal) {
      const timer = setTimeout(() => {
        setShowSuccessModal(false);
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [showSuccessModal]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus({ type: null, message: '' });

    if (!turnstileToken) {
      setSubmitStatus({
        type: 'error',
        message: 'Please complete the CAPTCHA verification.',
      });
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          profession: formData.profession,
          monthlyIncome: formData.monthlyIncome,
          turnstileToken,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to join waitlist');
      }

      // Show success modal
      setShowSuccessModal(true);
      setSubmitStatus({ type: null, message: '' });
      setFormData({
        fullName: '',
        email: '',
        profession: '',
        monthlyIncome: '',
        agreedToPolicy: false,
      });
      // Reset Turnstile after successful submission
      turnstileRef.current?.reset();
      setTurnstileToken(null);
    } catch (error) {
      setSubmitStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Something went wrong. Please try again.',
      });
      // Reset Turnstile on error so user can try again
      turnstileRef.current?.reset();
      setTurnstileToken(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id='waitlist' className='relative py-20 overflow-hidden'>
      {/* Wavy Background */}
      <div className='absolute inset-0 bg-light-blue'>
        <svg
          className='absolute top-0 left-0 w-full h-full'
          viewBox='0 0 1440 600'
          fill='none'
          xmlns='http://www.w3.org/2000/svg'
          preserveAspectRatio='none'>
          <path
            d='M0 100C200 50 400 150 600 100C800 50 1000 150 1200 100C1400 50 1440 100 1440 100V600H0V100Z'
            fill='#bfdbfe'
            fillOpacity='0.3'
          />
          <path
            d='M0 200C300 150 500 250 800 200C1100 150 1300 250 1440 200V600H0V200Z'
            fill='#93c5fd'
            fillOpacity='0.2'
          />
        </svg>
      </div>

      <div className='relative max-w-xl mx-auto px-6'>
        {/* Form Card */}
        <div className='bg-white rounded-3xl shadow-xl p-8 md:p-12'>
          {/* Badge */}
          <div className='flex justify-center mb-6'>
            <div className='inline-flex items-center gap-2 bg-[#C5E2FF] text-primary-blue px-4 py-2 rounded-full text-sm font-medium'>
              <svg
                width='18'
                height='18'
                viewBox='0 0 18 18'
                fill='none'
                xmlns='http://www.w3.org/2000/svg'>
                <path
                  fillRule='evenodd'
                  clipRule='evenodd'
                  d='M3.63853 1.18603C3.91191 0.354656 5.08791 0.354656 5.36128 1.18603L5.96841 3.03141L7.81378 3.63853C8.64516 3.91191 8.64516 5.08791 7.81378 5.36128L5.96841 5.96841L5.36128 7.81378C5.08791 8.64516 3.91191 8.64516 3.63853 7.81378L3.03141 5.96841L1.18603 5.36128C0.354656 5.08791 0.354656 3.91191 1.18603 3.63853L3.03141 3.03141L3.63853 1.18603ZM11.023 2.76928C11.3332 1.82691 12.6667 1.82691 12.9768 2.76928L13.9057 5.59416L16.7305 6.52303C17.6729 6.83316 17.6729 8.16666 16.7305 8.47678L13.9057 9.40566L12.9768 12.2305C12.6667 13.1733 11.3332 13.1733 11.023 12.2305L10.0942 9.40566L7.26928 8.47678C6.32653 8.16666 6.32653 6.83316 7.26928 6.52303L10.0942 5.59416L11.023 2.76928ZM6.89803 9.46228C6.61303 8.59603 5.38678 8.59603 5.10178 9.46228L4.41778 11.5428L2.33728 12.2272C1.47103 12.5122 1.47103 13.7377 2.33728 14.0227L4.41778 14.707L5.10216 16.7875C5.38716 17.6538 6.61266 17.6538 6.89766 16.7875L7.58203 14.707L9.66253 14.0227C10.5288 13.7377 10.5288 12.5122 9.66253 12.2272L7.58203 11.5428L6.89803 9.46228Z'
                  fill='#0A1832'
                />
              </svg>
              Limited Early Access
            </div>
          </div>

          {/* Header */}
          <div className='text-center mb-8'>
            <h2 className='text-2xl md:text-3xl font-bold text-primary-dark mb-3'>
              Get Early Access
            </h2>
            <p className='text-text-gray'>
              Be among the first to experience Taash. Early members get lifetime discounts and
              priority support.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className='space-y-5'>
            <div>
              <label
                htmlFor='fullName'
                className='block text-sm font-medium text-primary-dark mb-2'>
                Full Name
              </label>
              <input
                type='text'
                id='fullName'
                name='fullName'
                value={formData.fullName}
                onChange={handleChange}
                placeholder='John Doe'
                className='w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-transparent transition-all'
                required
              />
            </div>

            <div>
              <label htmlFor='email' className='block text-sm font-medium text-primary-dark mb-2'>
                Email Address
              </label>
              <input
                type='email'
                id='email'
                name='email'
                value={formData.email}
                onChange={handleChange}
                placeholder='john@example.com'
                className='w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-transparent transition-all'
                required
              />
            </div>

            <div>
              <label
                htmlFor='profession'
                className='block text-sm font-medium text-primary-dark mb-2'>
                Profession
              </label>
              <input
                type='text'
                id='profession'
                name='profession'
                value={formData.profession}
                onChange={handleChange}
                placeholder='e.g., Freelance Designer, Content Creator'
                className='w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-transparent transition-all'
                required
              />
            </div>

            <div>
              <label
                htmlFor='monthlyIncome'
                className='block text-sm font-medium text-primary-dark mb-2'>
                Monthly Income (optional)
              </label>
              <input
                type='text'
                id='monthlyIncome'
                name='monthlyIncome'
                value={formData.monthlyIncome}
                onChange={handleChange}
                placeholder='e.g., ₦200,000 - ₦500,000'
                className='w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-transparent transition-all'
              />
            </div>

            <div className='flex items-start gap-3'>
              <input
                type='checkbox'
                id='agreedToPolicy'
                name='agreedToPolicy'
                checked={formData.agreedToPolicy}
                onChange={handleChange}
                className='mt-1 w-4 h-4 text-primary-blue border-border rounded focus:ring-primary-blue'
                required
              />
              <label htmlFor='agreedToPolicy' className='text-sm text-text-gray'>
                I agree to receive updates about Taash and understand that my data will be handled
                according to the{' '}
                <Link href='#' className='text-primary-blue hover:underline'>
                  privacy policy
                </Link>
                .
              </label>
            </div>

            {submitStatus.type === 'error' && (
              <div className='p-4 rounded-lg text-sm bg-red-50 text-red-800 border border-red-200'>
                {submitStatus.message}
              </div>
            )}

            {/* Turnstile CAPTCHA */}
            <div className='flex justify-center'>
              <Turnstile
                ref={turnstileRef}
                siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '1x00000000000000000000AA'}
                onSuccess={(token) => setTurnstileToken(token)}
                onError={() => setTurnstileToken(null)}
                onExpire={() => setTurnstileToken(null)}
                options={{
                  theme: 'light',
                }}
              />
            </div>

            <button
              type='submit'
              disabled={isSubmitting || !turnstileToken}
              className='w-full bg-primary-dark text-white py-3 rounded-lg font-medium hover:bg-text-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed'>
              {isSubmitting ? 'Joining...' : 'Join Waitlist'}
            </button>
          </form>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-in fade-in duration-200'>
          <div className='bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center animate-in zoom-in-95 duration-200'>
            {/* Success Icon */}
            <div className='mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6'>
              <svg
                className='w-8 h-8 text-green-600'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M5 13l4 4L19 7'
                />
              </svg>
            </div>

            {/* Title */}
            <h3 className='text-2xl font-bold text-primary-dark mb-3'>
              You&apos;re on the list! 🎉
            </h3>

            {/* Message */}
            <p className='text-text-gray mb-6'>
              Thanks for joining the Taash waitlist! We&apos;ll keep you updated on our progress and
              let you know when early access is available.
            </p>

            {/* Progress bar */}
            <div className='h-1 bg-gray-200 rounded-full overflow-hidden'>
              <div className='h-full bg-primary-blue animate-shrink-width' />
            </div>
            <p className='text-xs text-text-gray mt-2'>This message will close automatically</p>

            {/* Close button */}
            <button
              onClick={() => setShowSuccessModal(false)}
              className='mt-4 text-sm text-primary-blue hover:underline'>
              Close now
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
