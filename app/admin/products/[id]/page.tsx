import { db } from '@/lib/db'
import { products } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import ProductForm from '../_components/ProductForm'

export const dynamic = 'force-dynamic'

interface EditProductPageProps {
  params: {
    id: string
  }
}

export async function generateMetadata({ params }: EditProductPageProps) {
  return {
    title: `Edit Product ${params.id} | Admin Portal`,
  }
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const product = await db.query.products.findFirst({
    where: eq(products.id, params.id),
    with: {
      variants: true,
      productImages: true,
    },
  })

  if (!product) {
    notFound()
  }

  return <ProductForm initialData={product} isEdit={true} />
}
