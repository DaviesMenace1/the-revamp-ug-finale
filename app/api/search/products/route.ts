/**
 * Public structured product search endpoint for AI crawlers and integrations.
 */

import { NextRequest, NextResponse } from 'next/server'
import { desc, eq } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import { products } from '@/lib/db/schema'
import { normalizeProductTags } from '@/lib/products/tags'

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://therevampug.com').replace(/\/$/, '')

interface Product {
  id: string
  name: string
  description: string
  price?: number
  currency: string
  imageUrl?: string
  category?: string
  tags: string[]
  rating?: number
  reviewsCount?: number
  inStock?: boolean
  sku?: string
  brand?: string
  url: string
}

interface APIResponse {
  products: Product[]
  total: number
  pagination: { page: number; limit: number; hasMore: boolean }
  _links?: { self: string; next?: string; prev?: string }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)))
    const category = searchParams.get('category')
    const sort = searchParams.get('sort') || 'newest'
    const search = searchParams.get('search')?.trim().toLowerCase()
    const minPrice = Number(searchParams.get('minPrice'))
    const maxPrice = Number(searchParams.get('maxPrice'))
    const inStock = searchParams.get('inStock') === 'true'

    const rows = await db.query.products.findMany({
      where: eq(products.status, 'published'),
      columns: {
        id: true,
        name: true,
        slug: true,
        description: true,
        price: true,
        currency: true,
        brand: true,
        sku: true,
        rating: true,
        ratingCount: true,
        quantity: true,
        ogImage: true,
        tags: true,
      },
      orderBy: desc(products.updatedAt),
      limit: 500,
    })

    let filtered: Product[] = rows.map((product) => {
      const tags = normalizeProductTags(product.tags)
      return {
        id: product.id,
        name: product.name,
        description: product.description || '',
        price: Number(product.price || 0),
        currency: product.currency || 'UGX',
        imageUrl: product.ogImage || undefined,
        category: undefined,
        tags,
        rating: Number(product.rating || 0),
        reviewsCount: product.ratingCount || 0,
        inStock: Number(product.quantity || 0) > 0,
        sku: product.sku,
        brand: product.brand || undefined,
        url: `${SITE_URL}/collections/${product.slug}`,
      }
    })

    if (category) filtered = filtered.filter((product) => product.category?.toLowerCase() === category.toLowerCase())
    if (search) filtered = filtered.filter((product) => `${product.name} ${product.description} ${product.category || ''} ${product.tags.join(' ')}`.toLowerCase().includes(search))
    if (Number.isFinite(minPrice)) filtered = filtered.filter((product) => (product.price || 0) >= minPrice)
    if (Number.isFinite(maxPrice)) filtered = filtered.filter((product) => (product.price || 0) <= maxPrice)
    if (inStock) filtered = filtered.filter((product) => product.inStock !== false)

    if (sort === 'price-low') filtered.sort((a, b) => (a.price || 0) - (b.price || 0))
    if (sort === 'price-high') filtered.sort((a, b) => (b.price || 0) - (a.price || 0))
    if (sort === 'rating') filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0))
    if (sort === 'oldest') filtered.reverse()

    const total = filtered.length
    const offset = (page - 1) * limit
    const paginated = filtered.slice(offset, offset + limit)
    const query = `page=${page}&limit=${limit}${category ? `&category=${encodeURIComponent(category)}` : ''}${search ? `&search=${encodeURIComponent(search)}` : ''}`

    const response: APIResponse = {
      products: paginated,
      total,
      pagination: { page, limit, hasMore: offset + limit < total },
      _links: {
        self: `${request.nextUrl.origin}/api/search/products?${query}`,
        ...(page > 1 ? { prev: `${request.nextUrl.origin}/api/search/products?page=${page - 1}&limit=${limit}` } : {}),
        ...(offset + limit < total ? { next: `${request.nextUrl.origin}/api/search/products?page=${page + 1}&limit=${limit}` } : {}),
      },
    }

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, max-age=300, s-maxage=3600',
        'CDN-Cache-Control': 'max-age=3600',
        'X-Robots-Tag': 'index, follow',
      },
    })
  } catch (error) {
    console.error('Search API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function HEAD() {
  return new Response(null, { status: 200 })
}
