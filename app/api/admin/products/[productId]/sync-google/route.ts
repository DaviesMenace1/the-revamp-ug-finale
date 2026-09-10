import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { products } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import {
  upsertMerchantProduct,
  isGoogleMerchantConfigured,
  GoogleMerchantApiError,
  GoogleMerchantConfigError,
} from "@/lib/google-merchant/client"
import { mapProductToMerchantResource } from "@/lib/google-merchant/map-product"
import { requireAdminApi } from "@/lib/auth/api"

export const dynamic = "force-dynamic"

type RouteContext = {
  params: Promise<{ productId: string }>
}

export async function POST(_req: NextRequest, { params }: RouteContext) {
  const authorizationError = await requireAdminApi()
  if (authorizationError) return authorizationError

  const { productId: id } = await params

  if (!isGoogleMerchantConfigured()) {
    return NextResponse.json(
      {
        success: false,
        error:
          "Google Merchant is not configured. Set GOOGLE_MERCHANT_ID, GOOGLE_MERCHANT_CLIENT_EMAIL, and GOOGLE_MERCHANT_PRIVATE_KEY.",
      },
      { status: 400 },
    )
  }

  const product = await db.query.products.findFirst({
    where: eq(products.id, id),
    with: {
      productImages: true,
      subCategory: true,
    },
  })

  if (!product) {
    return NextResponse.json(
      { success: false, error: "Product not found." },
      { status: 404 },
    )
  }

  const { resource, warnings } = mapProductToMerchantResource(product as any)
  const blockingWarnings = warnings.filter((warning) => warning.includes('real product image') || warning.includes('shipping weight'))
  if (blockingWarnings.length > 0) {
    const message = 'Product is not ready for Google Merchant Center sync. Add a real product image and valid shipping weight first.'
    await db
      .update(products)
      .set({ googleSyncStatus: 'error', googleSyncError: [...blockingWarnings, message].join(' '), googleLastSyncedAt: new Date() })
      .where(eq(products.id, id))
    return NextResponse.json({ success: false, error: message, warnings }, { status: 422 })
  }

  try {
    const result = await upsertMerchantProduct(resource)

    await db
      .update(products)
      .set({
        googleProductId: (result.product || result.name || null) as string | null,
        googleSyncStatus: "synced",
        googleSyncError: null,
        googleLastSyncedAt: new Date(),
      })
      .where(eq(products.id, id))

    return NextResponse.json({
      success: true,
      merchantProduct: result,
      warnings,
    })
  } catch (error: any) {
    const message =
      error instanceof GoogleMerchantApiError || error instanceof GoogleMerchantConfigError
        ? error.message
        : error?.message || "Failed to sync product to Google Merchant."

    await db
      .update(products)
      .set({
        googleSyncStatus: "error",
        googleSyncError: message,
        googleLastSyncedAt: new Date(),
      })
      .where(eq(products.id, id))

    return NextResponse.json(
      { success: false, error: message, warnings },
      { status: 502 },
    )
  }
}
