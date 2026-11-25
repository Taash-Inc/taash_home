import type { Metadata } from 'next';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/sanity', () => ({
  getPostBySlug: async () => ({
    title: 'How to Register Your TIN in Nigeria. Step-by-Step Guide for Freelancers',
    excerpt: 'A simple step-by-step guide.',
    publishedAt: '2026-01-10T09:00:00Z',
    mainImage: { asset: { _ref: 'image-abc-1200x630-png' } },
  }),
  getAllPostSlugs: async () => [],
  getLatestPosts: async () => [],
  urlFor: () => ({ width: () => ({ height: () => ({ url: () => 'https://cdn.sanity.io/images/post.png' }) }) }),
}));

type Shared = { title?: unknown; description?: unknown; url?: unknown; images?: unknown };
const og = (m: Metadata) => m.openGraph as Shared;
const tw = (m: Metadata) => m.twitter as Shared & { card?: string };
const firstImage = (images: unknown) => {
  const first = Array.isArray(images) ? images[0] : images;
  return typeof first === 'string' ? first : (first as { url?: string } | undefined)?.url;
};

// PR #70 review: pages that set no share metadata of their own inherited the layout's, so
// X/Twitter (and, on /privacy and /terms, Facebook and LinkedIn too) showed the homepage's title,
// description and URL for them. Every indexed page must describe itself on every platform.
describe('share previews describe the page they are on', async () => {
  const pages: [string, string, () => Promise<Metadata>][] = [
    ['/privacy', 'Privacy Policy', async () => (await import('@/app/privacy/page')).metadata],
    ['/terms', 'Terms & Conditions', async () => (await import('@/app/terms/page')).metadata],
    ['/blogs', 'Tax guides for freelancers and creators in Nigeria', async () => (await import('@/app/blogs/page')).metadata],
    ['/tax-calculator', 'Nigeria Tax Calculator 2026: PAYE and Self-Employed', async () => (await import('@/app/tax-calculator/page')).metadata],
    [
      '/blogs/how-to-register-your-tin-in-nigeria',
      'How to Register Your TIN in Nigeria. Step-by-Step Guide for Freelancers',
      async () =>
        (await import('@/app/blogs/[slug]/page')).generateMetadata({
          params: Promise.resolve({ slug: 'how-to-register-your-tin-in-nigeria' }),
        }) as Promise<Metadata>,
    ],
  ];

  it.each(pages)('%s', async (path, shareTitle, load) => {
    const m = await load();
    expect(og(m).title).toBe(shareTitle);
    expect(tw(m).title).toBe(shareTitle);
    expect(og(m).description).toBe(m.description);
    expect(tw(m).description).toBe(m.description);
    expect(og(m).url).toBe(path);
    expect(m.alternates?.canonical).toBe(path);
    expect(tw(m).card).toBe('summary_large_image');
    expect(firstImage(tw(m).images)).toBe(firstImage(og(m).images));
    expect(firstImage(og(m).images)).toBeTruthy();
  });

  it('uses the post image for a blog post, on both platforms', async () => {
    const m = (await (await import('@/app/blogs/[slug]/page')).generateMetadata({
      params: Promise.resolve({ slug: 'how-to-register-your-tin-in-nigeria' }),
    })) as Metadata;
    expect(firstImage(og(m).images)).toBe('https://cdn.sanity.io/images/post.png');
    expect(firstImage(tw(m).images)).toBe('https://cdn.sanity.io/images/post.png');
    expect(m.title).toBe('How to Register Your TIN in Nigeria');
  });
});
