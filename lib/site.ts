/**
 * The site's canonical origin. www.taash.tax is the address that serves pages: taash.tax
 * redirects to it. Every absolute URL (metadata, sitemap, robots, structured data) comes from
 * here, so they can never disagree. robots.ts and sitemap.ts used to fall back to taash.africa,
 * which pointed Google at another domain.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.taash.tax').replace(/\/$/, '');
