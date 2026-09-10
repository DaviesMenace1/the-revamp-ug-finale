import { NextResponse } from 'next/server'
import { and, eq } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import { getCurrentUserWithRole } from '@/lib/auth/server'
import { projectActivity, projectAssets, projectMembers, projects } from '@/lib/db/schema'
import { createProjectUploadUrl, headFromR2, isR2Configured, publicR2Url } from '@/lib/storage/r2'
import { isUuid } from '@/lib/utils'

export const dynamic = 'force-dynamic'

const MAX_ASSET_BYTES = 100 * 1024 * 1024
const ALLOWED_ASSET_TYPES = new Set(['image', '3d_render', 'floor_plan', 'elevation', 'section', 'cad', 'pdf', 'video', '360_view', 'moodboard', 'presentation'])
const STAFF_ROLES = ['admin', 'designer', 'architect', 'interior_designer', 'trade_member'] as const
const CLIENT_ROLES = ['customer', ...STAFF_ROLES] as const

type AssetPayload = {
  action?: unknown
  title?: unknown
  assetType?: unknown
  description?: unknown
  filename?: unknown
  contentType?: unknown
  storageKey?: unknown
}

function text(value: unknown, maxLength: number) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : ''
}

function contentTypeFor(filename: string, contentType: string) {
  if (contentType) return contentType.slice(0, 160)
  const extension = filename.includes('.') ? filename.slice(filename.lastIndexOf('.')).toLowerCase() : ''
  return extension === '.pdf' ? 'application/pdf' : 'application/octet-stream'
}

function responseError(message: string, status: number) {
  return NextResponse.json({ success: false, error: message }, { status })
}

async function readBody(request: Request) {
  try {
    return await request.json() as AssetPayload
  } catch {
    return null
  }
}

async function getProject(slug: string) {
  return db.query.projects.findFirst({
    where: isUuid(slug) ? eq(projects.id, slug) : eq(projects.slug, slug),
    columns: { id: true, slug: true, userId: true },
  })
}

export async function POST(request: Request, context: { params: Promise<{ slug: string }> }) {
  const authorization = await getCurrentUserWithRole([...CLIENT_ROLES])
  const user = authorization.user
  if (!authorization.authorized || !user) return responseError('Forbidden.', 403)

  const { slug } = await context.params
  if (!isR2Configured()) return responseError('Cloudflare R2 is not configured.', 400)
  const project = await getProject(slug)
  if (!project) return responseError('Project not found.', 404)

  const isStaff = STAFF_ROLES.includes(user.role as typeof STAFF_ROLES[number])
  if (!isStaff && project.userId !== user.id) {
    const member = await db.query.projectMembers.findFirst({
      where: and(eq(projectMembers.projectId, project.id), eq(projectMembers.userId, user.id)),
      columns: { id: true },
    })
    if (!member) return responseError('Forbidden.', 403)
  }

  const payload = await readBody(request)
  if (!payload) return responseError('A JSON upload request is required.', 400)
  const action = text(payload.action, 20)

  if (action === 'presign') {
    const filename = text(payload.filename, 255)
    const assetType = text(payload.assetType, 30)
    const contentType = contentTypeFor(filename, text(payload.contentType, 160))
    if (!filename || !assetType) return responseError('Filename and asset type are required.', 400)
    if (!ALLOWED_ASSET_TYPES.has(assetType)) return responseError('Unsupported asset type.', 400)
    try {
      const category = assetType
      const upload = await createProjectUploadUrl({ projectId: project.id, category, filename, contentType })
      return NextResponse.json({ success: true, uploadUrl: upload.url, storageKey: upload.key, expiresAt: upload.expiresAt, maxBytes: MAX_ASSET_BYTES, contentType })
    } catch (error) {
      console.error('Failed to create client project upload URL:', error)
      return responseError('The asset upload could not be prepared. Check the R2 configuration and try again.', 500)
    }
  }

  if (action !== 'complete') return responseError('Unknown upload action.', 400)

  const title = text(payload.title, 255)
  const assetType = text(payload.assetType, 30)
  const description = text(payload.description, 1000) || null
  const filename = text(payload.filename, 255)
  const storageKey = text(payload.storageKey, 500)
  if (!title || !filename || !storageKey) return responseError('Title, filename, and upload reference are required.', 400)
  if (!ALLOWED_ASSET_TYPES.has(assetType)) return responseError('Unsupported asset type.', 400)
  if (!storageKey.startsWith(`projects/${project.id}/`)) return responseError('Invalid project upload reference.', 400)

  try {
    const object = await headFromR2(storageKey)
    const fileSize = Number(object.ContentLength ?? 0)
    if (!Number.isFinite(fileSize) || fileSize <= 0 || fileSize > MAX_ASSET_BYTES) return responseError('The uploaded asset must be between 1 byte and 100 MB.', 400)

    const visibility = 'client'
    const actorType = isStaff ? 'admin' : 'client'
    const [asset] = await db.insert(projectAssets).values({
      projectId: project.id,
      title,
      description,
      assetType,
      fileUrl: publicR2Url(storageKey),
      storageKey,
      fileSize,
      storageProvider: 'r2',
      visibility,
      approvalStatus: isStaff ? 'pending' : 'pending',
      uploadedBy: user.id,
    }).returning()

    await db.insert(projectActivity).values({
      projectId: project.id,
      actorUserId: user.id,
      actorType,
      action: 'asset_uploaded',
      summary: `${title} was shared by ${actorType === 'admin' ? 'the studio' : 'the client'}`,
      relatedAssetId: asset.id,
    })
    return NextResponse.json({ success: true, asset }, { status: 201 })
  } catch (error) {
    console.error('Failed to complete client project upload:', error)
    return responseError('The upload completed but could not be added to this project. Refresh and try again.', 500)
  }
}
