import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db/client'
import { faqs } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

// PUT /api/faqs/[id] - Update an FAQ
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await params
    const id = resolvedParams.id
    const body = await req.json()
    const { category, question, answer, status, views, helpful, notHelpful } = body

    const updateData: any = {}
    if (category !== undefined) updateData.category = category
    if (question !== undefined) updateData.question = question
    if (answer !== undefined) updateData.answer = answer
    if (status !== undefined) updateData.status = status
    if (views !== undefined) updateData.views = views
    if (helpful !== undefined) updateData.helpful = helpful
    if (notHelpful !== undefined) updateData.notHelpful = notHelpful

    const [updatedFaq] = await db
      .update(faqs)
      .set(updateData)
      .where(eq(faqs.id, id))
      .returning()

    revalidatePath('/faqs')
    revalidatePath('/admin/faqs')

    return NextResponse.json({ success: true, data: updatedFaq })
  } catch (error: any) {
    console.error('Error updating FAQ:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update FAQ' },
      { status: 500 }
    )
  }
}

// DELETE /api/faqs/[id] - Delete an FAQ
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await params
    const id = resolvedParams.id

    await db.delete(faqs).where(eq(faqs.id, id))

    revalidatePath('/faqs')
    revalidatePath('/admin/faqs')

    return NextResponse.json({ success: true, message: 'FAQ deleted' })
  } catch (error: any) {
    console.error('Error deleting FAQ:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete FAQ' },
      { status: 500 }
    )
  }
}
