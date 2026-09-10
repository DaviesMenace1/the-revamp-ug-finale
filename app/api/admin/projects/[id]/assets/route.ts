import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { projectAssets, projectActivity, projects } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { uploadToR2, deleteFromR2, keyFromR2Url, isR2Configured } from '@/lib/storage/r2'
import { getCurrentUserWithRole } from '@/lib/auth/server'

export const dynamic = 'force-dynamic'

const MAX_ASSET_BYTES = 100 * 1024 * 1024
const ALLOWED_ASSET_TYPES = new Set(['image', '3d_render', 'floor_plan', 'elevation', 'section', 'cad', 'pdf', 'video', '360_view', 'moodboard', 'presentation'])
const STAFF_ROLES = ['admin', 'designer', 'architect', 'interior_designer', 'trade_member'] as const

async function requireStaff() {
  const authorization = await getCurrentUserWithRole([...STAFF_ROLES])
  return authorization.authorized ? authorization.user : null
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    if (!(await requireStaff())) return NextResponse.json({ success: false, error: 'Forbidden.' }, { status: 403 })
    const { id: projectId } = await context.params
    const assets = await db.select().from(projectAssets).where(eq(projectAssets.projectId, projectId)).orderBy(desc(projectAssets.createdAt))
    return NextResponse.json({ success: true, assets })
  } catch (error) {
    console.error('Failed to load project assets:', error)
    return NextResponse.json({ success: false, error: 'Failed to load project assets.' }, { status: 500 })
  }
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireStaff()
    if (!admin) return NextResponse.json({ success: false, error: 'Forbidden.' }, { status: 403 })
    const { id: projectId } = await context.params
    if (!isR2Configured()) return NextResponse.json({ success: false, error: 'Cloudflare R2 is not configured.' }, { status: 400 })

    const project = await db.query.projects.findFirst({ where: eq(projects.id, projectId), columns: { id: true, title: true } })
    if (!project) return NextResponse.json({ success: false, error: 'Project not found.' }, { status: 404 })

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const title = typeof formData.get('title') === 'string' ? String(formData.get('title')).trim() : ''
    const assetType = typeof formData.get('assetType') === 'string' ? String(formData.get('assetType')) : 'image'
    const category = typeof formData.get('category') === 'string' ? String(formData.get('category')).trim() : null
    const description = typeof formData.get('description') === 'string' ? String(formData.get('description')).trim() : null
    const visibility = typeof formData.get('visibility') === 'string' ? String(formData.get('visibility')) : 'client'
    const parentAssetId = typeof formData.get('parentAssetId') === 'string' ? String(formData.get('parentAssetId')) : null

    if (!file || !title) return NextResponse.json({ success: false, error: 'File and title are required.' }, { status: 400 })
    if (file.size <= 0 || file.size > MAX_ASSET_BYTES) return NextResponse.json({ success: false, error: 'Assets must be between 1 byte and 100 MB.' }, { status: 400 })
    if (!ALLOWED_ASSET_TYPES.has(assetType)) return NextResponse.json({ success: false, error: 'Unsupported asset type.' }, { status: 400 })
    if (!['client', 'internal'].includes(visibility)) return NextResponse.json({ success: false, error: 'Invalid visibility.' }, { status: 400 })

    const buffer = Buffer.from(await file.arrayBuffer())
    const uploadResult = await uploadToR2(buffer, {
      projectId,
      category: assetType,
      filename: file.name,
      contentType: file.type || 'application/octet-stream',
    })

    let version = 1
    if (parentAssetId) {
      const siblings = await db.select({ version: projectAssets.version }).from(projectAssets).where(eq(projectAssets.parentAssetId, parentAssetId))
      version = siblings.length > 0 ? Math.max(...siblings.map((item) => item.version)) + 1 : 2
      await db.update(projectAssets).set({ isCurrentVersion: false }).where(eq(projectAssets.id, parentAssetId))
      await db.update(projectAssets).set({ isCurrentVersion: false }).where(eq(projectAssets.parentAssetId, parentAssetId))
    }

    const [asset] = await db.insert(projectAssets).values({
      projectId,
      title,
      description: description || null,
      assetType,
      category: category || null,
      fileUrl: uploadResult.url,
      storageKey: uploadResult.key,
      fileSize: uploadResult.size,
      storageProvider: 'r2',
      version,
      parentAssetId: parentAssetId || null,
      isCurrentVersion: true,
      visibility,
      approvalStatus: 'pending',
      uploadedBy: admin?.id || null,
    }).returning()

    await db.insert(projectActivity).values({
      projectId,
      actorUserId: admin?.id || null,
      actorType: 'admin',
      action: 'asset_uploaded',
      summary: `${title} (v${version}) was uploaded`,
      relatedAssetId: asset.id,
    })
    return NextResponse.json({ success: true, asset }, { status: 201 })
  } catch (error) {
    console.error('Failed to upload project asset:', error)
    return NextResponse.json({ success: false, error: 'Failed to upload project asset.' }, { status: 500 })
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireStaff()
    if (!admin) return NextResponse.json({ success: false, error: 'Forbidden.' }, { status: 403 })
    const { id: projectId } = await context.params
    const assetId = new URL(request.url).searchParams.get('assetId')
    if (!assetId) return NextResponse.json({ success: false, error: 'Asset ID is required.' }, { status: 400 })

    const asset = await db.query.projectAssets.findFirst({ where: and(eq(projectAssets.id, assetId), eq(projectAssets.projectId, projectId)) })
    if (!asset) return NextResponse.json({ success: false, error: 'Asset not found.' }, { status: 404 })

    if (asset.storageProvider === 'r2') {
      const key = asset.storageKey || keyFromR2Url(asset.fileUrl)
      if (key) {
        try { await deleteFromR2(key) } catch (error) { console.error('Failed to delete R2 object (continuing):', error) }
      }
    }
    await db.delete(projectAssets).where(eq(projectAssets.id, assetId))
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete project asset:', error)
    return NextResponse.json({ success: false, error: 'Failed to delete project asset.' }, { status: 500 })
  }
}
