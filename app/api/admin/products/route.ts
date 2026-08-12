import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { products, productVariants, productImages } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, slug, description, category, price, colors, fabrics } = body

    if (!name || !slug || price === undefined) {
      return NextResponse.json(
        { success: false, error: 'Name, slug, and price are required.' },
        { status: 400 }
      )
    }

    const result = await db.transaction(async (tx) => {
      // 1. Extract Cloudinary image URLs
      const allCloudinaryImages: string[] = []
      if (colors?.length) {
        colors.forEach((c: any) => {
          if (c.images?.length) {
            allCloudinaryImages.push(...c.images)
          }
        })
      }

      // 2. Insert Base Product
      // Note: Passing jsonb fields explicitly or omitting them cleanly prevents broken SQL parameter alignment
      const [newProduct] = await tx
        .insert(products)
        .values({
          name: String(name).trim(),
          slug: String(slug).trim(),
          description: description ? String(description) : null,
          category: category ? String(category) : 'Furniture',
          price: String(price),
          images: allCloudinaryImages, // Drizzle handles jsonb arrays automatically when valid
          thumbnailImage: allCloudinaryImages[0] || null,
          inStock: true,
          quantity: 10,
          status: 'published',
          rating: '0',
          ratingCount: 0,
          likes: 0,
          views: 0,
          featured: false,
        })
        .returning()

      // 3. Insert Fabrics
      if (fabrics?.length) {
        await tx.insert(productVariants).values(
          fabrics.map((f: any) => ({
            productId: newProduct.id,
            type: 'FABRIC' as const,
            label: String(f.label),
            priceDelta: String(f.priceDelta || 0),
          }))
        )
      }

      // 4. Insert Colors & Images
      if (colors?.length) {
        for (const c of colors) {
          const [colorVariant] = await tx
            .insert(productVariants)
            .values({
              productId: newProduct.id,
              type: 'COLOR' as const,
              label: String(c.label || 'Standard'),
              value: String(c.value || '#1C1C1C'),
            })
            .returning()

          if (c.images?.length) {
            await tx.insert(productImages).values(
              c.images.map((url: string, idx: number) => ({
                productId: newProduct.id,
                colorId: colorVariant.id,
                url,
                isPrimary: idx === 0,
                order: idx,
              }))
            )
          }
        }
      }

      return newProduct
    })

    return NextResponse.json({ success: true, data: result }, { status: 201 })
  } catch (error: any) {
    console.error('Error inserting product:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
