import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { products } from '@/lib/db/schema'
import { desc, eq } from 'drizzle-orm'
import { POST as adminPOST } from '../admin/products/route'

export const dynamic = 'force-dynamic'

// Public GET: Retrieve all published items for storefront display
export async function GET() {
  try {
    const data = await db.query.products.findMany({
      where: eq(products.status, 'published'),
      orderBy: [desc(products.createdAt)],
      with: {
        variants: true,
        productImages: true,
      },
    })
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// Direct proxy for POST & PUT to centralize write logic
export async function POST(req: NextRequest) {
  return adminPOST(req)
}

export async function PUT(req: NextRequest) {
  return adminPOST(req)
}




// import { NextRequest, NextResponse } from 'next/server'
// import { db } from '@/lib/db/client'
// import { products, productVariants, productImages } from '@/lib/db/schema'
// import { eq, desc } from 'drizzle-orm'
// import { revalidatePath } from 'next/cache'

// export async function GET() {
//   try {
//     const data = await db.query.products.findMany({
//       orderBy: [desc(products.createdAt)],
//       with: {
//         variants: true,
//         productImages: true,
//       },
//     })
//     return NextResponse.json({ success: true, data })
//   } catch (error: any) {
//     return NextResponse.json({ success: false, error: error.message }, { status: 500 })
//   }
// }

// export async function POST(req: NextRequest) {
//   try {
//     const body = await req.json()
//     const {
//       name,
//       slug,
//       description,
//       longDescription,
//       category,
//       subCategory,
//       price,
//       originalPrice,
//       sku,
//       quantity,
//       inStock,
//       featured,
//       status,
//       weight,
//       material,
//       rating,
//       ratingCount,
//       seoTitle,
//       seoDescription,
//       colors,
//       fabrics,
//     } = body

//     if (!name || !slug || !price || !category) {
//       return NextResponse.json(
//         { success: false, error: 'Name, slug, price, and category are required.' },
//         { status: 400 }
//       )
//     }

//     const result = await db.transaction(async (tx) => {
//       // 1. Collect Cloudinary images
//       const allCloudinaryImages: string[] = []
//       if (colors?.length) {
//         colors.forEach((c: any) => {
//           if (c.images?.length) {
//             allCloudinaryImages.push(...c.images)
//           }
//         })
//       }

//       // 2. Insert Full Product Data
//       const [newProduct] = await tx
//         .insert(products)
//         .values({
//           name: String(name).trim(),
//           slug: String(slug).trim(),
//           description: description ? String(description) : '',
//           longDescription: longDescription ? String(longDescription) : '',
//           category: String(category),
//           subCategory: subCategory ? String(subCategory) : null,
//           price: String(price),
//           originalPrice: originalPrice ? String(originalPrice) : null,
//           sku: sku ? String(sku) : null,
//           images: allCloudinaryImages,
//           gallery: allCloudinaryImages,
//           thumbnailImage: allCloudinaryImages[0] || null,
//           inStock: Boolean(inStock),
//           quantity: Number(quantity) || 10,
//           status: status || 'published',
//           featured: Boolean(featured),
//           weight: weight ? String(weight) : null,
//           material: material ? String(material) : null,
//           rating: String(rating || '0'),
//           ratingCount: Number(ratingCount) || 0,
//           seoTitle: seoTitle || String(name),
//           seoDescription: seoDescription || String(description || ''),
//           tags: [],
//           relatedProducts: [],
//           publishedAt: new Date(),
//         })
//         .returning()

//       // 3. Insert Fabrics
//       if (fabrics?.length) {
//         await tx.insert(productVariants).values(
//           fabrics.map((f: any) => ({
//             productId: newProduct.id,
//             type: 'FABRIC' as const,
//             label: String(f.label),
//             priceDelta: String(f.priceDelta || 0),
//           }))
//         )
//       }

//       // 4. Insert Colors & Images
//       if (colors?.length) {
//         for (const c of colors) {
//           const [colorVariant] = await tx
//             .insert(productVariants)
//             .values({
//               productId: newProduct.id,
//               type: 'COLOR' as const,
//               label: String(c.label || 'Standard'),
//               value: String(c.value || '#1C1C1C'),
//             })
//             .returning()

//           if (c.images?.length) {
//             await tx.insert(productImages).values(
//               c.images.map((url: string, idx: number) => ({
//                 productId: newProduct.id,
//                 colorId: colorVariant.id,
//                 url,
//                 isPrimary: idx === 0,
//                 order: idx,
//               }))
//             )
//           }
//         }
//       }

//       return newProduct
//     })

//     revalidatePath('/collections')
//     revalidatePath(`/collections/${slug}`)

//     return NextResponse.json({ success: true, data: result }, { status: 201 })
//   } catch (error: any) {
//     console.error('Error creating product:', error)
//     return NextResponse.json({ success: false, error: error.message }, { status: 500 })
//   }
// }

// // ==========================================
// // ADDED: PUT Handler to Update Existing Products
// // ==========================================
// export async function PUT(req: NextRequest) {
//   try {
//     const body = await req.json()
//     const {
//       id,
//       name,
//       slug,
//       description,
//       longDescription,
//       category,
//       subCategory,
//       price,
//       originalPrice,
//       sku,
//       quantity,
//       inStock,
//       featured,
//       status,
//       weight,
//       material,
//       rating,
//       ratingCount,
//       seoTitle,
//       seoDescription,
//       colors,
//       fabrics,
//     } = body

//     if (!id) {
//       return NextResponse.json(
//         { success: false, error: 'Product ID is required for updating.' },
//         { status: 400 }
//       )
//     }

//     const updatedProduct = await db.transaction(async (tx) => {
//       // 1. Collect Cloudinary images
//       const allCloudinaryImages: string[] = []
//       if (colors?.length) {
//         colors.forEach((c: any) => {
//           if (c.images?.length) {
//             allCloudinaryImages.push(...c.images)
//           }
//         })
//       }

//       // 2. Update Main Product Details
//       const [product] = await tx
//         .update(products)
//         .set({
//           name: String(name).trim(),
//           slug: String(slug).trim(),
//           description: description ? String(description) : '',
//           longDescription: longDescription ? String(longDescription) : '',
//           category: String(category),
//           subCategory: subCategory ? String(subCategory) : null,
//           price: String(price),
//           originalPrice: originalPrice ? String(originalPrice) : null,
//           sku: sku ? String(sku) : null,
//           images: allCloudinaryImages,
//           gallery: allCloudinaryImages,
//           thumbnailImage: allCloudinaryImages[0] || null,
//           inStock: Boolean(inStock),
//           quantity: Number(quantity) || 0,
//           status: status || 'published',
//           featured: Boolean(featured),
//           weight: weight ? String(weight) : null,
//           material: material ? String(material) : null,
//           rating: String(rating || '0'),
//           ratingCount: Number(ratingCount) || 0,
//           seoTitle: seoTitle || String(name),
//           seoDescription: seoDescription || String(description || ''),
//           updatedAt: new Date(),
//         })
//         .where(eq(products.id, id))
//         .returning()

//       // 3. Clear existing product images and variants
//       await tx.delete(productImages).where(eq(productImages.productId, id))
//       await tx.delete(productVariants).where(eq(productVariants.productId, id))

//       // 4. Re-insert Fabrics
//       if (fabrics?.length) {
//         await tx.insert(productVariants).values(
//           fabrics.map((f: any) => ({
//             productId: id,
//             type: 'FABRIC' as const,
//             label: String(f.label),
//             priceDelta: String(f.priceDelta || 0),
//           }))
//         )
//       }

//       // 5. Re-insert Colors & Images
//       if (colors?.length) {
//         for (const c of colors) {
//           const [colorVariant] = await tx
//             .insert(productVariants)
//             .values({
//               productId: id,
//               type: 'COLOR' as const,
//               label: String(c.label || 'Standard'),
//               value: String(c.value || '#1C1C1C'),
//             })
//             .returning()

//           if (c.images?.length) {
//             await tx.insert(productImages).values(
//               c.images.map((url: string, idx: number) => ({
//                 productId: id,
//                 colorId: colorVariant.id,
//                 url,
//                 isPrimary: idx === 0,
//                 order: idx,
//               }))
//             )
//           }
//         }
//       }

//       return product
//     })

//     // Revalidate collection paths
//     revalidatePath('/collections')
//     revalidatePath(`/collections/${slug}`)
//     revalidatePath('/admin/products')

//     return NextResponse.json({ success: true, data: updatedProduct })
//   } catch (error: any) {
//     console.error('Error updating product:', error)
//     return NextResponse.json({ success: false, error: error.message }, { status: 500 })
//   }
// }
