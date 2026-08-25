// Maps a product row to the Google Merchant API ProductInput contract.
// The Merchant API separates ProductInput writes from processed Product reads;
// all offer attributes therefore live under `productAttributes`.

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://therevampug.com'
const CONTENT_LANGUAGE = process.env.GOOGLE_MERCHANT_CONTENT_LANGUAGE || 'en'
const FEED_LABEL = process.env.GOOGLE_MERCHANT_FEED_LABEL || process.env.GOOGLE_MERCHANT_TARGET_COUNTRY || 'UG'

const AVAILABILITY_MAP: Record<string, string> = {
  in_stock: 'IN_STOCK',
  out_of_stock: 'OUT_OF_STOCK',
  made_to_order: 'BACKORDER',
  pre_order: 'PREORDER',
  available_on_request: 'BACKORDER',
}

export interface MappableProduct {
  id: string
  sku: string
  name: string
  slug: string
  description: string | null
  longDescription: string | null
  brand: string | null
  mpn: string | null
  gtin: string | null
  price: string | number
  currency: string
  availability: string
  condition: string
  weight: string | number | null
  weightUnit: string | null
  canonicalUrl: string | null
  googleProductCategoryId: string | null
  googleProductCategoryPath: string | null
  productImages?: { url: string; isPrimary?: boolean | null }[]
}

export interface ProductMappingResult {
  resource: Record<string, unknown>
  warnings: string[]
}

export function mapProductToMerchantResource(product: MappableProduct): ProductMappingResult {
  const warnings: string[] = []
  const images = Array.isArray(product.productImages)
    ? [...product.productImages].sort((a, b) => a.isPrimary === b.isPrimary ? 0 : a.isPrimary ? -1 : 1)
    : []
  const imageLink = images[0]?.url?.trim()
  if (!imageLink) warnings.push('Product has no real product image — Google requires a crawlable imageLink. Add a product image before syncing.')

  const weightValue = typeof product.weight === 'string' ? parseFloat(product.weight) : product.weight
  const weightUnit = (product.weightUnit || 'kg').trim().toLowerCase()
  if (!Number.isFinite(weightValue) || Number(weightValue) <= 0) warnings.push('Product has no valid shipping weight. Set weight and weight unit before syncing.')

  const description = product.longDescription?.trim() || product.description?.trim()
  if (!description) warnings.push('Product has no description set.')
  if (!product.brand) warnings.push('Product has no brand set — Google requires a brand for most categories.')
  if (!product.googleProductCategoryId && !product.googleProductCategoryPath) warnings.push('No Google product category is set on this product\'s subcategory. Sync may be rejected without one.')

  const priceValue = typeof product.price === 'string' ? parseFloat(product.price) : product.price
  const amountMicros = Number.isFinite(priceValue) && Number(priceValue) >= 0 ? Math.round(Number(priceValue) * 1_000_000).toString() : '0'
  const productAttributes: Record<string, unknown> = {
    title: product.name,
    description: description || product.name,
    link: product.canonicalUrl?.trim() || `${SITE_URL}/collections/${product.slug}`,
    imageLink: imageLink || undefined,
    additionalImageLinks: images.slice(1, 11).map((img) => img.url.trim()).filter(Boolean),
    availability: AVAILABILITY_MAP[product.availability] || 'OUT_OF_STOCK',
    condition: (product.condition || 'new').toUpperCase(),
    price: { amountMicros, currencyCode: product.currency || 'UGX' },
  }

  if (product.brand) productAttributes.brand = product.brand
  if (product.mpn) productAttributes.mpn = product.mpn
  if (product.gtin) productAttributes.gtins = [product.gtin]
  if (Number.isFinite(weightValue) && Number(weightValue) > 0) productAttributes.shippingWeight = { value: Number(weightValue).toFixed(3), unit: weightUnit }
  if (product.googleProductCategoryId) productAttributes.googleProductCategory = product.googleProductCategoryId
  else if (product.googleProductCategoryPath) productAttributes.googleProductCategory = product.googleProductCategoryPath
  if (product.googleProductCategoryPath) productAttributes.productTypes = [product.googleProductCategoryPath]

  return {
    resource: {
      offerId: product.sku,
      contentLanguage: CONTENT_LANGUAGE,
      feedLabel: FEED_LABEL,
      productAttributes,
    },
    warnings,
  }
}
