import FAQ from '@/components/FAQ';
import Footer from '@/components/Footer';
import Header from '@/components/Header';
import { BreadcrumbSchema, CalculatorSchema, FAQSchema } from '@/components/StructuredData';
import TaxEstimator from '@/components/TaxEstimator';
import TaxGuide from '@/components/TaxGuide';
import WaitlistForm from '@/components/WaitlistForm';
import { CALCULATOR_FAQ } from '@/lib/faq';
import { TAX_YEAR } from '@/lib/tax';
import type { Metadata } from 'next';

/**
 * A page of its own for the calculator, so it can rank for "Nigeria tax calculator 2026",
 * "PAYE calculator Nigeria" and similar searches, which a section halfway down the homepage
 * can't. Same calculator, plus the rules in writing and its own FAQ.
 */
export const revalidate = 3600;

const OG_IMAGE = { url: '/og-image.png?v=2', width: 1200, height: 630, alt: 'Taash: Nigeria tax calculator 2026' };

const title = `Nigeria Tax Calculator ${TAX_YEAR}: PAYE and Self-Employed`;
const description = `Free ${TAX_YEAR} tax calculator for Nigeria. Work out your PAYE or freelance income tax under the Nigeria Tax Act 2025, with pension, NHF, NHIS and rent relief.`;

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: '/tax-calculator' },
  // A page's openGraph replaces the layout's whole object, so the share image has to be repeated
  // here or links to the calculator are shared with no preview image.
  openGraph: { title, description, url: '/tax-calculator', type: 'website', images: [OG_IMAGE] },
  twitter: { card: 'summary_large_image', title, description, images: [OG_IMAGE.url] },
};

export default function TaxCalculatorPage() {
  return (
    <>
      <Header />
      <main>
        <TaxEstimator standalone />
        <TaxGuide />
        <FAQ
          items={CALCULATOR_FAQ}
          title='Tax calculator questions'
          intro='How the calculator works, and what it includes.'
        />
        <WaitlistForm />
      </main>
      <Footer />
      <CalculatorSchema />
      <FAQSchema items={CALCULATOR_FAQ} />
      <BreadcrumbSchema
        items={[
          { name: 'Home', path: '/' },
          { name: 'Tax calculator', path: '/tax-calculator' },
        ]}
      />
    </>
  );
}
