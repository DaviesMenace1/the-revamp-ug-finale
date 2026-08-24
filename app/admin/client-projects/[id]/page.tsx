import { db } from '@/lib/db/client'
import { projects, users, projectAssets, projectDocuments, projectActivity, projectTasks } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import ClientProjectDetailClient from './client-project-detail'
import { safeQuery } from '@/lib/server/safe-query'
import PageLoadError from '@/components/system/page-load-error'

export const dynamic = 'force-dynamic'

export default async function AdminClientProjectDetail({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

    const projectResult = await safeQuery(
    db.query.projects.findFirst({
      where: and(eq(projects.id, id), eq(projects.projectKind, 'client')),
    }),
    'admin client project',
    null,
  )

  if (!projectResult.data) {
    if (!projectResult.error) notFound()
    return (
      <main className="min-h-screen bg-background p-8">
        <PageLoadError
          title="This client project could not load."
          message="The project record is temporarily unavailable. No project data was changed."
        />
      </main>
    )
  }

  const project = projectResult.data
  const [clientResult, assetsResult, documentsResult, activityResult, tasksResult] = await Promise.all([
    safeQuery(
      project.userId ? db.query.users.findFirst({ where: eq(users.id, project.userId) }) : Promise.resolve(undefined),
      'client project owner',
      undefined,
    ),
    safeQuery(
      db.select().from(projectAssets).where(eq(projectAssets.projectId, id)).orderBy(desc(projectAssets.createdAt)),
      'client project assets',
      [],
    ),
    safeQuery(
      db.select().from(projectDocuments).where(eq(projectDocuments.projectId, id)).orderBy(desc(projectDocuments.createdAt)),
      'client project documents',
      [],
    ),
    safeQuery(
      db.select().from(projectActivity).where(eq(projectActivity.projectId, id)).orderBy(desc(projectActivity.createdAt)).limit(30),
      'client project activity',
      [],
    ),
    safeQuery(
      db.select().from(projectTasks).where(eq(projectTasks.projectId, id)).orderBy(desc(projectTasks.createdAt)),
      'client project tasks',
      [],
    ),
  ])

  const client = clientResult.data
  const assets = assetsResult.data
  const documents = documentsResult.data
  const activity = activityResult.data
  const tasks = tasksResult.data

  const formatted = {

    id: project.id,
    title: project.title,
    description: project.description,
    location: project.location,
    budget: project.budget,
    designer: project.designer,
    status: project.status,
    currentPhase: project.currentPhase ?? 'consultation',
    progress: project.progress ?? 0,
    dueDate: project.dueDate ? project.dueDate.toISOString() : null,
    client: client
      ? {
          name: [client.firstName, client.lastName].filter(Boolean).join(' ') || client.email,
          email: client.email,
        }
      : null,
    assets: assets.map((a) => ({
      id: a.id,
      title: a.title,
      description: a.description,
      assetType: a.assetType,
      fileUrl: a.fileUrl,
      thumbnailUrl: a.thumbnailUrl,
      version: a.version,
      isCurrentVersion: a.isCurrentVersion,
      visibility: a.visibility,
      approvalStatus: a.approvalStatus,
      createdAt: a.createdAt.toISOString(),
    })),
    documents: documents.map((d) => ({
      id: d.id,
      name: d.name,
      category: d.category,
      fileUrl: d.fileUrl,
      visibility: d.visibility,
      signatureStatus: d.signatureStatus,
      createdAt: d.createdAt.toISOString(),
    })),
    tasks: tasks.map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      assignedTo: t.assignedTo,
      status: t.status,
      dueDate: t.dueDate ? t.dueDate.toISOString() : null,
      createdAt: t.createdAt.toISOString(),
    })),
    activity: activity.map((a) => ({
      id: a.id,
      action: a.action,
      summary: a.summary,
      actorType: a.actorType,
      createdAt: a.createdAt.toISOString(),
    })),
  }

  return <ClientProjectDetailClient project={formatted} />
}