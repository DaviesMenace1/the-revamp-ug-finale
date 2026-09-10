import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/auth/api'
import { createCloudflareDirectUpload } from '@/lib/media/cloudflare-images'

export const dynamic = 'force-dynamic'

const MAX_IMAGE_SIZE = 10 * 1024 * 1024

export async function POST(request: Request) {
  const authorizationError = await requireAdminApi()
  if (authorizationError) return authorizationError

  try {
    const body = await request.json().catch(() => null)
    const filename = typeof body?.filename === 'string' ? body.filename.trim() : ''
    const contentType = typeof body?.contentType === 'string' ? body.contentType : ''
    const fileSize = Number(body?.fileSize || 0)

    if (!filename || !contentType.startsWith('image/')) {
      return NextResponse.json(
        { success: false, error: 'Only image files can be uploaded to Cloudflare Images.' },
        { status: 400 },
      )
    }

    if (!Number.isFinite(fileSize) || fileSize <= 0 || fileSize > MAX_IMAGE_SIZE) {
      return NextResponse.json(
        { success: false, error: 'Images must be larger than zero and no bigger than 10 MB.' },
        { status: 400 },
      )
    }

    const result = await createCloudflareDirectUpload({
      source: 'revamp-admin',
      filename: filename.slice(0, 180),
      contentType,
    })

    if (!result.success || !result.uploadURL || !result.imageId || !result.deliveryURL) {
      return NextResponse.json(
        { success: false, error: result.error || 'Cloudflare could not prepare the upload.' },
        { status: result.error?.includes('not configured') ? 503 : 502 },
      )
    }

    return NextResponse.json({
      success: true,
      imageId: result.imageId,
      uploadURL: result.uploadURL,
      deliveryURL: result.deliveryURL,
    })
  } catch (error) {
    console.error('Cloudflare direct upload preparation failed:', error)
    return NextResponse.json(
      { success: false, error: 'Cloudflare upload preparation failed.' },
      { status: 500 },
    )
  }
}
