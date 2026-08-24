import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { products } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export const dynamic = "force-dynamic"

type RouteContext = {
  params: Promise<{ productId: string }>
}

type ProductUpdate = {
  name?: string
  slug?: string
  sku?: string
  mpn?: string | null
  gtin?: string | null
  brand?: string | null
  manufacturer?: string | null
  countryOfOrigin?: string | null

  subCategoryId?: string

  productType?: string
  description?: string | null
  longDescription?: string | null
  editorialHighlight?: string | null

  price?: number | string
  originalPrice?: number | string | null
  currency?: string

  condition?: string
  availability?: string
  inStock?: boolean
  quantity?: number
  leadTime?: string | null

  weight?: number | string | null
  weightUnit?: string

  googleProductCategoryId?: string | null
  googleProductCategoryPath?: string | null
  canonicalUrl?: string | null

  seoTitle?: string | null
  seoDescription?: string | null

  featured?: boolean
  isNewArrival?: boolean
  isBestSeller?: boolean
  isOnSale?: boolean

  status?:
    | "draft"
    | "ready_for_review"
    | "published"
    | "archived"

  attributes?: Record<string, unknown>

  /*
   * Images are handled by the dedicated product-images endpoint.
   * Do not put image arrays directly into this update.
   */
}

function cleanString(value: unknown) {
  if (typeof value !== "string") return null

  const result = value.trim()

  return result.length ? result : null
}

function cleanSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function decimal(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return null
  }

  const number = Number(value)

  if (!Number.isFinite(number)) {
    return null
  }

  return number.toString()
}

function validStatus(value: unknown) {
  return (
    value === "draft" ||
    value === "ready_for_review" ||
    value === "published" ||
    value === "archived"
  )
}

function validAvailability(value: unknown) {
  return (
    value === "in_stock" ||
    value === "made_to_order" ||
    value === "pre_order" ||
    value === "available_on_request" ||
    value === "out_of_stock"
  )
}

/**
 * GET
 *
 * Loads one complete product for the admin editor.
 *
 * Keep this endpoint focused on product data.
 * Taxonomy is loaded separately from:
 *
 * /api/admin/product-taxonomy
 */
export async function GET(
  _request: NextRequest,
  context: RouteContext,
) {
  try {
    const { productId: id } = await context.params

    if (!id) {
      return NextResponse.json(
        { error: "Product ID is required." },
        { status: 400 },
      )
    }

    const product = await db.query.products.findFirst({
      where: eq(products.id, id),
      with: {
        productImages: {
          orderBy: (images, { asc }) => [
            asc(images.displayOrder),
          ],
        },
        productVariants: true,
      },
    })

    if (!product) {
      return NextResponse.json(
        { error: "Product not found." },
        { status: 404 },
      )
    }

    return NextResponse.json({
      product,
    })
  } catch (error) {
    console.error(
      "GET /api/admin/products/[id]:",
      error,
    )

    return NextResponse.json(
      {
        error: "Failed to load product.",
      },
      { status: 500 },
    )
  }
}

/**
 * PATCH
 *
 * Updates an existing product.
 *
 * Important:
 * We intentionally build the update object instead of passing
 * the entire request body directly to Drizzle.
 *
 * This prevents accidental database fields from being modified
 * through the browser.
 */
