import {
  BreadcrumbSchema,
  FAQSchema,
  OrganizationSchema,
  SoftwareApplicationSchema,
  WebsiteSchema,
} from '@/components/StructuredData';
import SiteAnalytics from '@/components/SiteAnalytics';
import type { Metadata, Viewport } from 'next';
import { JetBrains_Mono, Space_Grotesk } from 'next/font/google';
import './globals.css';

// latin-ext is preloaded too because ₦ (U+20A6) lives in it: the hero's figures need that file
// on every load, and without a preload it was only discovered after first layout.
const spaceGrotesk = Space_Grotesk({
  variable: '--font-space-grotesk',
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
});

// Not preloaded: the mono face only appears below the fold (labels, the estimator), so a
// preload competed with the hero for early bandwidth. It still loads on first layout.
const jetbrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains-mono',
  subsets: ['latin'],
  display: 'swap',
  preload: false,
});

// Base URL for the site
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.taash.tax';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Taash - Effortless Tax & Finance for Nigerian Freelancers',
    template: '%s | Taash',
  },
  description:
    'AI-powered platform helping Nigerian freelancers, creators, and small businesses track expenses, estimate taxes, and save smarter. Join the waitlist for early access.',
  keywords: [
    'tax software Africa',
    'freelancer tax calculator',
    'Nigerian tax calculator',
    'African freelancer finance',
    'expense tracking Africa',
    'tax compliance Nigeria',
    'tax compliance Ghana',
    'tax compliance Kenya',
    'tax compliance South Africa',
    'SME tax software',
    'creator tax tools',
    'AI tax estimator',
    'freelance income tracker',
    'TIN registration Africa',
    'small business tax Africa',
  ],
  authors: [{ name: 'Taash Technologies Inc.' }],
  creator: 'Taash Technologies Inc.',
  publisher: 'Taash Technologies Inc.',
  // icon.svg, icon-192.png and icon-512.png were a placeholder "T" until v=3; the version
  // bump makes browsers drop their cached copy. favicon.ico already carried the real mark.
  icons: {
    icon: [
      { url: '/favicon.ico?v=2', sizes: '48x48', type: 'image/x-icon' },
      { url: '/icon.svg?v=3', type: 'image/svg+xml', sizes: 'any' },
    ],
    apple: [{ url: '/apple-touch-icon.png?v=3', sizes: '180x180', type: 'image/png' }],
  },
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteUrl,
    siteName: 'Taash',
    title: 'Taash - Effortless Tax & Finance for Nigerian Freelancers',
    description:
      'AI-powered platform helping Nigerian freelancers, creators, and small businesses track expenses, estimate taxes, and save smarter.',
    images: [
      {
        url: '/og-image.png?v=2',
        width: 1200,
        height: 630,
        alt: 'Taash - Tax & Finance for Nigerian Freelancers',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Taash - Effortless Tax & Finance for Nigerian Freelancers',
    description:
      'AI-powered platform helping Nigerian freelancers track expenses, estimate taxes, and save smarter.',
    images: ['/og-image.png?v=2'],
    creator: '@taaborafrica',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: siteUrl,
  },
  category: 'Finance',
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en' className={`${spaceGrotesk.variable} ${jetbrainsMono.variable}`}>
      <head>
        <meta
          name='google-site-verification'
          content='1EUjadppSWLxbtcm8HTr8DAimEDTLikT65JsIexrdAU'
        />
        <link rel='manifest' href='/manifest.json' />
        {/* JSON-LD Structured Data for SEO */}
        <OrganizationSchema />
        <WebsiteSchema />
        <SoftwareApplicationSchema />
        <FAQSchema />
        <BreadcrumbSchema />
      </head>
      <body className='font-sans antialiased'>
        {children}
        <SiteAnalytics />
      </body>
    </html>
  );
}
