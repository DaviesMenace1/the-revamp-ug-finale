import { NextResponse } from 'next/server'
import { desc } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import { users } from '@/lib/db/schema'
import { getCurrentUserWithRole } from '@/lib/auth/server'
import { hasPermission } from '@/lib/auth/permissions'
import { safeQuery } from '@/lib/server/safe-query'

export const dynamic = 'force-dynamic'

export async function GET() {
  const authorization = await getCurrentUserWithRole()
  if (authorization.reason === 'unauthenticated') return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
  if (authorization.reason === 'error') return NextResponse.json({ error: 'Admin authorization is temporarily unavailable.' }, { status: 503 })
  if (!authorization.user || !hasPermission(authorization.user.role, 'manage_staff')) return NextResponse.json({ error: 'You do not have permission to manage users.' }, { status: 403 })

  const result = await safeQuery(
    db.select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      company: users.company,
      role: users.role,
      createdAt: users.createdAt,
    }).from(users).orderBy(desc(users.createdAt)).limit(500),
    'admin users API',
    [],
  )

  if (result.error) return NextResponse.json({ error: 'The user list is temporarily unavailable.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } })
  return NextResponse.json({ users: result.data.map((user) => ({ ...user, role: user.role || 'customer', createdAt: user.createdAt.toISOString() })) }, { headers: { 'Cache-Control': 'private, no-store' } })
}
