export function OrganizationSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Taash Technologies Inc.',
    url: 'https://www.taash.tax',
    logo: 'https://www.taash.tax/logo.png',
    description:
      'AI-powered platform helping Nigerian freelancers, creators, and small businesses track expenses, estimate taxes, and save smarter.',
    foundingDate: '2024',
    founders: [
      {
        '@type': 'Person',
        name: 'Taash Team',
      },
    ],
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'NG',
    },
    sameAs: [
      'https://x.com/taashapp',
      'https://www.linkedin.com/company/taash-technologies-inc/',
      'https://www.instagram.com/taashapp/',
      'https://www.facebook.com/profile.php?id=61585718545111',
      'https://www.youtube.com/@taashapp',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      availableLanguage: ['English'],
    },
  };

  return (
    <script
      type='application/ld+json'
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function WebsiteSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Taash',
    url: 'https://www.taash.tax',
    description:
      'AI-powered tax and finance platform for Nigerian freelancers, creators, and small businesses.',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://www.taash.tax/search?q={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <script
      type='application/ld+json'
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function SoftwareApplicationSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Taash',
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Web',
    description:
      'AI-powered tax estimation and expense tracking for Nigerian freelancers and small businesses.',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      availability: 'https://schema.org/PreOrder',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '150',
      bestRating: '5',
      worstRating: '1',
    },
    featureList: [
      'Smart Expense Categorisation',
      'Tax Estimator',
      'Savings Tips',
      'Receipt Upload',
      'Bank Connection',
    ],
  };

  return (
    <script
      type='application/ld+json'
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function FAQSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What is Taash?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Taash is an AI-powered platform that helps Nigerian freelancers, creators, and small businesses track expenses, estimate taxes, and save smarter.',
        },
      },
      {
        '@type': 'Question',
        name: 'Who is Taash for?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Taash is built for freelancers, content creators, and SMEs across Africa who want to stay tax-compliant and manage their finances effortlessly.',
        },
      },
      {
        '@type': 'Question',
        name: 'Which African countries does Taash support?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Taash supports tax calculations for Nigeria, Ghana, Kenya, and South Africa, with more countries coming soon.',
        },
      },
      {
        '@type': 'Question',
        name: 'How does Taash calculate taxes?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Taash uses AI to automatically categorize your income and expenses, then applies the relevant tax laws for your country to estimate your tax obligations in real-time.',
        },
      },
      {
        '@type': 'Question',
        name: 'Is Taash free to use?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Taash is currently in early access. Join the waitlist to get lifetime discounts and priority support when we launch.',
        },
      },
    ],
  };

  return (
    <script
      type='application/ld+json'
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function BreadcrumbSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://www.taash.tax',
      },
    ],
  };

  return (
    <script
      type='application/ld+json'
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
