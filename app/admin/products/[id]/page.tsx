import { db } from '@/lib/db/client'
import { products } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import ProductForm from '../_components/ProductForm'

export const dynamic = 'force-dynamic'

interface EditProductPageProps {
  params: Promise<{ id: string }> // 👈 Updated to Promise for Next.js 15
}

export async function generateMetadata({ params }: EditProductPageProps) {
  const { id } = await params
  return {
    title: `Edit Product ${id} | Admin Portal`,
  }
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { id } = await params

  const product = await db.query.products.findFirst({
    where: eq(products.id, id),
    with: {
      productVariants: true,   // ← was variants
      productImages: true,
    },
  })

  if (!product) {
    notFound()
  }

  return <ProductForm initialData={product} isEdit={true} />
}
