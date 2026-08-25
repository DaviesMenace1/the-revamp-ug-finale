import { NextResponse } from 'next/server'
import { and, eq } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import { getCurrentUserWithRole } from '@/lib/auth/server'
import { projectActivity, projectAssets, projectVisualizations, projects } from '@/lib/db/schema'
import { createProjectUploadUrl, headFromR2, isR2Configured, publicR2Url } from '@/lib/storage/r2'
import { isUuid } from '@/lib/utils'

export const dynamic = 'force-dynamic'

const MAX_ASSET_BYTES = 100 * 1024 * 1024
const ALLOWED_ASSET_TYPES = new Set(['image', '3d_render', '3d_model', 'glb', 'gltf', 'floor_plan', 'elevation', 'section', 'cad', 'pdf', 'video', '360_view', 'moodboard', 'presentation'])
const MODEL_EXTENSIONS = new Set(['.glb', '.gltf'])
const STAFF_ROLES = ['admin', 'designer', 'architect', 'interior_designer', 'trade_member'] as const

type AssetPayload = {
  title?: unknown
  assetType?: unknown
  category?: unknown
  description?: unknown
  visibility?: unknown
  parentAssetId?: unknown
  filename?: unknown
  contentType?: unknown
  storageKey?: unknown
}

function extensionOf(filename: string) {
  const index = filename.lastIndexOf('.')
  return index >= 0 ? filename.slice(index).toLowerCase() : ''
}

function stringValue(value: unknown, maxLength: number) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : ''
}

function contentTypeFor(filename: string, contentType: string) {
  if (contentType) return contentType.slice(0, 160)
  return extensionOf(filename) === '.gltf' ? 'model/gltf+json' : extensionOf(filename) === '.glb' ? 'model/gltf-binary' : 'application/octet-stream'
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
    return errorResponse('You do not have permission to upload project assets.', 403)
  }
  const staff = authorization.user

  const { id: projectId } = await context.params
  if (!isUuid(projectId)) return errorResponse('Invalid project ID.', 400)
  if (!isR2Configured()) return errorResponse('Cloudflare R2 is not configured.', 400)

  const payload = await readJson(request)
  if (!payload) return errorResponse('A JSON upload request is required.', 400)
  const action = stringValue((payload as { action?: unknown }).action, 20)
  const project = await db.query.projects.findFirst({ where: eq(projects.id, projectId), columns: { id: true, title: true } })
  if (!project) return errorResponse('Project not found.', 404)

  if (action === 'presign') {
    const filename = stringValue(payload.filename, 255)
    const assetType = stringValue(payload.assetType, 30)
    const contentType = contentTypeFor(filename, stringValue(payload.contentType, 160))
    if (!filename || !assetType) return errorResponse('Filename and asset type are required.', 400)
    if (!ALLOWED_ASSET_TYPES.has(assetType)) return errorResponse('Unsupported asset type.', 400)
    if (['3d_model', 'glb', 'gltf'].includes(assetType) && !MODEL_EXTENSIONS.has(extensionOf(filename))) {
      return errorResponse('3D visualization uploads must be .glb or .gltf files.', 400)
    }

    try {
      const category = ['3d_model', 'glb', 'gltf'].includes(assetType) ? '3d/models' : assetType
      const upload = await createProjectUploadUrl({ projectId, category, filename, contentType })
      return NextResponse.json({ success: true, uploadUrl: upload.url, storageKey: upload.key, expiresAt: upload.expiresAt, maxBytes: MAX_ASSET_BYTES, contentType })
    } catch (error) {
      console.error('Failed to create project asset upload URL:', error)
      return errorResponse('The asset upload could not be prepared. Check the R2 configuration and try again.', 500)
    }
  }

  if (action !== 'complete') return errorResponse('Unknown upload action.', 400)

  const title = stringValue(payload.title, 255)
  const assetType = stringValue(payload.assetType, 30)
  const category = stringValue(payload.category, 100) || null
  const description = stringValue(payload.description, 1000) || null
  const visibility = stringValue(payload.visibility, 20)
  const filename = stringValue(payload.filename, 255)
  const storageKey = stringValue(payload.storageKey, 500)
  const parentAssetId = stringValue(payload.parentAssetId, 36) || null
  if (!title || !filename || !storageKey) return errorResponse('Title, filename, and upload reference are required.', 400)
  if (!ALLOWED_ASSET_TYPES.has(assetType)) return errorResponse('Unsupported asset type.', 400)
  if (!['client', 'internal'].includes(visibility)) return errorResponse('Invalid visibility.', 400)
  if (!storageKey.startsWith(`projects/${projectId}/`)) return errorResponse('Invalid project upload reference.', 400)
  if (['3d_model', 'glb', 'gltf'].includes(assetType) && !MODEL_EXTENSIONS.has(extensionOf(filename))) {
    return errorResponse('3D visualization uploads must be .glb or .gltf files.', 400)
  }

  try {
    const object = await headFromR2(storageKey)
    const fileSize = Number(object.ContentLength ?? 0)
    if (!Number.isFinite(fileSize) || fileSize <= 0 || fileSize > MAX_ASSET_BYTES) {
      return errorResponse('The uploaded asset must be between 1 byte and 100 MB.', 400)
    }

    let version = 1
    if (parentAssetId) {
      const parent = await db.query.projectAssets.findFirst({
        where: and(eq(projectAssets.id, parentAssetId), eq(projectAssets.projectId, projectId)),
        columns: { id: true },
      })
      if (!parent) return errorResponse('The parent asset version was not found.', 404)
      const siblings = await db.select({ version: projectAssets.version }).from(projectAssets).where(eq(projectAssets.parentAssetId, parentAssetId))
      version = siblings.length > 0 ? Math.max(...siblings.map((item) => item.version)) + 1 : 2
      await db.update(projectAssets).set({ isCurrentVersion: false }).where(eq(projectAssets.id, parentAssetId))
      await db.update(projectAssets).set({ isCurrentVersion: false }).where(eq(projectAssets.parentAssetId, parentAssetId))
    }

    const [asset] = await db.insert(projectAssets).values({
      projectId,
      title,
      description,
      assetType,
      category,
      fileUrl: publicR2Url(storageKey),
      storageKey,
      fileSize,
      storageProvider: 'r2',
      version,
      parentAssetId,
      isCurrentVersion: true,
      visibility,
      approvalStatus: 'pending',
      uploadedBy: staff.id,
    }).returning()

    const isVisualization = ['3d_model', 'glb', 'gltf'].includes(assetType)
    if (isVisualization) {
      await db.insert(projectVisualizations).values({
        projectId,
        name: title,
        description,
        modelType: extensionOf(filename) === '.gltf' ? 'gltf' : 'glb',
        storageProvider: 'r2',
        storageKey,
        fileSize,
        version,
        status: 'ready',
        visibility,
        createdBy: staff.id,
      }).catch((error) => console.error('Failed to save visualization metadata (asset remains available):', error))
    }

    await db.insert(projectActivity).values({
      projectId,
      actorUserId: staff.id,
      actorType: 'admin',
      action: isVisualization ? 'visualization_uploaded' : 'asset_uploaded',
      summary: `${title} (v${version}) was uploaded`,
      relatedAssetId: asset.id,
    })
    return NextResponse.json({ success: true, asset }, { status: 201 })
  } catch (error) {
    console.error('Failed to complete project asset upload:', error)
    return errorResponse('The upload completed but could not be added to this project. Refresh and try again.', 500)
  }
}
