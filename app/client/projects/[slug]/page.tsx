import { requirePortalUser } from '@/lib/auth/portal-auth'
import { db } from '@/lib/db/client'
import { projects, clientDocuments, projectAssets, projectDocuments, projectActivity, projectTasks } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import ProjectDetailClient from './project-detail-client'
import { safeQuery } from '@/lib/server/safe-query'
import PageLoadError from '@/components/system/page-load-error'
import { isUuid } from '@/lib/utils'

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

  const projectResult = await safeQuery(
    db.query.projects.findFirst({
      where: and(
        eq(projects.userId, user.id),
        isUuid(slug) ? eq(projects.id, slug) : eq(projects.slug, slug),
      ),
    }),
    'client project detail',
    null,
  )

  if (!projectResult.data) {
    if (!projectResult.error) notFound()
    return (
      <main className="min-h-screen bg-background p-8">
        <PageLoadError
          title="This project could not load."
          message="The project record is temporarily unavailable. No project data was changed."
        />
      </main>
    )
  }

  const project = projectResult.data
  const canonicalSlug = project.slug?.trim() || project.id
  const [legacyDocumentsResult, assetsResult, docsResult, activityResult, tasksResult] = await Promise.all([
    safeQuery(
      db.select().from(clientDocuments).where(eq(clientDocuments.projectId, project.id)).orderBy(desc(clientDocuments.createdAt)),
      'client project legacy documents',
      [],
    ),
    safeQuery(
      db
        .select()
        .from(projectAssets)
        .where(and(eq(projectAssets.projectId, project.id), eq(projectAssets.visibility, 'client'), eq(projectAssets.isCurrentVersion, true)))
        .orderBy(desc(projectAssets.createdAt)),
      'client project assets',
      [],
    ),
    safeQuery(
      db
        .select()
        .from(projectDocuments)
        .where(and(eq(projectDocuments.projectId, project.id), eq(projectDocuments.visibility, 'client')))
        .orderBy(desc(projectDocuments.createdAt)),
      'client project documents',
      [],
    ),
    safeQuery(
      db
        .select()
        .from(projectActivity)
        .where(eq(projectActivity.projectId, project.id))
        .orderBy(desc(projectActivity.createdAt))
        .limit(20),
      'client project activity',
      [],
    ),
    safeQuery(
      db.select().from(projectTasks).where(eq(projectTasks.projectId, project.id)).orderBy(desc(projectTasks.createdAt)),
      'client project tasks',
      [],
    ),
  ])

  const legacyDocuments = legacyDocumentsResult.data
  const assets = assetsResult.data
  const docs = docsResult.data
  const activity = activityResult.data
  const tasks = tasksResult.data

  const formatted = {
    id: project.id,
    slug: canonicalSlug,
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
    features: [],
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
        viewerUrl: ['3d_model', 'glb', 'gltf'].includes(a.assetType) ? `/client/projects/${canonicalSlug}/visualization` : null,
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
