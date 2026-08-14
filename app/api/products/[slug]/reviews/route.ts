import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { productReviews } from '@/lib/db/schema'

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const body = await req.json()
    const { productId, authorName, rating, comment } = body

    if (!productId || !authorName || !comment) {
      return NextResponse.json(
        { success: false, error: 'Missing required review fields' },
        { status: 400 }
      )
    }

    const [newReview] = await db
      .insert(productReviews)
      .values({
        productId,
        authorName,
        rating: rating || 5,
        comment,
      })
      .returning()

    return NextResponse.json({ success: true, data: newReview }, { status: 201 })
  } catch (error: any) {
    console.error('Failed to insert review:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Server error' },
      { status: 500 }
    )
  }
}
