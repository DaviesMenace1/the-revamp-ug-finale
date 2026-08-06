import { NextRequest, NextResponse } from 'next/server';
import { getProducts, searchProducts, getProductsByCategory } from '@/lib/db/queries';
import { checkRateLimit, withCache, CACHE_KEYS, TTL } from '@/lib/redis';

export async function GET(request: NextRequest) {
  const limited = await checkRateLimit(request, 'api');
  if (limited) return limited;

  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search');
    const category = searchParams.get('category');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    const cacheKey = search
      ? CACHE_KEYS.searchResults(`products:${search}`)
      : CACHE_KEYS.productsList(page, limit, category ?? undefined);

    const products = await withCache(
      cacheKey,
      async () => {
        if (search) return searchProducts(search);
        if (category) return getProductsByCategory(category);
        return getProducts(limit, offset);
      },
      search ? TTL.SHORT : TTL.MEDIUM,
    );

    return NextResponse.json(
      { success: true, data: products, page, limit, count: products.length },
      { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } },
    );
  } catch (error) {
    console.error('[Products API] Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch products' }, { status: 500 });
  }
}
