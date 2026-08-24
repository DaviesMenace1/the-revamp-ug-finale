import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { projectAssets, projectMembers, projects } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'
import { getCurrentUserWithRole } from '@/lib/auth/server'
import { getFromR2, keyFromR2Url } from '@/lib/storage/r2'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const STAFF_ROLES = ['admin', 'designer', 'architect', 'interior_designer', 'trade_member'] as const

export async function GET(_request: Request, context: { params: Promise<{ slug: string; assetId: string }> }) {
  try {
    const { slug, assetId } = await context.params
    const authorization = await getCurrentUserWithRole([
      'customer',
      ...STAFF_ROLES,
    ])
    if (!authorization.authorized || !authorization.user) {
      return NextResponse.json({ success: false, error: 'Forbidden.' }, { status: 403 })
    }

    const project = await db.query.projects.findFirst({ where: eq(projects.slug, slug), columns: { id: true, userId: true } })
    if (!project) return NextResponse.json({ success: false, error: 'Project not found.' }, { status: 404 })

    const isStaff = STAFF_ROLES.includes(authorization.user.role as typeof STAFF_ROLES[number])
    if (!isStaff && project.userId !== authorization.user.id) {
      const membership = await db.query.projectMembers.findFirst({
        where: and(eq(projectMembers.projectId, project.id), eq(projectMembers.userId, authorization.user.id)),
        columns: { id: true },
      })
      if (!membership) return NextResponse.json({ success: false, error: 'Forbidden.' }, { status: 403 })
    }

    const asset = await db.query.projectAssets.findFirst({
      where: and(
        eq(projectAssets.id, assetId),
        eq(projectAssets.projectId, project.id),
        eq(projectAssets.visibility, 'client'),
        eq(projectAssets.isCurrentVersion, true),
      ),
      columns: { fileUrl: true, storageKey: true, assetType: true, title: true },
    })
    if (!asset) return NextResponse.json({ success: false, error: 'Visualization not found.' }, { status: 404 })

    const key = asset.storageKey || keyFromR2Url(asset.fileUrl)
    if (!key) return NextResponse.json({ success: false, error: 'Visualization storage reference is unavailable.' }, { status: 404 })
    const object = await getFromR2(key)
    if (!object.Body) return NextResponse.json({ success: false, error: 'Visualization file is empty.' }, { status: 404 })

    const contentType = asset.assetType === 'gltf' ? 'model/gltf+json' : 'model/gltf-binary'
    return new NextResponse(object.Body.transformToWebStream() as ReadableStream, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${asset.title.replace(/[^a-zA-Z0-9._-]/g, '_')}.${asset.assetType === 'gltf' ? 'gltf' : 'glb'}"`,
        'Cache-Control': 'private, max-age=300',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (error) {
    console.error('Failed to stream project visualization:', error)
    return NextResponse.json({ success: false, error: 'Failed to load visualization.' }, { status: 500 })
  }
}
