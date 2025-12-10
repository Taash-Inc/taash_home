import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms & Conditions | Taash',
  description: 'Terms and Conditions for using Taash financial management services.',
};

export default function TermsPage() {
  return (
    <main className='min-h-screen bg-white'>
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
          <p className='text-gray-300 mt-4'>Last updated: December 5, 2025</p>
        </div>
      </div>

      {/* Content */}
      <div className='max-w-4xl mx-auto px-6 py-12'>
        <div className='prose prose-lg max-w-none'>
          <section className='mb-10'>
            <h2 className='text-2xl font-bold text-primary-dark mb-4'>1. Agreement to Terms</h2>
            <p className='text-text-gray mb-4'>
              By accessing or using Taash (&quot;the Service&quot;), operated by Taash Technologies
              Inc. (&quot;Company,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;), you
              agree to be bound by these Terms and Conditions (&quot;Terms&quot;). If you disagree
              with any part of these Terms, you do not have permission to access the Service.
            </p>
            <p className='text-text-gray'>
              These Terms apply to all visitors, users, and others who access or use the Service.
            </p>
          </section>

          <section className='mb-10'>
            <h2 className='text-2xl font-bold text-primary-dark mb-4'>2. Description of Service</h2>
            <p className='text-text-gray mb-4'>
              Taash provides financial management tools designed to help self-employed individuals
              and freelancers manage their finances, track expenses, estimate taxes, and organize
              receipts. The Service may include:
            </p>
            <ul className='list-disc pl-6 text-text-gray space-y-2'>
              <li>Bank account connection and transaction categorization</li>
              <li>Expense tracking and management</li>
              <li>Tax estimation tools</li>
              <li>Receipt scanning and storage</li>
              <li>Financial insights and recommendations</li>
            </ul>
          </section>

          <section className='mb-10'>
            <h2 className='text-2xl font-bold text-primary-dark mb-4'>3. User Accounts</h2>
            <p className='text-text-gray mb-4'>
              When you create an account with us, you must provide accurate, complete, and current
              information. Failure to do so constitutes a breach of the Terms, which may result in
              immediate termination of your account.
            </p>
            <p className='text-text-gray mb-4'>
              You are responsible for safeguarding the password that you use to access the Service
              and for any activities or actions under your password. You agree not to disclose your
              password to any third party. You must notify us immediately upon becoming aware of any
              breach of security or unauthorized use of your account.
            </p>
          </section>

          <section className='mb-10'>
            <h2 className='text-2xl font-bold text-primary-dark mb-4'>
              4. Financial Information Disclaimer
            </h2>
            <p className='text-text-gray mb-4'>
              <strong>Taash is not a financial advisor, tax advisor, or accounting service.</strong>{' '}
              The information provided through the Service is for general informational purposes
              only and should not be construed as professional financial, tax, or legal advice.
            </p>
            <p className='text-text-gray mb-4'>
              Tax estimates and financial calculations provided by Taash are approximations based on
              the information you provide and general tax guidelines. These estimates may not
              reflect your actual tax liability. We strongly recommend consulting with a qualified
              tax professional or accountant for accurate tax advice specific to your situation.
            </p>
            <p className='text-text-gray'>
              You acknowledge that any reliance on information provided by the Service is at your
              own risk.
            </p>
          </section>

          <section className='mb-10'>
            <h2 className='text-2xl font-bold text-primary-dark mb-4'>5. Bank Account Access</h2>
            <p className='text-text-gray mb-4'>
              By connecting your bank accounts to Taash, you authorize us to access your financial
              data through secure third-party services. We use industry-standard encryption and
              security measures to protect your information. You can disconnect your accounts at any
              time through your account settings.
            </p>
            <p className='text-text-gray'>
              We do not store your bank login credentials. All connections are made through
              encrypted, secure channels using trusted financial data aggregation partners.
            </p>
          </section>

          <section className='mb-10'>
            <h2 className='text-2xl font-bold text-primary-dark mb-4'>6. Intellectual Property</h2>
            <p className='text-text-gray mb-4'>
              The Service and its original content, features, and functionality are and will remain
              the exclusive property of Taash Technologies Inc. and its licensors. The Service is
              protected by copyright, trademark, and other laws. Our trademarks and trade dress may
              not be used in connection with any product or service without the prior written
              consent of Taash Technologies Inc.
            </p>
          </section>

          <section className='mb-10'>
            <h2 className='text-2xl font-bold text-primary-dark mb-4'>7. User Content</h2>
            <p className='text-text-gray mb-4'>
              You retain all rights to any content you submit, post, or display on or through the
              Service (&quot;User Content&quot;). By submitting User Content, you grant us a
              worldwide, non-exclusive, royalty-free license to use, reproduce, and process your
              User Content solely for the purpose of providing the Service to you.
            </p>
            <p className='text-text-gray'>
              You represent and warrant that you own or have the necessary rights to the User
              Content you submit and that the User Content does not violate the rights of any third
              party.
            </p>
          </section>

          <section className='mb-10'>
            <h2 className='text-2xl font-bold text-primary-dark mb-4'>8. Prohibited Uses</h2>
            <p className='text-text-gray mb-4'>You agree not to use the Service:</p>
            <ul className='list-disc pl-6 text-text-gray space-y-2'>
              <li>For any unlawful purpose or in violation of any laws</li>
              <li>To impersonate any person or entity</li>
              <li>To interfere with or disrupt the Service or servers</li>
              <li>To attempt to gain unauthorized access to any part of the Service</li>
              <li>To transmit any viruses, malware, or harmful code</li>
              <li>To harvest or collect user information without consent</li>
              <li>To engage in any activity that could damage or impair the Service</li>
            </ul>
          </section>

          <section className='mb-10'>
            <h2 className='text-2xl font-bold text-primary-dark mb-4'>9. Termination</h2>
            <p className='text-text-gray mb-4'>
              We may terminate or suspend your account immediately, without prior notice or
              liability, for any reason whatsoever, including without limitation if you breach the
              Terms. Upon termination, your right to use the Service will immediately cease.
            </p>
            <p className='text-text-gray'>
              You may terminate your account at any time by contacting us or using the account
              deletion feature in the Service. Upon termination, we will delete your data in
              accordance with our Privacy Policy.
            </p>
          </section>

          <section className='mb-10'>
            <h2 className='text-2xl font-bold text-primary-dark mb-4'>
              10. Limitation of Liability
            </h2>
            <p className='text-text-gray mb-4'>
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, IN NO EVENT SHALL TAASH TECHNOLOGIES INC., ITS
              DIRECTORS, EMPLOYEES, PARTNERS, AGENTS, SUPPLIERS, OR AFFILIATES, BE LIABLE FOR ANY
              INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING WITHOUT
              LIMITATION, LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES,
              RESULTING FROM:
            </p>
            <ul className='list-disc pl-6 text-text-gray space-y-2'>
              <li>Your access to or use of or inability to access or use the Service</li>
              <li>Any conduct or content of any third party on the Service</li>
              <li>Any content obtained from the Service</li>
              <li>
                Unauthorized access, use, or alteration of your transmissions or content, whether
                based on warranty, contract, tort (including negligence), or any other legal theory,
                whether or not we have been informed of the possibility of such damage
              </li>
            </ul>
          </section>

          <section className='mb-10'>
            <h2 className='text-2xl font-bold text-primary-dark mb-4'>
              11. Disclaimer of Warranties
            </h2>
            <p className='text-text-gray mb-4'>
              THE SERVICE IS PROVIDED ON AN &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; BASIS.
              TAASH TECHNOLOGIES INC. EXPRESSLY DISCLAIMS ALL WARRANTIES OF ANY KIND, WHETHER
              EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE IMPLIED WARRANTIES OF
              MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
            </p>
            <p className='text-text-gray'>
              We do not warrant that the Service will be uninterrupted, timely, secure, or
              error-free, or that any defects will be corrected.
            </p>
          </section>

          <section className='mb-10'>
            <h2 className='text-2xl font-bold text-primary-dark mb-4'>12. Indemnification</h2>
            <p className='text-text-gray'>
              You agree to defend, indemnify, and hold harmless Taash Technologies Inc. and its
              licensees and licensors, and their employees, contractors, agents, officers, and
              directors, from and against any and all claims, damages, obligations, losses,
              liabilities, costs, or debt, and expenses (including but not limited to
              attorney&apos;s fees), resulting from or arising out of your use and access of the
              Service, or a breach of these Terms.
            </p>
          </section>

          <section className='mb-10'>
            <h2 className='text-2xl font-bold text-primary-dark mb-4'>13. Governing Law</h2>
            <p className='text-text-gray'>
              These Terms shall be governed and construed in accordance with the laws of the
              jurisdiction in which Taash Technologies Inc. is incorporated, without regard to its
              conflict of law provisions. Our failure to enforce any right or provision of these
              Terms will not be considered a waiver of those rights.
            </p>
          </section>

          <section className='mb-10'>
            <h2 className='text-2xl font-bold text-primary-dark mb-4'>14. Changes to Terms</h2>
            <p className='text-text-gray'>
              We reserve the right, at our sole discretion, to modify or replace these Terms at any
              time. If a revision is material, we will try to provide at least 30 days&apos; notice
              prior to any new terms taking effect. What constitutes a material change will be
              determined at our sole discretion. By continuing to access or use our Service after
              those revisions become effective, you agree to be bound by the revised terms.
            </p>
          </section>

          <section className='mb-10'>
            <h2 className='text-2xl font-bold text-primary-dark mb-4'>15. Contact Us</h2>
            <p className='text-text-gray'>
              If you have any questions about these Terms, please contact us at:
            </p>
            <div className='mt-4 p-4 bg-light-blue rounded-lg'>
              <p className='text-primary-dark font-medium'>Taash Technologies Inc.</p>
              <p className='text-text-gray'>Email: legal@taash.tax</p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
