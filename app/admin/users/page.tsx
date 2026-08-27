import { desc } from 'drizzle-orm'
import UsersClient from './users-client'
import { db } from '@/lib/db/client'
import { users } from '@/lib/db/schema'
import { safeQuery } from '@/lib/server/safe-query'

export const dynamic = 'force-dynamic'

async function getAdminUsers() {
  const result = await safeQuery(
    db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        company: users.company,
        role: users.role,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt))
      .limit(500),
    'admin users page',
    [],
  )

  return {
    users: result.data.map((user) => ({
      ...user,
      role: user.role || 'customer',
      createdAt: user.createdAt.toISOString(),
    })),
    loadError: result.error ? 'The user list is temporarily unavailable. Your access changes were not modified.' : null,
  }
}

export default async function AdminUsersPage() {
  const { users: initialUsers, loadError } = await getAdminUsers()
  return <UsersClient initialUsers={initialUsers} loadError={loadError} />
}
