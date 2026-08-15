import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { products } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export const dynamic = "force-dynamic"

type ProductPayload = {
  name: string
  slug: string
  sku: string
  mpn?: string | null
  gtin?: string | null
  brand?: string | null
  manufacturer?: string | null
  countryOfOrigin?: string | null

  departmentId: string
  categoryId: string
  subCategoryId: string

  productType?: string
  description?: string
  longDescription?: string
  editorialHighlight?: string

  price: number
  originalPrice?: number | null
  currency?: string

  condition?: string
  availability?: string
  inStock?: boolean
  quantity?: number
  leadTime?: string | null

  weight?: number | null
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

  status?: "draft" | "ready_for_review" | "published" | "archived"

  attributes?: Record<string, unknown>
}

function cleanString(value: unknown) {
  if (typeof value !== "string") return null

  const trimmed = value.trim()

  return trimmed.length ? trimmed : null
}

function cleanSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function isValidStatus(value: unknown) {
  return (
    value === "draft" ||
    value === "ready_for_review" ||
    value === "published" ||
    value === "archived"
  )
}

function isValidAvailability(value: unknown) {
  return (
    value === "in_stock" ||
    value === "made_to_order" ||
    value === "pre_order" ||
    value === "available_on_request" ||
    value === "out_of_stock"
  )
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ProductPayload

    /*
     * Basic validation.
     *
     * Do not rely only on the admin UI.
     * The API must also protect the database from incomplete products.
     */
    if (!cleanString(body.name)) {
      return NextResponse.json(
        { error: "Product name is required." },
        { status: 400 },
      )
    }

    if (!cleanString(body.sku)) {
      return NextResponse.json(
        { error: "SKU is required." },
        { status: 400 },
      )
    }

    if (!cleanString(body.departmentId)) {
      return NextResponse.json(
        { error: "Department is required." },
        { status: 400 },
      )
    }

    if (!cleanString(body.categoryId)) {
      return NextResponse.json(
        { error: "Category is required." },
        { status: 400 },
      )
    }

    if (!cleanString(body.subCategoryId)) {
      return NextResponse.json(
        { error: "Subcategory is required." },
        { status: 400 },
      )
    }

    if (
      typeof body.price !== "number" ||
      Number.isNaN(body.price) ||
      body.price < 0
    ) {
      return NextResponse.json(
        { error: "A valid product price is required." },
        { status: 400 },
      )
    }

    const slug = cleanSlug(
      cleanString(body.slug) || cleanString(body.name) || "",
    )

    if (!slug) {
      return NextResponse.json(
        { error: "A valid product slug is required." },
        { status: 400 },
      )
    }

    const sku = body.sku.trim().toUpperCase()

    /*
     * Check duplicate SKU.
     */
    const existingSku = await db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.sku, sku))
      .limit(1)

    if (existingSku.length) {
      return NextResponse.json(
        {
          error: `SKU "${sku}" already exists.`,
        },
        { status: 409 },
      )
    }

    /*
     * Check duplicate slug.
     */
    const existingSlug = await db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.slug, slug))
      .limit(1)

    if (existingSlug.length) {
      return NextResponse.json(
        {
          error: `The product slug "${slug}" already exists.`,
        },
        { status: 409 },
      )
    }

    const availability = isValidAvailability(body.availability)
      ? body.availability
      : "in_stock"

    const status = isValidStatus(body.status)
      ? body.status
      : "draft"

    /*
     * Never allow a product to accidentally become "published"
     * without the admin explicitly choosing that state.
     *
     * The new-product UI currently sends draft or ready_for_review.
     */
    const safeStatus =
      status === "published" ? "ready_for_review" : status

    const quantity =
      typeof body.quantity === "number" &&
      Number.isFinite(body.quantity) &&
      body.quantity >= 0
        ? Math.floor(body.quantity)
        : 0

    const inStock =
      typeof body.inStock === "boolean"
        ? body.inStock
        : availability !== "out_of_stock"

    /*
     * Google sync starts as "not_synced".
     *
     * Creating the product in our database does NOT mean Google
     * has received it yet. A separate sync process/API will handle
     * Merchant Center later.
     */
    const [created] = await db
      .insert(products)
      .values({
        name: body.name.trim(),
        slug,
        sku,

        mpn: cleanString(body.mpn),
        gtin: cleanString(body.gtin),
        brand: cleanString(body.brand),
        manufacturer: cleanString(body.manufacturer),
        countryOfOrigin: cleanString(body.countryOfOrigin),

        departmentId: body.departmentId,
        categoryId: body.categoryId,
        subCategoryId: body.subCategoryId,

        productType: cleanString(body.productType) ?? "standard",

        description: cleanString(body.description),
        longDescription: cleanString(body.longDescription),
        editorialHighlight: cleanString(body.editorialHighlight),

        price: body.price.toString(),

        originalPrice:
          typeof body.originalPrice === "number" &&
          Number.isFinite(body.originalPrice)
            ? body.originalPrice.toString()
            : null,

        currency: cleanString(body.currency) ?? "UGX",

        condition: cleanString(body.condition) ?? "new",
        availability,
        inStock,
        quantity,

        leadTime: cleanString(body.leadTime),

        weight:
          typeof body.weight === "number" &&
          Number.isFinite(body.weight)
            ? body.weight.toString()
            : null,

        weightUnit: cleanString(body.weightUnit) ?? "kg",

        googleProductCategoryId:
          cleanString(body.googleProductCategoryId),

        googleProductCategoryPath:
          cleanString(body.googleProductCategoryPath),

        canonicalUrl: cleanString(body.canonicalUrl),

        seoTitle: cleanString(body.seoTitle),
        seoDescription: cleanString(body.seoDescription),

        featured: Boolean(body.featured),
        isNewArrival: Boolean(body.isNewArrival),
        isBestSeller: Boolean(body.isBestSeller),
        isOnSale: Boolean(body.isOnSale),

        status: safeStatus,

        /*
         * Category-specific specifications.
         *
         * Examples:
         * Sofa -> dimensions, upholstery, fabric, filling, frame
         * Table -> dimensions, material, finish, shape
         * Door -> dimensions, material, finish, opening type
         *
         * These are controlled by the selected subcategory template.
         */
        attributes:
          body.attributes &&
          typeof body.attributes === "object"
            ? body.attributes
            : {},
        
        /*
         * Google Merchant lifecycle.
         */
        googleSyncStatus: "not_synced",
        googleSyncError: null,
      })
      .returning({
        id: products.id,
        name: products.name,
        slug: products.slug,
        sku: products.sku,
        status: products.status,
      })

    return NextResponse.json(
      {
        success: true,
        product: created,
        message: "Product created successfully.",
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("POST /api/admin/products:", error)

    /*
     * Drizzle/Postgres constraint errors should not expose
     * internal database details to the browser.
     */
    return NextResponse.json(
      {
        error: "Failed to create product.",
      },
      { status: 500 },
    )
  }
}

