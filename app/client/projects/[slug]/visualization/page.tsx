import { db } from '@/lib/db'
import { projectAssets, projectMembers, projects } from '@/lib/db/schema'
import { and, eq, inArray, desc, or } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import { getCurrentUserWithRole } from '@/lib/auth/server'
import VisualizationViewer from './visualization-viewer'
import { safeQuery } from '@/lib/server/safe-query'
import PageLoadError from '@/components/system/page-load-error'

export const dynamic = 'force-dynamic'

const STAFF_ROLES = ['admin', 'designer', 'architect', 'interior_designer', 'trade_member'] as const

export default async function ProjectVisualizationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const authorization = await getCurrentUserWithRole(['customer', ...STAFF_ROLES])
  if (!authorization.authorized || !authorization.user) notFound()

  const projectResult = await safeQuery(
    db.query.projects.findFirst({
      where: or(eq(projects.slug, slug), eq(projects.id, slug)),
      columns: { id: true, slug: true, title: true, userId: true },
    }),
    'project visualization',
    null,
  )
  if (!projectResult.data) {
    if (!projectResult.error) notFound()
    return <PageLoadError title="This visualization could not load." message="The project is temporarily unavailable. Retry to load the 3D workspace." />
  }

  const project = projectResult.data
  const canonicalSlug = project.slug?.trim() || project.id
  const isStaff = STAFF_ROLES.includes(authorization.user.role as typeof STAFF_ROLES[number])
  if (!isStaff && project.userId !== authorization.user.id) {
    const memberResult = await safeQuery(
      db.query.projectMembers.findFirst({
        where: and(eq(projectMembers.projectId, project.id), eq(projectMembers.userId, authorization.user.id)),
        columns: { id: true },
      }),
      'project visualization membership',
      null,
    )
    if (memberResult.error) {
      return <PageLoadError title="This visualization could not load." message="Project access is temporarily unavailable. Retry to try again." />
    }
    if (!memberResult.data) notFound()
  }

  const assetsResult = await safeQuery(
    db
      .select({ id: projectAssets.id, title: projectAssets.title, description: projectAssets.description, assetType: projectAssets.assetType, thumbnailUrl: projectAssets.thumbnailUrl, version: projectAssets.version, approvalStatus: projectAssets.approvalStatus, createdAt: projectAssets.createdAt })
      .from(projectAssets)
      .where(and(eq(projectAssets.projectId, project.id), eq(projectAssets.visibility, 'client'), eq(projectAssets.isCurrentVersion, true), inArray(projectAssets.assetType, ['3d_model', 'glb', 'gltf'])))
      .orderBy(desc(projectAssets.createdAt)),
    'project visualization assets',
    [],
  )

  return (
    <VisualizationViewer
      project={{ id: project.id, slug: canonicalSlug, title: project.title }}
      assets={assetsResult.data.map((asset) => ({ ...asset, createdAt: asset.createdAt.toISOString(), viewerUrl: `/api/client/projects/${canonicalSlug}/assets/${asset.id}` }))}
    />
  )
}
