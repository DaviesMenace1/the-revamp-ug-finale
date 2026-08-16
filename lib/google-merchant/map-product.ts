// Maps our `products` row (plus its images/subCategory) to a Google Merchant
// Content API v2.1 product resource.
//
// Scope note: this syncs the *base* product as a single offer. It does not
// yet create Merchant Center item groups for per-variant offers (color/fabric
// combinations) — offerId is the product SKU. Extending to per-variant offers
// is a reasonable next step but needs a decision on how variants should be
// priced/imaged individually first.

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://therevampug.com"
const CONTENT_LANGUAGE = process.env.GOOGLE_MERCHANT_CONTENT_LANGUAGE || "en"
const TARGET_COUNTRY = process.env.GOOGLE_MERCHANT_TARGET_COUNTRY || "UG"

const AVAILABILITY_MAP: Record<string, string> = {
  in_stock: "in_stock",
  out_of_stock: "out_of_stock",
  made_to_order: "backorder",
  pre_order: "preorder",
  available_on_request: "backorder",
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
  canonicalUrl: string | null
  googleProductCategoryId: string | null
  googleProductCategoryPath: string | null
  productImages?: { url: string; isPrimary?: boolean | null }[]
}

export interface ProductMappingResult {
  resource: Record<string, unknown>
  warnings: string[]
}

export function mapProductToMerchantResource(
  product: MappableProduct,
): ProductMappingResult {
  const warnings: string[] = []

  const images = Array.isArray(product.productImages)
    ? [...product.productImages].sort((a, b) =>
        a.isPrimary === b.isPrimary ? 0 : a.isPrimary ? -1 : 1,
      )
    : []

  const imageLink = images[0]?.url
  if (!imageLink) {
    warnings.push(
      "Product has no images — Google requires at least one imageLink. Add a product image before syncing.",
    )
  }

  const additionalImageLinks = images
    .slice(1, 11)
    .map((img) => img.url)
    .filter(Boolean)

  const description = product.longDescription?.trim() || product.description?.trim()
  if (!description) {
    warnings.push("Product has no description set.")
  }

  const availability = AVAILABILITY_MAP[product.availability] || "out_of_stock"

  const priceValue =
    typeof product.price === "string" ? parseFloat(product.price) : product.price

  if (!product.brand) {
    warnings.push("Product has no brand set — Google requires a brand for most categories.")
  }

  if (!product.googleProductCategoryId && !product.googleProductCategoryPath) {
    warnings.push(
      "No Google product category is set on this product's subcategory. Sync may be rejected without one.",
    )
  }

  const resource: Record<string, unknown> = {
    offerId: product.sku,
    title: product.name,
    description: description || product.name,
    link:
      product.canonicalUrl?.trim() || `${SITE_URL}/collections/${product.slug}`,
    imageLink: imageLink || `${SITE_URL}/default-thumb.png`,
    additionalImageLinks:
      additionalImageLinks.length > 0 ? additionalImageLinks : undefined,
    contentLanguage: CONTENT_LANGUAGE,
    targetCountry: TARGET_COUNTRY,
    channel: "online",
    availability,
    condition: product.condition || "new",
    price: {
      value: Number.isFinite(priceValue) ? priceValue.toFixed(2) : "0.00",
      currency: product.currency || "UGX",
    },
  }

  if (product.brand) resource.brand = product.brand
  if (product.mpn) resource.mpn = product.mpn
  if (product.gtin) resource.gtin = product.gtin

  // Google accepts either the numeric taxonomy id (googleProductCategory) or
  // a free-text category path — prefer the id when we have it.
  if (product.googleProductCategoryId) {
    resource.googleProductCategory = product.googleProductCategoryId
  } else if (product.googleProductCategoryPath) {
    resource.googleProductCategory = product.googleProductCategoryPath
  }

  if (product.googleProductCategoryPath) {
    resource.productTypes = [product.googleProductCategoryPath]
  }

  return { resource, warnings }
  