// import { NextResponse } from 'next/server'
// import { db } from '@/lib/db'
// import { products, productImages, productVariants } from '@/lib/db/schema'
// import { eq } from 'drizzle-orm'

// export async function POST(req: Request) {
//   try {
//     const body = await req.json()

//     const {
//       id,
//       thumbnailImage,
//       gallery = [],
//       colors = [],
//       fabrics = [],
//       whatsIncluded = [],
//       ...productData
//     } = body

//     let productId = id

//     // Normalize numerical and array types
//     const cleanedProductData = {
//       ...productData,
//       price: String(productData.price || '0'),
//       originalPrice: productData.originalPrice ? String(productData.originalPrice) : null,
//       quantity: Number(productData.quantity || 0),
//       whatsIncluded: Array.isArray(whatsIncluded) ? whatsIncluded : [],
//       updatedAt: new Date(),
//     }

//     // 1. Create or Update Product
//     if (productId) {
//       await db.update(products).set(cleanedProductData).where(eq(products.id, productId))
//     } else {
//       const [newProduct] = await db.insert(products).values(cleanedProductData).returning()
//       productId = newProduct.id
//     }

//     // 2. Synchronize Product Images
//     if (productId) {
//       // Clear current images for product
//       await db.delete(productImages).where(eq(productImages.productId, productId))

//       const imagesToInsert = []

//       // Insert Primary Thumbnail
//       if (thumbnailImage) {
//         imagesToInsert.push({
//           productId,
//           url: thumbnailImage,
//           isPrimary: true,
//           displayOrder: 0,
//         })
//       }

