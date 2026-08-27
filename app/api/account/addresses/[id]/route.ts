import { auth } from '@clerk/nextjs/server'
import { and, eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { getOrCreateCurrentUser } from '@/lib/auth/utils'
import { savedAddresses } from '@/lib/db/schema'

function cleanText(value: unknown, maxLength: number) {
  return typeof value === 'string' && value.trim() ? value.trim().slice(0, maxLength) : ''
}

async function getUser() {
  const { userId } = await auth()
  if (!userId) return null
  return getOrCreateCurrentUser(userId)
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await params
    const body = await request.json() as Record<string, unknown>
    const updates: Partial<typeof savedAddresses.$inferInsert> = { updatedAt: new Date() }

    if (body.label !== undefined) updates.label = cleanText(body.label, 120) || 'Home'
    if (body.recipientName !== undefined) updates.recipientName = cleanText(body.recipientName, 255)
    if (body.phone !== undefined) updates.phone = cleanText(body.phone, 30)
    if (body.address !== undefined) updates.address = cleanText(body.address, 2000)
    if (body.city !== undefined) updates.city = cleanText(body.city, 120)
    if (body.region !== undefined) updates.region = cleanText(body.region, 120) || null
    if (body.country !== undefined) updates.country = cleanText(body.country, 100) || 'Uganda'
    if (body.notes !== undefined) updates.notes = cleanText(body.notes, 1000) || null
    if (body.isDefault === true) {
      await db.update(savedAddresses).set({ isDefault: false, updatedAt: new Date() }).where(eq(savedAddresses.userId, user.id))
      updates.isDefault = true
    }

    const [updated] = await db.update(savedAddresses)
      .set(updates)
      .where(and(eq(savedAddresses.id, id), eq(savedAddresses.userId, user.id)))
      .returning()
    if (!updated) return NextResponse.json({ error: 'Address not found.' }, { status: 404 })
    return NextResponse.json({ address: updated })
  } catch (error) {
    console.error('PATCH /api/account/addresses/[id] error:', error)
    return NextResponse.json({ error: 'We could not update this address.' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await params
    const [deleted] = await db.delete(savedAddresses)
      .where(and(eq(savedAddresses.id, id), eq(savedAddresses.userId, user.id)))
      .returning({ id: savedAddresses.id, wasDefault: savedAddresses.isDefault })
    if (!deleted) return NextResponse.json({ error: 'Address not found.' }, { status: 404 })

    if (deleted.wasDefault) {
      const [replacement] = await db.select({ id: savedAddresses.id })
        .from(savedAddresses)
        .where(eq(savedAddresses.userId, user.id))
        .limit(1)
      if (replacement) await db.update(savedAddresses).set({ isDefault: true, updatedAt: new Date() }).where(eq(savedAddresses.id, replacement.id))
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/account/addresses/[id] error:', error)
    return NextResponse.json({ error: 'We could not remove this address.' }, { status: 500 })
  }
}
