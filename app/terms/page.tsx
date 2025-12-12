import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms & Conditions | Taash',
  description: 'Terms and Conditions for using Taash financial management services.',
};

export default function TermsPage() {
  return (
    <main id='top' className='min-h-screen bg-white'>
      {/* Header */}
      <div className='bg-primary-dark text-white py-16'>
        <div className='max-w-4xl mx-auto px-6'>
          <Link
            href='/'
            className='inline-flex items-center text-gray-300 hover:text-white mb-6 transition-colors'>
            <svg className='w-5 h-5 mr-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M15 19l-7-7 7-7'
              />
            </svg>
            Back to Home
          </Link>
          <h1 className='text-4xl md:text-5xl font-bold'>Terms &amp; Conditions</h1>
          <p className='text-gray-300 mt-4'>Last updated: December 12, 2025</p>
        </div>
      </div>

      {/* Content */}
      <div className='max-w-4xl mx-auto px-6 py-12'>
        <div className='prose prose-lg max-w-none font-sans'>
          {/* Company Info */}
          <section className='mb-10'>
            <div className='p-4 bg-light-blue rounded-lg mb-6'>
              <p className='text-primary-dark mb-2'>
                <strong>Company Name:</strong> Taash Technologies Inc.
              </p>
              <p className='text-primary-dark mb-2'>
                <strong>Jurisdiction:</strong> United States (Delaware C-Corp), servicing users in
                Nigeria and globally
              </p>
              <p className='text-primary-dark'>
                <strong>Product Scope:</strong> AI-powered tax estimation, expense categorisation,
                savings advisory, and financial tools for freelancers, creators, and SMEs.
              </p>
            </div>
          </section>

          <section className='mb-10'>
            <h2 className='text-2xl font-bold text-primary-dark mb-4'>1. Acceptance of Terms</h2>
            <p className='text-text-gray'>
              By accessing or using any service provided by Taash (&quot;we&quot;, &quot;our&quot;,
              or &quot;us&quot;), you (&quot;user&quot;, &quot;you&quot;, or &quot;your&quot;) agree
              to comply with and be legally bound by these Terms and Conditions. If you do not
              agree, you must discontinue the use of our services immediately.
            </p>
          </section>

          <section className='mb-10'>
            <h2 className='text-2xl font-bold text-primary-dark mb-4'>2. Nature of Service</h2>
            <p className='text-text-gray mb-4'>
              Taash provides AI-powered tools to assist users with:
            </p>
            <ul className='list-disc pl-6 text-text-gray space-y-2 mb-4'>
              <li>Expense tracking and categorisation</li>
              <li>Tax deduction estimation</li>
              <li>Savings advisory</li>
              <li>Generation of tax summaries and reports</li>
              <li>Document uploads and receipt tracking</li>
            </ul>
            <p className='text-text-gray'>
              <strong>Important:</strong> We do not file taxes on your behalf nor issue official tax
              certificates. Filing is your sole responsibility, unless separately contracted via our
              CPA partner network.
            </p>
          </section>

          <section className='mb-10'>
            <h2 className='text-2xl font-bold text-primary-dark mb-4'>3. User Eligibility</h2>
            <p className='text-text-gray mb-4'>You must:</p>
            <ul className='list-disc pl-6 text-text-gray space-y-2 mb-4'>
              <li>Be at least 18 years old</li>
              <li>Be a registered freelancer, creator, or SME operator</li>
              <li>Have the legal capacity to enter into binding agreements</li>
            </ul>
            <p className='text-text-gray'>
              We reserve the right to suspend or terminate any account that breaches these
              eligibility criteria.
            </p>
          </section>

          <section className='mb-10'>
            <h2 className='text-2xl font-bold text-primary-dark mb-4'>4. User Responsibilities</h2>
            <p className='text-text-gray mb-4'>You agree to:</p>
            <ul className='list-disc pl-6 text-text-gray space-y-2 mb-4'>
              <li>Provide accurate personal and financial data</li>
              <li>Review AI categorisation outputs and confirm accuracy</li>
              <li>Maintain control and confidentiality of your login credentials</li>
              <li>Comply with all relevant tax laws applicable to your jurisdiction</li>
            </ul>
            <p className='text-text-gray'>
              <strong>
                You are solely responsible for your tax filing and compliance. Taash provides
                insights, not certified tax filing.
              </strong>
            </p>
          </section>

          <section className='mb-10'>
            <h2 className='text-2xl font-bold text-primary-dark mb-4'>
              5. AI-Powered Features Disclaimer
            </h2>
            <p className='text-text-gray mb-4'>
              Our AI models provide tax estimates and categorisations based on:
            </p>
            <ul className='list-disc pl-6 text-text-gray space-y-2 mb-4'>
              <li>NTA 2025</li>
              <li>NRS tax reforms</li>
              <li>Publicly available tax rules</li>
              <li>Your transaction history and uploads</li>
            </ul>
            <p className='text-text-gray'>
              <strong>Disclaimer:</strong> AI-based deductions or summaries are only as accurate as
              the data provided by you and should not be considered as legal or official tax advice.
            </p>
          </section>

          <section className='mb-10'>
            <h2 className='text-2xl font-bold text-primary-dark mb-4'>
              6. Receipt Uploads &amp; Categorisation
            </h2>
            <p className='text-text-gray mb-4'>
              Users may upload photos of receipts and invoices for categorisation.
            </p>
            <p className='text-text-gray mb-4'>By uploading a document, you:</p>
            <ul className='list-disc pl-6 text-text-gray space-y-2'>
              <li>Grant Taash the right to analyse the data using AI</li>
              <li>Acknowledge that the AI suggestions are advisory</li>
              <li>Confirm that you&apos;re responsible for final classification</li>
            </ul>
          </section>

          <section className='mb-10'>
            <h2 className='text-2xl font-bold text-primary-dark mb-4'>
              7. Subscription &amp; Payments
            </h2>
            <p className='text-text-gray mb-4'>We offer:</p>
            <ul className='list-disc pl-6 text-text-gray space-y-2 mb-4'>
              <li>Free usage with limited features</li>
              <li>Pay-as-you-go features using TaashCoins</li>
              <li>Optional paid subscriptions</li>
            </ul>
            <p className='text-text-gray'>
              All payments are processed securely. Refunds are subject to case-by-case review.
            </p>
          </section>

          <section className='mb-10'>
            <h2 className='text-2xl font-bold text-primary-dark mb-4'>
              8. TaashCoins – Tokenised Feature Access
            </h2>
            <p className='text-text-gray mb-4'>Certain features require TaashCoins:</p>
            <ul className='list-disc pl-6 text-text-gray space-y-2 mb-4'>
              <li>10 coins for ready-to-file tax summaries</li>
              <li>5 coins for monthly expense reports</li>
              <li>3 coins for CAC-compliant invoice generation</li>
              <li>15 coins for reverse logistics (SMEs only)</li>
              <li>2 coins per smart tax estimate</li>
            </ul>
            <p className='text-text-gray'>
              <strong>Coins are non-refundable and non-transferable.</strong>
            </p>
          </section>

          <section className='mb-10'>
            <h2 className='text-2xl font-bold text-primary-dark mb-4'>
              9. Data Privacy and NDPR Compliance
            </h2>
            <p className='text-text-gray'>
              We adhere to the Nigeria Data Protection Regulation (NDPR). For more on how we collect
              and protect your data, see our{' '}
              <Link href='/privacy' className='text-primary-blue hover:underline'>
                Privacy Policy
              </Link>
              .
            </p>
          </section>

          <section className='mb-10'>
            <h2 className='text-2xl font-bold text-primary-dark mb-4'>
              10. Open Banking &amp; Third-Party Integrations
            </h2>
            <p className='text-text-gray mb-4'>
              We integrate with financial data aggregators like Mono, Okra, and others.
            </p>
            <p className='text-text-gray mb-4'>You agree to:</p>
            <ul className='list-disc pl-6 text-text-gray space-y-2'>
              <li>Provide consent before linking your account</li>
              <li>Allow us to access only read-only financial data</li>
              <li>Accept that we do not initiate or store financial transactions</li>
            </ul>
          </section>

          <section className='mb-10'>
            <h2 className='text-2xl font-bold text-primary-dark mb-4'>
              11. Limitation of Liability
            </h2>
            <p className='text-text-gray mb-4'>
              To the extent permitted by law, Taash is not liable for:
            </p>
            <ul className='list-disc pl-6 text-text-gray space-y-2'>
              <li>Losses from inaccurate AI categorisation</li>
              <li>Penalties from improper tax filings</li>
              <li>Delays in CPA responses or document generation</li>
              <li>Errors in user-inputted data</li>
            </ul>
          </section>

          <section className='mb-10'>
            <h2 className='text-2xl font-bold text-primary-dark mb-4'>
              12. Legal Status of Our Outputs
            </h2>
            <p className='text-text-gray mb-4'>
              <strong>We issue:</strong>
            </p>
            <ul className='list-disc pl-6 text-text-gray space-y-2 mb-4'>
              <li>✔ Deduction Summary</li>
              <li>✔ Expense Ledger</li>
              <li>✔ Quarterly Tax Prep Report</li>
              <li>✔ Income Summary</li>
              <li>✔ Receipt Attachment Reports</li>
              <li>✔ Smart Estimate Sheets</li>
            </ul>
            <p className='text-text-gray mb-4'>
              <strong>We do not issue:</strong>
            </p>
            <ul className='list-disc pl-6 text-text-gray space-y-2 mb-4'>
              <li>✘ Tax Clearance Certificates</li>
              <li>✘ FIRS/SIRS Payment Acknowledgements</li>
              <li>✘ PIT Assessment Notices</li>
            </ul>
            <p className='text-text-gray'>
              These are exclusively issued by the appropriate tax authorities.
            </p>
          </section>

          <section className='mb-10'>
            <h2 className='text-2xl font-bold text-primary-dark mb-4'>13. Termination</h2>
            <p className='text-text-gray mb-4'>We may suspend or terminate access if:</p>
            <ul className='list-disc pl-6 text-text-gray space-y-2 mb-4'>
              <li>Terms are violated</li>
              <li>Fraud is suspected</li>
              <li>Regulatory compliance requires it</li>
            </ul>
            <p className='text-text-gray'>Users may delete their accounts at any time.</p>
          </section>

          <section className='mb-10'>
            <h2 className='text-2xl font-bold text-primary-dark mb-4'>14. Intellectual Property</h2>
            <p className='text-text-gray'>
              All content, UI designs, code, and tools within the platform are the intellectual
              property of Taash Technologies Inc. Reproduction without permission is prohibited.
            </p>
          </section>

          <section className='mb-10'>
            <h2 className='text-2xl font-bold text-primary-dark mb-4'>15. Governing Law</h2>
            <p className='text-text-gray'>
              These Terms are governed by the laws of the State of Delaware, United States. Where
              services apply in Nigeria, supplementary interpretation may apply under local tax
              regulations and NDPR.
            </p>
          </section>

          <section className='mb-10'>
            <h2 className='text-2xl font-bold text-primary-dark mb-4'>16. Changes to Terms</h2>
            <p className='text-text-gray'>
              We reserve the right to update these Terms at any time. Continued use after updates
              constitutes acceptance of changes.
            </p>
          </section>

          <section className='mb-10'>
            <h2 className='text-2xl font-bold text-primary-dark mb-4'>17. Contact</h2>
            <p className='text-text-gray mb-4'>
              If you have questions or concerns regarding these Terms, contact:
            </p>
            <div className='mt-4 p-4 bg-light-blue rounded-lg'>
              <p className='text-primary-dark font-medium'>Taash Technologies Inc.</p>
              <p className='text-text-gray'>
                Email:{' '}
                <a href='mailto:legal@taash.tax' className='text-primary-blue hover:underline'>
                  legal@taash.tax
                </a>
              </p>
            </div>
          </section>

          {/* Back to Top & Home */}
          <div className='flex flex-col sm:flex-row items-center justify-center gap-4 pt-8 border-t border-border'>
            <a
              href='#top'
              className='inline-flex items-center gap-2 text-primary-dark hover:text-primary-blue transition-colors font-medium'>
              <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M5 10l7-7m0 0l7 7m-7-7v18'
                />
              </svg>
              Back to Top
            </a>
            <span className='hidden sm:inline text-gray-300'>|</span>
            <Link
              href='/'
              className='inline-flex items-center gap-2 text-primary-dark hover:text-primary-blue transition-colors font-medium'>
              <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6'
                />
              </svg>
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