//       // Insert Gallery Images
//       if (Array.isArray(gallery)) {
//         gallery.forEach((url: string, index: number) => {
//           if (url && url !== thumbnailImage) {
//             imagesToInsert.push({
//               productId,
//               url,
//               isPrimary: false,
//               displayOrder: index + 1,
//             })
//           }
//         })
//       }

//       if (imagesToInsert.length > 0) {
//         await db.insert(productImages).values(imagesToInsert)
//       }

//       // 3. Synchronize Color & Fabric Variants
//       await db.delete(productVariants).where(eq(productVariants.productId, productId))

//       const variantsToInsert = []

//       if (Array.isArray(colors)) {
//         for (const col of colors) {
//           if (col.label) {
//             variantsToInsert.push({
//               productId,
//               type: 'COLOR',
//               label: col.label,
//               value: col.value || '#000000',
//               imageUrl: col.imageUrl || null,
//             })
//           }
//         }
//       }

//       if (Array.isArray(fabrics)) {
//         for (const fab of fabrics) {
//           if (fab.label) {
//             variantsToInsert.push({
//               productId,
//               type: 'FABRIC',
//               label: fab.label,
//               priceDelta: String(fab.priceDelta || 0),
//               imageUrl: fab.imageUrl || null,
//             })
//           }
//         }
//       }

//       if (variantsToInsert.length > 0) {
//         await db.insert(productVariants).values(variantsToInsert)
//       }
//     }

//     return NextResponse.json({ success: true, id: productId })
//   } catch (error: any) {
//     console.error('API Product Save Error:', error)
//     return NextResponse.json({ success: false, error: error.message }, { status: 500 })
//   }
// }



// // import { NextRequest, NextResponse } from 'next/server'
// // import { db } from '@/lib/db/client'
// // import { products, productVariants, productImages } from '@/lib/db/schema'
// // import { eq, desc } from 'drizzle-orm'
// // import { revalidatePath } from 'next/cache'

// // export const dynamic = 'force-dynamic'

// // export async function GET() {
// //   try {
// //     const data = await db.query.products.findMany({
// //       orderBy: [desc(products.createdAt)],
// //       with: {
// //         variants: true,
// //         productImages: true,
// //       },
// //     })
// //     return NextResponse.json({ success: true, data })
// //   } catch (error: any) {
// //     return NextResponse.json({ success: false, error: error.message }, { status: 500 })
// //   }
// // }

// // export async function POST(req: NextRequest) {
// //   try {
// //     const body = await req.json()
// //     const {
// //       id, // If present, we are UPDATING an existing product
// //       name,
// //       slug,
// //       description,
// //       longDescription,
// //       category,
// //       subCategory,
// //       price,
// //       originalPrice,
// //       sku,
// //       quantity,
// //       inStock,
// //       featured,
// //       status,
// //       weight,
// //       material,
// //       rating,
// //       ratingCount,
// //       seoTitle,
// //       seoDescription,
// //       colors,
// //       fabrics,
// //     } = body

// //     if (!name || !slug || !price || !category) {
// //       return NextResponse.json(
// //         { success: false, error: 'Name, slug, price, and category are required.' },
// //         { status: 400 }
// //       )
// //     }

// //     // 1. Collect Cloudinary images
// //     const allCloudinaryImages: string[] = []
// //     if (colors?.length) {
// //       colors.forEach((c: any) => {
// //         if (c.images?.length) {
// //           allCloudinaryImages.push(...c.images)
// //         }
// //       })
// //     }

// //     // ==========================================
// //     // BRANCH A: UPDATE EXISTING PRODUCT (if id exists)
// //     // ==========================================
// //     if (id) {
// //       const updatedProduct = await db.transaction(async (tx) => {
// //         // Update product record
// //         const [product] = await tx
// //           .update(products)
// //           .set({
// //             name: String(name).trim(),
// //             slug: String(slug).trim(),
// //             description: description ? String(description) : '',
// //             longDescription: longDescription ? String(longDescription) : '',
// //             category: String(category),
// //             subCategory: subCategory ? String(subCategory) : null,
// //             price: String(price),
// //             originalPrice: originalPrice ? String(originalPrice) : null,
// //             sku: sku ? String(sku) : null,
// //             images: allCloudinaryImages,
// //             gallery: allCloudinaryImages,
// //             thumbnailImage: allCloudinaryImages[0] || null,
// //             inStock: Boolean(inStock),
// //             quantity: Number(quantity) || 0,
// //             status: status || 'published',
// //             featured: Boolean(featured),
// //             weight: weight ? String(weight) : null,
// //             material: material ? String(material) : null,
// //             rating: String(rating || '0'),
// //             ratingCount: Number(ratingCount) || 0,
// //             seoTitle: seoTitle || String(name),
// //             seoDescription: seoDescription || String(description || ''),
// //             updatedAt: new Date(),
// //           })
// //           .where(eq(products.id, id))
// //           .returning()

