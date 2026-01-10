import { createClient } from '@sanity/client';
import { createImageUrlBuilder } from '@sanity/image-url';

type SanityImageSource = Parameters<ReturnType<typeof createImageUrlBuilder>['image']>[0];

export const sanityClient = createClient({
  projectId: 'f5cca1ph',
  dataset: 'production',
  apiVersion: '2024-01-01',
  useCdn: true, // Use CDN for faster response in production
});

const builder = createImageUrlBuilder(sanityClient);

export function urlFor(source: SanityImageSource) {
  return builder.image(source);
}

// Types for blog posts
export interface SanityPost {
  _id: string;
  title: string;
  slug: {
    current: string;
  };
  excerpt?: string;
  mainImage?: {
    asset: {
      _ref: string;
    };
    alt?: string;
  };
  publishedAt?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  body?: any[];
}

// Fetch latest blog posts
export async function getLatestPosts(limit = 3): Promise<SanityPost[]> {
  return sanityClient.fetch(
    `*[_type == "post"] | order(publishedAt desc)[0...$limit]{
      _id,
      title,
      slug,
      excerpt,
      mainImage,
      publishedAt
    }`,
    { limit }
  );
}

// Fetch a single post by slug
export async function getPostBySlug(slug: string): Promise<SanityPost | null> {
  return sanityClient.fetch(
    `*[_type == "post" && slug.current == $slug][0]{
      _id,
      title,
      slug,
      excerpt,
      mainImage,
      publishedAt,
      body
    }`,
    { slug }
  );
}

// Fetch all post slugs (for static generation)
export async function getAllPostSlugs(): Promise<{ slug: string }[]> {
  const posts = await sanityClient.fetch<{ slug: { current: string } }[]>(
    `*[_type == "post"]{ slug }`
  );
  return posts.map((post) => ({ slug: post.slug.current }));
}
