import { getLatestPosts, urlFor } from '@/lib/sanity';
import Link from 'next/link';
import BlogCarousel from './BlogCarousel';

const gradients = [
  'from-brand-100 to-ink-100',
  'from-mark-100 to-ink-100',
  'from-signal-100 to-ink-100',
  'from-positive-100 to-ink-100',
  'from-ink-100 to-ink-200',
];

export default async function Resources() {
  const posts = await getLatestPosts(10);
  const postsWithImageUrls = posts.map((post) => ({
    ...post,
    imageUrl: post.mainImage ? urlFor(post.mainImage).width(672).height(352).url() : null,
  }));

  return (
    <section id='resources' className='py-18'>
      <div className='mx-auto max-w-7xl px-6'>
        <p className='mb-4 flex items-center gap-2.5 text-xs font-bold tracking-[0.12em] text-ink-700 uppercase'>
          <span aria-hidden='true' className='h-px w-6 bg-ink-300' />
          Resources
        </p>
        <h2 className='text-[clamp(1.75rem,3.2vw,2rem)] font-bold tracking-tight text-ink-1000'>
          Learn About Taxes the Easy Way
        </h2>
        <p className='mt-3 max-w-[56ch] text-lg text-ink-700'>
          Tax compliance doesn&apos;t have to be confusing. Our guides break down complex topics
          into simple, actionable advice.
        </p>

        <BlogCarousel posts={postsWithImageUrls} gradients={gradients} />

        <div className='mt-8'>
          <Link
            href='/blogs'
            className='inline-flex min-h-11 items-center gap-2 rounded-lg border border-ink-300 bg-white px-6 py-3 font-semibold text-ink-1000 transition-colors hover:bg-ink-50'>
            Visit Blog
            <span aria-hidden='true'>→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
