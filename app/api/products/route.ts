import { NextRequest, NextResponse } from 'next/server';
import { getProducts, searchProducts, getProductsByCategory } from '@/lib/db/queries';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search');
    const category = searchParams.get('category');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const offset = (page - 1) * limit;

    let products;

    if (search) {
      products = await searchProducts(search);
    } else if (category) {
      products = await getProductsByCategory(category);
    } else {
      products = await getProducts(limit, offset);
    }

    return NextResponse.json({
      success: true,
      data: products,
      page,
      limit,
      count: products.length,
    });
  } catch (error) {
    console.error('[Products API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}