// //         // Clear existing variants & images
// //         await tx.delete(productImages).where(eq(productImages.productId, id))
// //         await tx.delete(productVariants).where(eq(productVariants.productId, id))

// //         // Re-insert Fabrics
// //         if (fabrics?.length) {
// //           await tx.insert(productVariants).values(
// //             fabrics.map((f: any) => ({
// //               productId: id,
// //               type: 'FABRIC' as const,
// //               label: String(f.label),
// //               priceDelta: String(f.priceDelta || 0),
// //             }))
// //           )
// //         }

// //         // Re-insert Colors & Images
// //         if (colors?.length) {
// //           for (const c of colors) {
// //             const [colorVariant] = await tx
// //               .insert(productVariants)
// //               .values({
// //                 productId: id,
// //                 type: 'COLOR' as const,
// //                 label: String(c.label || 'Standard'),
// //                 value: String(c.value || '#1C1C1C'),
// //               })
// //               .returning()

// //             if (c.images?.length) {
// //               await tx.insert(productImages).values(
// //                 c.images.map((url: string, idx: number) => ({
// //                   productId: id,
// //                   colorId: colorVariant.id,
// //                   url,
// //                   isPrimary: idx === 0,
// //                   order: idx,
// //                 }))
// //               )
// //             }
// //           }
// //         }

// //         return product
// //       })

// //       revalidatePath('/collections')
// //       revalidatePath(`/collections/${slug}`)
// //       revalidatePath('/admin/products')

// //       return NextResponse.json({ success: true, data: updatedProduct })
// //     }

// //     // ==========================================
// //     // BRANCH B: CREATE NEW PRODUCT (if no id)
// //     // ==========================================
// //     const newProductResult = await db.transaction(async (tx) => {
// //       const [newProduct] = await tx
// //         .insert(products)
// //         .values({
// //           name: String(name).trim(),
// //           slug: String(slug).trim(),
// //           description: description ? String(description) : '',
// //           longDescription: longDescription ? String(longDescription) : '',
// //           category: String(category),
// //           subCategory: subCategory ? String(subCategory) : null,
// //           price: String(price),
// //           originalPrice: originalPrice ? String(originalPrice) : null,
// //           sku: sku ? String(sku) : null,
// //           images: allCloudinaryImages,
// //           gallery: allCloudinaryImages,
// //           thumbnailImage: allCloudinaryImages[0] || null,
// //           inStock: Boolean(inStock),
// //           quantity: Number(quantity) || 10,
// //           status: status || 'published',
// //           featured: Boolean(featured),
// //           weight: weight ? String(weight) : null,
// //           material: material ? String(material) : null,
// //           rating: String(rating || '0'),
// //           ratingCount: Number(ratingCount) || 0,
// //           seoTitle: seoTitle || String(name),
// //           seoDescription: seoDescription || String(description || ''),
// //           tags: [],
// //           relatedProducts: [],
// //           publishedAt: new Date(),
// //         })
// //         .returning()

// //       if (fabrics?.length) {
// //         await tx.insert(productVariants).values(
// //           fabrics.map((f: any) => ({
// //             productId: newProduct.id,
// //             type: 'FABRIC' as const,
// //             label: String(f.label),
// //             priceDelta: String(f.priceDelta || 0),
// //           }))
// //         )
// //       }

// //       if (colors?.length) {
// //         for (const c of colors) {
// //           const [colorVariant] = await tx
// //             .insert(productVariants)
// //             .values({
// //               productId: newProduct.id,
// //               type: 'COLOR' as const,
// //               label: String(c.label || 'Standard'),
// //               value: String(c.value || '#1C1C1C'),
// //             })
// //             .returning()

