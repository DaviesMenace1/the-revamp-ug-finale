// Used for project drawings/renders/documents (the "files, drawings and all"
// asset library). Product/marketing images continue to go through Cloudinary
// — this is deliberately scoped to project workspace files only, to avoid
// re-plumbing everything that already works.

import { GetObjectCommand, S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { randomUUID } from 'crypto'

export class R2ConfigError extends Error {}

function getEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new R2ConfigError(`Missing required environment variable: ${name}. Cloudflare R2 storage is not configured.`)
  }
  return value
}

let cachedClient: S3Client | null = null

function getClient(): S3Client {
  if (cachedClient) return cachedClient

  const accountId = getEnv('R2_ACCOUNT_ID')
  cachedClient = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: getEnv('R2_ACCESS_KEY_ID'),
      secretAccessKey: getEnv('R2_SECRET_ACCESS_KEY'),
    },
  })
  return cachedClient
}

export function isR2Configured(): boolean {
  return Boolean(
    process.env.R2_ACCOUNT_ID &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      process.env.R2_BUCKET_NAME &&
      process.env.R2_PUBLIC_URL,
  )
}

export interface UploadResult {
  url: string
  key: string
  size: number
}

/** Uploads a project-scoped file and returns its public URL and storage key. */
export async function uploadToR2(
  file: Buffer,
  options: { projectId: string; category: string; filename: string; contentType: string },
): Promise<UploadResult> {
  const bucket = getEnv('R2_BUCKET_NAME')
  const publicUrl = getEnv('R2_PUBLIC_URL').replace(/\/+$/, '')
  const safeFilename = options.filename.replace(/[^a-zA-Z0-9.\-_]/g, '_')
  const key = `projects/${options.projectId}/${options.category}/${randomUUID()}-${safeFilename}`
  await getClient().send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: file,
    ContentType: options.contentType,
  }))
  return { url: `${publicUrl}/${key}`, key, size: file.length }
}

/** Uploads a client-scoped billing/document file and returns its public URL and storage key. */
export async function uploadClientDocToR2(
  file: Buffer,
  options: { userId: string; category: string; filename: string; contentType: string },
): Promise<UploadResult> {
  const bucket = getEnv('R2_BUCKET_NAME')
  const publicUrl = getEnv('R2_PUBLIC_URL').replace(/\/+$/, '')
  const safeFilename = options.filename.replace(/[^a-zA-Z0-9.\-_]/g, '_')
  const key = `clients/${options.userId}/${options.category}/${randomUUID()}-${safeFilename}`
  await getClient().send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: file,
    ContentType: options.contentType,
  }))
  return { url: `${publicUrl}/${key}`, key, size: file.length }
}

/** Reads an object from R2 by key for an authenticated application route. */
export async function getFromR2(key: string) {
  const bucket = getEnv('R2_BUCKET_NAME')
  return getClient().send(new GetObjectCommand({ Bucket: bucket, Key: key }))
}

/** Deletes an object from R2 given its key (not its full public URL). */
export async function deleteFromR2(key: string): Promise<void> {
  const bucket = getEnv('R2_BUCKET_NAME')
  await getClient().send(new DeleteObjectCommand({ Bucket: bucket, Key: key }))
}

/** Extracts the R2 object key from a full public URL produced by this helper. */
export function keyFromR2Url(url: string): string | null {
  const publicUrl = process.env.R2_PUBLIC_URL?.replace(/\/+$/, '')
  if (!publicUrl || !url.startsWith(publicUrl)) return null
  return url.slice(publicUrl.length + 1)
}
