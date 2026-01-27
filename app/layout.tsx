import {
  BreadcrumbSchema,
  FAQSchema,
  OrganizationSchema,
  SoftwareApplicationSchema,
  WebsiteSchema,
} from '@/components/StructuredData';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import type { Metadata, Viewport } from 'next';
import { JetBrains_Mono, Space_Grotesk } from 'next/font/google';
import './globals.css';

const spaceGrotesk = Space_Grotesk({
  variable: '--font-space-grotesk',
  subsets: ['latin'],
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
  display: 'swap',
});

// Base URL for the site
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.taash.tax';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Taash - Effortless Tax & Finance for African Freelancers',
    template: '%s | Taash',
  },
  description:
    'AI-powered platform helping African freelancers, creators, and small businesses track expenses, estimate taxes, and save smarter. Join the waitlist for early access.',
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
    title: 'Taash - Effortless Tax & Finance for African Freelancers',
    description:
      'AI-powered platform helping African freelancers, creators, and small businesses track expenses, estimate taxes, and save smarter.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Taash - Tax & Finance for African Freelancers',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Taash - Effortless Tax & Finance for African Freelancers',
    description:
      'AI-powered platform helping African freelancers track expenses, estimate taxes, and save smarter.',
    images: ['/og-image.png'],
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
    <html lang='en'>
      <head>
        <link rel='icon' href='/favicon.ico' sizes='any' />
        <link rel='icon' href='/icon.svg' type='image/svg+xml' />
        <link rel='apple-touch-icon' href='/apple-touch-icon.png' />
        <link rel='manifest' href='/manifest.json' />
        {/* JSON-LD Structured Data for SEO */}
        <OrganizationSchema />
        <WebsiteSchema />
        <SoftwareApplicationSchema />
        <FAQSchema />
        <BreadcrumbSchema />
      </head>
      <body className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
