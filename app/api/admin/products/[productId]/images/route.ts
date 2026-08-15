import { NextResponse } from "next/server"
import { z } from "zod"
import {
  db,
  products,
  productImages,
} from "@/lib/db"
import { eq, asc } from "drizzle-orm"

const imageSchema = z.object({
  url: z.string().url(),
  publicId: z.string().optional().nullable(),
  alt: z.string().optional().nullable(),
  type: z
    .enum([
      "primary",
      "gallery",
      "lifestyle",
      "detail",
      "dimension",
      "swatch",
    ])
    .default("gallery"),
  sortOrder: z.number().int().nonnegative().default(0),
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
    const { productId } =
      await context.params

    const product =
      await db.query.products.findFirst({
        where: eq(
          products.id,
          productId,
        ),
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

    const images =
      await db
        .select()
        .from(productImages)
        .where(
          eq(
            productImages.productId,
            productId,
          ),
        )
        .orderBy(
          asc(productImages.sortOrder),
        )

    return NextResponse.json({
      success: true,
      images,
    })
  } catch (error) {
    console.error(
      "Failed to load product images:",
      error,
    )

    return NextResponse.json(
      {
        success: false,
        error:
          "Failed to load product images.",
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
    const { productId } =
      await context.params

    const product =
      await db.query.products.findFirst({
        where: eq(
          products.id,
          productId,
        ),
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

    const body =
      await request.json()

    const parsed =
      imageSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid image data.",
          details:
            parsed.error.flatten(),
        },
        { status: 400 },
      )
    }

    const data = parsed.data

    if (
      data.type === "primary"
    ) {
      await db
        .update(productImages)
        .set({
          type: "gallery",
        })
        .where(
          eq(
            productImages.productId,
            productId,
          ),
        )
    }

    const [image] =
      await db
        .insert(productImages)
        .values({
          productId,

          url: data.url,

          publicId:
            data.publicId ||
            null,

          alt:
            data.alt ||
            null,

          type: data.type,

          sortOrder:
            data.sortOrder,

          createdAt:
            new Date(),

          updatedAt:
            new Date(),
        })
        .returning()

    return NextResponse.json(
      {
        success: true,
        image,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error(
      "Product image creation error:",
      error,
    )

    return NextResponse.json(
      {
        success: false,
        error:
          "Failed to add product image.",
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
    const { productId } =
      await context.params

    const { searchParams } =
      new URL(request.url)

    const imageId =
      searchParams.get("imageId")

    if (!imageId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Image ID is required.",
        },
        { status: 400 },
      )
    }

    const image =
      await db.query.productImages.findFirst({
        where: eq(
          productImages.id,
          imageId,
        ),
      })

    if (
      !image ||
      image.productId !== productId
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Image not found.",
        },
        { status: 404 },
      )
    }

    await db
      .delete(productImages)
      .where(
        eq(
          productImages.id,
          imageId,
        ),
      )

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error(
      "Product image deletion error:",
      error,
    )

    return NextResponse.json(
      {
        success: false,
        error:
          "Failed to delete product image.",
      },
      { status: 500 },
    )
  }
}