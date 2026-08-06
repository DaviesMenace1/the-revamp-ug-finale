/**
 * API Endpoint for AI Search Systems
 * Returns structured product data for AI crawlers (Google, Claude, Perplexity, etc.)
 * 
 * Usage:
 * GET /api/search/products?page=1&limit=50&category=furniture&sort=newest&format=json-ld
 * 
 * This endpoint allows AI systems to fetch product data without visiting the website,
 * enabling semantic search results in Google, Claude, and other AI systems.
 */

import { NextRequest, NextResponse } from 'next/server';

interface Product {
  id: string;
  name: string;
  description: string;
  price?: number;
  currency: string;
  imageUrl?: string;
  category?: string;
  rating?: number;
  reviewsCount?: number;
  inStock?: boolean;
  sku?: string;
  brand?: string;
  url: string;
}

interface APIResponse {
  products: Product[];
  total: number;
  pagination: {
    page: number;
    limit: number;
    hasMore: boolean;
  };
  _links?: {
    self: string;
    next?: string;
    prev?: string;
  };
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Parse query parameters
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, parseInt(searchParams.get('limit') || '50', 10));
    const category = searchParams.get('category');
    const sort = searchParams.get('sort') || 'newest';
    const format = searchParams.get('format') || 'json'; // json or json-ld
    const search = searchParams.get('search');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const inStock = searchParams.get('inStock') === 'true';

    // TODO: Replace with actual database query
    // This is a placeholder - implement with your Supabase/database
    const mockProducts: Product[] = [
      {
        id: 'prod_001',
        name: 'Minimalist Leather Sofa',
        description: 'Handcrafted genuine leather sofa in modern minimalist design. Perfect for contemporary living spaces.',
        price: 2500,
        currency: 'USD',
        imageUrl: 'https://via.placeholder.com/1200x800',
        category: 'Furniture',
        rating: 4.8,
        reviewsCount: 24,
        inStock: true,
        sku: 'SOFA-001',
        brand: 'Revamp UG',
        url: `${process.env.NEXT_PUBLIC_APP_URL}/products/prod_001`,
      },
      {
        id: 'prod_002',
        name: 'Scandinavian Oak Dining Table',
        description: 'Solid oak dining table with natural finish. Seats 8-10 people comfortably.',
        price: 1800,
        currency: 'USD',
        imageUrl: 'https://via.placeholder.com/1200x800',
        category: 'Furniture',
        rating: 4.6,
        reviewsCount: 18,
        inStock: true,
        sku: 'TABLE-001',
        brand: 'Revamp UG',
        url: `${process.env.NEXT_PUBLIC_APP_URL}/products/prod_002`,
      },
    ];

    // Filter products
    let filtered = mockProducts;

    if (category) {
      filtered = filtered.filter((p) => p.category?.toLowerCase() === category.toLowerCase());
    }

    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(searchLower) ||
          p.description.toLowerCase().includes(searchLower) ||
          p.category?.toLowerCase().includes(searchLower)
      );
    }

    if (minPrice) {
      const min = parseFloat(minPrice);
      filtered = filtered.filter((p) => (p.price || 0) >= min);
    }

    if (maxPrice) {
      const max = parseFloat(maxPrice);
      filtered = filtered.filter((p) => (p.price || 0) <= max);
    }

    if (inStock) {
      filtered = filtered.filter((p) => p.inStock !== false);
    }

    // Sort products
    switch (sort) {
      case 'oldest':
        filtered.reverse();
        break;
      case 'price-low':
        filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case 'price-high':
        filtered.sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
      case 'rating':
        filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'newest':
      default:
        // Already in newest order
        break;
    }

    const total = filtered.length;
    const offset = (page - 1) * limit;
    const paginated = filtered.slice(offset, offset + limit);

    const response: APIResponse = {
      products: paginated,
      total,
      pagination: {
        page,
        limit,
        hasMore: offset + limit < total,
      },
      _links: {
        self: `${request.nextUrl.origin}/api/search/products?page=${page}&limit=${limit}${category ? `&category=${category}` : ''}`,
        ...(page > 1 && {
          prev: `${request.nextUrl.origin}/api/search/products?page=${page - 1}&limit=${limit}${category ? `&category=${category}` : ''}`,
        }),
        ...(offset + limit < total && {
          next: `${request.nextUrl.origin}/api/search/products?page=${page + 1}&limit=${limit}${category ? `&category=${category}` : ''}`,
        }),
      },
    };

    // Set cache headers for AI crawlers
    const headers = {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600', // 1 hour cache
      'CDN-Cache-Control': 'max-age=3600',
      'X-Robots-Tag': 'index, follow',
    };

    return NextResponse.json(response, { headers });
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function HEAD(request: NextRequest) {
  // Allow HEAD requests for cache checking
  return new Response(null, { status: 200 });
}
