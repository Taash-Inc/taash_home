import type { Metadata } from 'next';

/** The site-wide share image (layout default), 1200×630. */
export const DEFAULT_SHARE_IMAGE = {
  url: '/og-image.png?v=2',
  width: 1200,
  height: 630,
  alt: 'Taash - Tax & Finance for Nigerian Freelancers',
};

type ShareImage = { url: string; width?: number; height?: number; alt?: string };

/**
 * Search and share metadata for one page: its <title>, description, canonical URL, and the
 * Open Graph (Facebook, LinkedIn, WhatsApp) and X/Twitter previews, built together so they
 * always describe the same page.
 *
 * Next.js replaces the layout's `openGraph` and `twitter` objects wholesale when a page sets
 * them, and inherits them untouched when it doesn't. Pages that set neither used to share with
 * the homepage's title, description and URL; pages that set only `openGraph` still did on X.
 */
export function pageMetadata({
  title,
  description,
  path,
  shareTitle = title,
  image = DEFAULT_SHARE_IMAGE,
  type = 'website',
  publishedTime,
}: {
  /** The <title>, before the layout adds " | Taash". */
  title: string;
  description: string;
  path: string;
  /** The title in share previews, when it should differ from the search title. */
  shareTitle?: string;
  image?: ShareImage;
  type?: 'website' | 'article';
  publishedTime?: string;
}): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type,
      locale: 'en_NG',
      siteName: 'Taash',
      url: path,
      title: shareTitle,
      description,
      images: [image],
      ...(type === 'article' && publishedTime ? { publishedTime } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      creator: '@taashtax',
      title: shareTitle,
      description,
      images: [image.url],
    },
  };
}
