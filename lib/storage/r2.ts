
// Used for project drawings/renders/documents (the "files, drawings and all"
// asset library). Product/marketing images continue to go through Cloudinary
// — this is deliberately scoped to project workspace files only, to avoid
// re-plumbing everything that already works.

import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3"
import { randomUUID } from "crypto"

export class R2ConfigError extends Error {}

function getEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new R2ConfigError(
      `Missing required environment variable: ${name}. Cloudflare R2 storage is not configured.`,
    )
  }
  return value
}

let cachedClient: S3Client | null = null

function getClient(): S3Client {
  if (cachedClient) return cachedClient

  const accountId = getEnv("R2_ACCOUNT_ID")

  cachedClient = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: getEnv("R2_ACCESS_KEY_ID"),
      secretAccessKey: getEnv("R2_SECRET_ACCESS_KEY"),
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

/**
 * Uploads a file buffer to R2 under a folder scoped to the project, and
 * returns its public URL. Keys are namespaced as:
 *   projects/{projectId}/{category}/{uuid}-{originalFilename}
 */
export async function uploadToR2(
  file: Buffer,
  options: {
    projectId: string
    category: string // e.g. "renders", "floor-plans", "documents"
    filename: string
    contentType: string
  },
): Promise<UploadResult> {
  const bucket = getEnv("R2_BUCKET_NAME")
  const publicUrl = getEnv("R2_PUBLIC_URL").replace(/\/+$/, "")

  const safeFilename = options.filename.replace(/[^a-zA-Z0-9.\-_]/g, "_")
  const key = `projects/${options.projectId}/${options.category}/${randomUUID()}-${safeFilename}`

  const client = getClient()

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: file,
      ContentType: options.contentType,
    }),
  )

  return {
    url: `${publicUrl}/${key}`,
    key,
    size: file.length,
  }
}

/**
 * Uploads a file buffer to R2 under a folder scoped to the client account
 * (not a project) — used for invoices, quotes, and receipts, which a client
 * may have even without an active project. Keys are namespaced as:
 *   clients/{userId}/{category}/{uuid}-{originalFilename}
 * This folder scoping is defense-in-depth alongside the DB-level userId
 * filter — every query for these documents must also filter by userId.
 */
export async function uploadClientDocToR2(
  file: Buffer,
  options: {
    userId: string
    category: string // "invoices" | "quotes" | "receipts"
    filename: string
    contentType: string
  },
): Promise<UploadResult> {
  const bucket = getEnv("R2_BUCKET_NAME")
  const publicUrl = getEnv("R2_PUBLIC_URL").replace(/\/+$/, "")

  const safeFilename = options.filename.replace(/[^a-zA-Z0-9.\-_]/g, "_")
  const key = `clients/${options.userId}/${options.category}/${randomUUID()}-${safeFilename}`

  const client = getClient()

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: file,
      ContentType: options.contentType,
    }),
  )

  return {
    url: `${publicUrl}/${key}`,
    key,
    size: file.length,
  }
}

/** Deletes an object from R2 given its key (not its full public URL). */
export async function deleteFromR2(key: string): Promise<void> {
  const bucket = getEnv("R2_BUCKET_NAME")
  const client = getClient()

  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }))
}

/** Extracts the R2 object key from a full public URL produced by uploadToR2. */
export function keyFromR2Url(url: string): string | null {
  const publicUrl = process.env.R2_PUBLIC_URL?.replace(/\/+$/, "")
  if (!publicUrl || !url.startsWith(publicUrl)) return null
  return url.slice(publicUrl.length + 1)
}
