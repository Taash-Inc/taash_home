import { describe, expect, it } from 'vitest';
import { searchTitle } from './seo-title';

// Google shows about 60 characters of a title; the layout adds " | Taash" (8).
describe('searchTitle', () => {
  it('keeps a title that fits with the brand suffix', () => {
    expect(searchTitle('Top 5 Deductible Expenses for Freelancers in Nigeria')).toBe(
      'Top 5 Deductible Expenses for Freelancers in Nigeria'
    );
  });

  it('uses the headline of a long "Headline. Subtitle" title', () => {
    expect(
      searchTitle('2025 Tax Reforms Explained. What Changed in Nigerian Tax Laws and How It Affects Freelancers')
    ).toBe('2025 Tax Reforms Explained');
    expect(searchTitle('How to Register Your TIN in Nigeria. Step-by-Step Guide for Freelancers')).toBe(
      'How to Register Your TIN in Nigeria'
    );
  });

  it('cuts a long title with no sentence break at a word, never mid-word', () => {
    const long = 'A very long guide title about Nigerian personal income tax rules for creators and freelancers';
    const result = searchTitle(long);
    expect(result.length).toBeLessThanOrEqual(52);
    expect(long.startsWith(result)).toBe(true);
    expect(long[result.length]).toBe(' ');
  });
});
