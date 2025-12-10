import About from '@/components/About';
import AppDownload from '@/components/AppDownload';
import Features from '@/components/Features';
import Footer from '@/components/Footer';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import HowItWorks from '@/components/HowItWorks';
import Resources from '@/components/Resources';
import WaitlistForm from '@/components/WaitlistForm';
import WhoItsFor from '@/components/WhoItsFor';

export default function Home() {
  return (
    <>
      <Header />
      <main role='main' itemScope itemType='https://schema.org/WebPage'>
        <article>
          <Hero />
          <About />
          <HowItWorks />
          <Features />
          <WhoItsFor />
          <AppDownload />
          <WaitlistForm />
          <Resources />
        </article>
      </main>
      <Footer />
    </>
  );
}
