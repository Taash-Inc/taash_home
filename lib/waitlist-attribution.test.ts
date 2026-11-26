import { describe, expect, it } from 'vitest';
import { campaignColumns, rememberCampaignVisit } from './waitlist-attribution';

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
    expect(rememberCampaignVisit('?utm_source=whatsapp&utm_medium=referral', storage)?.source).toBe('whatsapp');
    expect(rememberCampaignVisit('', storage)?.source).toBe('whatsapp');
  });

  // The Instagram bio link carried a source and medium but no campaign (found 26 Nov 2026), so
  // every bio signup was stored untagged and Instagram looked like it brought nobody.
  it('keeps the source of a link without a campaign, like the Instagram bio link', () => {
    const storage = tabStorage();
    const bio = '?utm_source=ig&utm_medium=social&utm_content=link_in_bio&fbclid=unused';
    const expected = { source: 'instagram', medium: 'social', campaign: 'not_set', content: 'link_in_bio' };
    expect(rememberCampaignVisit(bio, storage)).toEqual(expected);
    expect(rememberCampaignVisit('', storage)).toEqual(expected);
  });

  it('stores a link without a campaign under a campaign the report can count', () => {
    expect(campaignColumns({ source: 'instagram', medium: 'social', campaign: null, content: 'link_in_bio' }))
      .toMatchObject({ campaign_source: 'instagram', campaign_medium: 'social', campaign_name: 'not_set' });
    expect(campaignColumns({ source: 'instagram', medium: 'social' })).toMatchObject({ campaign_name: 'not_set' });
  });

  it('accepts the tagged landing URL when storage is unavailable', () => {
    expect(rememberCampaignVisit(`${view}&utm_source=ig`, null)?.source).toBe('instagram');
  });

  it('ignores links without a source or medium, malformed slugs and full URLs', () => {
    const storage = tabStorage();
    expect(rememberCampaignVisit('?utm_source=facebook&utm_campaign=taash', storage)).toBeNull();
    expect(rememberCampaignVisit('?utm_medium=social&utm_campaign=taash', storage)).toBeNull();
    // A campaign that's there but malformed is junk, not a missing tag: drop the whole visit.
    expect(rememberCampaignVisit('?utm_source=ig&utm_medium=social&utm_campaign=Black%20Friday', storage)).toBeNull();
    expect(campaignColumns({ source: 'instagram', medium: 'social', campaign: 'ada@example.invalid' })).toBeNull();
    expect(rememberCampaignVisit(`${view}&utm_source=https%3A%2F%2Fexample.com`, storage)).toBeNull();
    expect(rememberCampaignVisit('?utm_source=fb&utm_medium=paid_social&utm_campaign=ada%40example.invalid', storage)).toBeNull();
  });
});
