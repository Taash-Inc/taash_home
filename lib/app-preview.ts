/**
 * The five chapters of the app preview video in public/app-preview/.
 *
 * Windows were measured from the 30.0s source cut at 4 fps: 0–6s is the hook and logo, and
 * 27.25–30s is the "coming soon" outro, so no chapter is active during either. The copy is
 * taken from the video's own on-screen text. If the video is re-cut, re-measure these.
 */
export const APP_PREVIEW_CHAPTERS = [
  {
    label: 'Scan',
    title: 'Scan a receipt',
    description: 'Merchant, amount and category, read on your phone.',
    start: 6,
    end: 9,
  },
  {
    label: 'Swipe',
    title: 'Swipe to sort',
    description: 'Right if it counts, left if it doesn’t. You decide.',
    start: 9,
    end: 14,
  },
  {
    label: 'Ask',
    title: 'Ask Taash AI',
    description: 'Answers from your own numbers, like reliefs you may be missing.',
    start: 14,
    end: 19.5,
  },
  {
    label: 'Plan',
    title: 'See ways to pay less',
    description: 'Estimates under the Nigeria Tax Act 2025 bands.',
    start: 19.5,
    end: 23.75,
  },
  {
    label: 'File',
    title: 'Get your Tax Year Pack',
    description: 'Every number you need to file, in one PDF.',
    start: 23.75,
    end: 27.25,
  },
] as const;

/** The chapter playing at `time` (-1 for none) and how far through each chapter playback is, 0–1. */
export function chapterProgress(time: number) {
  const active = APP_PREVIEW_CHAPTERS.findIndex(({ start, end }) => time >= start && time < end);
  const progress = APP_PREVIEW_CHAPTERS.map(({ start, end }) =>
    Math.min(1, Math.max(0, (time - start) / (end - start))),
  );
  return { active, progress };
}

/** 6 → "0:06" */
export const formatTimestamp = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