export async function PATCH(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    const { productId: id } = await context.params

    if (!id) {
      return NextResponse.json(
        { error: "Product ID is required." },
        { status: 400 },
      )
    }

    const body = (await request.json()) as ProductUpdate

    const existingRows = await db
      .select()
      .from(products)
      .where(eq(products.id, id))
      .limit(1)

    if (!existingRows.length) {
      return NextResponse.json(
        { error: "Product not found." },
        { status: 404 },
      )
    }

    const existing = existingRows[0]

    /*
     * Basic validation.
     */
    if (
      body.name !== undefined &&
      !cleanString(body.name)
    ) {
      return NextResponse.json(
        { error: "Product name cannot be empty." },
        { status: 400 },
      )
    }

    if (
      body.sku !== undefined &&
      !cleanString(body.sku)
    ) {
      return NextResponse.json(
        { error: "SKU cannot be empty." },
        { status: 400 },
      )
    }

    if (
      body.price !== undefined &&
      decimal(body.price) === null
    ) {
      return NextResponse.json(
        { error: "Invalid product price." },
        { status: 400 },
      )
    }

    if (
      body.quantity !== undefined &&
      (!Number.isFinite(body.quantity) ||
        body.quantity < 0)
    ) {
      return NextResponse.json(
        { error: "Quantity cannot be negative." },
        { status: 400 },
      )
    }

    if (
      body.status !== undefined &&
      !validStatus(body.status)
    ) {
      return NextResponse.json(
        { error: "Invalid product status." },
        { status: 400 },
      )
    }

    if (
      body.availability !== undefined &&
      !validAvailability(body.availability)
    ) {
      return NextResponse.json(
        { error: "Invalid availability value." },
        { status: 400 },
      )
    }

    const nextSku =
      body.sku !== undefined
        ? body.sku.trim().toUpperCase()
        : existing.sku

    const nextSlug =
      body.slug !== undefined
        ? cleanSlug(body.slug)
        : existing.slug

    /*
     * SKU uniqueness.
     */
    if (nextSku !== existing.sku) {
      const duplicateSku = await db
        .select({ id: products.id })
        .from(products)
        .where(eq(products.sku, nextSku))
        .limit(1)

      if (
        duplicateSku.length &&
        duplicateSku[0].id !== id
      ) {
        return NextResponse.json(
          {
            error: `SKU "${nextSku}" already exists.`,
          },
          { status: 409 },
        )
      }
    }

    /*
     * Slug uniqueness.
     */
    if (nextSlug !== existing.slug) {
      const duplicateSlug = await db
        .select({ id: products.id })
        .from(products)
        .where(eq(products.slug, nextSlug))
        .limit(1)

      if (
        duplicateSlug.length &&
        duplicateSlug[0].id !== id
      ) {
        return NextResponse.json(
          {
            error: `Slug "${nextSlug}" already exists.`,
          },
          { status: 409 },
        )
      }
    }

    const update: Record<string, unknown> = {
      updatedAt: new Date(),
    }

    /*
     * Identity.
     */
    if (body.name !== undefined) {
      update.name = body.name.trim()
    }

    if (body.slug !== undefined) {
      update.slug = nextSlug
    }

    if (body.sku !== undefined) {
      update.sku = nextSku
    }

    if (body.mpn !== undefined) {
      update.mpn = cleanString(body.mpn)
    }

    if (body.gtin !== undefined) {
      update.gtin = cleanString(body.gtin)
    }

    if (body.brand !== undefined) {
      update.brand = cleanString(body.brand)
    }

    if (body.manufacturer !== undefined) {
      update.manufacturer =
        cleanString(body.manufacturer)
    }

    if (body.countryOfOrigin !== undefined) {
      update.countryOfOrigin =
        cleanString(body.countryOfOrigin)
    }

    /*
     * Taxonomy.
     */
    if (body.subCategoryId !== undefined) {
      update.subCategoryId = body.subCategoryId
    }

    /*
     * Content.
     */
    if (body.productType !== undefined) {
      update.productType =
        cleanString(body.productType)
    }

    if (body.description !== undefined) {
      update.description =
        cleanString(body.description)
    }

    if (body.longDescription !== undefined) {
      update.longDescription =
        cleanString(body.longDescription)
    }

    if (body.editorialHighlight !== undefined) {
      update.editorialHighlight =
        cleanString(body.editorialHighlight)
    }

    /*
     * Pricing.
     */
    if (body.price !== undefined) {
      update.price = decimal(body.price)
    }

    if (body.originalPrice !== undefined) {
      update.originalPrice =
        decimal(body.originalPrice)
    }

    if (body.currency !== undefined) {
      update.currency =
        cleanString(body.currency) ?? "UGX"
    }

    /*
     * Availability.
     */
    if (body.condition !== undefined) {
      update.condition =
        cleanString(body.condition)
    }

    if (body.availability !== undefined) {
      update.availability = body.availability
    }

    if (body.quantity !== undefined) {
      update.quantity = Math.floor(body.quantity)
    }

    if (body.leadTime !== undefined) {
      update.leadTime =
        cleanString(body.leadTime)
    }

    /*
     * Weight.
     */
    if (body.weight !== undefined) {
      update.weight = decimal(body.weight)
    }

    if (body.weightUnit !== undefined) {
      update.weightUnit =
        cleanString(body.weightUnit) ?? "kg"
    }

    /*
     * Google Merchant data.
     */
    if (
      body.googleProductCategoryId !== undefined
    ) {
      update.googleProductCategoryId =
        cleanString(
          body.googleProductCategoryId,
        )
    }

    if (
      body.googleProductCategoryPath !== undefined
    ) {
      update.googleProductCategoryPath =
        cleanString(
          body.googleProductCategoryPath,
        )
    }

    if (body.canonicalUrl !== undefined) {
      update.canonicalUrl =
        cleanString(body.canonicalUrl)
    }

    /*
     * SEO.
     */
    if (body.seoTitle !== undefined) {
      update.seoTitle =
        cleanString(body.seoTitle)
    }

    if (body.seoDescription !== undefined) {
      update.seoDescription =
        cleanString(body.seoDescription)
    }

    /*
     * Storefront flags.
     */
    if (body.featured !== undefined) {
      update.featured = Boolean(body.featured)
    }

    if (body.isNewArrival !== undefined) {
      update.isNewArrival =
        Boolean(body.isNewArrival)
    }

    if (body.isBestSeller !== undefined) {
      update.isBestSeller =
        Boolean(body.isBestSeller)
    }

    if (body.isOnSale !== undefined) {
      update.isOnSale =
        Boolean(body.isOnSale)
    }

    /*
     * Dynamic category-specific specifications.
     */
    if (body.attributes !== undefined) {
      update.attributes =
        body.attributes &&
        typeof body.attributes === "object"
          ? body.attributes
          : {}
    }

    /*
     * Publishing.
     *
     * Published products should only be published once
     * the product has passed through the review state.
     */
    if (body.status !== undefined) {
      update.status = body.status

      /*
       * Whenever important product information changes,
       * Google needs to receive the updated data again.
       */
      if (
        body.status === "published" ||
        body.name !== undefined ||
        body.price !== undefined ||
        body.availability !== undefined ||
        body.gtin !== undefined ||
        body.mpn !== undefined ||
        body.brand !== undefined ||
        body.description !== undefined ||
        body.subCategoryId !== undefined ||
        body.attributes !== undefined
      ) {
        update.googleSyncStatus = "pending"
        update.googleSyncError = null
      }
    } else if (
      body.name !== undefined ||
      body.price !== undefined ||
      body.availability !== undefined ||
      body.gtin !== undefined ||
      body.mpn !== undefined ||
      body.brand !== undefined ||
      body.description !== undefined ||
      body.subCategoryId !== undefined ||
      body.attributes !== undefined
    ) {
      /*
       * Product changed but status did not.
       * Mark Google data stale so the sync worker knows
       * that Merchant Center needs an update.
       */
      update.googleSyncStatus = "pending"
      update.googleSyncError = null
    }

    const [updated] = await db
      .update(products)
      .set(update)
      .where(eq(products.id, id))
      .returning()

    return NextResponse.json({
      success: true,
      product: updated,
      message: "Product updated successfully.",
    })
  } catch (error) {
    console.error(
      "PATCH /api/admin/products/[id]:",
      error,
    )

    return NextResponse.json(
      {
        error: "Failed to update product.",
      },
      { status: 500 },
    )
  }
}

