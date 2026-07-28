/**
 * JSON-LD Schema Generator for Structured Data
 * Generates schema.org compliant JSON-LD for SEO and AI parsing
 */

export interface Product {
  id: string;
  name: string;
  description: string;
  price?: number;
  currency?: string;
  imageUrl?: string;
  rating?: number;
  reviewCount?: number;
  brand?: string;
  inStock?: boolean;
  sku?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  location?: string;
  designer?: string;
  style?: string;
  imageUrl?: string;
  publishedDate?: string;
  scope?: string;
}

export interface Article {
  id: string;
  title: string;
  description?: string;
  content?: string;
  author?: string;
  publishedDate?: string;
  modifiedDate?: string;
  imageUrl?: string;
  tags?: string[];
}

export interface Service {
  name: string;
  description?: string;
  pricing?: {
    type: 'quote' | 'fixed' | 'range';
    startingPrice?: number;
    currency?: string;
  };
  includes?: string[];
  imageUrl?: string;
}

/**
 * Generate Product Schema
 */
export function generateProductSchema(product: Product, baseUrl: string = process.env.NEXT_PUBLIC_APP_URL || '') {
  return {
    '@context': 'https://schema.org/',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.imageUrl || `${baseUrl}/placeholder.jpg`,
    sku: product.sku || product.id,
    brand: {
      '@type': 'Brand',
      name: product.brand || 'Revamp UG',
    },
    offers: {
      '@type': 'Offer',
      url: `${baseUrl}/products/${product.id}`,
      price: product.price || 0,
      priceCurrency: product.currency || 'USD',
      availability: product.inStock !== false ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    },
    ...(product.rating && product.reviewCount && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: product.rating,
        reviewCount: product.reviewCount,
        ratingCount: product.reviewCount,
      },
    }),
  };
}

/**
 * Generate Project Schema
 */
export function generateProjectSchema(project: Project, baseUrl: string = process.env.NEXT_PUBLIC_APP_URL || '') {
  return {
    '@context': 'https://schema.org/',
    '@type': 'CreativeWork',
    name: project.name,
    description: project.description,
    image: project.imageUrl || `${baseUrl}/placeholder.jpg`,
    url: `${baseUrl}/projects/${project.id}`,
    author: project.designer
      ? {
          '@type': 'Person',
          name: project.designer,
        }
      : {
          '@type': 'Organization',
          name: 'Revamp UG',
        },
    ...(project.publishedDate && { datePublished: project.publishedDate }),
    ...(project.location && {
      locationCreated: {
        '@type': 'Place',
        name: project.location,
      },
    }),
    ...(project.style && {
      about: {
        '@type': 'Thing',
        name: project.style,
      },
    }),
  };
}

/**
 * Generate Article Schema
 */
export function generateArticleSchema(article: Article, baseUrl: string = process.env.NEXT_PUBLIC_APP_URL || '') {
  return {
    '@context': 'https://schema.org/',
    '@type': 'NewsArticle',
    headline: article.title,
    description: article.description || article.title,
    image: article.imageUrl || `${baseUrl}/placeholder.jpg`,
    url: `${baseUrl}/journal/${article.id}`,
    datePublished: article.publishedDate || new Date().toISOString(),
    ...(article.modifiedDate && { dateModified: article.modifiedDate }),
    author: article.author
      ? {
          '@type': 'Person',
          name: article.author,
        }
      : {
          '@type': 'Organization',
          name: 'Revamp UG',
        },
    ...(article.tags && article.tags.length > 0 && { keywords: article.tags.join(', ') }),
    articleBody: article.content,
  };
}

/**
 * Generate Organization Schema (Global)
 */
export function generateOrganizationSchema(baseUrl: string = process.env.NEXT_PUBLIC_APP_URL || '') {
  return {
    '@context': 'https://schema.org/',
    '@type': 'LocalBusiness',
    '@id': baseUrl,
    name: 'Revamp UG',
    url: baseUrl,
    image: `${baseUrl}/logo.png`,
    description:
      'Interior design, architecture, and global sourcing services with white-glove installation',
    sameAs: [
      'https://www.facebook.com/therevampug',
      'https://www.instagram.com/therevampug',
      'https://www.linkedin.com/company/therevampug',
      'https://www.pinterest.com/therevampug',
    ],
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Kampala',
      addressLocality: 'Kampala',
      addressCountry: 'UG',
    },
    telephone: process.env.NEXT_PUBLIC_PHONE_NUMBER || '+256',
    email: process.env.NEXT_PUBLIC_EMAIL || 'info@therevampug.com',
    priceRange: '$$',
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      opens: '09:00',
      closes: '17:00',
    },
  };
}

/**
 * Generate Breadcrumb Schema
 */
export interface BreadcrumbItem {
  name: string;
  url: string;
}

export function generateBreadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org/',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/**
 * Generate Service Schema
 */
export function generateServiceSchema(service: Service, baseUrl: string = process.env.NEXT_PUBLIC_APP_URL || '') {
  return {
    '@context': 'https://schema.org/',
    '@type': 'Service',
    name: service.name,
    description: service.description,
    image: service.imageUrl || `${baseUrl}/placeholder.jpg`,
    provider: {
      '@type': 'Organization',
      name: 'Revamp UG',
      url: baseUrl,
    },
    ...(service.pricing && {
      offers: {
        '@type': 'Offer',
        priceCurrency: service.pricing.currency || 'USD',
        ...(service.pricing.type === 'quote' && { price: 'Contact for quote' }),
        ...(service.pricing.type === 'fixed' && { price: service.pricing.startingPrice }),
        ...(service.pricing.type === 'range' && {
          price: `From ${service.pricing.startingPrice}`,
        }),
      },
    }),
    ...(service.includes && service.includes.length > 0 && {
      areaServed: {
        '@type': 'Country',
        name: 'Uganda',
      },
    }),
  };
}

/**
 * Generate FAQ Schema
 */
export interface FAQItem {
  question: string;
  answer: string;
}

export function generateFAQSchema(faqs: FAQItem[]) {
  return {
    '@context': 'https://schema.org/',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

/**
 * Generate VideoObject Schema
 */
export interface VideoObject {
  name: string;
  description: string;
  thumbnailUrl: string;
  uploadDate: string;
  duration?: string;
}

export function generateVideoSchema(video: VideoObject, videoUrl: string) {
  return {
    '@context': 'https://schema.org/',
    '@type': 'VideoObject',
    name: video.name,
    description: video.description,
    thumbnailUrl: video.thumbnailUrl,
    uploadDate: video.uploadDate,
    url: videoUrl,
    ...(video.duration && { duration: video.duration }),
  };
}

/**
 * Helper to inject JSON-LD into React Helmet or Next.js head
 */
export function schemaToJSON(schema: any): string {
  return JSON.stringify(schema);
}
