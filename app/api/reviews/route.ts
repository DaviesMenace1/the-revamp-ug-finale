import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { products } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function POST(req: NextRequest) {
  try {
    const { productId, author, rating, comment } = await req.json()

    if (!productId || !comment) {
      return NextResponse.json({ success: false, error: 'Product ID and comment are required' }, { status: 400 })
    }

    // 1. Fetch current product
    const product = await db.query.products.findFirst({
      where: eq(products.id, productId),
    })

    if (!product) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 })
    }

    // 2. Append review to product tags/reviews or JSON column
    const existingReviews = Array.isArray((product as any).reviews) ? (product as any).reviews : []
    const newReview = {
      id: `rev-${Date.now()}`,
      author: author || 'Verified Customer',
      rating: Number(rating) || 5,
      comment,
      createdAt: new Date().toISOString(),
    }

    const updatedReviews = [newReview, ...existingReviews]

    // Recalculate average rating
    const totalScore = updatedReviews.reduce((acc: number, r: any) => acc + (Number(r.rating) || 5), 0)
    const newAvgRating = (totalScore / updatedReviews.length).toFixed(1)

    // 3. Update PostgreSQL row
    await db
      .update(products)
      .set({
        rating: newAvgRating,
        ratingCount: updatedReviews.length,
      })
      .where(eq(products.id, productId))

    return NextResponse.json({ success: true, data: newReview }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
