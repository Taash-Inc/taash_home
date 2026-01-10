import Footer from '@/components/Footer';
import Header from '@/components/Header';
import { getAllPostSlugs, getPostBySlug, urlFor } from '@/lib/sanity';
import { PortableText, PortableTextComponents } from '@portabletext/react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const slugs = await getAllPostSlugs();
  return slugs.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    return {
      title: 'Post Not Found - Taash Blog',
    };
  }

  return {
    title: `${post.title} - Taash Blog`,
    description: post.excerpt || 'Read this article on Taash Blog',
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: post.mainImage
        ? [
            {
              url: urlFor(post.mainImage).width(1200).height(630).url(),
              width: 1200,
              height: 630,
            },
          ]
        : [],
    },
  };
}

// Custom components for rendering Portable Text
const portableTextComponents: PortableTextComponents = {
  block: {
    h1: ({ children }) => (
      <h1 className='text-3xl font-bold text-primary-dark mt-8 mb-4'>{children}</h1>
    ),
    h2: ({ children }) => (
      <h2 className='text-2xl font-bold text-primary-dark mt-8 mb-4'>{children}</h2>
    ),
    h3: ({ children }) => (
      <h3 className='text-xl font-semibold text-primary-dark mt-6 mb-3'>{children}</h3>
    ),
    h4: ({ children }) => (
      <h4 className='text-lg font-semibold text-primary-dark mt-4 mb-2'>{children}</h4>
    ),
    normal: ({ children }) => <p className='text-text-gray leading-relaxed mb-4'>{children}</p>,
    blockquote: ({ children }) => (
      <blockquote className='border-l-4 border-primary-blue pl-4 italic text-text-gray my-6'>
        {children}
      </blockquote>
    ),
  },
  list: {
    bullet: ({ children }) => (
      <ul className='list-disc list-inside text-text-gray mb-4 space-y-2'>{children}</ul>
    ),
    number: ({ children }) => (
      <ol className='list-decimal list-inside text-text-gray mb-4 space-y-2'>{children}</ol>
    ),
  },
  listItem: {
    bullet: ({ children }) => <li className='ml-4'>{children}</li>,
    number: ({ children }) => <li className='ml-4'>{children}</li>,
  },
  marks: {
    strong: ({ children }) => (
      <strong className='font-semibold text-primary-dark'>{children}</strong>
    ),
    em: ({ children }) => <em>{children}</em>,
    code: ({ children }) => (
      <code className='bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono'>{children}</code>
    ),
    link: ({ children, value }) => (
      <a
        href={value?.href}
        target='_blank'
        rel='noopener noreferrer'
        className='text-primary-blue hover:underline'>
        {children}
      </a>
    ),
  },
  types: {
    image: ({ value }) => {
      if (!value?.asset?._ref) {
        return null;
      }
      return (
        <figure className='my-8'>
          <div className='relative w-full aspect-video rounded-lg overflow-hidden'>
            <Image
              src={urlFor(value).width(800).height(450).url()}
              alt={value.alt || 'Blog image'}
              fill
              className='object-cover'
            />
          </div>
          {value.caption && (
            <figcaption className='text-center text-text-light-gray text-sm mt-2'>
              {value.caption}
            </figcaption>
          )}
        </figure>
      );
    },
    code: ({ value }) => (
      <pre className='bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto my-6'>
        <code className='text-sm font-mono'>{value.code}</code>
      </pre>
    ),
  },
};

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  return (
    <>
      <Header />
      <main className='min-h-screen bg-white pt-24'>
        <article className='max-w-3xl mx-auto px-6 py-12'>
          {/* Back link */}
          <Link
            href='/blogs'
            className='inline-flex items-center gap-2 text-primary-blue hover:underline mb-8'>
            <svg
              width='16'
              height='16'
              viewBox='0 0 16 16'
              fill='none'
              xmlns='http://www.w3.org/2000/svg'>
              <path
                d='M13 8H3M3 8L7 4M3 8L7 12'
                stroke='currentColor'
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'
              />
            </svg>
            Back to Blog
          </Link>

          {/* Header */}
          <header className='mb-8'>
            {/* Categories */}
            {post.categories && post.categories.length > 0 && (
              <div className='flex flex-wrap gap-2 mb-4'>
                {post.categories.map((category) => (
                  <span
                    key={category._id}
                    className='text-xs font-medium text-primary-blue bg-primary-blue/10 px-3 py-1 rounded-full'>
                    {category.title}
                  </span>
                ))}
              </div>
            )}

            <h1 className='text-3xl md:text-4xl font-bold text-primary-dark mb-4'>{post.title}</h1>

            {/* Author and Date */}
            <div className='flex items-center gap-4'>
              {post.author && (
                <div className='flex items-center gap-3'>
                  {post.author.image && (
                    <div className='relative w-10 h-10 rounded-full overflow-hidden'>
                      <Image
                        src={urlFor(post.author.image).width(80).height(80).url()}
                        alt={post.author.name}
                        fill
                        className='object-cover'
                      />
                    </div>
                  )}
                  <span className='text-text-gray font-medium'>{post.author.name}</span>
                </div>
              )}
              {post.author && post.publishedAt && <span className='text-text-light-gray'>•</span>}
              {post.publishedAt && (
                <time className='text-text-light-gray'>
                  {new Date(post.publishedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </time>
              )}
            </div>
          </header>

          {/* Featured Image */}
          {post.mainImage && (
            <div className='relative w-full aspect-video rounded-xl overflow-hidden mb-8'>
              <Image
                src={urlFor(post.mainImage).width(1200).height(630).url()}
                alt={post.mainImage.alt || post.title}
                fill
                className='object-cover'
                priority
              />
            </div>
          )}

          {/* Excerpt */}
          {post.excerpt && (
            <p className='text-lg text-text-gray font-medium mb-8 border-l-4 border-primary-blue pl-4'>
              {post.excerpt}
            </p>
          )}

          {/* Content */}
          <div className='prose prose-lg max-w-none'>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {post.body && (
              <PortableText value={post.body as any} components={portableTextComponents} />
            )}
          </div>

          {/* CTA */}
          <div className='mt-12 p-8 bg-gradient-to-br from-primary-blue/10 to-primary-blue/5 rounded-2xl text-center'>
            <h3 className='text-xl font-bold text-primary-dark mb-2'>
              Ready to simplify your taxes?
            </h3>
            <p className='text-text-gray mb-4'>
              Join thousands of Nigerian freelancers using Taash to track income and estimate taxes.
            </p>
            <Link
              href='/#waitlist'
              className='inline-flex items-center gap-2 bg-primary-blue text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-blue/90 transition-colors'>
              Join the Waitlist
            </Link>
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}
