import { requirePortalUser } from '@/lib/auth/portal-auth'
import { db } from '@/lib/db/client'
import { projects, clientDocuments, projectAssets, projectDocuments, projectActivity, projectTasks } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import ProjectDetailClient from './project-detail-client'

export const dynamic = 'force-dynamic'

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const user = await requirePortalUser(
    ['customer', 'admin', 'designer', 'trade_member', 'architect', 'interior_designer'],
    '/client/projects',
  )

  const project = await db.query.projects.findFirst({
    where: and(eq(projects.slug, slug), eq(projects.userId, user.id)),
  })

  if (!project) {
    notFound()
  }

  const [legacyDocuments, assets, docs, activity, tasks] = await Promise.all([
    db.select().from(clientDocuments).where(eq(clientDocuments.projectId, project.id)).orderBy(desc(clientDocuments.createdAt)),
    db
      .select()
      .from(projectAssets)
      .where(and(eq(projectAssets.projectId, project.id), eq(projectAssets.visibility, 'client'), eq(projectAssets.isCurrentVersion, true)))
      .orderBy(desc(projectAssets.createdAt)),
    db
      .select()
      .from(projectDocuments)
      .where(and(eq(projectDocuments.projectId, project.id), eq(projectDocuments.visibility, 'client')))
      .orderBy(desc(projectDocuments.createdAt)),
    db
      .select()
      .from(projectActivity)
      .where(eq(projectActivity.projectId, project.id))
      .orderBy(desc(projectActivity.createdAt))
      .limit(20),
    db.select().from(projectTasks).where(eq(projectTasks.projectId, project.id)).orderBy(desc(projectTasks.createdAt)),
  ])

  const formatted = {
    id: project.id,
    slug: project.slug,
    title: project.title,
    status: project.status,
    currentPhase: project.currentPhase ?? 'consultation',
    progress: project.progress ?? 0,
    description: project.description,
    longDescription: project.longDescription,
    budget: project.budget,
    dueDate: project.dueDate ? project.dueDate.toISOString() : null,
    designer: project.designer,
    location: project.location,
    features: Array.isArray(project.features) ? project.features : [],
    documents: [
      ...legacyDocuments.map((d) => ({
        id: d.id,
        name: d.name,
        category: d.category,
        fileUrl: d.fileUrl,
        createdAt: d.createdAt.toISOString(),
      })),
      ...docs.map((d) => ({
        id: d.id,
        name: d.name,
        category: d.category,
        fileUrl: d.fileUrl,
        createdAt: d.createdAt.toISOString(),
      })),
    ],
    tasks: tasks.map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      assignedTo: t.assignedTo,
      status: t.status,
      dueDate: t.dueDate ? t.dueDate.toISOString() : null,
    })),
    assets: assets.map((a) => ({
      id: a.id,
      title: a.title,
      description: a.description,
      assetType: a.assetType,
      category: a.category,
      fileUrl: a.fileUrl,
      thumbnailUrl: a.thumbnailUrl,
      version: a.version,
      approvalStatus: a.approvalStatus,
      createdAt: a.createdAt.toISOString(),
    })),
    activity: activity.map((a) => ({
      id: a.id,
      action: a.action,
      summary: a.summary,
      actorType: a.actorType,
      createdAt: a.createdAt.toISOString(),
    })),
  }

  return <ProjectDetailClient project={formatted} />
}
