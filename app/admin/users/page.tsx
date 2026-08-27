import { desc } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import { users } from '@/lib/db/schema'
import { safeQuery } from '@/lib/server/safe-query'
import UsersClient from './users-client'

export const dynamic = 'force-dynamic'

export default async function AdminUsersPage() {
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
    'admin users',
    [],
  )

  const formattedUsers = result.data.map((user) => ({
    ...user,
    role: user.role || 'customer',
    createdAt: user.createdAt.toISOString(),
  }))

  return <UsersClient initialUsers={formattedUsers} loadError={result.error ? 'The user list is temporarily unavailable. Retry the page to try again.' : null} />
}
