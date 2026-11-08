import type { Metadata } from 'next';
import About from '@/components/About';
import FAQ from '@/components/FAQ';
import Features from '@/components/Features';
import Footer from '@/components/Footer';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import HowItWorks from '@/components/HowItWorks';
import Resources from '@/components/Resources';
import { FAQSchema } from '@/components/StructuredData';
import TaxEstimator from '@/components/TaxEstimator';
import TrustStrip from '@/components/TrustStrip';
import WaitlistForm from '@/components/WaitlistForm';
import WhoItsFor from '@/components/WhoItsFor';

// Revalidate every hour — homepage content rarely changes
// Between revalidations, the page is served instantly from Vercel's edge CDN
export const revalidate = 3600;

export const metadata: Metadata = { alternates: { canonical: '/' } };

export default function Home() {
  return (
    <>
      <Header />
      <main role='main' itemScope itemType='https://schema.org/WebPage'>
        <article>
          <Hero />
          <TrustStrip />
          <About />
          <HowItWorks />
          <Features />
          <WhoItsFor />
          <TaxEstimator />
          <WaitlistForm />
          <FAQ />
          <Resources />
        </article>
      </main>
      <Footer />
      <FAQSchema />
    </>
  );
}
