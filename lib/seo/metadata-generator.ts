/**
 * SEO Metadata Generator
 * Generates optimized metadata for pages and content
 */

import { Metadata } from 'next'

export interface SEOMetadataInput {
  title: string
  description: string
  url: string
  image?: string
  type?: 'website' | 'article' | 'product'
  author?: string
  publishedDate?: string
  modifiedDate?: string
  keywords?: string[]
}

/**
 * Generate Metadata object for Next.js pages
 */
export function generateMetadata(input: SEOMetadataInput): Metadata {
  const {
    title,
    description,
    url,
    image = 'https://therevampug.com/default-og-image.png',
    type = 'website',
    author,
    publishedDate,
    modifiedDate,
    keywords = [],
  } = input

  const siteUrl = 'https://therevampug.com'
  const fullUrl = `${siteUrl}${url}`

  return {
    title: `${title} | The Revamp UG`,
    description,
    keywords: [
      ...keywords,
      'luxury design',
      'interior design',
      'architecture',
      'furniture',
      'Uganda',
    ],
    authors: author ? [{ name: author }] : undefined,
    openGraph: {
      title,
      description,
      url: fullUrl,
      siteName: 'The Revamp UG',
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      type: type === 'article' ? 'article' : 'website',
      publishedTime: publishedDate,
      modifiedTime: modifiedDate,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
      creator: '@therevampug',
    },
    alternates: {
      canonical: fullUrl,
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
  }
}

/**
 * Generate metadata for Services
 */
export function generateServiceMetadata(
  serviceName: string,
  description: string,
  url: string
): Metadata {
  return generateMetadata({
    title: serviceName,
    description,
    url,
    keywords: [
      serviceName.toLowerCase(),
      'design service',
      'luxury service',
      'professional design',
    ],
  })
}

/**
 * Generate metadata for Products
 */
export function generateProductMetadata(
  productName: string,
  price: string,
  description: string,
  image: string,
  url: string
): Metadata {
  return generateMetadata({
    title: `${productName} - Luxury Furniture & Décor`,
    description,
    url,
    image,
    type: 'product',
    keywords: [
      productName,
      'luxury furniture',
      'buy online',
      'home décor',
      'interior design',
    ],
  })
}

/**
 * Generate metadata for Projects/Portfolio
 */
export function generateProjectMetadata(
  projectTitle: string,
  description: string,
  image: string,
  url: string,
  date?: string
): Metadata {
  return generateMetadata({
    title: projectTitle,
    description,
    url,
    image,
    type: 'article',
    publishedDate: date,
    keywords: [
      'portfolio',
      'interior design project',
      'architecture project',
      'design inspiration',
    ],
  })
}

/**
 * Generate metadata for Articles/Blog
 */
export function generateArticleMetadata(
  title: string,
  excerpt: string,
  image: string,
  author: string,
  url: string,
  publishedDate: string,
  modifiedDate?: string
): Metadata {
  return generateMetadata({
    title,
    description: excerpt,
    url,
    image,
    type: 'article',
    author,
    publishedDate,
    modifiedDate,
    keywords: [
      'design blog',
      'interior design tips',
      'home décor',
      'design inspiration',
    ],
  })
}

/**
 * Generate metadata for Collections/Categories
 */
export function generateCollectionMetadata(
  categoryName: string,
  description: string,
  url: string,
  image?: string
): Metadata {
  return generateMetadata({
    title: `${categoryName} | Shop Luxury Furniture & Décor`,
    description,
    url,
    image,
    keywords: [
      categoryName,
      'furniture collection',
      'buy luxury',
      'interior design',
    ],
  })
}

/**
 * Generate seo-friendly slug from text
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
}

/**
 * Generate SEO-friendly title
 */
export function generateSEOTitle(title: string, maxLength: number = 60): string {
  if (title.length <= maxLength) return title
  return title.substring(0, maxLength - 3) + '...'
}

/**
 * Generate SEO-friendly description
 */
export function generateSEODescription(description: string, maxLength: number = 160): string {
  const clean = description.replace(/<[^>]*>/g, '').trim()
  if (clean.length <= maxLength) return clean

  const truncated = clean.substring(0, maxLength - 3)
  const lastSpace = truncated.lastIndexOf(' ')
  return truncated.substring(0, lastSpace > 0 ? lastSpace : maxLength - 3) + '...'
}

/**
 * Extract keywords from content
 */
export function extractKeywords(content: string, count: number = 5): string[] {
  // Simple keyword extraction based on word frequency
  // In production, use proper NLP library
  const words = content
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter((word) => word.length > 3)

  const frequency: { [key: string]: number } = {}
  words.forEach((word) => {
    frequency[word] = (frequency[word] || 0) + 1
  })

  return Object.entries(frequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, count)
    .map(([word]) => word)
}

/**
 * Generate canonical URL
 */
export function generateCanonicalURL(path: string): string {
  const baseURL = process.env.NEXT_PUBLIC_SITE_URL || 'https://therevampug.com'
  return new URL(path, baseURL).toString()
}
