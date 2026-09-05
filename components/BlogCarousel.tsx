'use client';

import { SanityPost } from '@/lib/sanity';
import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';

interface PostWithImageUrl extends SanityPost {
  imageUrl: string | null;
}

/**
 * A scroll-snap rail, not a carousel.
 *
 * The previous implementation auto-advanced every 5 seconds with no way to pause it —
 * a WCAG 2.2.2 failure — duplicated DOM nodes to fake an infinite loop (so screen readers
 * met every link twice), sized itself from a resize listener after hydration (causing a
 * layout flip on mobile), and used 8x8px dots. Native scroll-snap does the same job with
 * none of that, and works without JavaScript.
 */
export default function BlogCarousel({
  posts,
  gradients,
}: {
  posts: PostWithImageUrl[];
  gradients: string[];
}) {
  const rail = useRef<HTMLUListElement>(null);
  const [active, setActive] = useState(0);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const sync = useCallback(() => {
    const el = rail.current;
    if (!el) return;
    const items = [...el.children] as HTMLElement[];
    const mid = el.scrollLeft + el.clientWidth / 2;
    let nearest = 0;
    let best = Infinity;
    items.forEach((item, i) => {
      const d = Math.abs(item.offsetLeft + item.offsetWidth / 2 - mid);
      if (d < best) {
        best = d;
        nearest = i;
      }
    });
    setActive(nearest);
    setAtStart(el.scrollLeft <= 4);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 4);
  }, []);

  // A ResizeObserver rather than a mount effect: it fires once on observe, which gives the
  // initial state, and again whenever the rail is resized — which the previous resize
  // listener did too, but only after hydration, causing a visible layout flip on mobile.
  useEffect(() => {
    const el = rail.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => ro.disconnect();
  }, [sync]);

  const scrollTo = (i: number) => {
    const el = rail.current;
    const item = el?.children[i] as HTMLElement | undefined;
    if (!el || !item) return;
    el.scrollTo({ left: item.offsetLeft, behavior: 'smooth' });
  };

  const nudge = (dir: -1 | 1) => scrollTo(Math.min(posts.length - 1, Math.max(0, active + dir)));

  if (posts.length === 0) return null;

  return (
    <div className='mt-9'>
      <ul
        ref={rail}
        onScroll={sync}
        className='scrollbar-hide -mx-6 flex snap-x snap-mandatory gap-5 overflow-x-auto px-6 pb-2'>
        {posts.map((post, i) => (
          <li key={post._id} className='w-[19rem] shrink-0 snap-start sm:w-[21rem]'>
            <BlogCard post={post} index={i} gradients={gradients} />
          </li>
        ))}
      </ul>

      {posts.length > 1 ? (
        <div className='mt-5 flex items-center gap-2'>
          <button
            type='button'
            onClick={() => nudge(-1)}
            disabled={atStart}
            aria-label='Previous articles'
            className='grid h-11 w-11 place-items-center rounded-full border border-ink-300 text-ink-1000 transition-colors hover:bg-ink-50 disabled:opacity-35'>
            <span aria-hidden='true'>←</span>
          </button>
          <button
            type='button'
            onClick={() => nudge(1)}
            disabled={atEnd}
            aria-label='More articles'
            className='grid h-11 w-11 place-items-center rounded-full border border-ink-300 text-ink-1000 transition-colors hover:bg-ink-50 disabled:opacity-35'>
            <span aria-hidden='true'>→</span>
          </button>
          <ul className='ml-2 flex gap-1'>
            {posts.map((post, i) => (
              <li key={post._id}>
                <button
                  type='button'
                  onClick={() => scrollTo(i)}
                  aria-label={`Go to article ${i + 1} of ${posts.length}`}
                  aria-current={i === active ? 'true' : undefined}
                  className='grid h-6 w-6 place-items-center'>
                  <span
                    aria-hidden='true'
                    className={`block h-2 w-2 rounded-full transition-colors ${
                      i === active ? 'bg-brand-600' : 'bg-ink-300'
                    }`}
                  />
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function BlogCard({
  post,
  index,
  gradients,
}: {
  post: PostWithImageUrl;
  index: number;
  gradients: string[];
}) {
  return (
    <Link
      href={`/blogs/${post.slug.current}`}
      className='group block h-full overflow-hidden rounded-xl border border-ink-200 bg-white transition-colors hover:border-ink-300'>
      <div
        className={`relative flex h-44 items-center justify-center ${
          post.imageUrl ? '' : `bg-gradient-to-br ${gradients[index % gradients.length]}`
        }`}>
        {post.imageUrl ? (
          <Image
            src={post.imageUrl}
            alt=''
            fill
            sizes='21rem'
            className='object-cover'
          />
        ) : (
          <span aria-hidden='true' className='font-mono text-3xl text-ink-400'>
            ₦
          </span>
        )}
        {post.categories && post.categories.length > 0 ? (
          <span className='absolute top-3 left-3 rounded-full bg-brand-700 px-2.5 py-1 text-xs font-semibold text-white'>
            {post.categories[0].title}
          </span>
        ) : null}
      </div>
      <div className='p-5'>
        <h3 className='line-clamp-2 text-[1.0625rem] leading-snug font-semibold text-ink-1000 group-hover:text-brand-700'>
          {post.title}
        </h3>
        <p className='mt-2 line-clamp-2 text-[0.9375rem] text-ink-700'>
          {post.excerpt || 'Read more about this topic.'}
        </p>
        <div className='mt-4 flex items-center justify-between text-xs text-ink-600'>
          <span>
            {post.publishedAt
              ? new Date(post.publishedAt).toLocaleDateString('en-NG', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })
              : '5 min read'}
          </span>
          {post.author ? <span className='font-medium'>{post.author.name}</span> : null}
        </div>
      </div>
    </Link>
  );
}
