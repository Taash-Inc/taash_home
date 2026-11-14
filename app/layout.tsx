import {
  OrganizationSchema,
  SoftwareApplicationSchema,
  WebsiteSchema,
} from '@/components/StructuredData';
import ErrorReporter from '@/components/ErrorReporter';
import SiteAnalytics from '@/components/SiteAnalytics';
import { SITE_URL } from '@/lib/site';
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

const siteUrl = SITE_URL;
const title = 'Taash: Tax App and 2026 Tax Calculator for Nigeria';
const description =
  'Free 2026 tax calculator for Nigeria. Taash tracks your income and expenses and keeps freelancers, creators and small businesses tax-ready. Join the waitlist.';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: title,
    template: '%s | Taash',
  },
  description,
  keywords: [
    'tax app Nigeria',
    'Nigeria tax calculator 2026',
    'PAYE calculator Nigeria',
    'Nigeria Tax Act 2025',
    'freelancer tax Nigeria',
    'creator tax Nigeria',
    'small business tax Nigeria',
    'expense tracker Nigeria',
    'rent relief Nigeria',
    'tax app Africa',
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
    locale: 'en_NG',
    url: siteUrl,
    siteName: 'Taash',
    title,
    description,
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
    title,
    description,
    images: ['/og-image.png?v=2'],
    creator: '@taashtax',
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
    <html lang='en-NG' className={`${spaceGrotesk.variable} ${jetbrainsMono.variable}`}>
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
      </head>
      <body className='font-sans antialiased'>
        {children}
        <SiteAnalytics />
        <ErrorReporter />
      </body>
    </html>
  );
}
