import { FAQ, type FaqItem } from '@/lib/faq';
import { SITE_URL } from '@/lib/site';

/*
 * JSON-LD for search engines. Every claim here must be true and, for the FAQ, visible on the
 * page: Google penalises markup that isn't. Removed in Nov 2026:
 *   - aggregateRating 4.8 from 150 ratings, for an app that has not launched (fabricated reviews
 *     are a spam policy violation);
 *   - a SearchAction pointing at /search, which doesn't exist;
 *   - FAQ answers not shown on the page, including support for Ghana, Kenya and South Africa;
 *   - a logo at /logo.png, which doesn't exist.
 */

function JsonLd({ data }: { data: object }) {
  return (
    <script
      type='application/ld+json'
      // JSON.stringify output contains no executable HTML; "<" is escaped so a string can
      // never close the script element.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  );
}

export function OrganizationSchema() {
  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'Taash',
        legalName: 'Taash Technologies Inc.',
        url: SITE_URL,
        logo: `${SITE_URL}/icon-512.png`,
        description:
          'Taash is a tax and finance app that helps freelancers, creators, salary earners and small businesses in Nigeria track income and expenses and stay tax-ready.',
        areaServed: { '@type': 'Country', name: 'Nigeria' },
        sameAs: [
          'https://x.com/taashapp',
          'https://www.linkedin.com/company/taash-technologies-inc/',
          'https://www.instagram.com/taashapp/',
          'https://www.facebook.com/profile.php?id=61585718545111',
          'https://www.youtube.com/@taashapp',
        ],
      }}
    />
  );
}

export function WebsiteSchema() {
  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'Taash',
        url: SITE_URL,
        inLanguage: 'en-NG',
      }}
    />
  );
}

export function SoftwareApplicationSchema() {
  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'MobileApplication',
        name: 'Taash',
        applicationCategory: 'FinanceApplication',
        operatingSystem: 'iOS, Android',
        url: SITE_URL,
        description:
          'Tax and finance app for Nigeria: track income and expenses, scan receipts, see your tax under the Nigeria Tax Act 2025 and know what to set aside.',
        featureList: [
          'Tax estimate under the Nigeria Tax Act 2025',
          'Swipe to mark expenses tax deductible',
          'Receipt scanning',
          'Read-only bank connection',
          'Tax set-aside planning',
          'Taash AI answers from your own numbers',
        ],
      }}
    />
  );
}

/** Only alongside the visible FAQ section it describes, with the same items. */
export function FAQSchema({ items = FAQ }: { items?: readonly FaqItem[] }) {
  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: items.map(({ q, a }) => ({
          '@type': 'Question',
          name: q,
          acceptedAnswer: { '@type': 'Answer', text: a },
        })),
      }}
    />
  );
}

export function BlogPostingSchema({
  title,
  description,
  slug,
  image,
  publishedAt,
  author,
}: {
  title: string;
  description?: string;
  slug: string;
  image?: string;
  publishedAt?: string;
  author?: string;
}) {
  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: title,
        description,
        url: `${SITE_URL}/blogs/${slug}`,
        mainEntityOfPage: `${SITE_URL}/blogs/${slug}`,
        ...(image ? { image } : {}),
        ...(publishedAt ? { datePublished: publishedAt } : {}),
        author: { '@type': author ? 'Person' : 'Organization', name: author ?? 'Taash' },
        publisher: { '@type': 'Organization', name: 'Taash', logo: `${SITE_URL}/icon-512.png` },
        inLanguage: 'en-NG',
      }}
    />
  );
}

export function BreadcrumbSchema({ items }: { items: { name: string; path: string }[] }) {
  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: items.map((item, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: item.name,
          item: `${SITE_URL}${item.path}`,
        })),
      }}
    />
  );
}

/** The free calculator itself: a web tool anyone can use without signing up. */
export function CalculatorSchema() {
  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: 'Taash Nigeria Tax Calculator 2026',
        url: `${SITE_URL}/tax-calculator`,
        applicationCategory: 'FinanceApplication',
        operatingSystem: 'Any',
        browserRequirements: 'Requires JavaScript',
        isAccessibleForFree: true,
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'NGN' },
        description:
          'Work out personal income tax in Nigeria under the Nigeria Tax Act 2025, for salaried (PAYE) and self-employed income, with pension, NHF, NHIS and rent relief.',
        areaServed: { '@type': 'Country', name: 'Nigeria' },
        inLanguage: 'en-NG',
      }}
    />
  );
}
