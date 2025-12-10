import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy | Taash',
  description:
    'Privacy Policy for Taash - Learn how we collect, use, and protect your personal information.',
};

export default function PrivacyPage() {
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
          <h1 className='text-4xl md:text-5xl font-bold'>Privacy Policy</h1>
          <p className='text-gray-300 mt-4'>Last updated: December 5, 2025</p>
        </div>
      </div>

      {/* Content */}
      <div className='max-w-4xl mx-auto px-6 py-12'>
        <div className='prose prose-lg max-w-none'>
          <section className='mb-10'>
            <h2 className='text-2xl font-bold text-primary-dark mb-4'>1. Introduction</h2>
            <p className='text-text-gray mb-4'>
              Taash Technologies Inc. (&quot;Company,&quot; &quot;we,&quot; &quot;us,&quot; or
              &quot;our&quot;) respects your privacy and is committed to protecting your personal
              data. This Privacy Policy explains how we collect, use, disclose, and safeguard your
              information when you use our financial management application and related services
              (collectively, the &quot;Service&quot;).
            </p>
            <p className='text-text-gray'>
              Please read this Privacy Policy carefully. By using the Service, you agree to the
              collection and use of information in accordance with this policy.
            </p>
          </section>

          <section className='mb-10'>
            <h2 className='text-2xl font-bold text-primary-dark mb-4'>2. Information We Collect</h2>

            <h3 className='text-xl font-semibold text-primary-dark mb-3 mt-6'>
              2.1 Personal Information You Provide
            </h3>
            <p className='text-text-gray mb-4'>
              We collect information you provide directly to us, including:
            </p>
            <ul className='list-disc pl-6 text-text-gray space-y-2 mb-4'>
              <li>
                <strong>Account Information:</strong> Name, email address, phone number, and
                password when you create an account
              </li>
              <li>
                <strong>Profile Information:</strong> Business type, industry, and tax filing status
              </li>
              <li>
                <strong>Communication Data:</strong> Information you provide when contacting our
                support team
              </li>
            </ul>

            <h3 className='text-xl font-semibold text-primary-dark mb-3 mt-6'>
              2.2 Financial Information
            </h3>
            <p className='text-text-gray mb-4'>
              When you connect your bank accounts or financial institutions to Taash, we collect:
            </p>
            <ul className='list-disc pl-6 text-text-gray space-y-2 mb-4'>
              <li>Transaction history and details</li>
              <li>Account balances</li>
              <li>Account and routing numbers (encrypted)</li>
              <li>Financial institution names</li>
            </ul>
            <p className='text-text-gray'>
              <strong>Important:</strong> We never store your bank login credentials. All financial
              connections are facilitated through secure, encrypted third-party services (such as
              Plaid) that comply with banking security standards.
            </p>

            <h3 className='text-xl font-semibold text-primary-dark mb-3 mt-6'>
              2.3 Receipt and Document Data
            </h3>
            <p className='text-text-gray mb-4'>
              When you upload receipts or documents, we collect and process:
            </p>
            <ul className='list-disc pl-6 text-text-gray space-y-2'>
              <li>Images of receipts and documents</li>
              <li>Extracted text and data from receipts (merchant name, amount, date, items)</li>
              <li>Categories and tags you assign</li>
            </ul>

            <h3 className='text-xl font-semibold text-primary-dark mb-3 mt-6'>
              2.4 Automatically Collected Information
            </h3>
            <p className='text-text-gray mb-4'>
              When you use our Service, we automatically collect:
            </p>
            <ul className='list-disc pl-6 text-text-gray space-y-2'>
              <li>Device information (device type, operating system, unique device identifiers)</li>
              <li>Log data (IP address, browser type, pages visited, time spent)</li>
              <li>Usage data (features used, actions taken within the app)</li>
              <li>
                Location data (general location based on IP address, with your consent for precise
                location)
              </li>
            </ul>
          </section>

          <section className='mb-10'>
            <h2 className='text-2xl font-bold text-primary-dark mb-4'>
              3. How We Use Your Information
            </h2>
            <p className='text-text-gray mb-4'>We use the information we collect to:</p>
            <ul className='list-disc pl-6 text-text-gray space-y-2'>
              <li>Provide, maintain, and improve the Service</li>
              <li>Process and categorize your financial transactions</li>
              <li>Generate tax estimates and financial insights</li>
              <li>Extract and organize data from uploaded receipts</li>
              <li>Send you technical notices, updates, and support messages</li>
              <li>Respond to your comments, questions, and customer service requests</li>
              <li>Detect, prevent, and address fraud, security issues, and technical problems</li>
              <li>Analyze usage patterns to improve user experience</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section className='mb-10'>
            <h2 className='text-2xl font-bold text-primary-dark mb-4'>
              4. How We Share Your Information
            </h2>
            <p className='text-text-gray mb-4'>
              We do not sell your personal information. We may share your information in the
              following circumstances:
            </p>

            <h3 className='text-xl font-semibold text-primary-dark mb-3 mt-6'>
              4.1 Service Providers
            </h3>
            <p className='text-text-gray mb-4'>
              We share information with third-party vendors who perform services on our behalf,
              including:
            </p>
            <ul className='list-disc pl-6 text-text-gray space-y-2 mb-4'>
              <li>Financial data aggregation providers (e.g., Plaid)</li>
              <li>Cloud hosting providers</li>
              <li>Analytics providers</li>
              <li>Customer support tools</li>
            </ul>
            <p className='text-text-gray'>
              These providers are contractually obligated to protect your information and use it
              only for the purposes we specify.
            </p>

            <h3 className='text-xl font-semibold text-primary-dark mb-3 mt-6'>
              4.2 Legal Requirements
            </h3>
            <p className='text-text-gray'>
              We may disclose your information if required to do so by law or in response to valid
              requests by public authorities (e.g., a court or government agency), or to protect our
              rights, privacy, safety, or property, or that of our users or the public.
            </p>

            <h3 className='text-xl font-semibold text-primary-dark mb-3 mt-6'>
              4.3 Business Transfers
            </h3>
            <p className='text-text-gray'>
              If we are involved in a merger, acquisition, or sale of all or a portion of our
              assets, your information may be transferred as part of that transaction. We will
              notify you of any change in ownership or uses of your personal information.
            </p>

            <h3 className='text-xl font-semibold text-primary-dark mb-3 mt-6'>
              4.4 With Your Consent
            </h3>
            <p className='text-text-gray'>
              We may share your information with third parties when you give us explicit consent to
              do so.
            </p>
          </section>

          <section className='mb-10'>
            <h2 className='text-2xl font-bold text-primary-dark mb-4'>5. Data Security</h2>
            <p className='text-text-gray mb-4'>
              We implement appropriate technical and organizational security measures to protect
              your personal information, including:
            </p>
            <ul className='list-disc pl-6 text-text-gray space-y-2'>
              <li>256-bit AES encryption for data at rest</li>
              <li>TLS 1.3 encryption for data in transit</li>
              <li>Regular security audits and penetration testing</li>
              <li>Multi-factor authentication options</li>
              <li>Strict access controls and employee training</li>
              <li>SOC 2 Type II compliance (or working toward certification)</li>
            </ul>
            <p className='text-text-gray mt-4'>
              While we strive to protect your personal information, no method of transmission over
              the Internet or electronic storage is 100% secure. We cannot guarantee absolute
              security.
            </p>
          </section>

          <section className='mb-10'>
            <h2 className='text-2xl font-bold text-primary-dark mb-4'>6. Data Retention</h2>
            <p className='text-text-gray mb-4'>
              We retain your personal information for as long as your account is active or as needed
              to provide you with the Service. We will also retain and use your information as
              necessary to:
            </p>
            <ul className='list-disc pl-6 text-text-gray space-y-2'>
              <li>Comply with legal obligations (e.g., tax and accounting requirements)</li>
              <li>Resolve disputes</li>
              <li>Enforce our agreements</li>
            </ul>
            <p className='text-text-gray mt-4'>
              When you delete your account, we will delete or anonymize your personal information
              within 30 days, except where we are required to retain it for legal purposes.
            </p>
          </section>

          <section className='mb-10'>
            <h2 className='text-2xl font-bold text-primary-dark mb-4'>
              7. Your Rights and Choices
            </h2>
            <p className='text-text-gray mb-4'>
              Depending on your location, you may have certain rights regarding your personal
              information:
            </p>

            <h3 className='text-xl font-semibold text-primary-dark mb-3 mt-6'>7.1 Access</h3>
            <p className='text-text-gray'>
              You can request a copy of the personal information we hold about you.
            </p>

            <h3 className='text-xl font-semibold text-primary-dark mb-3 mt-6'>7.2 Correction</h3>
            <p className='text-text-gray'>
              You can update or correct your personal information through your account settings or
              by contacting us.
            </p>

            <h3 className='text-xl font-semibold text-primary-dark mb-3 mt-6'>7.3 Deletion</h3>
            <p className='text-text-gray'>
              You can request that we delete your personal information, subject to certain
              exceptions required by law.
            </p>

            <h3 className='text-xl font-semibold text-primary-dark mb-3 mt-6'>
              7.4 Data Portability
            </h3>
            <p className='text-text-gray'>
              You can request a copy of your data in a structured, commonly used, machine-readable
              format.
            </p>

            <h3 className='text-xl font-semibold text-primary-dark mb-3 mt-6'>
              7.5 Opt-Out of Marketing
            </h3>
            <p className='text-text-gray'>
              You can unsubscribe from marketing communications at any time by clicking the
              &quot;unsubscribe&quot; link in our emails or adjusting your notification preferences.
            </p>

            <h3 className='text-xl font-semibold text-primary-dark mb-3 mt-6'>
              7.6 Disconnect Financial Accounts
            </h3>
            <p className='text-text-gray'>
              You can disconnect your linked bank accounts at any time through your account
              settings.
            </p>
          </section>

          <section className='mb-10'>
            <h2 className='text-2xl font-bold text-primary-dark mb-4'>
              8. California Privacy Rights (CCPA)
            </h2>
            <p className='text-text-gray mb-4'>
              If you are a California resident, you have additional rights under the California
              Consumer Privacy Act (CCPA):
            </p>
            <ul className='list-disc pl-6 text-text-gray space-y-2'>
              <li>
                The right to know what personal information we collect, use, disclose, and sell
              </li>
              <li>The right to delete your personal information</li>
              <li>
                The right to opt-out of the sale of personal information (we do not sell data)
              </li>
              <li>The right to non-discrimination for exercising your privacy rights</li>
            </ul>
            <p className='text-text-gray mt-4'>
              To exercise these rights, please contact us at privacy@taash.app.
            </p>
          </section>

          <section className='mb-10'>
            <h2 className='text-2xl font-bold text-primary-dark mb-4'>
              9. European Privacy Rights (GDPR)
            </h2>
            <p className='text-text-gray mb-4'>
              If you are in the European Economic Area (EEA), United Kingdom, or Switzerland, you
              have additional rights under the General Data Protection Regulation (GDPR):
            </p>
            <ul className='list-disc pl-6 text-text-gray space-y-2'>
              <li>Right to access, rectify, or erase your personal data</li>
              <li>Right to restrict or object to processing</li>
              <li>Right to data portability</li>
              <li>Right to withdraw consent at any time</li>
              <li>Right to lodge a complaint with a supervisory authority</li>
            </ul>
            <p className='text-text-gray mt-4'>
              Our legal basis for processing your information includes: performance of a contract,
              legitimate interests, compliance with legal obligations, and your consent.
            </p>
          </section>

          <section className='mb-10'>
            <h2 className='text-2xl font-bold text-primary-dark mb-4'>
              10. International Transfers
            </h2>
            <p className='text-text-gray'>
              Your information may be transferred to and maintained on servers located outside of
              your state, province, country, or other governmental jurisdiction where data
              protection laws may differ. If you are located outside the United States and choose to
              provide information to us, please note that we transfer the data to the United States
              and process it there. We use appropriate safeguards such as Standard Contractual
              Clauses to protect your information during international transfers.
            </p>
          </section>

          <section className='mb-10'>
            <h2 className='text-2xl font-bold text-primary-dark mb-4'>
              11. Children&apos;s Privacy
            </h2>
            <p className='text-text-gray'>
              Our Service is not intended for anyone under the age of 18. We do not knowingly
              collect personal information from children under 18. If we learn we have collected
              personal information from a child under 18, we will delete that information as quickly
              as possible. If you believe we might have any information from or about a child under
              18, please contact us at privacy@taash.app.
            </p>
          </section>

          <section className='mb-10'>
            <h2 className='text-2xl font-bold text-primary-dark mb-4'>
              12. Cookies and Tracking Technologies
            </h2>
            <p className='text-text-gray mb-4'>
              We use cookies and similar tracking technologies to:
            </p>
            <ul className='list-disc pl-6 text-text-gray space-y-2'>
              <li>Keep you logged in</li>
              <li>Remember your preferences</li>
              <li>Understand how you use our Service</li>
              <li>Improve our Service</li>
            </ul>
            <p className='text-text-gray mt-4'>
              You can instruct your browser to refuse all cookies or to indicate when a cookie is
              being sent. However, if you do not accept cookies, you may not be able to use some
              portions of our Service.
            </p>
          </section>

          <section className='mb-10'>
            <h2 className='text-2xl font-bold text-primary-dark mb-4'>
              13. Third-Party Links and Services
            </h2>
            <p className='text-text-gray'>
              Our Service may contain links to third-party websites or services that are not owned
              or controlled by us. We have no control over, and assume no responsibility for, the
              content, privacy policies, or practices of any third-party websites or services. We
              encourage you to review the privacy policies of every site you visit.
            </p>
          </section>

          <section className='mb-10'>
            <h2 className='text-2xl font-bold text-primary-dark mb-4'>
              14. Changes to This Privacy Policy
            </h2>
            <p className='text-text-gray'>
              We may update this Privacy Policy from time to time. We will notify you of any changes
              by posting the new Privacy Policy on this page and updating the &quot;Last
              updated&quot; date. For significant changes, we will provide additional notice, such
              as via email or a prominent notice within the Service. Your continued use of the
              Service after such modifications constitutes your acknowledgment and agreement to the
              updated Privacy Policy.
            </p>
          </section>

          <section className='mb-10'>
            <h2 className='text-2xl font-bold text-primary-dark mb-4'>15. Contact Us</h2>
            <p className='text-text-gray'>
              If you have any questions about this Privacy Policy or our privacy practices, please
              contact us:
            </p>
            <div className='mt-4 p-4 bg-light-blue rounded-lg'>
              <p className='text-primary-dark font-medium'>Taash Technologies Inc.</p>
              <p className='text-text-gray'>Email: privacy@taash.app</p>
              <p className='text-text-gray'>For data protection inquiries: dpo@taash.app</p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