/**
 * DELETE
 *
 * For safety, this performs a soft delete by archiving the product.
 *
 * This is much safer than physically deleting it because products
 * may already be referenced by:
 *
 * - orders
 * - carts
 * - wishlists
 * - analytics
 * - Google Merchant
 * - customer history
 */
export async function DELETE(
  _request: NextRequest,
  context: RouteContext,
) {
  try {
    const { productId: id } = await context.params

    if (!id) {
      return NextResponse.json(
        { error: "Product ID is required." },
        { status: 400 },
      )
    }

    const existing = await db
      .select({
        id: products.id,
        status: products.status,
      })
      .from(products)
      .where(eq(products.id, id))
      .limit(1)

    if (!existing.length) {
      return NextResponse.json(
        { error: "Product not found." },
        { status: 404 },
      )
    }

    const [archived] = await db
      .update(products)
      .set({
        status: "archived",
        availability: "out_of_stock",
        googleSyncStatus: "pending",
        googleSyncError: null,
        updatedAt: new Date(),
      })
      .where(eq(products.id, id))
      .returning({
        id: products.id,
        status: products.status,
      })

    return NextResponse.json({
      success: true,
      product: archived,
      message:
        "Product archived successfully.",
    })
  } catch (error) {
    console.error(
      "DELETE /api/admin/products/[id]:",
      error,
    )

    return NextResponse.json(
      {
        error: "Failed to archive product.",
      },
      { status: 500 },
    )
  }
}
