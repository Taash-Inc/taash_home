import { getAllPostSlugs } from '@/lib/sanity';
import { SITE_URL } from '@/lib/site';
import type { MetadataRoute } from 'next';

// Rebuilt hourly so new blog posts appear without a deploy.
export const revalidate = 3600;

/**
 * Real pages only. It used to list taash.africa addresses and #section anchors, which are not
 * separate pages, and left out the blog.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/tax-calculator`, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${SITE_URL}/blogs`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${SITE_URL}/privacy`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${SITE_URL}/terms`, changeFrequency: 'yearly', priority: 0.2 },
  ];

  // A Sanity outage must not take the sitemap down with it, but it must not pass silently
  // either: the error is logged and the static pages are still listed.
  let posts: { slug: string }[] = [];
  try {
    posts = await getAllPostSlugs();
  } catch (error) {
    console.error('sitemap: could not load blog posts from Sanity', error);
  }

  return [
    ...pages,
    ...posts.map(({ slug }) => ({
      url: `${SITE_URL}/blogs/${slug}`,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
  ];
}
