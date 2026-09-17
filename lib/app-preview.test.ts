import { describe, expect, it } from 'vitest';
import { APP_PREVIEW_CHAPTERS, chapterProgress, formatTimestamp } from './app-preview';

describe('chapterProgress', () => {
  it('has no active chapter during the hook, and nothing filled', () => {
    expect(chapterProgress(3)).toEqual({ active: -1, progress: [0, 0, 0, 0, 0] });
  });

  it('hands over to the next chapter exactly on the boundary', () => {
    expect(chapterProgress(9)).toEqual({ active: 1, progress: [1, 0, 0, 0, 0] });
  });

  it('reports partial progress through the playing chapter', () => {
    const { active, progress } = chapterProgress(16.75);
    expect(active).toBe(2);
    expect(progress).toEqual([1, 1, 0.5, 0, 0]);
  });

  it('has no active chapter during the outro, with every chapter filled', () => {
    expect(chapterProgress(28)).toEqual({ active: -1, progress: [1, 1, 1, 1, 1] });
  });
});

describe('APP_PREVIEW_CHAPTERS', () => {
  it('are contiguous and end before the 30s video does', () => {
    APP_PREVIEW_CHAPTERS.slice(1).forEach((chapter, i) => {
      expect(chapter.start).toBe(APP_PREVIEW_CHAPTERS[i].end);
    });
    expect(APP_PREVIEW_CHAPTERS.at(-1)!.end).toBeLessThanOrEqual(30);
  });
});

describe('formatTimestamp', () => {
  it('formats whole and fractional seconds as m:ss', () => {
    expect(formatTimestamp(6)).toBe('0:06');
    expect(formatTimestamp(23.75)).toBe('0:23');
  });
});
