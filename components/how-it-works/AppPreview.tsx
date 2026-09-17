'use client';

import { APP_PREVIEW_CHAPTERS, chapterProgress, formatTimestamp } from '@/lib/app-preview';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';

/** Sampled from the video's own background, so the frame never flashes a different navy. */
const CANVAS = '#0a1a31';

function PlayIcon({ className }: { className: string }) {
  return (
    <svg viewBox='0 0 24 24' fill='currentColor' aria-hidden='true' className={className}>
      <path d='M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z' />
    </svg>
  );
}

function ControlButton({
  label,
  pressed,
  onClick,
  children,
}: {
  label: string;
  pressed?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  // A 44px target around a 36px disc on phones, where a full 44px disc would cover the video's
  // subtitle line; 44px disc from sm up.
  return (
    <button
      type='button'
      aria-label={label}
      aria-pressed={pressed}
      onClick={onClick}
      className='group grid size-11 cursor-pointer place-items-center'>
      <span
        className='grid size-9 place-items-center rounded-full border border-white/20 text-white backdrop-blur-sm transition-colors group-hover:border-white/40 sm:size-11'
        style={{ backgroundColor: `color-mix(in srgb, ${CANVAS} 65%, transparent)` }}>
        {children}
      </span>
    </button>
  );
}

/**
 * The app preview video with its five chapters. Autoplays muted whenever the video is on screen
 * and pauses when it leaves, so it always starts where the visitor can see it. The pause button
 * keeps autoplay within WCAG 2.2.2. A visitor's own pause is remembered: scrolling away and back
 * doesn't restart it.
 *
 * The chapter fills are written straight to the DOM on each animation frame rather than through
 * state, so playback doesn't re-render the component 60 times a second.
 */
export default function AppPreview() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fillRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const userPaused = useRef(false);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [blocked, setBlocked] = useState(false);
  const [active, setActive] = useState(-1);

  const play = useCallback(() => {
    userPaused.current = false;
    videoRef.current?.play().catch((err: DOMException) => {
      // Autoplay refused outright (e.g. iOS Low Power Mode) — fall back to a play button. Other
      // rejections are a play() interrupted by a pause() and need nothing.
      if (err.name === 'NotAllowedError') setBlocked(true);
    });
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    // React doesn't reliably emit the muted attribute, and browsers only autoplay muted video.
    video.muted = true;

    let frame = 0;
    const paint = () => {
      const { active, progress } = chapterProgress(video.currentTime);
      setActive(active);
      progress.forEach((p, i) => {
        const fill = fillRefs.current[i];
        if (fill) fill.style.transform = `scaleX(${p})`;
      });
    };
    const tick = () => {
      paint();
      frame = requestAnimationFrame(tick);
    };
    const onPlay = () => {
      setPlaying(true);
      setBlocked(false);
      cancelAnimationFrame(frame);
      tick();
    };
    const onPause = () => {
      setPlaying(false);
      cancelAnimationFrame(frame);
      paint();
    };
    const onVolumeChange = () => setMuted(video.muted);

    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('seeked', paint);
    video.addEventListener('volumechange', onVolumeChange);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) video.pause();
        else if (!userPaused.current) play();
      },
      { threshold: 0.35 },
    );
    observer.observe(video);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('seeked', paint);
      video.removeEventListener('volumechange', onVolumeChange);
    };
  }, [play]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      play();
    } else {
      userPaused.current = true;
      video.pause();
    }
  };

  const toggleSound = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    if (!video.muted && video.paused) play();
  };

  const seek = (start: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = start;
    play();
  };

  return (
    <div className='mt-9 grid gap-5 xl:grid-cols-[minmax(0,1fr)_20rem] xl:gap-x-10 xl:gap-y-4'>
      <div
        className='relative aspect-video overflow-hidden rounded-2xl ring-1 ring-ink-1000/10'
        style={{ backgroundColor: CANVAS }}>
        {/* Poster is frame 0, so the hand-off from poster to playback is invisible. Phones get
            the 720p cut (2.2 MB), everything else 1080p (4.0 MB); a browser that ignores
            <source media> falls through to the 720p file. */}
        <video
          ref={videoRef}
          muted
          loop
          playsInline
          preload='none'
          poster='/app-preview/poster.webp'
          disablePictureInPicture
          aria-label='30-second preview of the Taash app: scanning a receipt, sorting transactions, asking Taash AI, finding ways to pay less, and generating a Tax Year Pack'
          className='size-full object-cover'>
          <source src='/app-preview/app-preview-720.mp4' type='video/mp4' media='(max-width: 767px)' />
          <source src='/app-preview/app-preview-1080.mp4' type='video/mp4' />
        </video>

        {blocked ? (
          <button
            type='button'
            onClick={play}
            className='absolute inset-0 grid cursor-pointer content-center justify-items-center gap-3 text-[0.9375rem] font-semibold text-white'
            style={{ backgroundColor: `color-mix(in srgb, ${CANVAS} 45%, transparent)` }}>
            <span className='grid size-14 place-items-center rounded-full bg-signal-500 text-ink-1000 shadow-lg sm:size-18'>
              <PlayIcon className='ml-1 size-6' />
            </span>
            <span
              className='rounded-full px-4 py-2'
              style={{ backgroundColor: `color-mix(in srgb, ${CANVAS} 90%, transparent)` }}>
              Watch the 30-second preview
            </span>
          </button>
        ) : (
          // Bottom-left is the one corner the video keeps clear in every chapter: the logo sits
          // top-left and the phone runs the full height of the right side.
          <div className='absolute bottom-1 left-1 flex sm:bottom-3 sm:left-3'>
            <ControlButton label={playing ? 'Pause video' : 'Play video'} onClick={togglePlay}>
              {playing ? (
                <svg viewBox='0 0 24 24' fill='currentColor' aria-hidden='true' className='size-4'>
                  <rect x='6' y='5' width='4' height='14' rx='1' />
                  <rect x='14' y='5' width='4' height='14' rx='1' />
                </svg>
              ) : (
                <PlayIcon className='ml-0.5 size-4' />
              )}
            </ControlButton>
            <ControlButton label='Sound' pressed={!muted} onClick={toggleSound}>
              <svg
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'
                aria-hidden='true'
                className='size-4'>
                <path d='M11 5 6 9H3v6h3l5 4z' fill='currentColor' />
                {muted ? <path d='m17 9 5 6M22 9l-5 6' /> : <path d='M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13' />}
              </svg>
            </ControlButton>
          </div>
        )}
      </div>

      {/* Beside the video from xl: ruled rows, like the grid this section used to be, sized to
          the video's height. Below xl: a five-part stepper, with descriptions kept for screen
          readers only — the video prints each step's title on screen. */}
      <ol aria-label='Video chapters' className='grid grid-cols-5 gap-1.5 xl:col-start-2 xl:row-start-1 xl:block xl:self-center'>
        {APP_PREVIEW_CHAPTERS.map((chapter, i) => {
          const isActive = i === active;
          return (
            <li key={chapter.label} className='relative xl:border-t xl:border-ink-200 xl:last:border-b'>
              <button
                type='button'
                onClick={() => seek(chapter.start)}
                aria-current={isActive ? 'step' : undefined}
                className='group flex min-h-11 w-full cursor-pointer flex-col items-center gap-2 py-1.5 text-left xl:grid xl:grid-cols-[2.75rem_1fr_auto] xl:items-start xl:gap-0 xl:py-3'>
                <span
                  aria-hidden='true'
                  className={`hidden font-mono text-xs leading-6 font-bold tracking-[0.1em] xl:block ${isActive ? 'text-brand-700' : 'text-ink-600'}`}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span
                  className={`hidden text-[1.0625rem] font-semibold transition-colors xl:block ${isActive ? 'text-ink-1000' : 'text-ink-700 group-hover:text-ink-1000'}`}>
                  {chapter.title}
                </span>
                <span aria-hidden='true' className='hidden font-mono text-xs leading-6 text-ink-600 tabular-nums xl:block'>
                  {formatTimestamp(chapter.start)}
                </span>
                <span
                  className={`order-2 text-xs font-semibold xl:hidden ${isActive ? 'text-ink-1000' : 'text-ink-600'}`}>
                  {chapter.label}
                </span>
                <span
                  className={`sr-only xl:not-sr-only xl:col-span-2 xl:col-start-2 xl:mt-0.5 xl:text-[0.9375rem] xl:leading-normal ${isActive ? 'xl:text-ink-700' : 'xl:text-ink-600'}`}>
                  {chapter.description}
                </span>
                <span
                  aria-hidden='true'
                  className='relative order-1 h-[3px] w-full overflow-hidden rounded-full bg-ink-200 xl:absolute xl:inset-x-0 xl:-bottom-px xl:z-10 xl:h-0.5 xl:rounded-none xl:bg-transparent'>
                  <span
                    ref={(el) => {
                      fillRefs.current[i] = el;
                    }}
                    className='block h-full origin-left bg-ink-1000'
                    style={{ transform: 'scaleX(0)' }}
                  />
                </span>
              </button>
            </li>
          );
        })}
      </ol>
      <p className='text-center text-sm text-ink-600 xl:text-left'>
        App preview — screens may change before launch.{' '}
        <Link href='#waitlist' className='font-semibold whitespace-nowrap text-brand-700 hover:underline'>
          Join the waitlist →
        </Link>
      </p>
    </div>
  );
}
