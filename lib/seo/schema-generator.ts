/**
 * Schema Markup Generator
 * Generates JSON-LD structured data for SEO and AI search engines
 */

export interface SchemaMarkupOptions {
  url: string
  image?: string
  datePublished?: string
  dateModified?: string
  author?: string
}

/**
 * Generate Organization schema for website
 */
export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'The Revamp UG',
    url: 'https://therevampug.com',
    logo: 'https://therevampug.com/logo.png',
    description:
      'Luxury design house offering interior design, architecture, 3D visualization, construction, procurement, and custom furniture services.',
    sameAs: [
      'https://instagram.com/therevampug',
      'https://linkedin.com/company/therevampug',
      'https://twitter.com/therevampug',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Service',
      telephone: '+256-phone-number',
      email: 'hello@therevampug.com',
    },
  }
}

/**
 * Generate Service schema for individual services
 */
export function generateServiceSchema(
  name: string,
  description: string,
  options: SchemaMarkupOptions
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name,
    description,
    url: options.url,
    image: options.image,
    provider: {
      '@type': 'Organization',
      name: 'The Revamp UG',
      url: 'https://therevampug.com',
    },
    areaServed: {
      '@type': 'Country',
      name: 'Uganda',
    },
    serviceType: name,
  }
}

/**
 * Generate Product schema for items in shop
 */
export function generateProductSchema(
  name: string,
  description: string,
  price: string,
  currency: string,
  images: string[],
  options: SchemaMarkupOptions
) {
  return {
    '@context': 'https://schema.org/',
    '@type': 'Product',
    name,
    description,
    image: images,
    brand: {
      '@type': 'Brand',
      name: 'The Revamp UG',
    },
    offers: {
      '@type': 'Offer',
      url: options.url,
      priceCurrency: currency,
      price,
      availability: 'https://schema.org/InStock',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '150',
    },
  }
}

/**
 * Generate Project/Portfolio schema
 */
export function generateProjectSchema(
  name: string,
  description: string,
  images: string[],
  options: SchemaMarkupOptions
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'VisualArtwork',
    name,
    description,
    image: images,
    creator: {
      '@type': 'Organization',
      name: 'The Revamp UG',
    },
    url: options.url,
    datePublished: options.datePublished,
    dateModified: options.dateModified,
  }
}

/**
 * Generate Article schema for blog posts
 */
export function generateArticleSchema(
  title: string,
  description: string,
  image: string,
  author: string,
  options: SchemaMarkupOptions
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: title,
    description,
    image,
    author: {
      '@type': 'Person',
      name: author,
    },
    datePublished: options.datePublished,
    dateModified: options.dateModified,
    url: options.url,
    mainEntity: {
      '@type': 'Article',
      headline: title,
      image,
      datePublished: options.datePublished,
      author: {
        '@type': 'Person',
        name: author,
      },
    },
  }
}

/**
 * Generate BreadcrumbList schema for navigation
 */
export function generateBreadcrumbSchema(breadcrumbs: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

/**
 * Generate FAQ schema for FAQ pages
 */
export function generateFAQSchema(faqs: Array<{ question: string; answer: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }
}

/**
 * Generate LocalBusiness schema
 */
export function generateLocalBusinessSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'The Revamp UG',
    image: 'https://therevampug.com/logo.png',
    description:
      'Luxury design house offering comprehensive interior design, architecture, and procurement services in Uganda.',
    telephone: '+256-phone-number',
    email: 'hello@therevampug.com',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Street Address',
      addressLocality: 'Kampala',
      addressRegion: 'Uganda',
      postalCode: '00256',
      addressCountry: 'UG',
    },
    url: 'https://therevampug.com',
    sameAs: [
      'https://instagram.com/therevampug',
      'https://linkedin.com/company/therevampug',
    ],
  }
}
