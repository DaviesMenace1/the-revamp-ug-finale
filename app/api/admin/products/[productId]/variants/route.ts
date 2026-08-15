import { NextResponse } from "next/server"
import { z } from "zod"
import { db, products, productVariants } from "@/lib/db"
import { eq, asc } from "drizzle-orm"

const variantSchema = z.object({
  name: z.string().min(1),
  sku: z.string().min(1),
  mpn: z.string().optional().nullable(),
  gtin: z.string().optional().nullable(),

  price: z.number().nonnegative(),
  originalPrice: z.number().nonnegative().optional().nullable(),

  quantity: z.number().int().nonnegative().default(0),
  inStock: z.boolean().default(true),

  colorId: z.string().optional().nullable(),
  fabricId: z.string().optional().nullable(),
  materialId: z.string().optional().nullable(),
  finishId: z.string().optional().nullable(),

  colorName: z.string().optional().nullable(),
  fabricName: z.string().optional().nullable(),
  materialName: z.string().optional().nullable(),
  finishName: z.string().optional().nullable(),

  attributes: z.record(z.string(), z.unknown()).default({}),

  sortOrder: z.number().int().nonnegative().default(0),

  isDefault: z.boolean().default(false),
  active: z.boolean().default(true),
})

export async function GET(
  request: Request,
  context: {
    params: Promise<{
      productId: string
    }>
  },
) {
  try {
    const { productId } = await context.params

    const product = await db.query.products.findFirst({
      where: eq(products.id, productId),
      columns: {
        id: true,
      },
    })

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          error: "Product not found.",
        },
        { status: 404 },
      )
    }

    const variants = await db
      .select()
      .from(productVariants)
      .where(eq(productVariants.productId, productId))
      .orderBy(asc(productVariants.sortOrder))

    return NextResponse.json({
      success: true,
      variants,
    })
  } catch (error) {
    console.error("Failed to load variants:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Failed to load product variants.",
      },
      { status: 500 },
    )
  }
}

export async function POST(
  request: Request,
  context: {
    params: Promise<{
      productId: string
    }>
  },
) {
  try {
    const { productId } = await context.params

    const product = await db.query.products.findFirst({
      where: eq(products.id, productId),
      columns: {
        id: true,
      },
    })

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          error: "Product not found.",
        },
        { status: 404 },
      )
    }

    const body = await request.json()

    const parsed = variantSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid variant data.",
          details: parsed.error.flatten(),
        },
        { status: 400 },
      )
    }

    const data = parsed.data

    const existingSku = await db.query.productVariants.findFirst({
      where: eq(productVariants.sku, data.sku),
      columns: {
        id: true,
      },
    })

    if (existingSku) {
      return NextResponse.json(
        {
          success: false,
          error: "A variant with this SKU already exists.",
        },
        { status: 409 },
      )
    }

    if (data.isDefault) {
      await db
        .update(productVariants)
        .set({
          isDefault: false,
          updatedAt: new Date(),
        })
        .where(eq(productVariants.productId, productId))
    }

    const [variant] = await db
      .insert(productVariants)
      .values({
        productId,

        name: data.name,
        sku: data.sku,

        mpn: data.mpn || null,
        gtin: data.gtin || null,

        price: String(data.price),

        originalPrice:
          data.originalPrice !== null
            ? String(data.originalPrice)
            : null,

        quantity: data.quantity,
        inStock: data.inStock,

        colorId: data.colorId || null,
        fabricId: data.fabricId || null,
        materialId: data.materialId || null,
        finishId: data.finishId || null,

        colorName: data.colorName || null,
        fabricName: data.fabricName || null,
        materialName: data.materialName || null,
        finishName: data.finishName || null,

        attributes: data.attributes,

        sortOrder: data.sortOrder,

        isDefault: data.isDefault,
        active: data.active,

        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning()

    return NextResponse.json(
      {
        success: true,
        variant,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Variant creation error:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Failed to create variant.",
      },
      { status: 500 },
    )
  }
}

