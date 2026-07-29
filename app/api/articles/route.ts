import { NextRequest, NextResponse } from 'next/server';
import { getArticles, getArticlesByCategory } from '@/lib/db/queries';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const offset = (page - 1) * limit;

    let articles;

    if (category) {
      articles = await getArticlesByCategory(category);
    } else {
      articles = await getArticles(limit, offset);
    }

    return NextResponse.json({
      success: true,
      data: articles,
      page,
      limit,
      count: articles.length,
    });
  } catch (error) {
    console.error('[Articles API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch articles' },
      { status: 500 }
    );
  }
}
