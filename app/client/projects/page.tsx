import { requirePortalUser } from '@/lib/auth/portal-auth'
import { db } from '@/lib/db/client'
import { projects } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import ProjectsClient from './projects-client'

export const dynamic = 'force-dynamic'

export default async function ClientProjects() {
  const user = await requirePortalUser(
    ['customer', 'admin', 'designer', 'trade_member', 'architect', 'interior_designer'],
    '/client/projects',
  )

  const myProjects = await db
    .select()
    .from(projects)
    .where(eq(projects.userId, user.id))
    .orderBy(desc(projects.createdAt))

  const formatted = myProjects.map((p) => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    status: p.status,
    progress: p.progress ?? 0,
    thumbnailImage: p.thumbnailImage,
    budget: p.budget,
    designer: p.designer,
    dueDate: p.dueDate ? p.dueDate.toISOString() : null,
  }))

  return <ProjectsClient projects={formatted} />
}

