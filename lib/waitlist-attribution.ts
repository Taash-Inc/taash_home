type MetaPlatform = 'facebook' | 'instagram';

type CampaignAttribution = {
  source: string;
  medium: string;
  campaign: string;
  content: string | null;
};

type MetaColumns = {
  paid_social_platform: MetaPlatform;
  paid_social_campaign: string;
  paid_social_content: string | null;
  paid_social_submitted_at: string;
};

export type SignupAttributionColumns = {
  campaign_source: string;
  campaign_medium: string;
  campaign_name: string;
  campaign_content: string | null;
  campaign_submitted_at: string;
} & Partial<MetaColumns>;

// Keep the old key so an already-tagged Meta visit survives a website deployment.
const STORAGE_KEY = 'taash.waitlist.paid-social';
const TAGS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'];

function slug(value: unknown): string | null {
  if (typeof value !== 'string' || value.length > 100) return null;
  const normalized = value.trim().toLowerCase();
  return /^[a-z0-9_-]+(?:\.[a-z0-9_-]+)*$/.test(normalized) ? normalized : null;
}

/**
 * Stored when a link has a source and medium but no campaign. The Instagram bio link was missing
 * one, and dropping the whole visit hid every bio signup (26 Nov 2026). The report only counts
 * rows with a campaign, so this keeps them visible as their own line.
 */
export const CAMPAIGN_NOT_SET = 'not_set';

/** Accept only the campaign fields. Full URLs and click IDs are not stored. */
function parseCampaignAttribution(input: unknown): CampaignAttribution | null {
  if (!input || typeof input !== 'object') return null;
  const fields = input as Record<string, unknown>;
  const tag = slug(fields.source);
  const source = tag === 'fb' ? 'facebook' : tag === 'ig' ? 'instagram' : tag;
  const medium = slug(fields.medium);
  // Only a missing campaign gets the placeholder. One that's there but malformed is junk (or
  // personal data, like an email address), so the whole visit is dropped as before.
  const missing = fields.campaign == null || fields.campaign === '';
  const campaign = missing ? CAMPAIGN_NOT_SET : slug(fields.campaign);
  if (!source || !medium || !campaign) return null;
  return { source, medium, campaign, content: slug(fields.content) };
}

/** The latest tagged visit in this tab wins. Untagged navigation keeps that visit's source. */
export function rememberCampaignVisit(query: string, storage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> | null) {
  const params = new URLSearchParams(query);
  if (TAGS.some((tag) => params.has(tag))) {
    const current = parseCampaignAttribution({
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
    return saved ? parseCampaignAttribution(JSON.parse(saved)) : null;
  } catch {
    return null;
  }
}

export function readCampaignVisit() {
  let storage: Storage | null = null;
  try {
    storage = window.sessionStorage;
  } catch {
    // Access to sessionStorage itself can throw.
  }
  return rememberCampaignVisit(window.location.search, storage);
}

export function campaignColumns(input: unknown): SignupAttributionColumns | null {
  const attribution = parseCampaignAttribution(input);
  if (!attribution) return null;
  const { source, medium, campaign, content } = attribution;
  const submittedAt = new Date().toISOString();
  const columns: SignupAttributionColumns = {
    campaign_source: source,
    campaign_medium: medium,
    campaign_name: campaign,
    campaign_content: content,
    campaign_submitted_at: submittedAt,
  };
  // Keep the existing Meta report working for new signups until it is retired.
  if (medium === 'paid_social' && (source === 'facebook' || source === 'instagram')) {
    return {
      ...columns,
      paid_social_platform: source,
      paid_social_campaign: campaign,
      paid_social_content: content,
      paid_social_submitted_at: submittedAt,
    };
  }
  return columns;
}
