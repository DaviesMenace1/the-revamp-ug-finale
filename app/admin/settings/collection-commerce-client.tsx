'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Pause, Play, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createCollectionPromotion, updateCollectionPromotionStatus } from '@/lib/actions/collection-commerce'

export type CollectionPromotion = {
  id: string
  name: string
  code: string
  discountType: string
  discountValue: string
  maxDiscount: string | null
  targetType: string
  collectionSlugs: unknown
  productIds: unknown
  audience: string
  startsAt: string | null
  endsAt: string | null
  totalUsageLimit: number | null
  perCustomerLimit: number
  status: string
  stackable: boolean
  createdAt: string
  updatedAt: string
}

type TaxonomyCategory = { id: string; name: string; slug: string }
type TaxonomySubcategory = { id: string; name: string; slug: string; categoryId: string }

type TaxonomyResponse = {
  categories?: TaxonomyCategory[]
  subCategories?: TaxonomySubcategory[]
}

const INITIAL_PROMOTION = {
  name: '',
  code: '',
  discountType: 'percentage',
  discountValue: '',
  maxDiscount: '',
  targetType: 'all',
  collectionSlugs: '',
  productIds: '',
  audience: 'all',
  startsAt: '',
  endsAt: '',
  totalUsageLimit: '',
  perCustomerLimit: '1',
  status: 'draft',
  stackable: false,
}

function listValue(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
}

function selectedValues(value: string) {
  return value.split(',').map((item) => item.trim()).filter(Boolean)
}

function formatPromotion(row: CollectionPromotion) {
  const value = Number(row.discountValue)
  const amount = row.discountType === 'percentage' ? `${value}% off` : `${new Intl.NumberFormat('en-UG').format(value)} UGX off`
  return `${amount} · ${row.code}`
}

function formatAudience(audience: string) {
  if (audience === 'new_customer') return 'First order only'
  if (audience === 'returning_customer') return 'Returning customers'
  if (audience === 'members') return 'Members and trade clients'
  return 'Everyone'
}

function formatScope(row: CollectionPromotion) {
  const collections = listValue(row.collectionSlugs)
  const products = listValue(row.productIds)
  const targetType = row.targetType || (collections.length === 0 && products.length === 0 ? 'all' : 'mixed')
  if (targetType === 'all') return 'All published collection products'
  if (targetType === 'category') return `Categories: ${collections.slice(0, 3).join(', ')}${collections.length > 3 ? ' and more' : ''}`
  if (targetType === 'subcategory') return `Subcategories: ${collections.slice(0, 3).join(', ')}${collections.length > 3 ? ' and more' : ''}`
  if (targetType === 'collection') return `Collection slugs: ${collections.slice(0, 3).join(', ')}${collections.length > 3 ? ' and more' : ''}`
  if (targetType === 'product') return `Selected products: ${products.length}`
  return `${collections.length > 0 ? `Categories or subcategories: ${collections.slice(0, 2).join(', ')}` : ''}${products.length > 0 ? `${collections.length > 0 ? ' · ' : ''}Selected products: ${products.length}` : ''}`
}

