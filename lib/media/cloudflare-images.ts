export type CloudflareImageResult = {
  success: boolean
  imageId?: string
  uploadURL?: string
  deliveryURL?: string
  error?: string
}

function getConfig() {
  return {
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
    token: process.env.CLOUDFLARE_IMAGES_API_TOKEN,
    deliveryHash: process.env.CLOUDFLARE_IMAGES_DELIVERY_HASH,
  }
}

function deliveryUrl(imageId: string, variant = 'public') {
  const { deliveryHash } = getConfig()
  return deliveryHash ? `https://imagedelivery.net/${deliveryHash}/${imageId}/${variant}` : ''
}

function configurationError() {
  const config = getConfig()
  return !config.accountId || !config.token || !config.deliveryHash
}

export async function createCloudflareDirectUpload(metadata: Record<string, unknown>): Promise<CloudflareImageResult> {
  const config = getConfig()
  if (configurationError()) {
    return { success: false, error: 'Cloudflare Images is not configured on the server yet.' }
  }

  const form = new FormData()
  form.append('requireSignedURLs', 'false')
  form.append('metadata', JSON.stringify(metadata))

  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(config.accountId!)}/images/v2/direct_upload`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${config.token}` },
      body: form,
      cache: 'no-store',
    },
  )
  const payload = await response.json().catch(() => null)
  if (!response.ok || !payload?.success || !payload?.result?.uploadURL || !payload?.result?.id) {
    console.error('Cloudflare direct upload error:', payload)
    return { success: false, error: 'Cloudflare could not prepare the upload.' }
  }

  const imageId = String(payload.result.id)
  return {
    success: true,
    imageId,
    uploadURL: String(payload.result.uploadURL),
    deliveryURL: deliveryUrl(imageId),
  }
}

export async function uploadToCloudflare(file: globalThis.File, metadata: Record<string, unknown>): Promise<CloudflareImageResult> {
  const config = getConfig()
  if (configurationError()) {
    return { success: false, error: 'Cloudflare Images is not configured on the server yet.' }
  }

  const form = new FormData()
  form.append('file', file as unknown as Blob, String(metadata.filename || file.name || 'upload'))
  form.append('metadata', JSON.stringify(metadata))

  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(config.accountId!)}/images/v1`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${config.token}` },
      body: form,
      cache: 'no-store',
    },
  )
  const payload = await response.json().catch(() => null)
  if (!response.ok || !payload?.success || !payload?.result?.id) {
    console.error('Cloudflare image upload error:', payload)
    return { success: false, error: 'Cloudflare could not upload the image.' }
  }

  const imageId = String(payload.result.id)
  return { success: true, imageId, deliveryURL: deliveryUrl(imageId) }
}
