import { NextResponse } from 'next/server'
import { and, eq } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import { getCurrentUserWithRole } from '@/lib/auth/server'
import { projectActivity, projectAssets, projects } from '@/lib/db/schema'
import { createProjectUploadUrl, headFromR2, isR2Configured, publicR2Url } from '@/lib/storage/r2'

export const dynamic = 'force-dynamic'

const MAX_ASSET_BYTES = 100 * 1024 * 1024
const ALLOWED_ASSET_TYPES = new Set(['image', '3d_render', 'floor_plan', 'elevation', 'section', 'cad', 'pdf', 'video', '360_view', 'moodboard', 'presentation'])
const STAFF_ROLES = ['admin', 'designer', 'architect', 'interior_designer', 'trade_member'] as const

type AssetPayload = {
  action?: unknown
  title?: unknown
  assetType?: unknown
  description?: unknown
  visibility?: unknown
  filename?: unknown
  contentType?: unknown
  storageKey?: unknown
  externalUrl?: unknown
}

function stringValue(value: unknown, maxLength: number) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : ''
}

function contentTypeFor(filename: string, contentType: string) {
  if (contentType) return contentType.slice(0, 160)
  return filename.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream'
}

function errorResponse(message: string, status: number) {
  return NextResponse.json({ success: false, error: message }, { status, headers: { 'Cache-Control': 'no-store' } })
}

async function readJson(request: Request) {
  try {
    return await request.json() as AssetPayload
  } catch {
    return null
  }
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const authorization = await getCurrentUserWithRole([...STAFF_ROLES])
  if (!authorization.authorized || !authorization.user) {
    if (authorization.reason === 'error') return errorResponse('Authentication is temporarily unavailable. Refresh and try again.', 503)
    if (authorization.reason === 'unauthenticated') return errorResponse('Your session has expired. Sign in again and retry the upload.', 401)
    return errorResponse('You do not have permission to manage project assets.', 403)
  }
  const staff = authorization.user
  const { id: projectId } = await context.params
  const project = await db.query.projects.findFirst({ where: eq(projects.id, projectId), columns: { id: true, title: true } })
  if (!project) return errorResponse('Project not found.', 404)

  const payload = await readJson(request)
  if (!payload) return errorResponse('A JSON asset request is required.', 400)
  const action = stringValue(payload.action, 20)

  if (action === 'link') {
    const title = stringValue(payload.title, 255)
    const description = stringValue(payload.description, 1000) || null
    const visibility = stringValue(payload.visibility, 20) || 'client'
    const externalUrl = stringValue(payload.externalUrl, 2000)
    if (!title || !externalUrl) return errorResponse('A title and external 3D link are required.', 400)
    if (!['client', 'internal'].includes(visibility)) return errorResponse('Invalid visibility.', 400)
    try {
      const parsedUrl = new URL(externalUrl)
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) return errorResponse('Use a secure web link for the hosted 3D experience.', 400)
      const [asset] = await db.insert(projectAssets).values({
        projectId,
        title,
        description,
        assetType: 'external_3d',
        category: '3d_view',
        fileUrl: parsedUrl.toString(),
        storageKey: null,
        fileSize: null,
        storageProvider: 'external',
        visibility,
        approvalStatus: 'approved',
        uploadedBy: staff.id,
      }).returning()
      await db.insert(projectActivity).values({
        projectId,
        actorUserId: staff.id,
        actorType: 'admin',
        action: 'visualization_link_added',
        summary: `${title} was added as a hosted 3D experience`,
        relatedAssetId: asset.id,
      })
      return NextResponse.json({ success: true, asset }, { status: 201 })
    } catch (error) {
      console.error('Failed to add external project visualization link:', error)
      return errorResponse('The hosted 3D link could not be added.', 500)
    }
  }

  if (!isR2Configured()) return errorResponse('Cloudflare R2 is not configured.', 400)
  if (action === 'presign') {
    const filename = stringValue(payload.filename, 255)
    const assetType = stringValue(payload.assetType, 30)
    const contentType = contentTypeFor(filename, stringValue(payload.contentType, 160))
    if (!filename || !assetType) return errorResponse('Filename and asset type are required.', 400)
    if (!ALLOWED_ASSET_TYPES.has(assetType)) return errorResponse('Unsupported asset type. Hosted 3D experiences must use the link field.', 400)
    try {
      const upload = await createProjectUploadUrl({ projectId, category: assetType, filename, contentType })
      return NextResponse.json({ success: true, uploadUrl: upload.url, storageKey: upload.key, expiresAt: upload.expiresAt, maxBytes: MAX_ASSET_BYTES, contentType })
    } catch (error) {
      console.error('Failed to create project asset upload URL:', error)
      return errorResponse('The asset upload could not be prepared. Check the R2 configuration and try again.', 500)
    }
  }

  if (action !== 'complete') return errorResponse('Unknown asset action.', 400)
  const title = stringValue(payload.title, 255)
  const assetType = stringValue(payload.assetType, 30)
  const description = stringValue(payload.description, 1000) || null
  const filename = stringValue(payload.filename, 255)
  const storageKey = stringValue(payload.storageKey, 500)
  const visibility = stringValue(payload.visibility, 20) || 'client'
  if (!title || !filename || !storageKey) return errorResponse('Title, filename, and upload reference are required.', 400)
  if (!ALLOWED_ASSET_TYPES.has(assetType)) return errorResponse('Unsupported asset type.', 400)
  if (!['client', 'internal'].includes(visibility)) return errorResponse('Invalid visibility.', 400)
  if (!storageKey.startsWith(`projects/${projectId}/`)) return errorResponse('Invalid project upload reference.', 400)

  try {
    const object = await headFromR2(storageKey)
    const fileSize = Number(object.ContentLength ?? 0)
    if (!Number.isFinite(fileSize) || fileSize <= 0 || fileSize > MAX_ASSET_BYTES) return errorResponse('The uploaded asset must be between 1 byte and 100 MB.', 400)
    const [asset] = await db.insert(projectAssets).values({
      projectId,
      title,
      description,
      assetType,
      fileUrl: publicR2Url(storageKey),
      storageKey,
      fileSize,
      storageProvider: 'r2',
      visibility,
      approvalStatus: 'pending',
      uploadedBy: staff.id,
    }).returning()
    await db.insert(projectActivity).values({
      projectId,
      actorUserId: staff.id,
      actorType: 'admin',
      action: 'asset_uploaded',
      summary: `${title} was uploaded`,
      relatedAssetId: asset.id,
    })
    return NextResponse.json({ success: true, asset }, { status: 201 })
  } catch (error) {
    console.error('Failed to complete project asset upload:', error)
    return errorResponse('The upload completed but could not be added to the project. Refresh and try again.', 500)
  }
}
