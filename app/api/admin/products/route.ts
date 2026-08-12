import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { products, productVariants, productImages } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'

// GET all products with nested variants & images for the admin list/editing
export async function GET() {
  try {
    const data = await db.query.products.findMany({
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

// POST create a new product
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, slug, description, category, price, colors, fabrics } = body

    if (!name || !slug || !price) {
      return NextResponse.json(
        { success: false, error: 'Name, Slug, and Price are required.' },
        { status: 400 }
      )
    }

    const result = await db.transaction(async (tx) => {
      // 1. Collect all images across color swatches for the main product array
      const allCloudinaryImages: string[] = []
      if (colors?.length) {
        colors.forEach((c: any) => {
          if (c.images?.length) {
            allCloudinaryImages.push(...c.images)
          }
        })
      }

      // 2. Insert Base Product with explicit fallbacks for optional/default fields
      const [newProduct] = await tx
        .insert(products)
        .values({
          name: name.trim(),
          slug: slug.trim(),
          description: description || '',
          category: category || 'Furniture',
          price: String(price),
          images: allCloudinaryImages,
          thumbnailImage: allCloudinaryImages[0] || null,
          inStock: true,
          quantity: 10,
          status: 'published',
        })
        .returning()

      // 3. Insert Fabrics
      if (fabrics?.length) {
        await tx.insert(productVariants).values(
          fabrics.map((f: any) => ({
            productId: newProduct.id,
            type: 'FABRIC' as const,
            label: f.label,
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
              label: c.label || 'Standard',
              value: c.value || '#1C1C1C',
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
    console.error('Error in product POST route:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// PUT update an existing product
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, name, slug, description, category, price, colors, fabrics } = body

    if (!id) {
      return NextResponse.json({ success: false, error: 'Product ID is required for update' }, { status: 400 })
    }

    await db.transaction(async (tx) => {
      // 1. Update Core Product Details
      await tx
        .update(products)
        .set({
          name,
          slug,
          description,
          category,
          price: price.toString(),
          updatedAt: new Date(),
        })
        .where(eq(products.id, id))

      // 2. Wipe old variants and images for clean overwrite
      await tx.delete(productVariants).where(eq(productVariants.productId, id))
      await tx.delete(productImages).where(eq(productImages.productId, id))

      // 3. Re-insert Fabrics
      if (fabrics?.length) {
        await tx.insert(productVariants).values(
          fabrics.map((f: any) => ({
            productId: id,
            type: 'FABRIC' as const,
            label: f.label,
            priceDelta: (f.priceDelta || 0).toString(),
          }))
        )
      }

      // 4. Re-insert Colors & Images
      if (colors?.length) {
        for (const c of colors) {
          const [colorVariant] = await tx
            .insert(productVariants)
            .values({
              productId: id,
              type: 'COLOR' as const,
              label: c.label,
              value: c.value,
            })
            .returning()

          if (c.images?.length) {
            await tx.insert(productImages).values(
              c.images.map((url: string, idx: number) => ({
                productId: id,
                colorId: colorVariant.id,
                url,
                isPrimary: idx === 0,
                order: idx,
              }))
            )
          }
        }
      }
    })

    return NextResponse.json({ success: true, message: 'Product updated successfully' })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

