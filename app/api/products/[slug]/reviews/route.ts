import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import { productReviews, products } from '@/lib/db/schema'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> | { slug: string } }
) {
  try {
    const resolvedParams = await params
    const slug = resolvedParams.slug
    const body = await req.json()
    const { productId, authorName, rating, comment } = body

    if (!productId || !authorName || !comment) {
      return NextResponse.json(
        { success: false, error: 'Missing required review fields' },
        { status: 400 }
      )
    }

    // 1. Insert the new review
    const [newReview] = await db
      .insert(productReviews)
      .values({
        productId,
        authorName,
        rating: Number(rating) || 5,
        comment,
      })
      .returning()

    // 2. Fetch all reviews for this product to recalculate the average rating
    const allReviews = await db
      .select({ rating: productReviews.rating })
      .from(productReviews)
      .where(eq(productReviews.productId, productId))

    const totalRating = allReviews.reduce((acc, r) => acc + (r.rating || 0), 0)
    const newAverage = Number((totalRating / allReviews.length).toFixed(1))

    // 3. Update product rating in DB
    await db
      .update(products)
      .set({
        rating: newAverage,
        ratingCount: allReviews.length,
      })
      .where(eq(products.id, productId))

    // 4. Purge page cache
    revalidatePath(`/collections/${slug}`)

    return NextResponse.json({ success: true, data: newReview }, { status: 201 })
  } catch (error: any) {
    console.error('Failed to insert review:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Server error' },
      { status: 500 }
    )
  }
}

