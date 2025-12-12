import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy | Taash',
  description:
    'Privacy Policy for Taash - Learn how we collect, use, and protect your personal information.',
};

export default function PrivacyPage() {
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
          <h1 className='text-4xl md:text-5xl font-bold'>Privacy Policy</h1>
          <p className='text-gray-300 mt-4'>Last updated: December 12, 2025</p>
        </div>
      </div>

      {/* Content */}
      <div className='max-w-4xl mx-auto px-6 py-12'>
        <div className='prose prose-lg max-w-none font-sans'>
          <section className='mb-10'>
            <h2 className='text-2xl font-bold text-primary-dark mb-4'>1. Who We Are</h2>
            <p className='text-text-gray'>
              <strong>Taash Technologies Inc.</strong> (or registered entity) — &quot;Taash&quot;,
              &quot;we&quot;, &quot;our&quot;, &quot;us&quot; — operates this website and all
              related apps and services. We provide AI‑powered tax‑preparation and
              financial‑management services for freelancers, creators, and SMEs in Nigeria and
              beyond.
            </p>
          </section>

          <section className='mb-10'>
            <h2 className='text-2xl font-bold text-primary-dark mb-4'>
              2. Why This Policy Matters / Your Rights
            </h2>
            <p className='text-text-gray'>
              We respect your privacy and are committed to protecting your personal data. This
              policy explains what data we collect, why we collect it, how we use it—and the rights
              you have under the law (Nigeria Data Protection Act 2023 / NDPR). You should read this
              before using our services.
            </p>
          </section>

          <section className='mb-10'>
            <h2 className='text-2xl font-bold text-primary-dark mb-4'>3. What Data We Collect</h2>
            <p className='text-text-gray mb-4'>Depending on how you use Taash, we may collect:</p>
            <ul className='list-disc pl-6 text-text-gray space-y-2 mb-4'>
              <li>
                <strong>Identity &amp; Contact Data:</strong> full name, email, phone number,
                address (optional), Tax ID (if provided).
              </li>
              <li>
                <strong>Financial &amp; Transaction Data:</strong> bank account metadata (via
                open‑banking integrations), transaction history, income/expense entries, receipts or
                invoices you upload, details of your income sources.
              </li>
              <li>
                <strong>Usage &amp; Device Data:</strong> IP address, browser / device information,
                usage logs, timestamps, cookies (if any), metadata (for analytics, security, and
                service improvement).
              </li>
              <li>
                <strong>User‑Provided Documents:</strong> receipts, invoices, proof of expense,
                attachments, uploaded files.
              </li>
            </ul>
            <p className='text-text-gray'>
              We only collect data necessary for the services you request and with your consent.
            </p>
          </section>

          <section className='mb-10'>
            <h2 className='text-2xl font-bold text-primary-dark mb-4'>4. How We Use Your Data</h2>
            <p className='text-text-gray mb-4'>Taash uses your data for the following purposes:</p>
            <ul className='list-disc pl-6 text-text-gray space-y-2 mb-4'>
              <li>
                To provide tax‑preparation, financial‑tracking, reporting, estimation, and analytics
                services.
              </li>
              <li>
                To generate documents: expense ledgers, income summaries, deduction reports,
                tax‑estimate sheets, exportable PDFs/CSVs.
              </li>
              <li>
                To send notifications, reminders, updates about your account or tax‑relevant
                deadlines.
              </li>
              <li>To enable integrations (open banking, bank APIs) when you connect accounts.</li>
              <li>
                To improve and maintain our services: debugging, analytics, product improvements,
                usage data.
              </li>
              <li>
                To comply with legal and regulatory obligations (e.g. record-keeping, audit trails).
              </li>
            </ul>
            <p className='text-text-gray'>
              We will not use your data for purposes other than those listed above without asking
              for new consent.
            </p>
          </section>

          <section className='mb-10'>
            <h2 className='text-2xl font-bold text-primary-dark mb-4'>
              5. Data Sharing &amp; Third‑Party Use
            </h2>
            <p className='text-text-gray mb-4'>
              In providing services, Taash may share your data with third‑party service providers —
              for example:
            </p>
            <ul className='list-disc pl-6 text-text-gray space-y-2 mb-4'>
              <li>
                Banking / open‑banking API providers (e.g. connection to your banks/payment
                processors), strictly where you opt‑in.
              </li>
              <li>
                Analytics or performance monitoring tools (for app performance, security, usage
                tracking).
              </li>
              <li>
                Subprocessors or cloud servers (for storage, backup, processing) under strict
                data‑processing agreements.
              </li>
            </ul>
            <p className='text-text-gray mb-4'>
              <strong>We do not sell or trade your personal data.</strong>
            </p>
            <p className='text-text-gray'>
              Any sharing is strictly governed by data‑processing agreements that comply with NDPA /
              NDPR (or equivalent).
            </p>
          </section>

          <section className='mb-10'>
            <h2 className='text-2xl font-bold text-primary-dark mb-4'>
              6. Your Rights as User / Data Subject
            </h2>
            <p className='text-text-gray mb-4'>
              Under Nigeria&apos;s data‑protection law, you have:
            </p>
            <ul className='list-disc pl-6 text-text-gray space-y-2 mb-4'>
              <li>
                <strong>The Right to Access:</strong> you can request a copy of your personal data
                that we hold.
              </li>
              <li>
                <strong>The Right to Rectification:</strong> if your data is incomplete, inaccurate,
                or outdated, you can request corrections.
              </li>
              <li>
                <strong>The Right to Deletion (&apos;Right to be Forgotten&apos;):</strong> under
                certain conditions, you may request deletion of your personal data.
              </li>
              <li>
                <strong>The Right to Withdraw Consent:</strong> you can withdraw consent for data
                processing — though this may affect your ability to use certain features.
              </li>
              <li>
                <strong>The Right to Data Portability:</strong> you can request your data in a
                commonly used machine-readable format (e.g. CSV, JSON).
              </li>
              <li>
                <strong>The Right to Lodge a Complaint:</strong> if you believe your data protection
                rights have been violated, you may contact us — or the data‑protection authority
                (Nigeria Data Protection Commission, NDPC).
              </li>
            </ul>
            <p className='text-text-gray'>
              To exercise any of these rights, please contact us at:{' '}
              <a href='mailto:privacy@taash.tax' className='text-primary-blue hover:underline'>
                privacy@taash.tax
              </a>
            </p>
          </section>

          <section className='mb-10'>
            <h2 className='text-2xl font-bold text-primary-dark mb-4'>
              7. Data Security, Retention &amp; Deletion
            </h2>
            <p className='text-text-gray mb-4'>
              We implement appropriate technical and organizational safeguards: encryption (in
              transit and at rest), secure storage, access controls, audit logging, periodic
              security reviews.
            </p>
            <p className='text-text-gray mb-4'>
              We apply the principle of data minimization — we only store what is strictly necessary
              for service delivery.
            </p>
            <p className='text-text-gray mb-4'>We retain data only as long as required:</p>
            <ul className='list-disc pl-6 text-text-gray space-y-2 mb-4'>
              <li>
                <strong>For active users:</strong> as long as your account is active.
              </li>
              <li>
                <strong>For inactive users:</strong> for a period consistent with legal or
                compliance needs — after which data is anonymized or securely deleted.
              </li>
            </ul>
            <p className='text-text-gray'>
              In the event of a data breach, we will follow best practices and notify affected users
              and regulators as required by law.
            </p>
          </section>

          <section className='mb-10'>
            <h2 className='text-2xl font-bold text-primary-dark mb-4'>
              8. Consent &amp; Age / Eligibility
            </h2>
            <p className='text-text-gray'>
              By using Taash services, you consent to data collection and processing outlined in
              this policy. You confirm you are at least 18 years old (or legal adult in your
              jurisdiction) and competent to enter into this agreement.
            </p>
          </section>

          <section className='mb-10'>
            <h2 className='text-2xl font-bold text-primary-dark mb-4'>9. Changes to This Policy</h2>
            <p className='text-text-gray'>
              We may update this Privacy Policy occasionally — for example to reflect changes in
              law, regulations, business practices, or features. We will post the updated version
              with a &quot;Last updated&quot; date. Continued use after updates constitutes your
              acceptance of the changes.
            </p>
          </section>

          <section className='mb-10'>
            <h2 className='text-2xl font-bold text-primary-dark mb-4'>
              10. Contact / Data Protection Officer
            </h2>
            <p className='text-text-gray mb-4'>
              If you have any questions, requests, or complaints about our privacy practices, you
              can contact our DPO at:
            </p>
            <div className='mt-4 p-4 bg-light-blue rounded-lg'>
              <p className='text-primary-dark font-medium'>Taash Technologies Inc.</p>
              <p className='text-text-gray'>
                Email:{' '}
                <a href='mailto:privacy@taash.tax' className='text-primary-blue hover:underline'>
                  privacy@taash.tax
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
