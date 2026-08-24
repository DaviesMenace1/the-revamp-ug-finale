import { NextResponse } from 'next/server'
import { getCurrentUserWithRole } from '@/lib/auth/server'
import { db } from '@/lib/db/client'
import { users } from '@/lib/db/schema'

export const dynamic = 'force-dynamic'

export async function GET() {
  const authorization = await getCurrentUserWithRole(['admin'])

  if (authorization.reason === 'unauthenticated') {
    return NextResponse.json({ success: false, error: 'Authentication required.' }, { status: 401 })
  }

  if (authorization.reason === 'error') {
    return NextResponse.json(
      { success: false, error: 'The admin profile could not be resolved. Please retry.' },
      { status: 503 },
    )
  }

  if (!authorization.authorized || !authorization.user) {
    return NextResponse.json({ success: false, error: 'Admin access required.' }, { status: 403 })
  }

  try {
    const clients = await db
      .select({ id: users.id, firstName: users.firstName, lastName: users.lastName, email: users.email })
      .from(users)
      .orderBy(users.email)
      .limit(200)

    return NextResponse.json(
      { success: true, clients },
      { headers: { 'Cache-Control': 'private, no-store' } },
    )
  } catch (error) {
    console.error('[billing] client list failed:', error)
    return NextResponse.json(
      { success: false, error: 'The client list could not be loaded. Please retry.' },
      { status: 503 },
    )
  }
}
