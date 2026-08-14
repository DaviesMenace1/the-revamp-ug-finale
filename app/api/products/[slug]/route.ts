import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { products } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params

    if (!slug) {
      return NextResponse.json(
        { success: false, error: 'Product slug is required' },
        { status: 400 }
      )
    }

    // Fetch product with ALL relational data attached
    const product = await db.query.products.findFirst({
      where: eq(products.slug, slug),
      with: {
        productVariants: true, // Color swatches & fabric deltas
        productImages: true,   // Full image gallery
        category: true,        // Parent category info
        reviews: true,         // Customer ratings & comments
      },
    })

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: product })
  } catch (error: any) {
    console.error('Error fetching product details:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    )
  }
}