export default function CollectionCommerceClient({ initialPromotions }: { initialPromotions: CollectionPromotion[] }) {
  const router = useRouter()
  const [promotion, setPromotion] = useState(INITIAL_PROMOTION)
  const [taxonomy, setTaxonomy] = useState<{ categories: TaxonomyCategory[]; subCategories: TaxonomySubcategory[] }>({ categories: [], subCategories: [] })
  const [taxonomyError, setTaxonomyError] = useState('')
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    const controller = new AbortController()
    void fetch('/api/admin/product-taxonomy', { cache: 'no-store', signal: controller.signal })
      .then(async (response) => {
        const payload = await response.json() as TaxonomyResponse
        if (!response.ok) throw new Error('The category list is temporarily unavailable.')
        setTaxonomy({
          categories: Array.isArray(payload.categories) ? payload.categories : [],
          subCategories: Array.isArray(payload.subCategories) ? payload.subCategories : [],
        })
      })
      .catch((loadError) => {
        if (loadError instanceof DOMException && loadError.name === 'AbortError') return
        setTaxonomyError(loadError instanceof Error ? loadError.message : 'The category list is temporarily unavailable.')
      })
    return () => controller.abort()
  }, [])

  function setTargetType(targetType: string) {
    setPromotion((value) => ({
      ...value,
      targetType,
      collectionSlugs: targetType === 'all' || targetType === 'product' ? '' : value.collectionSlugs,
      productIds: targetType === 'all' || ['category', 'subcategory', 'collection'].includes(targetType) ? '' : value.productIds,
    }))
  }

  function setSelectedTargets(values: string[]) {
    setPromotion((value) => ({ ...value, collectionSlugs: values.join(', '), productIds: '' }))
  }

  function createPromotion() {
    setError('')
    startTransition(async () => {
      const response = await createCollectionPromotion(promotion)
      if (!response.success) setError(response.error || 'Could not create collection promotion.')
      else {
        setSaved(true)
        setPromotion(INITIAL_PROMOTION)
        router.refresh()
        window.setTimeout(() => setSaved(false), 2000)
      }
    })
  }

  function changePromotionStatus(id: string, status: string) {
    setError('')
    startTransition(async () => {
      const response = await updateCollectionPromotionStatus(id, status)
      if (!response.success) setError(response.error || 'Could not update collection promotion.')
      else router.refresh()
    })
  }

  const categoryNameById = new Map(taxonomy.categories.map((category) => [category.id, category.name]))
  const scopeUsesTaxonomy = promotion.targetType === 'category' || promotion.targetType === 'subcategory'
  const scopeOptions = promotion.targetType === 'category'
    ? taxonomy.categories.map((category) => ({ value: category.slug, label: category.name }))
    : taxonomy.subCategories.map((subCategory) => ({ value: subCategory.slug, label: `${categoryNameById.get(subCategory.categoryId) || 'Collection'} · ${subCategory.name}` }))

  return (
    <section className="rounded-xl border border-border/70 bg-card p-6 shadow-soft sm:p-7">
      <div>
        <p className="text-[10px] uppercase tracking-[0.22em] text-primary">Collection commerce</p>
        <h2 className="mt-2 font-serif text-3xl font-light text-foreground">Promote the right products.</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Choose whether a code applies to every published product, a category such as Living Room or Decor, a subcategory such as Chairs or Sofas, a collection URL slug, or selected products. Choose New customers to create a first-order offer such as “Get 20% off your first order”. Checkout checks the live catalogue, audience, dates, and usage limits again.</p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div><label htmlFor="collection-promotion-name" className="mb-2 block text-sm font-medium text-foreground">Campaign name</label><Input id="collection-promotion-name" value={promotion.name} onChange={(event) => setPromotion((value) => ({ ...value, name: event.target.value }))} placeholder="Living room edit" className="min-h-11 rounded-none" /></div>
        <div><label htmlFor="collection-promotion-code" className="mb-2 block text-sm font-medium text-foreground">Promo code</label><Input id="collection-promotion-code" value={promotion.code} onChange={(event) => setPromotion((value) => ({ ...value, code: event.target.value.toUpperCase() }))} placeholder="LIVING20" className="min-h-11 rounded-none uppercase" /></div>
        <div><label htmlFor="collection-promotion-type" className="mb-2 block text-sm font-medium text-foreground">Discount type</label><select id="collection-promotion-type" value={promotion.discountType} onChange={(event) => setPromotion((value) => ({ ...value, discountType: event.target.value }))} className="min-h-11 w-full rounded-none border border-input bg-background px-3 text-sm text-foreground"><option value="percentage">Percentage</option><option value="fixed">Fixed UGX amount</option></select></div>
        <div><label htmlFor="collection-promotion-value" className="mb-2 block text-sm font-medium text-foreground">Discount value</label><Input id="collection-promotion-value" inputMode="decimal" value={promotion.discountValue} onChange={(event) => setPromotion((value) => ({ ...value, discountValue: event.target.value }))} placeholder={promotion.discountType === 'percentage' ? '20' : '50000'} className="min-h-11 rounded-none" /></div>
        <div><label htmlFor="collection-promotion-max" className="mb-2 block text-sm font-medium text-foreground">Maximum discount</label><Input id="collection-promotion-max" inputMode="decimal" value={promotion.maxDiscount} onChange={(event) => setPromotion((value) => ({ ...value, maxDiscount: event.target.value }))} placeholder="Optional UGX cap" className="min-h-11 rounded-none" /></div>
        <div><label htmlFor="collection-promotion-audience" className="mb-2 block text-sm font-medium text-foreground">Audience</label><select id="collection-promotion-audience" value={promotion.audience} onChange={(event) => setPromotion((value) => ({ ...value, audience: event.target.value }))} className="min-h-11 w-full rounded-none border border-input bg-background px-3 text-sm text-foreground"><option value="all">Everyone</option><option value="new_customer">New customers, first order only</option><option value="returning_customer">Returning customers</option><option value="members">Members and trade clients</option></select></div>
        <div className="sm:col-span-2 lg:col-span-3"><label htmlFor="collection-promotion-target-type" className="mb-2 block text-sm font-medium text-foreground">Promotion scope</label><select id="collection-promotion-target-type" value={promotion.targetType} onChange={(event) => setTargetType(event.target.value)} className="min-h-11 w-full rounded-none border border-input bg-background px-3 text-sm text-foreground"><option value="all">All published collection products</option><option value="category">One or more categories</option><option value="subcategory">One or more subcategories</option><option value="collection">Collection URL slug or legacy collection target</option><option value="product">Selected products</option></select><p className="mt-1 text-xs text-muted-foreground">A first-order offer is controlled by the Audience field above. Scope controls which published products can receive the discount.</p></div>

        {scopeUsesTaxonomy && scopeOptions.length > 0 && <div className="sm:col-span-2 lg:col-span-3"><label htmlFor="collection-promotion-taxonomy" className="mb-2 block text-sm font-medium text-foreground">Choose {promotion.targetType === 'category' ? 'categories' : 'subcategories'}</label><select id="collection-promotion-taxonomy" multiple value={selectedValues(promotion.collectionSlugs)} onChange={(event) => setSelectedTargets(Array.from(event.currentTarget.selectedOptions, (option) => option.value))} className="min-h-28 w-full rounded-none border border-input bg-background px-3 py-2 text-sm text-foreground">{scopeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select><p className="mt-1 text-xs text-muted-foreground">Hold or tap multiple options to select more than one. The checkout server matches the selected slugs against the product taxonomy.</p></div>}
        {scopeUsesTaxonomy && scopeOptions.length === 0 && <div className="sm:col-span-2 lg:col-span-3"><label htmlFor="collection-promotion-slugs-fallback" className="mb-2 block text-sm font-medium text-foreground">Category or subcategory slugs</label><Input id="collection-promotion-slugs-fallback" value={promotion.collectionSlugs} onChange={(event) => setPromotion((value) => ({ ...value, collectionSlugs: event.target.value }))} placeholder="living-room, decor, chairs" className="min-h-11 rounded-none" /><p className="mt-1 text-xs text-muted-foreground">{taxonomyError || 'Use exact published category or subcategory slugs separated by commas.'}</p></div>}
        {promotion.targetType === 'collection' && <div className="sm:col-span-2 lg:col-span-3"><label htmlFor="collection-promotion-slugs" className="mb-2 block text-sm font-medium text-foreground">Collection URL slugs</label><Input id="collection-promotion-slugs" value={promotion.collectionSlugs} onChange={(event) => setPromotion((value) => ({ ...value, collectionSlugs: event.target.value }))} placeholder="sofas, dining, lighting" className="min-h-11 rounded-none" /><p className="mt-1 text-xs text-muted-foreground">Use the exact collection, category, or subcategory slugs used by your published catalogue.</p></div>}
        {promotion.targetType === 'product' && <div className="sm:col-span-2 lg:col-span-3"><label htmlFor="collection-promotion-products" className="mb-2 block text-sm font-medium text-foreground">Product IDs</label><Input id="collection-promotion-products" value={promotion.productIds} onChange={(event) => setPromotion((value) => ({ ...value, productIds: event.target.value }))} placeholder="Paste published product UUIDs separated by commas" className="min-h-11 rounded-none" /></div>}

        <div><label htmlFor="collection-promotion-status" className="mb-2 block text-sm font-medium text-foreground">Initial status</label><select id="collection-promotion-status" value={promotion.status} onChange={(event) => setPromotion((value) => ({ ...value, status: event.target.value }))} className="min-h-11 w-full rounded-none border border-input bg-background px-3 text-sm text-foreground"><option value="draft">Draft</option><option value="active">Active now</option><option value="scheduled">Scheduled</option></select></div>
        <div><label htmlFor="collection-promotion-total-limit" className="mb-2 block text-sm font-medium text-foreground">Total uses</label><Input id="collection-promotion-total-limit" inputMode="numeric" value={promotion.totalUsageLimit} onChange={(event) => setPromotion((value) => ({ ...value, totalUsageLimit: event.target.value }))} placeholder="Unlimited" className="min-h-11 rounded-none" /></div>
        <div><label htmlFor="collection-promotion-per-client" className="mb-2 block text-sm font-medium text-foreground">Uses per customer</label><Input id="collection-promotion-per-client" inputMode="numeric" value={promotion.perCustomerLimit} onChange={(event) => setPromotion((value) => ({ ...value, perCustomerLimit: event.target.value }))} className="min-h-11 rounded-none" /></div>
        <div><label htmlFor="collection-promotion-start" className="mb-2 block text-sm font-medium text-foreground">Starts at</label><Input id="collection-promotion-start" type="datetime-local" value={promotion.startsAt} onChange={(event) => setPromotion((value) => ({ ...value, startsAt: event.target.value }))} className="min-h-11 rounded-none" /></div>
        <div><label htmlFor="collection-promotion-end" className="mb-2 block text-sm font-medium text-foreground">Ends at</label><Input id="collection-promotion-end" type="datetime-local" value={promotion.endsAt} onChange={(event) => setPromotion((value) => ({ ...value, endsAt: event.target.value }))} className="min-h-11 rounded-none" /></div>
      </div>

      <label className="mt-5 flex min-h-11 items-center gap-3 text-sm text-foreground"><input type="checkbox" checked={promotion.stackable} onChange={(event) => setPromotion((value) => ({ ...value, stackable: event.target.checked }))} className="size-4" />Allow this code to combine with loyalty points.</label>
      {error && <p role="alert" className="mt-5 rounded border border-rose-300/70 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-400/40 dark:bg-rose-950/40 dark:text-rose-100">{error}</p>}
      <Button type="button" disabled={isPending} onClick={createPromotion} className="mt-5 min-h-11 rounded-none bg-primary text-primary-foreground hover:bg-primary/90"><Plus className="mr-2 size-4" />{saved ? 'Promotion created' : 'Create collection promotion'}</Button>

      <div className="mt-8 space-y-3">{initialPromotions.length === 0 ? <p className="rounded border border-dashed border-border p-5 text-sm text-muted-foreground">No collection promotions yet. Create a campaign above.</p> : initialPromotions.map((row) => <div key={row.id} className="flex flex-col gap-4 rounded-lg border border-border/70 p-4 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><p className="font-medium text-foreground">{row.name}</p><span className="rounded-full bg-muted px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">{row.status}</span></div><p className="mt-1 text-sm text-muted-foreground">{formatPromotion(row)} · {formatAudience(row.audience)} · {formatScope(row)} · {row.stackable ? 'Loyalty stackable' : 'Loyalty excluded'}</p></div><Button type="button" variant="outline" disabled={isPending} onClick={() => changePromotionStatus(row.id, row.status === 'active' ? 'paused' : 'active')} className="min-h-11 shrink-0 rounded-none">{row.status === 'active' ? <Pause className="mr-2 size-4" /> : <Play className="mr-2 size-4" />}{row.status === 'active' ? 'Pause' : 'Activate'}</Button></div>)}</div>
    </section>
  )
}
