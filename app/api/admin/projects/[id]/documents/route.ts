import { NextResponse } from 'next/server'
import { and, desc, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { projectDocuments, projectActivity, projects } from '@/lib/db/schema'
import { createProjectUploadUrl, deleteFromR2, headFromR2, isR2Configured, keyFromR2Url, publicR2Url } from '@/lib/storage/r2'
import { getOrCreateCurrentUser } from '@/lib/auth/utils'
import { requireAdminApi } from '@/lib/auth/api'
import { isUuid } from '@/lib/utils'

export const dynamic = 'force-dynamic'

const MAX_DOCUMENT_BYTES = 100 * 1024 * 1024
const ALLOWED_DOCUMENT_EXTENSIONS = new Set([
  '.pdf',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.ppt',
  '.pptx',
  '.txt',
  '.csv',
  '.rtf',
  '.odt',
  '.ods',
  '.odp',
])
const ALLOWED_VISIBILITIES = new Set(['client', 'internal'])
const ALLOWED_SIGNATURE_STATUSES = new Set(['n/a', 'draft', 'sent', 'signed', 'countersigned'])

function errorResponse(message: string, status: number) {
  return NextResponse.json({ success: false, error: message }, { status })
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
  const extension = extensionOf(filename)
  const defaults: Record<string, string> = {
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.ppt': 'application/vnd.ms-powerpoint',
    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    '.txt': 'text/plain',
    '.csv': 'text/csv',
    '.rtf': 'application/rtf',
    '.odt': 'application/vnd.oasis.opendocument.text',
    '.ods': 'application/vnd.oasis.opendocument.spreadsheet',
    '.odp': 'application/vnd.oasis.opendocument.presentation',
  }
  return defaults[extension] || 'application/octet-stream'
}

type DocumentPayload = {
  action?: unknown
  filename?: unknown
  contentType?: unknown
  name?: unknown
  category?: unknown
  visibility?: unknown
  signatureStatus?: unknown
  storageKey?: unknown
}

async function readJson(request: Request) {
  try {
    return await request.json() as DocumentPayload
  } catch {
    return null
  }
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const authorizationError = await requireAdminApi()
  if (authorizationError) return authorizationError

  try {
    const { id: projectId } = await context.params
    if (!isUuid(projectId)) return errorResponse('Invalid project ID.', 400)

    const documents = await db
      .select()
      .from(projectDocuments)
      .where(eq(projectDocuments.projectId, projectId))
      .orderBy(desc(projectDocuments.createdAt))

    return NextResponse.json({ success: true, documents })
  } catch (error) {
    console.error('Failed to load project documents:', error)
    return errorResponse('Failed to load project documents.', 500)
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const authorizationError = await requireAdminApi()
  if (authorizationError) return authorizationError

  try {
    const { id: projectId } = await context.params
    if (!isUuid(projectId)) return errorResponse('Invalid project ID.', 400)
    if (!isR2Configured()) return errorResponse('Cloudflare R2 is not configured.', 400)

    const project = await db.query.projects.findFirst({
      where: eq(projects.id, projectId),
      columns: { id: true },
    })
    if (!project) return errorResponse('Project not found.', 404)

    const payload = await readJson(request)
    if (!payload) return errorResponse('A JSON document upload request is required.', 400)
    const action = stringValue(payload.action, 20)

    if (action === 'presign') {
      const filename = stringValue(payload.filename, 255)
      const extension = extensionOf(filename)
      const contentType = contentTypeFor(filename, stringValue(payload.contentType, 160))
      if (!filename || !extension) return errorResponse('A document filename is required.', 400)
      if (!ALLOWED_DOCUMENT_EXTENSIONS.has(extension)) return errorResponse('Unsupported document type.', 400)

      try {
        const upload = await createProjectUploadUrl({
          projectId,
          category: 'documents',
          filename,
          contentType,
        })
        return NextResponse.json({
          success: true,
          uploadUrl: upload.url,
          storageKey: upload.key,
          expiresAt: upload.expiresAt,
          maxBytes: MAX_DOCUMENT_BYTES,
          contentType,
        })
      } catch (error) {
        console.error('Failed to create project document upload URL:', error)
        return errorResponse('The document upload could not be prepared. Check the R2 configuration and try again.', 500)
      }
    }

    if (action !== 'complete') return errorResponse('Unknown document upload action.', 400)

    const name = stringValue(payload.name, 255)
    const category = stringValue(payload.category, 100) || 'general'
    const visibility = stringValue(payload.visibility, 20) || 'client'
    const signatureStatus = stringValue(payload.signatureStatus, 20) || 'n/a'
    const filename = stringValue(payload.filename, 255)
    const storageKey = stringValue(payload.storageKey, 500)
    const extension = extensionOf(filename)

    if (!name || !filename || !storageKey) return errorResponse('Document name, filename, and upload reference are required.', 400)
    if (!ALLOWED_DOCUMENT_EXTENSIONS.has(extension)) return errorResponse('Unsupported document type.', 400)
    if (!ALLOWED_VISIBILITIES.has(visibility)) return errorResponse('Invalid document visibility.', 400)
    if (!ALLOWED_SIGNATURE_STATUSES.has(signatureStatus)) return errorResponse('Invalid signature status.', 400)
    if (!storageKey.startsWith(`projects/${projectId}/documents/`)) return errorResponse('Invalid project document upload reference.', 400)

    const object = await headFromR2(storageKey)
    const fileSize = Number(object.ContentLength ?? 0)
    if (!Number.isFinite(fileSize) || fileSize <= 0 || fileSize > MAX_DOCUMENT_BYTES) {
      return errorResponse('The document must be between 1 byte and 100 MB.', 400)
    }

    const admin = await getOrCreateCurrentUser()
    const [document] = await db
      .insert(projectDocuments)
      .values({
        projectId,
        name,
        category,
        fileUrl: publicR2Url(storageKey),
        fileSize,
        storageProvider: 'r2',
        visibility,
        signatureStatus,
        uploadedBy: admin?.id || null,
      })
      .returning()

    await db.insert(projectActivity).values({
      projectId,
      actorUserId: admin?.id || null,
      actorType: 'admin',
      action: 'document_uploaded',
      summary: `${name} was uploaded`,
    })

    return NextResponse.json({ success: true, document }, { status: 201 })
  } catch (error) {
    console.error('Failed to upload project document:', error)
    return errorResponse('The document was uploaded but could not be added to this project. Refresh and try again.', 500)
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const authorizationError = await requireAdminApi()
  if (authorizationError) return authorizationError

  try {
    const { id: projectId } = await context.params
    if (!isUuid(projectId)) return errorResponse('Invalid project ID.', 400)
    const body = await request.json() as { documentId?: unknown; signatureStatus?: unknown }
    const documentId = stringValue(body.documentId, 36)
    const signatureStatus = stringValue(body.signatureStatus, 20)

    if (!isUuid(documentId) || !signatureStatus) return errorResponse('Document ID and signature status are required.', 400)
    if (!ALLOWED_SIGNATURE_STATUSES.has(signatureStatus)) return errorResponse('Invalid signature status.', 400)

    const document = await db.query.projectDocuments.findFirst({
      where: and(eq(projectDocuments.id, documentId), eq(projectDocuments.projectId, projectId)),
    })
    if (!document) return errorResponse('Document not found.', 404)

    await db
      .update(projectDocuments)
      .set({ signatureStatus })
      .where(eq(projectDocuments.id, documentId))

    await db.insert(projectActivity).values({
      projectId,
      action: 'document_signature_updated',
      actorType: 'admin',
      summary: `${document.name} marked as ${signatureStatus}`,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to update signature status:', error)
    return errorResponse('Failed to update signature status.', 500)
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const authorizationError = await requireAdminApi()
  if (authorizationError) return authorizationError

  try {
    const { id: projectId } = await context.params
    if (!isUuid(projectId)) return errorResponse('Invalid project ID.', 400)
    const { searchParams } = new URL(request.url)
    const documentId = searchParams.get('documentId')

    if (!documentId || !isUuid(documentId)) return errorResponse('Document ID is required.', 400)

    const document = await db.query.projectDocuments.findFirst({
      where: and(eq(projectDocuments.id, documentId), eq(projectDocuments.projectId, projectId)),
    })
    if (!document) return errorResponse('Document not found.', 404)

    if (document.storageProvider === 'r2') {
      const key = keyFromR2Url(document.fileUrl)
      if (key) {
        try {
          await deleteFromR2(key)
        } catch (error) {
          console.error('Failed to delete R2 object (continuing):', error)
        }
      }
    }

    await db.delete(projectDocuments).where(eq(projectDocuments.id, documentId))
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete project document:', error)
    return errorResponse('Failed to delete project document.', 500)
  }
}
