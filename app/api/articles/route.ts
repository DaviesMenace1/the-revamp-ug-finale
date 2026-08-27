import { NextRequest, NextResponse } from 'next/server';
import { getPublishedArticles, getArticlesByCategory } from '@/lib/db/queries';
import { checkRateLimit, withCache, CACHE_KEYS, TTL } from '@/lib/redis';

export async function GET(request: NextRequest) {
  const limited = await checkRateLimit(request, 'api');
  if (limited) return limited;

  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    const cacheKey = CACHE_KEYS.articlesList(page, limit, category ?? undefined);

    const articles = await withCache(
      cacheKey,
      async () => {
        if (category) return getArticlesByCategory(category);
        return getPublishedArticles(limit, offset);
      },
      TTL.LONG,
    );

    return NextResponse.json(
      { success: true, data: articles, page, limit, count: articles.length },
      { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600' } },
    );
  } catch (error) {
    console.error('[Articles API] Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch articles' }, { status: 500 });
  }
}
