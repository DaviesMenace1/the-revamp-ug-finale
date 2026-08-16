import { NextResponse } from "next/server"
import { z } from "zod"
import { db, products, productImages, productVariants } from "@/lib/db"
import { eq, and, asc } from "drizzle-orm"

const createSchema = z.object({
  url: z.string().min(1),
  altText: z.string().optional().nullable(),
  variantId: z.string().optional().nullable(),
  isPrimary: z.boolean().optional().default(false),
})

const updateSchema = z.object({
  imageId: z.string(),
  isPrimary: z.boolean().optional(),
  altText: z.string().optional().nullable(),
  displayOrder: z.number().int().optional(),
})

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params

    const images = await db
      .select()
      .from(productImages)
      .where(eq(productImages.productId, id))
      .orderBy(asc(productImages.displayOrder))

    return NextResponse.json({ success: true, images })
  } catch (error) {
    console.error("Failed to load product images:", error)
    return NextResponse.json(
      { success: false, error: "Failed to load product images." },
      { status: 500 },
    )
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params

    const product = await db.query.products.findFirst({
      where: eq(products.id, id),
      columns: { id: true },
    })

    if (!product) {
      return NextResponse.json(
        { success: false, error: "Product not found." },
        { status: 404 },
      )
    }

    const body = await request.json()
    const parsed = createSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid image data.",
          details: parsed.error.flatten(),
        },
        { status: 400 },
      )
    }

    const data = parsed.data

    if (data.variantId) {
      const variant = await db.query.productVariants.findFirst({
        where: eq(productVariants.id, data.variantId),
        columns: { id: true, productId: true },
      })

      if (!variant || variant.productId !== id) {
        return NextResponse.json(
          { success: false, error: "Variant not found on this product." },
          { status: 404 },
        )
      }
    }

    // Figure out the next display order for this product's image list.
    const existing = await db
      .select({ displayOrder: productImages.displayOrder })
      .from(productImages)
      .where(eq(productImages.productId, id))
      .orderBy(asc(productImages.displayOrder))

    const nextOrder =
      existing.length > 0
        ? Math.max(...existing.map((row) => row.displayOrder)) + 1
        : 0

    // A newly-added image becomes primary if it's explicitly requested, or
    // if this product has no images yet.
    const shouldBePrimary = data.isPrimary || existing.length === 0

    if (shouldBePrimary) {
      await db
        .update(productImages)
        .set({ isPrimary: false })
        .where(eq(productImages.productId, id))
    }

    const [image] = await db
      .insert(productImages)
      .values({
        productId: id,
        variantId: data.variantId || null,
        url: data.url,
        altText: data.altText || null,
        isPrimary: shouldBePrimary,
        displayOrder: nextOrder,
        createdAt: new Date(),
      })
      .returning()

    return NextResponse.json({ success: true, image }, { status: 201 })
  } catch (error) {
    console.error("Failed to save product image:", error)
    return NextResponse.json(
      { success: false, error: "Failed to save product image." },
      { status: 500 },
    )
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params
    const body = await request.json()
    const parsed = updateSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid image update.",
          details: parsed.error.flatten(),
        },
        { status: 400 },
      )
    }

    const data = parsed.data

    const image = await db.query.productImages.findFirst({
      where: eq(productImages.id, data.imageId),
    })

    if (!image || image.productId !== id) {
      return NextResponse.json(
        { success: false, error: "Image not found." },
        { status: 404 },
      )
    }

    if (data.isPrimary) {
      await db
        .update(productImages)
        .set({ isPrimary: false })
        .where(eq(productImages.productId, id))
    }

    const [updated] = await db
      .update(productImages)
      .set({
        ...(data.isPrimary !== undefined && { isPrimary: data.isPrimary }),
        ...(data.altText !== undefined && { altText: data.altText || null }),
        ...(data.displayOrder !== undefined && {
          displayOrder: data.displayOrder,
        }),
      })
      .where(eq(productImages.id, data.imageId))
      .returning()

    return NextResponse.json({ success: true, image: updated })
  } catch (error) {
    console.error("Failed to update product image:", error)
    return NextResponse.json(
      { success: false, error: "Failed to update product image." },
      { status: 500 },
    )
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params
    const { searchParams } = new URL(request.url)
    const imageId = searchParams.get("imageId")

    if (!imageId) {
      return NextResponse.json(
        { success: false, error: "Image ID is required." },
        { status: 400 },
      )
    }

    const image = await db.query.productImages.findFirst({
      where: eq(productImages.id, imageId),
    })

    if (!image || image.productId !== id) {
      return NextResponse.json(
        { success: false, error: "Image not found." },
        { status: 404 },
      )
    }

    await db.delete(productImages).where(eq(productImages.id, imageId))

    // If we just deleted the primary image, promote the next one in order.
    if (image.isPrimary) {
      const [next] = await db
        .select()
        .from(productImages)
        .where(eq(productImages.productId, id))
        .orderBy(asc(productImages.displayOrder))
        .limit(1)

      if (next) {
        await db
          .update(productImages)
          .set({ isPrimary: true })
          .where(eq(productImages.id, next.id))
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete product image:", error)
    return NextResponse.json(
      { success: false, error: "Failed to delete product image." },
      { status: 500 },
    )
  }
                              }
