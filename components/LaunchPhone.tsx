'use client';

import { RENT_SAVING, WEEKLY } from '@/components/hero/demo-figures';
import { formatNaira } from '@/lib/tax';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

/**
 * A real hand holding a phone whose lock screen fills with Taash notifications, beside the
 * waitlist form. A photograph, unlike the hero's drawn phone, so the two sections don't look
 * alike. The last notification is the one waitlist members get first: "Taash is live". The
 * pattern is Selfridges' "be first to know" section on Mobbin.
 *
 * The screen is laid over the photo's own blank screen. Its box was measured from
 * public/launch-hand.png (1060×1092, cropped from phone-hand.png to drop a stray mark): left
 * 59.25%, top 3.30%, width 28.77%, height 62.09%. Re-measure if the photo changes.
 *
 * Plays once when it scrolls into view and then stays still, so it needs no pause control.
 * With reduced motion the notifications are simply there.
 */
const naira = (n: number) => `₦${formatNaira(n)}`;

const NOTIFICATIONS = [
  { when: '1h ago', title: 'Set aside this week', body: `${naira(WEEKLY)} keeps you ready for 31 March.` },
  { when: '12m ago', title: 'Rent relief found', body: `Claim it to save about ${naira(RENT_SAVING)}.` },
  { when: 'now', title: 'Taash is live 🎉', body: 'Your early-access link is ready.', highlight: true },
];

export default function LaunchPhone() {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    // The arm runs off the bottom of the section, so this box sits flush with its bottom edge.
    <div ref={ref} className='relative -mb-20 h-[33rem] self-end sm:h-[37rem] lg:-mb-28 lg:h-[39rem] xl:h-[45rem]'>
      <div
        role='img'
        aria-label='A hand holding a phone. Its lock screen shows Taash notifications: a weekly set-aside reminder, rent relief found, and “Taash is live, your early-access link is ready.”'
        className='absolute bottom-0 left-1/2 w-[32rem] -translate-x-[73.6%] sm:w-[36rem] lg:w-[38rem] lg:-translate-x-[66%] xl:w-[44rem]'>
        <Image
          src='/launch-hand.png'
          alt=''
          width={1060}
          height={1092}
          sizes='(min-width: 1280px) 704px, (min-width: 1024px) 608px, (min-width: 640px) 576px, 512px'
          className='h-auto w-full select-none'
        />

        <div
          className='absolute overflow-hidden bg-[radial-gradient(120%_70%_at_80%_0%,#2c70df_0%,transparent_60%),radial-gradient(90%_60%_at_0%_100%,rgb(251_228_41/0.4)_0%,transparent_60%),linear-gradient(180deg,#091730,#0d1f42)] text-white [container-type:inline-size]'
          style={{ left: '59.25%', top: '3.3%', width: '28.77%', height: '62.09%', borderRadius: '10.5% / 4.7%' }}>
          {/* The photo's own notch, redrawn on top of the screen. */}
          <span className='absolute top-0 left-[22%] h-[3.4%] w-[55%] rounded-b-[30%] bg-black' />

          <div className='pt-[17cqw] text-center'>
            <p className='text-[5.5cqw] font-medium text-white/80'>Sunday 8 November</p>
            <p className='text-[23cqw] leading-none font-semibold tracking-tight'>9:41</p>
          </div>

          <ul className='mt-[7cqw] flex flex-col-reverse gap-[2.5cqw] px-[3.5cqw]'>
            {NOTIFICATIONS.map((n, i) => (
              <li
                key={n.title}
                style={{ transitionDelay: shown ? `${400 + i * 750}ms` : '0ms' }}
                className={`flex gap-[3cqw] rounded-[5cqw] p-[3.2cqw] transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:translate-y-0 motion-reduce:opacity-100 ${n.highlight ? 'bg-white text-ink-1000' : 'bg-white/15 backdrop-blur-md'} ${shown ? 'translate-y-0 opacity-100' : '-translate-y-[4cqw] opacity-0'}`}>
                <span className='grid size-[11cqw] shrink-0 place-items-center rounded-[3cqw] bg-[#fbe429] text-ink-1000'>
                  <svg className='w-[6.5cqw]' viewBox='0 0 25 21' fill='currentColor' aria-hidden='true'>
                    <path d='M0 7.6c0-.34.36-.56.66-.4l11.53 6 11.28-5.88c.3-.16.66.06.66.4V20c0 .34-.36.56-.66.4l-11.53-6L.66 20.28c-.3.16-.66-.06-.66-.4z' />
                  </svg>
                </span>
                <span className='min-w-0 flex-1'>
                  <span className='flex items-baseline justify-between gap-[2cqw]'>
                    <span className='truncate text-[6cqw] font-semibold'>{n.title}</span>
                    <span className={`shrink-0 text-[4.4cqw] ${n.highlight ? 'text-ink-600' : 'text-white/60'}`}>{n.when}</span>
                  </span>
                  <span className={`block text-[5.4cqw] leading-snug ${n.highlight ? 'text-ink-800' : 'text-white/85'}`}>{n.body}</span>
                </span>
              </li>
            ))}
          </ul>

          <span className='absolute bottom-[2.5%] left-1/2 h-[1%] w-[36%] -translate-x-1/2 rounded-full bg-white/80' />
        </div>
      </div>
    </div>
  );
}
