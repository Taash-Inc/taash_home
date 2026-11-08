import { formatNaira } from '@/lib/tax';
import { TAX_AFTER, TAX_BEFORE, TAX_SAVED } from './demo-figures';
import PhoneDemo from './PhoneDemo';

/**
 * The hero visual: the Taash app on a phone, playing a short loop rebuilt from the real app
 * recording. The tour, its chapter tabs and its floating cards live in PhoneDemo.
 *
 * It replaced a stock photo in a gradient ellipse. Every finance hero we compared on Mobbin
 * (Jeton, Monarch, Fruitful, Legend, Aave) shows the product instead, and the Instagram ads
 * show the app, so the page now matches what people tapped on.
 */
const naira = (n: number) => `₦${formatNaira(n)}`;

export default function HeroPhone() {
  return (
    <figure className='relative mx-auto flex w-full max-w-[34rem] justify-center pt-4 lg:pt-0'>
      {/* Brand gradient, kept from the old hero so the page still reads as Taash. */}
      <div
        aria-hidden='true'
        className='absolute top-[6%] left-1/2 h-[19rem] w-[21rem] -translate-x-1/2 rounded-[50%] bg-gradient-to-b from-[#A3D3FF] to-[#FFEA66] sm:h-[24rem] sm:w-[30rem] lg:top-[10%] lg:h-[30rem] lg:w-[34rem]'
      />

      <div className='relative z-10'>
        <PhoneDemo />
      </div>

      <figcaption className='sr-only'>
        A tour of the Taash app in four parts. Swipe: an Uber ride and a laptop are marked tax
        deductible and the estimated tax drops from {naira(TAX_BEFORE)} to {naira(TAX_AFTER)}, a
        saving of {naira(TAX_SAVED)}. Scan: a receipt is read and saved as an expense. Ask: Taash AI
        points out rent relief you haven&apos;t claimed. Save: Taash shows how much tax to set
        aside each week before the 31 March deadline.
      </figcaption>
    </figure>
  );
}
