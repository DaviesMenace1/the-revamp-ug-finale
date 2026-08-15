import { NextResponse } from "next/server"
import { z } from "zod"
import {
  db,
  products,
  productVariants,
  productImages,
} from "@/lib/db"
import { eq, asc } from "drizzle-orm"

const schema = z.object({
  url: z.string().url(),
  publicId: z.string().optional().nullable(),
  alt: z.string().optional().nullable(),
  type: z
    .enum([
      "primary",
      "gallery",
      "lifestyle",
      "detail",
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
      variantId: string
    }>
  },
) {
  try {
    const {
      productId,
      variantId,
    } = await context.params

    const variant =
      await db.query.productVariants.findFirst({
        where: eq(
          productVariants.id,
          variantId,
        ),
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

    const images =
      await db
        .select()
        .from(productImages)
        .where(
          eq(
            productImages.variantId,
            variantId,
          ),
        )
        .orderBy(
          asc(
            productImages.sortOrder,
          ),
        )

    return NextResponse.json({
      success: true,
      images,
    })
  } catch (error) {
    console.error(
      "Failed to load variant images:",
      error,
    )

    return NextResponse.json(
      {
        success: false,
        error:
          "Failed to load variant images.",
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
      variantId: string
    }>
  },
) {
  try {
    const {
      productId,
      variantId,
    } = await context.params

    const variant =
      await db.query.productVariants.findFirst({
        where: eq(
          productVariants.id,
          variantId,
        ),
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

    const body =
      await request.json()

    const parsed =
      schema.safeParse(body)

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
          updatedAt: new Date(),
        })
        .where(
          eq(
            productImages.variantId,
            variantId,
          ),
        )
    }

    const [image] =
      await db
        .insert(productImages)
        .values({
          productId,
          variantId,

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
      "Variant image creation error:",
      error,
    )

    return NextResponse.json(
      {
        success: false,
        error:
          "Failed to add variant image.",
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
      variantId: string
    }>
  },
) {
  try {
    const {
      productId,
      variantId,
    } = await context.params

    const { searchParams } =
      new URL(request.url)

    const imageId =
      searchParams.get(
        "imageId",
      )

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
      image.productId !==
        productId ||
      image.variantId !==
        variantId
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Variant image not found.",
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
      "Variant image deletion error:",
      error,
    )

    return NextResponse.json(
      {
        success: false,
        error:
          "Failed to delete variant image.",
      },
      { status: 500 },
    )
  }
}