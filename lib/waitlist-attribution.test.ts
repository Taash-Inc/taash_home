import { describe, expect, it } from 'vitest';
import { rememberCampaignVisit } from './waitlist-attribution';

const view = '?utm_medium=paid_social&utm_campaign=taash_waitlist&utm_content=overview_carousel';

function tabStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
    removeItem: (key: string) => { values.delete(key); },
  };
}

describe('tagged visits to the waitlist', () => {
  it('keeps the campaign across untagged navigation and uses the latest tagged visit', () => {
    const storage = tabStorage();
    expect(rememberCampaignVisit(`${view}&utm_source=fb&fbclid=unused`, storage)).toEqual({
      source: 'facebook', medium: 'paid_social', campaign: 'taash_waitlist', content: 'overview_carousel',
    });
    expect(rememberCampaignVisit('', storage)?.source).toBe('facebook');
    expect(rememberCampaignVisit(`${view}&utm_source=ig`, storage)?.source).toBe('instagram');
    expect(rememberCampaignVisit('', storage)?.source).toBe('instagram');
    const partner = '?utm_source=partner.example&utm_medium=referral&utm_campaign=launch_waitlist';
    expect(rememberCampaignVisit(partner, storage)?.source).toBe('partner.example');
    expect(rememberCampaignVisit('', storage)?.source).toBe('partner.example');
    expect(rememberCampaignVisit('?utm_source=whatsapp&utm_medium=referral', storage)).toBeNull();
    expect(rememberCampaignVisit('', storage)).toBeNull();
  });

  it('accepts the tagged landing URL when storage is unavailable', () => {
    expect(rememberCampaignVisit(`${view}&utm_source=ig`, null)?.source).toBe('instagram');
  });

  it('ignores incomplete tags, malformed slugs and full URLs', () => {
    const storage = tabStorage();
    expect(rememberCampaignVisit('?utm_source=facebook&utm_campaign=taash', storage)).toBeNull();
    expect(rememberCampaignVisit(`${view}&utm_source=https%3A%2F%2Fexample.com`, storage)).toBeNull();
    expect(rememberCampaignVisit('?utm_source=fb&utm_medium=paid_social&utm_campaign=ada%40example.invalid', storage)).toBeNull();
  });
});
