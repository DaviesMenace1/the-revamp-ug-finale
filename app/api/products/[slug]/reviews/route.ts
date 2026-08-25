import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { auth } from '@clerk/nextjs/server'
import { and, desc, eq, inArray } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import { orders, productReviews, products } from '@/lib/db/schema'
import { getOrCreateCurrentUser } from '@/lib/auth/utils'
import { awardReviewPoints } from '@/lib/loyalty/service'
import { checkRateLimit } from '@/lib/redis/rate-limit'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> | { slug: string } }
) {
  try {
    const limited = await checkRateLimit(req, 'api')
    if (limited) return limited

    const resolvedParams = await params
    const slug = resolvedParams.slug
    const body = await req.json()
    const { productId, authorName, rating, comment } = body

    if (typeof productId !== 'string' || !productId || typeof authorName !== 'string' || !authorName.trim() || typeof comment !== 'string' || !comment.trim()) {
      return NextResponse.json(
        { success: false, error: 'Missing required review fields' },
        { status: 400 }
      )
    }

    const product = await db.query.products.findFirst({
      where: and(eq(products.id, productId), eq(products.slug, slug)),
    })
    if (!product) return NextResponse.json({ success: false, error: 'Product not found.' }, { status: 404 })

    const normalizedRating = Number(rating)
    if (!Number.isInteger(normalizedRating) || normalizedRating < 1 || normalizedRating > 5) {
      return NextResponse.json({ success: false, error: 'Rating must be a whole number from 1 to 5.' }, { status: 400 })
    }

    const { userId } = await auth()
    const localUser = userId ? await getOrCreateCurrentUser(userId) : null
    const completedOrders = userId
      ? await db
          .select({ items: orders.items })
          .from(orders)
          .where(and(eq(orders.userId, userId), inArray(orders.paymentStatus, ['completed'])))
          .orderBy(desc(orders.createdAt))
          .limit(25)
      : []
    const verifiedPurchase = completedOrders.some((order) => (
      Array.isArray(order.items) && order.items.some((item) => (
        item && typeof item === 'object' && 'productId' in item && item.productId === productId
      ))
    ))

    if (localUser && verifiedPurchase) {
      const existingReview = await db.query.productReviews.findFirst({
        where: and(eq(productReviews.productId, productId), eq(productReviews.userId, localUser.id)),
      })
      if (existingReview) return NextResponse.json({ success: false, error: 'You have already reviewed this product.' }, { status: 409 })
    }

    // 1. Insert the new review. Anonymous reviews remain supported, but only
    // an authenticated customer with a completed order earns review points.
    const [newReview] = await db
      .insert(productReviews)
      .values({
        productId,
        userId: localUser?.id ?? null,
        authorName: authorName.trim().slice(0, 255),
        authorEmail: localUser?.email ?? null,
        rating: normalizedRating,
        comment,
        verifiedPurchase,
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
        rating: newAverage.toFixed(1),
        ratingCount: allReviews.length,
      })
      .where(eq(products.id, productId))

    // 4. Purge page cache and issue a one-time reward for a verified purchase.
    revalidatePath(`/collections/${slug}`)
    if (localUser && verifiedPurchase && newReview) {
      void awardReviewPoints(localUser.id, newReview.id, productId)
    }

    return NextResponse.json({ success: true, data: newReview }, { status: 201 })
  } catch (error: any) {
    console.error('Failed to insert review:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Server error' },
      { status: 500 }
    )
  }
}

