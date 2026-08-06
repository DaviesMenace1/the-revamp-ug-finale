/**
 * Schema Markup Generator
 * Generates JSON-LD structured data for SEO and AI search engines
 */

export interface SchemaMarkupOptions {
  url?: string
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
 * Accepts either positional args (name, description, options) or a single object { name, description, options }
 */
export function generateServiceSchema(...args: any) {
  let name: string
  let description: string
  let options: SchemaMarkupOptions | undefined

  if (args.length === 1 && typeof args[0] === 'object') {
    ;({ name, description, options } = args[0])
  } else {
    ;[name, description, options] = args
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name,
    description,
    url: options?.url,
    image: options?.image,
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
 * Supports two call styles:
 * - Positional: (name, description, price, currency, images, options)
 * - Object: ({ name, description, price, currency, images | image, options | url })
 */
export function generateProductSchema(...args: any) {
  let name: string
  let description: string
  let price: string
  let currency: string
  let images: string[]
  let options: SchemaMarkupOptions | undefined

  if (args.length === 1 && typeof args[0] === 'object') {
    const o = args[0]
    name = o.name
    description = o.description
    price = typeof o.price === 'number' ? String(o.price) : o.price
    currency = o.currency || 'USD'
    images = o.images || (o.image ? [o.image] : [])
    options = o.options || { url: o.url, image: o.image }
  } else {
    ;[name, description, price, currency, images, options] = args
  }

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
      url: options?.url,
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
 * Supports either positional (name, description, images, options) or object ({ name, description, images | image, options | url, datePublished })
 */
export function generateProjectSchema(...args: any) {
  let name: string
  let description: string
  let images: string[]
  let options: SchemaMarkupOptions | undefined

  if (args.length === 1 && typeof args[0] === 'object') {
    const o = args[0]
    name = o.name
    description = o.description
    images = o.images || (o.image ? [o.image] : [])
    options = o.options || { url: o.url, datePublished: o.startDate || o.datePublished }
  } else {
    ;[name, description, images, options] = args
  }

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
    url: options?.url,
    datePublished: options?.datePublished,
    dateModified: options?.dateModified,
  }
}

/**
 * Generate Article schema for blog posts
 * Supports positional or object-style call
 */
export function generateArticleSchema(...args: any) {
  let title: string
  let description: string
  let image: string | undefined
  let author: string
  let options: SchemaMarkupOptions | undefined

  if (args.length === 1 && typeof args[0] === 'object') {
    const o = args[0]
    title = o.title || o.headline || o.headline
    description = o.description
    image = o.image
    author = o.author
    options = o.options || { url: o.url, datePublished: o.datePublished }
  } else {
    ;[title, description, image, author, options] = args
  }

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
    datePublished: options?.datePublished,
    dateModified: options?.dateModified,
    url: options?.url,
    mainEntity: {
      '@type': 'Article',
      headline: title,
      image,
      datePublished: options?.datePublished,
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
