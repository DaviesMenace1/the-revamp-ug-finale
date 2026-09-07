import { auth } from '@clerk/nextjs/server'
import { inArray } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import { products } from '@/lib/db/schema'
import { getOrCreateCurrentUser } from '@/lib/auth/utils'
import { getCollectionPromotionQuote } from '@/lib/collection-commerce'

function normalizeCurrency(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim().slice(0, 3).toUpperCase() : 'UGX'
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) return Response.json({ error: 'Please sign in before applying a collection promo code.' }, { status: 401 })
    const localUser = await getOrCreateCurrentUser(userId)
    if (!localUser) return Response.json({ error: 'Your account is not ready to apply a promotion.' }, { status: 503 })
    const body = await request.json() as { code?: unknown; items?: unknown; currency?: unknown }
    const submittedItems = Array.isArray(body.items) ? body.items : []
    if (submittedItems.length === 0 || submittedItems.length > 100) return Response.json({ error: 'Your cart is empty or too large to quote.' }, { status: 400 })
    const items = submittedItems.map((item: unknown) => {
      if (!item || typeof item !== 'object') return null
      const value = item as Record<string, unknown>
      const productId = typeof value.productId === 'string' ? value.productId : ''
      const quantity = Number(value.quantity)
      const unitPrice = Number(value.unitPrice)
      if (!/^[0-9a-f-]{36}$/i.test(productId) || !Number.isInteger(quantity) || quantity < 1 || quantity > 100 || !Number.isFinite(unitPrice) || unitPrice < 0) return null
      return { productId, quantity, unitPrice }
    })
    if (items.some((item) => !item)) return Response.json({ error: 'One or more cart items are invalid.' }, { status: 400 })
    const validItems = items as Array<{ productId: string; quantity: number; unitPrice: number }>
    const currency = normalizeCurrency(body.currency)
    const expectedCurrency = (process.env.FLUTTERWAVE_CURRENCY || 'UGX').toUpperCase()
    if (currency !== expectedCurrency) return Response.json({ error: `Checkout currently supports ${expectedCurrency} only.` }, { status: 400 })
    const productIds = [...new Set(validItems.map((item) => item.productId))]
    const catalog = await db.select({ id: products.id, price: products.price, currency: products.currency, status: products.status, availability: products.availability }).from(products).where(inArray(products.id, productIds))
    const catalogById = new Map(catalog.map((product) => [product.id, product]))
    if (validItems.some((item) => {
      const product = catalogById.get(item.productId)
      return !product || product.status !== 'published' || product.availability === 'out_of_stock' || (product.currency || '').toUpperCase() !== expectedCurrency || item.unitPrice + 0.01 < Number(product.price)
    })) return Response.json({ error: 'One or more products changed. Refresh your cart and try again.' }, { status: 409 })

    const result = await getCollectionPromotionQuote({ userId: localUser.id, code: body.code, items: validItems })
    if (!result.success) return Response.json({ error: result.error }, { status: 409 })
    return Response.json({ success: true, quote: result.quote })
  } catch (error) {
    console.error('[collection-promotion-quote] failed:', error)
    return Response.json({ error: 'We could not apply that collection promo code right now.' }, { status: 500 })
  }
}
