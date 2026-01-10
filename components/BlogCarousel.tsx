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
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile screen
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Auto-rotate carousel
  useEffect(() => {
    // On mobile: activate carousel with 2+ posts
    // On desktop: activate carousel with 4+ posts
    const minPostsForCarousel = isMobile ? 2 : 4;
    if (posts.length < minPostsForCarousel) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % posts.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [posts.length, isMobile]);

  // On mobile: show carousel with 2+ posts
  // On desktop: show grid with 3 or fewer posts
  const showCarousel = isMobile ? posts.length >= 2 : posts.length > 3;

  if (!showCarousel) {
    return (
      <div className='grid md:grid-cols-3 gap-6 mb-12'>
        {posts.map((post, index) => (
          <BlogCard key={post._id} post={post} index={index} gradients={gradients} />
        ))}
      </div>
    );
  }

  // Create extended array for seamless looping
  const extendedPosts = [...posts, ...posts.slice(0, 3)];

  // Card width and gap - smaller on mobile
  const cardWidth = isMobile ? 300 : 350;
  const gap = 24;
  const visibleCards = isMobile ? 1 : 3;
  const containerWidth = visibleCards * cardWidth + (visibleCards - 1) * gap;

  return (
    <div className='mb-12'>
      {/* Carousel container */}
      <div className='flex justify-center'>
        <div className='overflow-hidden' style={{ width: `${containerWidth}px`, maxWidth: '100%' }}>
          <div
            className='flex gap-6 transition-transform duration-1000 ease-in-out'
            style={{
              transform: `translateX(-${currentIndex * (cardWidth + gap)}px)`,
            }}>
            {extendedPosts.map((post, index) => (
              <div
                key={`${post._id}-${index}`}
                className='flex-shrink-0'
                style={{ width: `${cardWidth}px` }}>
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
          {/* Category badge */}
          {post.categories && post.categories.length > 0 && (
            <div className='absolute top-3 left-3'>
              <span className='text-xs font-medium text-white bg-primary-blue/90 px-2.5 py-1 rounded-full'>
                {post.categories[0].title}
              </span>
            </div>
          )}
        </div>
        <div className='p-6'>
          <h3 className='text-lg font-semibold text-primary-dark mb-2 line-clamp-2'>
            {post.title}
          </h3>
          <p className='text-text-gray text-sm mb-4 line-clamp-2'>
            {post.excerpt || 'Read more about this topic...'}
          </p>
          <div className='flex items-center justify-between'>
            <span className='text-xs text-text-light-gray'>
              {post.publishedAt
                ? new Date(post.publishedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })
                : '5 min read'}
            </span>
            {post.author && (
              <span className='text-xs text-text-gray font-medium'>{post.author.name}</span>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}
