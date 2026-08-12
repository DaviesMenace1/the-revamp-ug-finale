import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { products } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache' // ✅ 1. Import Next.js cache clearer

export async function POST(req: NextRequest) {
  try {
    const { productId, author, rating, comment } = await req.json()

    if (!productId || !comment) {
      return NextResponse.json({ success: false, error: 'Product ID and comment are required' }, { status: 400 })
    }

    // Fetch current product
    const product = await db.query.products.findFirst({
      where: eq(products.id, productId),
    })

    if (!product) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 })
    }

    // Append review
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
    
    // ✅ 2. Safely parse this as a float so the database doesn't reject a string
    const newAvgRating = parseFloat((totalScore / updatedReviews.length).toFixed(1))

    // Update Database
    await db
      .update(products)
      .set({
        rating: String(newAvgRating), // Try removing String() if your schema expects a real number instead of varchar
        ratingCount: updatedReviews.length,
        reviews: updatedReviews, 
      } as any)
      .where(eq(products.id, productId))

    // ✅ 3. THE MAGIC BULLET: Force Next.js to instantly delete the old cached page
    if (product.slug) {
      revalidatePath(`/collections/${product.slug}`)
    }

    return NextResponse.json({ success: true, data: newReview }, { status: 201 })
  } catch (error: any) {
    // ✅ 4. Log the actual database error to your terminal so we can see it!
    console.error("❌ DATABASE UPDATE ERROR:", error) 
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
