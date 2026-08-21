import { db } from '@/lib/db/client'
import { projects, users } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import ClientProjectsListClient from './client-projects-list'

export const dynamic = 'force-dynamic'

export default async function AdminClientProjectsPage() {
  const [rows, allUsers] = await Promise.all([
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
    db
      .select({ id: users.id, firstName: users.firstName, lastName: users.lastName, email: users.email })
      .from(users)
      .orderBy(users.email),
  ])

  const formatted = rows.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
  }))

  return <ClientProjectsListClient projects={formatted} clients={allUsers} />
}