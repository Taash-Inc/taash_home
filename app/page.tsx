import About from '@/components/About';
import AppDownload from '@/components/AppDownload';
import Features from '@/components/Features';
import Footer from '@/components/Footer';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import Resources from '@/components/Resources';
import TaxEstimator from '@/components/TaxEstimator';
import WaitlistForm from '@/components/WaitlistForm';
import WhoItsFor from '@/components/WhoItsFor';

// Revalidate every hour — homepage content rarely changes
// Between revalidations, the page is served instantly from Vercel's edge CDN
export const revalidate = 3600;

export default function Home() {
  return (
    <>
      <Header />
      <main role='main' itemScope itemType='https://schema.org/WebPage'>
        <article>
          <Hero />
          <About />
          {/* <HowItWorks /> */}
          <Features />
          <WhoItsFor />
          <TaxEstimator />
          <AppDownload />
          <WaitlistForm />
          <Resources />
        </article>
      </main>
      <Footer />
    </>
  );
}
