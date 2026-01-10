'use client';

import { SanityPost } from '@/lib/sanity';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

// Extended type with pre-computed image URL
interface PostWithImageUrl extends SanityPost {
  imageUrl: string | null;
}

interface BlogCarouselProps {
  posts: PostWithImageUrl[];
  gradients: string[];
}

export default function BlogCarousel({ posts, gradients }: BlogCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    // TODO: Change back to 3 after testing
    if (posts.length <= 3) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % posts.length);
    }, 5000); // Change slide every 4 seconds (includes pause)

    return () => clearInterval(interval);
  }, [posts.length]);

  // TODO: Change back to 3 after testing
  // If 2 or fewer posts, show static grid
  if (posts.length <= 3) {
    return (
      <div className='grid md:grid-cols-3 gap-6 mb-12'>
        {posts.map((post, index) => (
          <BlogCard key={post._id} post={post} index={index} gradients={gradients} />
        ))}
      </div>
    );
  }

  // Create extended array for seamless looping - duplicate posts at the end
  const extendedPosts = [...posts, ...posts.slice(0, 3)];

  // Width for exactly 3 cards: 3 * 350px + 2 * 24px gap = 1098px
  const containerWidth = 3 * 350 + 2 * 24;

  return (
    <div className='mb-12'>
      {/* Carousel container */}
      <div className='flex justify-center'>
        <div className='overflow-hidden' style={{ width: `${containerWidth}px`, maxWidth: '100%' }}>
          <div
            className='flex gap-6 transition-transform duration-1000 ease-in-out'
            style={{
              transform: `translateX(-${currentIndex * (350 + 24)}px)`,
            }}>
            {extendedPosts.map((post, index) => (
              <div key={`${post._id}-${index}`} className='flex-shrink-0 w-[350px]'>
                <BlogCard post={post} index={index} gradients={gradients} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Dots indicator */}
      <div className='flex justify-center gap-2 mt-6'>
        {posts.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-2 h-2 rounded-full transition-colors ${
              index === currentIndex ? 'bg-primary-blue' : 'bg-border'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
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
    <Link href={`/blogs/${post.slug.current}`} className='block h-full'>
      <article className='bg-white border border-border-light rounded-2xl overflow-hidden hover:shadow-lg transition-shadow cursor-pointer h-full'>
        {/* Image */}
        <div
          className={`h-48 relative ${
            !post.imageUrl ? `bg-gradient-to-br ${gradients[index % gradients.length]}` : ''
          } flex items-center justify-center`}>
          {post.imageUrl ? (
            <Image
              src={post.imageUrl}
              alt={post.mainImage?.alt || post.title}
              fill
              className='object-cover'
            />
          ) : (
            <svg
              viewBox='0 0 100 80'
              fill='none'
              xmlns='http://www.w3.org/2000/svg'
              className='w-24 h-20'>
              <rect x='10' y='5' width='80' height='50' rx='4' className='fill-border-light' />
              <rect x='15' y='10' width='70' height='40' className='fill-primary-dark' />
              <rect x='20' y='15' width='30' height='4' className='fill-primary-blue' />
              <rect x='20' y='22' width='50' height='2' className='fill-text-gray' />
              <rect x='20' y='27' width='45' height='2' className='fill-text-gray' />
              <rect x='20' y='32' width='40' height='2' className='fill-text-gray' />
              <path d='M5 55 L95 55 L90 70 L10 70 Z' className='fill-border' />
              <rect x='35' y='58' width='30' height='3' rx='1' fill='#cbd5e1' />
            </svg>
          )}
        </div>
        <div className='p-6'>
          <h3 className='text-lg font-semibold text-primary-dark mb-2 line-clamp-2'>
            {post.title}
          </h3>
          <p className='text-text-gray text-sm mb-4 line-clamp-2'>
            {post.excerpt || 'Read more about this topic...'}
          </p>
          <span className='text-xs text-text-light-gray'>
            {post.publishedAt
              ? new Date(post.publishedAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })
              : '5 min read'}
          </span>
        </div>
      </article>
    </Link>
  );
}
