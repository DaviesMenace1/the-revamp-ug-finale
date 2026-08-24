import { db } from '@/lib/db/client'
import { projects, users } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import ClientProjectsListClient from './client-projects-list'
import { safeQuery } from '@/lib/server/safe-query'

export const dynamic = 'force-dynamic'

export default async function AdminClientProjectsPage() {
    const [rowsResult, usersResult] = await Promise.all([
    safeQuery(
      db
        .select({
          id: projects.id,
          title: projects.title,
          status: projects.status,
          currentPhase: projects.currentPhase,
          progress: projects.progress,
          createdAt: projects.createdAt,
          clientFirstName: users.firstName,
          clientLastName: users.lastName,
          clientEmail: users.email,
        })
        .from(projects)
        .innerJoin(users, eq(projects.userId, users.id))
        .where(eq(projects.projectKind, 'client'))
        .orderBy(desc(projects.createdAt)),
      'admin client projects',
      [],
    ),
    safeQuery(
      db
        .select({ id: users.id, firstName: users.firstName, lastName: users.lastName, email: users.email })
        .from(users)
        .orderBy(users.email),
      'admin project clients',
      [],
    ),
  ])

  const rows = rowsResult.data
  const allUsers = usersResult.data
  const formatted = rows.map((r) => ({

    ...r,
    createdAt: r.createdAt.toISOString(),
  }))

    return <ClientProjectsListClient projects={formatted} clients={allUsers} loadError={rowsResult.error || usersResult.error ? 'Some client-project data is temporarily unavailable. You can retry the page.' : null} />

}