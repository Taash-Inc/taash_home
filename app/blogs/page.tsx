import Footer from '@/components/Footer';
import Header from '@/components/Header';
import { getLatestPosts, urlFor } from '@/lib/sanity';
import Image from 'next/image';
import Link from 'next/link';

// Gradient colors for articles without images
const gradients = [
  'from-orange-100 to-amber-50',
  'from-gray-100 to-slate-50',
  'from-blue-100 to-cyan-50',
  'from-green-100 to-emerald-50',
  'from-purple-100 to-violet-50',
];

export const metadata = {
  title: 'Blog - Taash',
  description:
    'Tax tips, guides, and resources for freelancers and creators in Nigeria. Learn how to manage your taxes the easy way.',
};

export default async function BlogPage() {
  const posts = await getLatestPosts(20);

  return (
    <>
      <Header />
      <main className='min-h-screen bg-white pt-24'>
        <div className='max-w-7xl mx-auto px-6 py-12'>
          {/* Header */}
          <div className='text-center mb-12'>
            <h1 className='text-4xl md:text-5xl font-bold text-primary-dark mb-4'>Taash Blog</h1>
            <p className='text-text-gray text-lg max-w-2xl mx-auto'>
              Tax tips, guides, and resources for freelancers and creators in Nigeria.
            </p>
          </div>

          {/* Articles Grid */}
          <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-8'>
            {posts.map((post, index) => (
              <Link key={post._id} href={`/blogs/${post.slug.current}`} className='block group'>
                <article className='bg-white border border-border-light rounded-2xl overflow-hidden hover:shadow-lg transition-shadow h-full'>
                  {/* Image */}
                  <div
                    className={`h-48 relative ${
                      !post.mainImage
                        ? `bg-gradient-to-br ${gradients[index % gradients.length]}`
                        : ''
                    } flex items-center justify-center`}>
                    {post.mainImage ? (
                      <Image
                        src={urlFor(post.mainImage).width(600).height(300).url()}
                        alt={post.mainImage.alt || post.title}
                        fill
                        className='object-cover group-hover:scale-105 transition-transform duration-300'
                      />
                    ) : (
                      <svg
                        viewBox='0 0 100 80'
                        fill='none'
                        xmlns='http://www.w3.org/2000/svg'
                        className='w-24 h-20'>
                        <rect
                          x='10'
                          y='5'
                          width='80'
                          height='50'
                          rx='4'
                          className='fill-border-light'
                        />
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
                    <h2 className='text-xl font-semibold text-primary-dark mb-2 group-hover:text-primary-blue transition-colors'>
                      {post.title}
                    </h2>
                    <p className='text-text-gray text-sm mb-4 line-clamp-3'>
                      {post.excerpt || 'Read more about this topic...'}
                    </p>
                    <div className='flex items-center justify-between'>
                      <span className='text-xs text-text-light-gray'>
                        {post.publishedAt
                          ? new Date(post.publishedAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })
                          : 'Published'}
                      </span>
                      {post.author && (
                        <span className='text-xs text-text-gray font-medium'>
                          {post.author.name}
                        </span>
                      )}
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>

          {posts.length === 0 && (
            <div className='text-center py-20'>
              <p className='text-text-gray text-lg'>No blog posts yet. Check back soon!</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
