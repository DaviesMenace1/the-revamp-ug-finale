import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

/** Returns true only for a canonical RFC 4122 UUID string. */
export function isUuid(value: string) {
  return UUID_PATTERN.test(value)
}

export function normalizeCurrency(value: unknown, fallback = 'UGX') {
  const candidate = typeof value === 'string' ? value.trim().toUpperCase() : ''
  return /^[A-Z]{3}$/.test(candidate) ? candidate : fallback
}

/** Format an amount without silently converting between currencies. */
export const DEFAULT_PRODUCT_IMAGE = '/brand/revamp-logo.png'

function readImageUrl(value: unknown) {
  if (typeof value === 'string' && value.trim()) return value.trim()
  if (value && typeof value === 'object') {
    const candidate = value as { url?: unknown; src?: unknown }
    if (typeof candidate.url === 'string' && candidate.url.trim()) return candidate.url.trim()
    if (typeof candidate.src === 'string' && candidate.src.trim()) return candidate.src.trim()
  }
  return null
}

/**
 * Resolve product imagery consistently across relation rows and legacy JSON
 * fields. Primary relation rows win over display order, then explicit product
 * thumbnail/OG images, then older images/gallery arrays.
 */
export function resolveProductImageUrls(product: unknown): string[] {
  if (!product || typeof product !== 'object') return [DEFAULT_PRODUCT_IMAGE]
  const record = product as Record<string, unknown>
  const relationImages = Array.isArray(record.productImages) ? record.productImages : []
  const orderedRelationUrls = relationImages
    .map((image, index) => ({
      url: readImageUrl(image),
      primary: Boolean(image && typeof image === 'object' && (image as { isPrimary?: unknown }).isPrimary),
      order: Number(image && typeof image === 'object' ? ((image as { displayOrder?: unknown; order?: unknown }).displayOrder ?? (image as { order?: unknown }).order) : index) || 0,
      index,
    }))
    .filter((image): image is { url: string; primary: boolean; order: number; index: number } => Boolean(image.url))
    .sort((a, b) => Number(b.primary) - Number(a.primary) || a.order - b.order || a.index - b.index)
    .map((image) => image.url)

  const directUrls = [
    readImageUrl(record.thumbnailImage),
    readImageUrl(record.ogImage),
    ...(Array.isArray(record.images) ? record.images.map(readImageUrl) : []),
    ...(Array.isArray(record.gallery) ? record.gallery.map(readImageUrl) : []),
  ].filter((url): url is string => Boolean(url))

  const urls = [...new Set([...orderedRelationUrls, ...directUrls])].slice(0, 12)
  return urls.length ? urls : [DEFAULT_PRODUCT_IMAGE]
}

/** Resolve the first image explicitly attached to a product variant. */
export function resolveProductVariantImage(product: unknown, variantId: unknown) {
  if (!product || typeof product !== 'object' || typeof variantId !== 'string' || !variantId) return null
  const record = product as Record<string, unknown>
  const relationImages = Array.isArray(record.productImages) ? record.productImages : []
  const matchingImage = relationImages
    .map((image) => image && typeof image === 'object' ? image as { variantId?: unknown; url?: unknown; displayOrder?: unknown } : null)
    .filter((image): image is { variantId?: unknown; url?: unknown; displayOrder?: unknown } => image?.variantId === variantId && typeof image.url === 'string' && Boolean(image.url.trim()))
    .sort((a, b) => Number(a.displayOrder ?? 0) - Number(b.displayOrder ?? 0))[0]
  return typeof matchingImage?.url === 'string' ? matchingImage.url.trim() || null : null
}

export function formatMoney(value: unknown, currency = 'UGX') {
  const safeCurrency = normalizeCurrency(currency)
  const amount = Number(value)
  const safeAmount = Number.isFinite(amount) ? amount : 0
  const fractionDigits = safeCurrency === 'UGX' ? 0 : 2

  try {
    return new Intl.NumberFormat(safeCurrency === 'UGX' ? 'en-UG' : 'en-US', {
      style: 'currency',
      currency: safeCurrency,
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    }).format(safeAmount)
  } catch {
    return `${safeCurrency} ${safeAmount.toLocaleString('en-US', { maximumFractionDigits: fractionDigits })}`
  }
}
