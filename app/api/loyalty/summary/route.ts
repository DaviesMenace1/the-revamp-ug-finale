import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getOrCreateCurrentUser } from '@/lib/auth/utils'
import { getLoyaltyOverview } from '@/lib/loyalty/service'

export const runtime = 'nodejs'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Please sign in to view your points.' }, { status: 401 })

  try {
    const user = await getOrCreateCurrentUser(userId)
    if (!user) return NextResponse.json({ error: 'Your account is not ready yet.' }, { status: 409 })
    const loyalty = await getLoyaltyOverview(user.id)
    return NextResponse.json({ loyalty }, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch (error) {
    console.error('[loyalty] summary failed:', error)
    return NextResponse.json({ error: 'Loyalty details are temporarily unavailable.' }, { status: 503 })
  }
}