// //           if (c.images?.length) {
// //             await tx.insert(productImages).values(
// //               c.images.map((url: string, idx: number) => ({
// //                 productId: newProduct.id,
// //                 colorId: colorVariant.id,
// //                 url,
// //                 isPrimary: idx === 0,
// //                 order: idx,
// //               }))
// //             )
// //           }
// //         }
// //       }

// //       return newProduct
// //     })

// //     revalidatePath('/collections')
// //     revalidatePath(`/collections/${slug}`)

// //     return NextResponse.json({ success: true, data: newProductResult }, { status: 201 })
// //   } catch (error: any) {
// //     console.error('Error saving product:', error)
// //     return NextResponse.json({ success: false, error: error.message }, { status: 500 })
// //   }
// // }






// // import { NextRequest, NextResponse } from 'next/server'
// // import { db } from '@/lib/db/client'
// // import { products, productVariants, productImages } from '@/lib/db/schema'
// // import { eq, desc } from 'drizzle-orm'

// // export async function GET() {
// //   try {
// //     const data = await db.query.products.findMany({
// //       orderBy: [desc(products.createdAt)],
// //       with: {
// //         variants: true,
// //         productImages: true,
// //       },
// //     })
// //     return NextResponse.json({ success: true, data })
// //   } catch (error: any) {
// //     return NextResponse.json({ success: false, error: error.message }, { status: 500 })
// //   }
// // }

// // export async function POST(req: NextRequest) {
// //   try {
// //     const body = await req.json()
// //     const { name, slug, description, category, price, colors, fabrics, quantity, status } = body

// //     if (!name || !slug || !price) {
// //       return NextResponse.json(
// //         { success: false, error: 'Name, slug, and price are required.' },
// //         { status: 400 }
// //       )
// //     }

// //     const result = await db.transaction(async (tx) => {
// //       // 1. Gather images across swatches
// //       const allCloudinaryImages: string[] = []
// //       if (colors?.length) {
// //         colors.forEach((c: any) => {
// //           if (c.images?.length) {
// //             allCloudinaryImages.push(...c.images)
// //           }
// //         })
// //       }

// //       // 2. Insert Base Product
// //       const [newProduct] = await tx
// //         .insert(products)
// //         .values({
// //           name: String(name).trim(),
// //           slug: String(slug).trim(),
// //           description: description ? String(description) : '',
// //           category: category || 'Furniture',
// //           price: String(price),
// //           images: allCloudinaryImages,
// //           gallery: allCloudinaryImages,
// //           thumbnailImage: allCloudinaryImages[0] || null,
// //           inStock: true,
// //           quantity: Number(quantity) || 10,
// //           status: status || 'published',
// //           rating: '0',
// //           ratingCount: 0,
// //           likes: 0,
// //           views: 0,
// //           tags: [],
// //           relatedProducts: [],
// //           featured: false,
// //         })
// //         .returning()

// //       // 3. Insert Fabrics
// //       if (fabrics?.length) {
// //         await tx.insert(productVariants).values(
// //           fabrics.map((f: any) => ({
// //             productId: newProduct.id,
// //             type: 'FABRIC' as const,
// //             label: String(f.label),
// //             priceDelta: String(f.priceDelta || 0),
// //           }))
// //         )
// //       }

// //       // 4. Insert Colors & Images
// //       if (colors?.length) {
// //         for (const c of colors) {
// //           const [colorVariant] = await tx
// //             .insert(productVariants)
// //             .values({
// //               productId: newProduct.id,
// //               type: 'COLOR' as const,
// //               label: String(c.label || 'Standard'),
// //               value: String(c.value || '#1C1C1C'),
// //             })
// //             .returning()

// //           if (c.images?.length) {
// //             await tx.insert(productImages).values(
// //               c.images.map((url: string, idx: number) => ({
// //                 productId: newProduct.id,
// //                 colorId: colorVariant.id,
// //                 url,
// //                 isPrimary: idx === 0,
// //                 order: idx,
// //               }))
// //             )
// //           }
// //         }
// //       }

// //       return newProduct
// //     })

// //     return NextResponse.json({ success: true, data: result }, { status: 201 })
// //   } catch (error: any) {
// //     console.error('Error inserting product:', error)
// //     return NextResponse.json({ success: false, error: error.message }, { status: 500 })
// //   }
// // }
