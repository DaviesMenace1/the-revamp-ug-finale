import { requirePortalUser } from '@/lib/auth/portal-auth'
import { db } from '@/lib/db/client'
import { products, tradeMembers } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import TradeCollectionsClient from './trade-collections-client'
import { resolveProductImageUrls } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function TradeCollections() {
  const user = await requirePortalUser(['trade_member', 'admin'], '/trade/collections')

  const [member, allProducts] = await Promise.all([
    db.query.tradeMembers.findFirst({ where: eq(tradeMembers.userId, user.id) }),
    db.query.products.findMany({
      where: eq(products.status, 'published'),
      orderBy: [desc(products.createdAt)],
      with: { productImages: true },
    }),
  ])

  const formatted = allProducts.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    price: Number(p.price),
    tradeDiscountPercent: Number(p.tradeDiscountPercent || 0),
    currency: p.currency,
    image: resolveProductImageUrls(p)[0],
  }))

  return <TradeCollectionsClient products={formatted} memberName={member?.businessName || null} />
}
