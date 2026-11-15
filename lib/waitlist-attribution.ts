export type PaidSocialPlatform = 'facebook' | 'instagram';

type PaidSocialAttribution = {
  source: PaidSocialPlatform;
  medium: 'paid_social';
  campaign: string;
  content: string | null;
};

export type PaidSocialColumns = {
  paid_social_platform: PaidSocialPlatform;
  paid_social_campaign: string;
  paid_social_content: string | null;
  paid_social_submitted_at: string;
};

const STORAGE_KEY = 'taash.waitlist.paid-social';
const TAGS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'];

function slug(value: unknown): string | null {
  if (typeof value !== 'string' || value.length > 100) return null;
  const normalized = value.trim().toLowerCase();
  return /^[a-z0-9_-]{1,100}$/.test(normalized) ? normalized : null;
}

/** Accept only the campaign fields. Full URLs and click IDs are not stored. */
export function parsePaidSocialAttribution(input: unknown): PaidSocialAttribution | null {
  if (!input || typeof input !== 'object') return null;
  const fields = input as Record<string, unknown>;
  const source = slug(fields.source);
  const platform =
    source === 'fb' || source === 'facebook' ? 'facebook'
      : source === 'ig' || source === 'instagram' ? 'instagram' : null;
  const campaign = slug(fields.campaign);
  if (!platform || slug(fields.medium) !== 'paid_social' || !campaign) return null;
  return { source: platform, medium: 'paid_social', campaign, content: slug(fields.content) };
}

/** The latest tagged visit in this tab wins. Untagged navigation keeps that visit's source. */
export function rememberPaidSocialVisit(query: string, storage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> | null) {
  const params = new URLSearchParams(query);
  if (TAGS.some((tag) => params.has(tag))) {
    const current = parsePaidSocialAttribution({
      source: params.get('utm_source'),
      medium: params.get('utm_medium'),
      campaign: params.get('utm_campaign'),
      content: params.get('utm_content'),
    });
    try {
      if (current) storage?.setItem(STORAGE_KEY, JSON.stringify(current));
      else storage?.removeItem(STORAGE_KEY);
    } catch {
      // The current link still works when storage is blocked by the in-app browser.
    }
    return current;
  }

  try {
    const saved = storage?.getItem(STORAGE_KEY);
    return saved ? parsePaidSocialAttribution(JSON.parse(saved)) : null;
  } catch {
    return null;
  }
}

export function readPaidSocialVisit() {
  let storage: Storage | null = null;
  try {
    storage = window.sessionStorage;
  } catch {
    // Access to sessionStorage itself can throw.
  }
  return rememberPaidSocialVisit(window.location.search, storage);
}

export function paidSocialColumns(input: unknown): PaidSocialColumns | null {
  const attribution = parsePaidSocialAttribution(input);
  return attribution && {
    paid_social_platform: attribution.source,
    paid_social_campaign: attribution.campaign,
    paid_social_content: attribution.content,
    paid_social_submitted_at: new Date().toISOString(),
  };
}
