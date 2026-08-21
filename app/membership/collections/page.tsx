import { requirePortalUser } from '@/lib/auth/portal-auth'
import { db } from '@/lib/db/client'
import { products } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import MembershipCollectionsClient from './membership-collections-client'

export const dynamic = 'force-dynamic'

export default async function MembershipCollections() {
  await requirePortalUser(
    ['customer', 'admin', 'designer', 'trade_member', 'architect', 'interior_designer'],
    '/membership/collections',
  )

  const exclusiveProducts = await db.query.products.findMany({
    where: and(eq(products.status, 'published'), eq(products.featured, true)),
    orderBy: [desc(products.createdAt)],
    with: { productImages: true },
  })

  const formatted = exclusiveProducts.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    price: Number(p.price),
    originalPrice: p.originalPrice ? Number(p.originalPrice) : null,
    currency: p.currency,
    image: p.productImages?.find((img) => img.isPrimary)?.url || p.productImages?.[0]?.url || null,
  }))

  return <MembershipCollectionsClient products={formatted} />
}
