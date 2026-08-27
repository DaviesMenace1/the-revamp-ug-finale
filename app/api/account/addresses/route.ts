import { auth } from '@clerk/nextjs/server'
import { and, desc, eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { getOrCreateCurrentUser } from '@/lib/auth/utils'
import { savedAddresses } from '@/lib/db/schema'

const MAX = {
  label: 120,
  recipientName: 255,
  phone: 30,
  address: 2000,
  city: 120,
  region: 120,
  country: 100,
  notes: 1000,
}

function cleanText(value: unknown, maxLength: number) {
  return typeof value === 'string' && value.trim() ? value.trim().slice(0, maxLength) : ''
}

async function getUser() {
  const { userId } = await auth()
  if (!userId) return null
  return getOrCreateCurrentUser(userId)
}

export async function GET() {
  try {
    const user = await getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const addresses = await db
      .select()
      .from(savedAddresses)
      .where(eq(savedAddresses.userId, user.id))
      .orderBy(desc(savedAddresses.isDefault), desc(savedAddresses.updatedAt))
      .limit(50)

    return NextResponse.json({ addresses }, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch (error) {
    console.error('GET /api/account/addresses error:', error)
    return NextResponse.json({ error: 'We could not load your saved addresses.' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const body = await request.json() as Record<string, unknown>
    const recipientName = cleanText(body.recipientName, MAX.recipientName)
    const phone = cleanText(body.phone, MAX.phone)
    const address = cleanText(body.address, MAX.address)
    const city = cleanText(body.city, MAX.city)
    if (!recipientName || !phone || !address || !city) {
      return NextResponse.json({ error: 'Recipient name, phone, address, and city are required.' }, { status: 400 })
    }

    const isDefault = body.isDefault === true
    if (isDefault) {
      await db.update(savedAddresses).set({ isDefault: false, updatedAt: new Date() }).where(eq(savedAddresses.userId, user.id))
    }

    const [created] = await db.insert(savedAddresses).values({
      userId: user.id,
      label: cleanText(body.label, MAX.label) || 'Home',
      recipientName,
      phone,
      address,
      city,
      region: cleanText(body.region, MAX.region) || null,
      country: cleanText(body.country, MAX.country) || 'Uganda',
      notes: cleanText(body.notes, MAX.notes) || null,
      isDefault,
      updatedAt: new Date(),
    }).returning()

    return NextResponse.json({ address: created }, { status: 201 })
  } catch (error) {
    console.error('POST /api/account/addresses error:', error)
    return NextResponse.json({ error: 'We could not save this address.' }, { status: 500 })
  }
}
