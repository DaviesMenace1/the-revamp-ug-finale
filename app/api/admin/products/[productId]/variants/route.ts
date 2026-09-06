import { revalidatePath } from "next/cache"
import { NextResponse } from "next/server"
import { z } from "zod"
import { db, products, productVariants } from "@/lib/db"
import { eq, asc } from "drizzle-orm"
import { requireAdminApi } from "@/lib/auth/api"

const variantSchema = z.object({
  type: z.enum(["COLOR", "FABRIC", "MATERIAL", "FINISH", "SIZE"]),
  label: z.string().min(1),
  value: z.string().min(1),
  sku: z.string().optional().nullable(),
  mpn: z.string().optional().nullable(),
  gtin: z.string().optional().nullable(),
  priceDelta: z.number().default(0),
  quantity: z.number().int().nonnegative().default(0),
  availability: z
    .enum(["in_stock", "out_of_stock", "made_to_order", "pre_order", "available_on_request"])
    .default("in_stock"),
  colorId: z.string().optional().nullable(),
  fabricId: z.string().optional().nullable(),
  materialId: z.string().optional().nullable(),
  finishId: z.string().optional().nullable(),
  attributes: z.record(z.string(), z.unknown()).default({}),
})

export async function GET(
  request: Request,
  context: { params: Promise<{ productId: string }> },
) {
  const authorizationError = await requireAdminApi()
  if (authorizationError) return authorizationError

  try {
    const { productId } = await context.params

    const product = await db.query.products.findFirst({
      where: eq(products.id, productId),
      columns: { id: true },
    })

    if (!product) {
      return NextResponse.json({ success: false, error: "Product not found." }, { status: 404 })
    }

    const variants = await db
      .select()
      .from(productVariants)
      .where(eq(productVariants.productId, productId))
      .orderBy(asc(productVariants.createdAt))

    return NextResponse.json({ success: true, variants })
  } catch (error) {
    console.error("Failed to load variants:", error)
    return NextResponse.json({ success: false, error: "Failed to load product variants." }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ productId: string }> },
) {
  const authorizationError = await requireAdminApi()
  if (authorizationError) return authorizationError

  try {
    const { productId } = await context.params

    const product = await db.query.products.findFirst({
      where: eq(products.id, productId),
      columns: { id: true },
    })

    if (!product) {
      return NextResponse.json({ success: false, error: "Product not found." }, { status: 404 })
    }

    const body = await request.json()
    const parsed = variantSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid variant data.", details: parsed.error.flatten() },
        { status: 400 },
      )
    }

    const data = parsed.data

    if (data.sku) {
      const existingSku = await db.query.productVariants.findFirst({
        where: eq(productVariants.sku, data.sku),
        columns: { id: true },
      })
      if (existingSku) {
        return NextResponse.json(
          { success: false, error: "A variant with this SKU already exists." },
          { status: 409 },
        )
      }
    }

    const [variant] = await db
      .insert(productVariants)
      .values({
        productId,
        type: data.type,
        label: data.label,
        value: data.value,
        sku: data.sku || null,
        mpn: data.mpn || null,
        gtin: data.gtin || null,
        priceDelta: String(data.priceDelta),
        quantity: data.quantity,
        availability: data.availability,
        colorId: data.colorId || null,
        fabricId: data.fabricId || null,
        materialId: data.materialId || null,
        finishId: data.finishId || null,
        attributes: data.attributes,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning()

    revalidatePath('/')
    return NextResponse.json({ success: true, variant }, { status: 201 })
  } catch (error) {
    console.error("Variant creation error:", error)
    return NextResponse.json({ success: false, error: "Failed to create variant." }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ productId: string }> },
) {
  const authorizationError = await requireAdminApi()
  if (authorizationError) return authorizationError

  try {
    const { productId } = await context.params
    const body = await request.json()
    const variantId = body.variantId

    if (!variantId) {
      return NextResponse.json({ success: false, error: "Variant ID is required." }, { status: 400 })
    }

    const parsed = variantSchema.partial().safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid variant data.", details: parsed.error.flatten() },
        { status: 400 },
      )
    }

    const existingVariant = await db.query.productVariants.findFirst({
      where: eq(productVariants.id, variantId),
    })

    if (!existingVariant || existingVariant.productId !== productId) {
      return NextResponse.json({ success: false, error: "Variant not found." }, { status: 404 })
    }

    const data = parsed.data

    const [updated] = await db
      .update(productVariants)
      .set({
        ...(data.type !== undefined && { type: data.type }),
        ...(data.label !== undefined && { label: data.label }),
        ...(data.value !== undefined && { value: data.value }),
        ...(data.sku !== undefined && { sku: data.sku || null }),
        ...(data.mpn !== undefined && { mpn: data.mpn || null }),
        ...(data.gtin !== undefined && { gtin: data.gtin || null }),
        ...(data.priceDelta !== undefined && { priceDelta: String(data.priceDelta) }),
        ...(data.quantity !== undefined && { quantity: data.quantity }),
        ...(data.availability !== undefined && { availability: data.availability }),
        ...(data.colorId !== undefined && { colorId: data.colorId || null }),
        ...(data.fabricId !== undefined && { fabricId: data.fabricId || null }),
        ...(data.materialId !== undefined && { materialId: data.materialId || null }),
        ...(data.finishId !== undefined && { finishId: data.finishId || null }),
        ...(data.attributes !== undefined && { attributes: data.attributes }),
        updatedAt: new Date(),
      })
      .where(eq(productVariants.id, variantId))
      .returning()

    revalidatePath('/')
    return NextResponse.json({ success: true, variant: updated })
  } catch (error) {
    console.error("Variant update error:", error)
    return NextResponse.json({ success: false, error: "Failed to update variant." }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ productId: string }> },
) {
  const authorizationError = await requireAdminApi()
  if (authorizationError) return authorizationError

  try {
    const { productId } = await context.params
    const { searchParams } = new URL(request.url)
    const variantId = searchParams.get("variantId")

    if (!variantId) {
      return NextResponse.json({ success: false, error: "Variant ID is required." }, { status: 400 })
    }

    const variant = await db.query.productVariants.findFirst({
      where: eq(productVariants.id, variantId),
    })

    if (!variant || variant.productId !== productId) {
      return NextResponse.json({ success: false, error: "Variant not found." }, { status: 404 })
    }

    await db.delete(productVariants).where(eq(productVariants.id, variantId))

    revalidatePath('/')
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Variant deletion error:", error)
    return NextResponse.json({ success: false, error: "Failed to delete variant." }, { status: 500 })
  }
}