export async function PATCH(
  request: Request,
  context: {
    params: Promise<{
      productId: string
    }>
  },
) {
  try {
    const { productId } = await context.params

    const body = await request.json()

    const variantId = body.variantId

    if (!variantId) {
      return NextResponse.json(
        {
          success: false,
          error: "Variant ID is required.",
        },
        { status: 400 },
      )
    }

    const parsed = variantSchema.partial().safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid variant data.",
          details: parsed.error.flatten(),
        },
        { status: 400 },
      )
    }

    const existingVariant =
      await db.query.productVariants.findFirst({
        where: eq(productVariants.id, variantId),
      })

    if (
      !existingVariant ||
      existingVariant.productId !== productId
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Variant not found.",
        },
        { status: 404 },
      )
    }

    const data = parsed.data

    if (data.isDefault) {
      await db
        .update(productVariants)
        .set({
          isDefault: false,
          updatedAt: new Date(),
        })
        .where(eq(productVariants.productId, productId))
    }

    const [updated] = await db
      .update(productVariants)
      .set({
        ...(data.name !== undefined && {
          name: data.name,
        }),

        ...(data.sku !== undefined && {
          sku: data.sku,
        }),

        ...(data.mpn !== undefined && {
          mpn: data.mpn || null,
        }),

        ...(data.gtin !== undefined && {
          gtin: data.gtin || null,
        }),

        ...(data.price !== undefined && {
          price: String(data.price),
        }),

        ...(data.originalPrice !== undefined && {
          originalPrice:
            data.originalPrice !== null
              ? String(data.originalPrice)
              : null,
        }),

        ...(data.quantity !== undefined && {
          quantity: data.quantity,
        }),

        ...(data.inStock !== undefined && {
          inStock: data.inStock,
        }),

        ...(data.colorId !== undefined && {
          colorId: data.colorId || null,
        }),

        ...(data.fabricId !== undefined && {
          fabricId: data.fabricId || null,
        }),

        ...(data.materialId !== undefined && {
          materialId: data.materialId || null,
        }),

        ...(data.finishId !== undefined && {
          finishId: data.finishId || null,
        }),

        ...(data.colorName !== undefined && {
          colorName: data.colorName || null,
        }),

        ...(data.fabricName !== undefined && {
          fabricName: data.fabricName || null,
        }),

        ...(data.materialName !== undefined && {
          materialName: data.materialName || null,
        }),

        ...(data.finishName !== undefined && {
          finishName: data.finishName || null,
        }),

        ...(data.attributes !== undefined && {
          attributes: data.attributes,
        }),

        ...(data.sortOrder !== undefined && {
          sortOrder: data.sortOrder,
        }),

        ...(data.isDefault !== undefined && {
          isDefault: data.isDefault,
        }),

        ...(data.active !== undefined && {
          active: data.active,
        }),

        updatedAt: new Date(),
      })
      .where(eq(productVariants.id, variantId))
      .returning()

    return NextResponse.json({
      success: true,
      variant: updated,
    })
  } catch (error) {
    console.error("Variant update error:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Failed to update variant.",
      },
      { status: 500 },
    )
  }
}

export async function DELETE(
  request: Request,
  context: {
    params: Promise<{
      productId: string
    }>
  },
) {
  try {
    const { productId } = await context.params

    const { searchParams } = new URL(request.url)

    const variantId = searchParams.get("variantId")

    if (!variantId) {
      return NextResponse.json(
        {
          success: false,
          error: "Variant ID is required.",
        },
        { status: 400 },
      )
    }

    const variant =
      await db.query.productVariants.findFirst({
        where: eq(productVariants.id, variantId),
      })

    if (
      !variant ||
      variant.productId !== productId
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Variant not found.",
        },
        { status: 404 },
      )
    }

    await db
      .delete(productVariants)
      .where(eq(productVariants.id, variantId))

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error("Variant deletion error:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete variant.",
      },
      { status: 500 },
    )
  }
}