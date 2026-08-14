import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db/client'
import { faqs } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'

// GET /api/faqs - Fetch FAQs
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')

    let query = db.select().from(faqs)

    if (status) {
      // @ts-ignore
      query = db.select().from(faqs).where(eq(faqs.status, status))
    }

    const data = await query.orderBy(desc(faqs.createdAt))

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('Error fetching FAQs:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch FAQs' },
      { status: 500 }
    )
  }
}

// POST /api/faqs - Create a new FAQ
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { category, question, answer, status } = body

    if (!category || !question || !answer) {
      return NextResponse.json(
        { success: false, error: 'Category, question, and answer are required' },
        { status: 400 }
      )
    }

    const [newFaq] = await db
      .insert(faqs)
      .values({
        category,
        question,
        answer,
        status: status || 'published',
      })
      .returning()

    revalidatePath('/faqs')
    revalidatePath('/admin/faqs')

    return NextResponse.json({ success: true, data: newFaq }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating FAQ:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create FAQ' },
      { status: 500 }
    )
  }
}
