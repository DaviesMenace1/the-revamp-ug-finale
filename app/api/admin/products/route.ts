import { NextResponse } from "next/server"
import { z } from "zod"
import { eq } from "drizzle-orm"
import {
  db,
  products,
  subCategories,
} from "@/lib/db"

const productSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  sku: z.string().min(1),

  mpn: z.string().optional().nullable(),
  gtin: z.string().optional().nullable(),
  brand: z.string().optional().nullable(),
  manufacturer: z.string().optional().nullable(),
  countryOfOrigin: z.string().optional().nullable(),

  departmentId: z.string().min(1),
  categoryId: z.string().min(1),
  subCategoryId: z.string().min(1),

  productType: z.string().default("standard"),

  description: z.string().optional().nullable(),
  longDescription: z.string().optional().nullable(),
  editorialHighlight:
    z.string().optional().nullable(),

  price: z.number().nonnegative(),
  originalPrice:
    z.number().nonnegative().optional().nullable(),
  currency: z.string().default("UGX"),

  condition: z.string().default("new"),
  availability:
    z.string().default("in_stock"),

  quantity: z.number().int().nonnegative().default(0),
  inStock: z.boolean().default(true),

  leadTime: z.string().optional().nullable(),

  weight:
    z.number().nonnegative().optional().nullable(),
  weightUnit: z.string().default("kg"),

  googleProductCategoryId:
    z.string().optional().nullable(),

  googleProductCategoryPath:
    z.string().optional().nullable(),

  canonicalUrl:
    z.string().optional().nullable(),

  seoTitle:
    z.string().optional().nullable(),

  seoDescription:
    z.string().optional().nullable(),

  featured: z.boolean().default(false),
  isNewArrival: z.boolean().default(false),
  isBestSeller: z.boolean().default(false),
  isOnSale: z.boolean().default(false),

  status: z
    .enum([
      "draft",
      "ready_for_review",
      "published",
      "archived",
    ])
    .default("draft"),

  attributes: z
    .record(z.string(), z.unknown())
    .default({}),
})

export async function POST(
  request: Request,
) {
  try {
    const body = await request.json()

    const parsed =
      productSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid product data.",
          details:
            parsed.error.flatten(),
        },
        {
          status: 400,
        },
      )
    }

    const data = parsed.data

    const existingSku =
      await db.query.products.findFirst({
        where: eq(
          products.sku,
          data.sku,
        ),
        columns: {
          id: true,
        },
      })

    if (existingSku) {
      return NextResponse.json(
        {
          success: false,
          error:
            "A product with this SKU already exists.",
        },
        {
          status: 409,
        },
      )
    }

    const existingSlug =
      await db.query.products.findFirst({
        where: eq(
          products.slug,
          data.slug,
        ),
        columns: {
          id: true,
        },
      })

    if (existingSlug) {
      return NextResponse.json(
        {
          success: false,
          error:
            "A product with this URL slug already exists.",
        },
        {
          status: 409,
        },
      )
    }

    const subCategory =
      await db.query.subCategories.findFirst({
        where: eq(
          subCategories.id,
          data.subCategoryId,
        ),
        columns: {
          id: true,
          categoryId: true,
          templateId: true,
          googleProductCategoryId:
            true,
          googleProductCategoryPath:
            true,
        },
      })

    if (!subCategory) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Selected subcategory does not exist.",
        },
        {
          status: 400,
        },
      )
    }

    if (
      subCategory.categoryId !==
      data.categoryId
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Selected category does not match the subcategory.",
        },
        {
          status: 400,
        },
      )
    }

    const googleCategoryId =
      data.googleProductCategoryId ||
      subCategory.googleProductCategoryId ||
      null

    const googleCategoryPath =
      data.googleProductCategoryPath ||
      subCategory.googleProductCategoryPath ||
      null

    const [product] =
      await db
        .insert(products)
        .values({
          name: data.name,
          slug: data.slug,
          sku: data.sku,

          mpn: data.mpn || null,
          gtin: data.gtin || null,
          brand:
            data.brand || null,
          manufacturer:
            data.manufacturer ||
            null,
          countryOfOrigin:
            data.countryOfOrigin ||
            null,

          departmentId:
            data.departmentId,
          categoryId:
            data.categoryId,
          subCategoryId:
            data.subCategoryId,

          productType:
            data.productType,

          description:
            data.description ||
            null,
          longDescription:
            data.longDescription ||
            null,
          editorialHighlight:
            data.editorialHighlight ||
            null,

          price: String(
            data.price,
          ),
          originalPrice:
            data.originalPrice !==
            null
              ? String(
                  data.originalPrice,
                )
              : null,

          currency:
            data.currency,

          condition:
            data.condition,

          availability:
            data.availability,

          quantity:
            data.quantity,

          leadTime:
            data.leadTime ||
            null,

          weight:
            data.weight !== null
              ? String(
                  data.weight,
                )
              : null,

          weightUnit:
            data.weightUnit,

          googleProductCategoryId:
            googleCategoryId,

          googleProductCategoryPath:
            googleCategoryPath,

          canonicalUrl:
            data.canonicalUrl ||
            null,

          seoTitle:
            data.seoTitle ||
            null,

          seoDescription:
            data.seoDescription ||
            null,

          featured:
            data.featured,

          isNewArrival:
            data.isNewArrival,

          isBestSeller:
            data.isBestSeller,

          isOnSale:
            data.isOnSale,

          status:
            data.status,

          attributes:
            data.attributes,

          createdAt:
            new Date(),

          updatedAt:
            new Date(),
        })
        .returning()

    return NextResponse.json(
      {
        success: true,
        product,
      },
      {
        status: 201,
      },
    )
  } catch (error) {
    console.error(
      "Product creation error:",
      error,
    )

    return NextResponse.json(
      {
        success: false,
        error:
          "Failed to create product.",
      },
      {
        status: 500,
      },
    )
  }
}
