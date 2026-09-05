import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    // AVIF then WebP; the source art is 1-3.5 MB PNG.
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.sanity.io',
        pathname: '/images/**',
      },
    ],
  },
};

export default nextConfig;
