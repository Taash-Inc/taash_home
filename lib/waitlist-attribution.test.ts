import { describe, expect, it } from 'vitest';
import { rememberPaidSocialVisit } from './waitlist-attribution';

const view = '?utm_medium=paid_social&utm_campaign=taash_waitlist&utm_content=overview_carousel';

function tabStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
    removeItem: (key: string) => { values.delete(key); },
  };
}

describe('paid visits to the waitlist', () => {
  it('keeps the platform across untagged navigation and uses the latest tagged visit', () => {
    const storage = tabStorage();
    expect(rememberPaidSocialVisit(`${view}&utm_source=fb&fbclid=unused`, storage)).toEqual({
      source: 'facebook', medium: 'paid_social', campaign: 'taash_waitlist', content: 'overview_carousel',
    });
    expect(rememberPaidSocialVisit('', storage)?.source).toBe('facebook');
    expect(rememberPaidSocialVisit(`${view}&utm_source=ig`, storage)?.source).toBe('instagram');
    expect(rememberPaidSocialVisit('', storage)?.source).toBe('instagram');
    expect(rememberPaidSocialVisit('?utm_source=whatsapp&utm_medium=referral', storage)).toBeNull();
    expect(rememberPaidSocialVisit('', storage)).toBeNull();
  });

  it('accepts the tagged landing URL when storage is unavailable', () => {
    expect(rememberPaidSocialVisit(`${view}&utm_source=ig`, null)?.source).toBe('instagram');
  });

  it('ignores organic traffic, unsupported Meta placements and malformed campaign tags', () => {
    const storage = tabStorage();
    expect(rememberPaidSocialVisit('?utm_source=facebook&utm_medium=organic&utm_campaign=taash', storage)).toBeNull();
    expect(rememberPaidSocialVisit(`${view}&utm_source=an`, storage)).toBeNull();
    expect(rememberPaidSocialVisit('?utm_source=fb&utm_medium=paid_social&utm_campaign=ada%40example.invalid', storage)).toBeNull();
  });
});
