import { db } from '@/lib/db'
import { projectAssets, projectMembers, projects } from '@/lib/db/schema'
import { and, eq, inArray, desc } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import { getCurrentUserWithRole } from '@/lib/auth/server'
import VisualizationViewer from './visualization-viewer'

export const dynamic = 'force-dynamic'

const STAFF_ROLES = ['admin', 'designer', 'architect', 'interior_designer', 'trade_member'] as const

export default async function ProjectVisualizationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const authorization = await getCurrentUserWithRole(['customer', ...STAFF_ROLES])
  if (!authorization.authorized || !authorization.user) notFound()

  const project = await db.query.projects.findFirst({ where: eq(projects.slug, slug), columns: { id: true, slug: true, title: true, userId: true } })
  if (!project) notFound()

  const isStaff = STAFF_ROLES.includes(authorization.user.role as typeof STAFF_ROLES[number])
  if (!isStaff && project.userId !== authorization.user.id) {
    const member = await db.query.projectMembers.findFirst({
      where: and(eq(projectMembers.projectId, project.id), eq(projectMembers.userId, authorization.user.id)),
      columns: { id: true },
    })
    if (!member) notFound()
  }

  const assets = await db
    .select({ id: projectAssets.id, title: projectAssets.title, description: projectAssets.description, assetType: projectAssets.assetType, thumbnailUrl: projectAssets.thumbnailUrl, version: projectAssets.version, approvalStatus: projectAssets.approvalStatus, createdAt: projectAssets.createdAt })
    .from(projectAssets)
    .where(and(eq(projectAssets.projectId, project.id), eq(projectAssets.visibility, 'client'), eq(projectAssets.isCurrentVersion, true), inArray(projectAssets.assetType, ['3d_model', 'glb', 'gltf'])))
    .orderBy(desc(projectAssets.createdAt))

  return (
    <VisualizationViewer
      project={{ id: project.id, slug: project.slug, title: project.title }}
      assets={assets.map((asset) => ({ ...asset, createdAt: asset.createdAt.toISOString(), viewerUrl: `/api/client/projects/${project.slug}/assets/${asset.id}` }))}
    />
  )
}
