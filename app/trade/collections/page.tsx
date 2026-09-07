import { requirePortalUser } from '@/lib/auth/portal-auth'
import { db } from '@/lib/db/client'
import { products, tradeMembers } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import TradeCollectionsClient from './trade-collections-client'
import { resolveProductImageUrls } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function TradeCollections() {
  const user = await requirePortalUser(['trade_member', 'admin'], '/trade/collections')
  const member = await db.query.tradeMembers.findFirst({ where: eq(tradeMembers.userId, user.id) })
  const approved = user.role === 'admin' || member?.status === 'approved' || member?.status === 'active'

  if (!approved) {
    return <TradeCollectionsClient products={[]} memberName={member?.businessName || null} accessState={member?.status === 'pending' ? 'pending' : 'restricted'} />
  }

  const allProducts = await db.query.products.findMany({
    where: eq(products.status, 'published'),
    orderBy: [desc(products.createdAt)],
    with: { productImages: true },
  })

  const formatted = allProducts.map((product) => ({
    id: product.id,
    slug: product.slug,
    name: product.name,
    price: Number(product.price),
    tradeDiscountPercent: Number(product.tradeDiscountPercent || 0),
    currency: product.currency,
    image: resolveProductImageUrls(product)[0],
  }))

  return <TradeCollectionsClient products={formatted} memberName={member?.businessName || null} accessState="approved" />
}
