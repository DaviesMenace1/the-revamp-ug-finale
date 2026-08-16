import { db } from '@/lib/db/client'
import { users } from '@/lib/db/schema'
import { desc } from 'drizzle-orm'
import UsersClient from './users-client'

export const dynamic = 'force-dynamic'

export default async function AdminUsersPage() {
  const allUsers = await db.query.users.findMany({
    orderBy: desc(users.createdAt),
  })

  const formattedUsers = allUsers.map((user) => ({
    ...user,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  }))

  return <UsersClient initialUsers={formattedUsers} />
}

