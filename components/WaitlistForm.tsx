import Image from 'next/image';
import LaunchPhone from './LaunchPhone';
import WaitlistCapture from './WaitlistCapture';

/**
 * "Be first when Taash launches": the launch message and the signup form in one section, with
 * a hand holding the phone beside them, on the app's navy. It replaced two sections in a row, an app-launch block with
 * a blank phone and store badges, then a separate form, so the visual now sits next to the
 * thing it asks people to do. The form is shared with the hero; joining in either place turns
 * both into the success state.
 */
export default function WaitlistForm() {
  return (
    <section id='waitlist' className='relative scroll-mt-20 overflow-hidden bg-[#091730] pt-20 pb-20 text-white lg:pt-28 lg:pb-28'>
      {/* The app's own navy, with a blue and a yellow glow, so this reads as the launch moment
          and not as a second hero. */}
      <div
        aria-hidden='true'
        className='pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_85%_20%,rgb(44_112_223/0.35),transparent_70%),radial-gradient(50%_45%_at_70%_95%,rgb(251_228_41/0.18),transparent_70%)]'
      />

      <div className='relative mx-auto grid max-w-6xl items-end gap-10 px-4 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-16'>
        {/* Above the photo: on wide screens the arm runs in behind this column. */}
        <div className='relative z-10'>
          <span className='inline-flex items-center gap-2 rounded-full bg-[#FFEA66] px-3.5 py-1.5 text-sm font-bold text-ink-1000'>
            <span className='live-dot' aria-hidden='true' />
            Coming soon to iOS and Android
          </span>
          <h2 className='mt-5 max-w-[16ch] text-3xl font-bold tracking-tight text-balance text-white md:text-[2.75rem] md:leading-[1.08]'>
            Be first when Taash launches
          </h2>
          <p className='mt-4 max-w-lg text-lg text-white/75'>
            Join the waitlist for early access, a lifetime discount and priority support as we roll
            out in Nigeria.
          </p>

          <div className='mt-8 max-w-lg rounded-[2rem] bg-white/10 p-1.5 ring-1 ring-white/15'>
            <div className='rounded-[calc(2rem-0.375rem)] bg-white p-6 shadow-[0_24px_60px_-28px_rgb(15_23_42/0.35)] sm:p-8'>
              <WaitlistCapture placement='section' />
            </div>
          </div>

          {/* Not links: the app isn't on the stores yet, so the badges are dimmed under a label. */}
          <div className='mt-6 flex flex-wrap items-center gap-3'>
            <span className='text-xs font-semibold tracking-[0.14em] text-white/60 uppercase'>
              Not on the stores yet
            </span>
            <span className='flex items-center gap-2 opacity-50'>
              <Image src='/app-store-badge.png' alt='Coming soon to the App Store' width={125} height={42} className='h-auto w-[96px]' />
              <Image src='/google-play-badge.png' alt='Coming soon to Google Play' width={155} height={60} className='h-auto w-[116px]' />
            </span>
          </div>
        </div>

        <LaunchPhone />
      </div>
    </section>
  );
}
