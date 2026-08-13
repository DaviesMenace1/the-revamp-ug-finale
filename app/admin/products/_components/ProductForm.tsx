'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Save, 
  Sparkles, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertCircle,
  Package,
  DollarSign,
  Truck,
  Layers,
  Search,
  FileText
} from 'lucide-react'

interface ProductFormProps {
  initialData?: any
  isEdit?: boolean
}

export default function ProductForm({ initialData, isEdit = false }: ProductFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [activeTab, setActiveTab] = useState<'general' | 'pricing' | 'logistics' | 'specs' | 'variants' | 'google' | 'seo'>('general')

  // Form State initialized with defaults or passed data
  const [formData, setFormData] = useState({
    id: initialData?.id || undefined,
    name: initialData?.name || '',
    slug: initialData?.slug || '',
    sku: initialData?.sku || '',
    mpn: initialData?.mpn || '',
    gtin: initialData?.gtin || '',
    brand: initialData?.brand || 'The Revamp UG',
    department: initialData?.department || '01 — Furniture',
    category: initialData?.category || 'Living Room',
    subCategory: initialData?.subCategory || '',
    googleProductCategory: initialData?.googleProductCategory || 'Furniture > Chairs > Armchairs',
    
    price: initialData?.price || '',
    originalPrice: initialData?.originalPrice || '',
    currency: initialData?.currency || 'UGX',
    
    condition: initialData?.condition || 'new',
    availability: initialData?.availability || 'in_stock',
    inStock: initialData?.inStock ?? true,
    quantity: initialData?.quantity || 0,
    leadTime: initialData?.leadTime || '',

    description: initialData?.description || '',
    longDescription: initialData?.longDescription || '',
    
    material: initialData?.material || '',
    finish: initialData?.finish || '',
    careInstructions: initialData?.careInstructions || '',
    whatsIncluded: initialData?.whatsIncluded?.join(', ') || '',
    weight: initialData?.weight || '',
    weightUnit: initialData?.weightUnit || 'kg',
    
    seoTitle: initialData?.seoTitle || '',
    seoDescription: initialData?.seoDescription || '',
    featured: initialData?.featured ?? false,
    status: initialData?.status || 'draft',

    // Variants State
    colors: initialData?.variants?.filter((v: any) => v.type === 'COLOR').map((v: any) => ({
      label: v.label,
      value: v.value,
      images: initialData?.productImages?.filter((img: any) => img.colorId === v.id).map((img: any) => img.url) || []
    })) || [{ label: 'Standard', value: '#1C1C1C', images: [] }],

    fabrics: initialData?.variants?.filter((v: any) => v.type === 'FABRIC').map((v: any) => ({
      label: v.label,
      priceDelta: v.priceDelta || 0
    })) || []
  })

  // Auto-generate Slug & SKU helpers
  const handleNameChange = (name: string) => {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
    const generatedSku = slug ? `REV-${slug.slice(0, 10).toUpperCase()}-001` : ''
    setFormData(prev => ({
      ...prev,
      name,
      slug: isEdit ? prev.slug : slug,
      sku: isEdit ? prev.sku : generatedSku,
      mpn: isEdit ? prev.mpn : generatedSku
    }))
  }

  // Calculate Google Readiness Score
  const calculateGoogleScore = () => {
    let score = 0
    if (formData.name) score += 15
    if (formData.description) score += 15
    if (formData.price) score += 15
    if (formData.sku) score += 10
    if (formData.gtin || formData.mpn) score += 10
    if (formData.brand) score += 10
    if (formData.googleProductCategory) score += 15
    if (formData.availability === 'made_to_order' ? formData.leadTime : true) score += 10
    return score
  }

  const googleScore = calculateGoogleScore()

  // Save / Update Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      try {
        const payload = {
          ...formData,
          whatsIncluded: formData.whatsIncluded.split(',').map((s: string) => s.trim()).filter(Boolean),
          price: String(formData.price),
          originalPrice: formData.originalPrice ? String(formData.originalPrice) : null,
        }

        const res = await fetch('/api/admin/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

        const result = await res.json()
        if (result.success) {
          router.push('/admin/products')
          router.refresh()
        } else {
          alert(`Error saving product: ${result.error}`)
        }
      } catch (err: any) {
        alert(`System error: ${err.message}`)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="min-h-screen bg-stone-50 pb-24 text-stone-800">
      {/* Sticky Header Action Bar */}
      <div className="sticky top-0 z-30 border-b border-stone-200 bg-white/95 px-6 py-4 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/products" className="rounded-lg p-2 text-stone-500 hover:bg-stone-100">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-xl font-semibold text-stone-900">
                {isEdit ? `Edit: ${formData.name || 'Product'}` : 'New Product Entry'}
              </h1>
              <p className="text-xs text-stone-500">UGX Catalog & Google Merchant API Ready</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs font-medium shadow-sm"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>

            <button
              type="submit"
              disabled={isPending}
              className="flex items-center gap-2 rounded-lg bg-stone-900 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-stone-800 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {isPending ? 'Saving...' : isEdit ? 'Update Product' : 'Save Product'}
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-8 max-w-7xl px-6">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          
          {/* Main Form Tabs (8 Columns) */}
          <div className="space-y-6 lg:col-span-8">
            
            {/* Tab Navigation */}
            <div className="flex flex-wrap border-b border-stone-200 bg-white px-4 pt-2 shadow-sm rounded-t-xl">
              {[
                { id: 'general', label: 'General', icon: Package },
                { id: 'pricing', label: 'Pricing & Stock', icon: DollarSign },
                { id: 'logistics', label: 'Logistics', icon: Truck },
                { id: 'specs', label: 'Specifications', icon: FileText },
                { id: 'variants', label: 'Variants', icon: Layers },
                { id: 'google', label: 'Google Merchant', icon: Sparkles },
                { id: 'seo', label: 'SEO & Search', icon: Search },
              ].map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'border-amber-700 text-amber-900'
                        : 'border-transparent text-stone-500 hover:text-stone-800'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                )
              })}
            </div>

            {/* TAB 1: GENERAL */}
            {activeTab === 'general' && (
              <div className="space-y-5 rounded-b-xl border border-t-0 border-stone-200 bg-white p-6 shadow-sm">
                <div>
                  <label className="block text-xs font-semibold text-stone-700">Product Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g. Luna Velvet Lounge Chair"
                    className="mt-1.5 w-full rounded-lg border border-stone-300 p-2.5 text-sm focus:border-amber-600 focus:outline-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700">URL Slug *</label>
                    <input
                      type="text"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      className="mt-1.5 w-full rounded-lg border border-stone-300 p-2.5 text-sm font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-700">Brand Name</label>
                    <input
                      type="text"
                      value={formData.brand}
                      onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                      className="mt-1.5 w-full rounded-lg border border-stone-300 p-2.5 text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700">Department</label>
                    <input
                      type="text"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      className="mt-1.5 w-full rounded-lg border border-stone-300 p-2.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-700">Category *</label>
                    <input
                      type="text"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="mt-1.5 w-full rounded-lg border border-stone-300 p-2.5 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-700">Sub-Category</label>
                    <input
                      type="text"
                      value={formData.subCategory}
                      onChange={(e) => setFormData({ ...formData, subCategory: e.target.value })}
                      className="mt-1.5 w-full rounded-lg border border-stone-300 p-2.5 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700">Short Summary</label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="mt-1.5 w-full rounded-lg border border-stone-300 p-2.5 text-sm"
                  />
                </div>
              </div>
            )}

            {/* TAB 2: PRICING & STOCK */}
            {activeTab === 'pricing' && (
              <div className="space-y-5 rounded-b-xl border border-t-0 border-stone-200 bg-white p-6 shadow-sm">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700">Price (UGX) *</label>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      placeholder="e.g. 2500000"
                      className="mt-1.5 w-full rounded-lg border border-stone-300 p-2.5 text-sm font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-700">Original / Compare-At Price</label>
                    <input
                      type="number"
                      value={formData.originalPrice}
                      onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                      className="mt-1.5 w-full rounded-lg border border-stone-300 p-2.5 text-sm font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-700">Currency</label>
                    <input
                      type="text"
                      disabled
                      value={formData.currency}
                      className="mt-1.5 w-full rounded-lg border border-stone-200 bg-stone-100 p-2.5 text-sm font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700">Stock Quantity</label>
                    <input
                      type="number"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                      className="mt-1.5 w-full rounded-lg border border-stone-300 p-2.5 text-sm"
                    />
                  </div>
                  <div className="flex items-center gap-3 pt-6">
                    <input
                      type="checkbox"
                      id="inStock"
                      checked={formData.inStock}
                      onChange={(e) => setFormData({ ...formData, inStock: e.target.checked })}
                      className="h-4 w-4 rounded border-stone-300 text-amber-700"
                    />
                    <label htmlFor="inStock" className="text-xs font-semibold text-stone-700">Available for Immediate Sale</label>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: LOGISTICS */}
            {activeTab === 'logistics' && (
              <div className="space-y-5 rounded-b-xl border border-t-0 border-stone-200 bg-white p-6 shadow-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700">Availability Status</label>
                    <select
                      value={formData.availability}
                      onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
                      className="mt-1.5 w-full rounded-lg border border-stone-300 p-2.5 text-sm"
                    >
                      <option value="in_stock">In Stock (Ready to Ship)</option>
                      <option value="made_to_order">Made to Order (Crafting Required)</option>
                      <option value="pre_order">Pre-Order</option>
                      <option value="out_of_stock">Out of Stock</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700">Lead Time / Production Window</label>
                    <input
                      type="text"
                      value={formData.leadTime}
                      onChange={(e) => setFormData({ ...formData, leadTime: e.target.value })}
                      placeholder="e.g. 4–6 weeks"
                      className="mt-1.5 w-full rounded-lg border border-stone-300 p-2.5 text-sm"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: SPECS */}
            {activeTab === 'specs' && (
              <div className="space-y-5 rounded-b-xl border border-t-0 border-stone-200 bg-white p-6 shadow-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700">Primary Material</label>
                    <input
                      type="text"
                      value={formData.material}
                      onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                      placeholder="e.g. Teak Wood, Brass"
                      className="mt-1.5 w-full rounded-lg border border-stone-300 p-2.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-700">Finish Detail</label>
                    <input
                      type="text"
                      value={formData.finish}
                      onChange={(e) => setFormData({ ...formData, finish: e.target.value })}
                      placeholder="e.g. Matte Oil Finish"
                      className="mt-1.5 w-full rounded-lg border border-stone-300 p-2.5 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700">What's Included (Comma-Separated)</label>
                  <input
                    type="text"
                    value={formData.whatsIncluded}
                    onChange={(e) => setFormData({ ...formData, whatsIncluded: e.target.value })}
                    placeholder="1x Lounge Chair, 2x Accent Cushions"
                    className="mt-1.5 w-full rounded-lg border border-stone-300 p-2.5 text-sm"
                  />
                </div>
              </div>
            )}

            {/* TAB 5: GOOGLE MERCHANT */}
            {activeTab === 'google' && (
              <div className="space-y-5 rounded-b-xl border border-t-0 border-stone-200 bg-white p-6 shadow-sm">
                <div>
                  <label className="block text-xs font-semibold text-stone-700">Google Product Taxonomy Category</label>
                  <input
                    type="text"
                    value={formData.googleProductCategory}
                    onChange={(e) => setFormData({ ...formData, googleProductCategory: e.target.value })}
                    className="mt-1.5 w-full rounded-lg border border-stone-300 p-2.5 text-sm font-mono"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700">SKU *</label>
                    <input
                      type="text"
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                      className="mt-1.5 w-full rounded-lg border border-stone-300 p-2.5 text-sm font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-700">MPN</label>
                    <input
                      type="text"
                      value={formData.mpn}
                      onChange={(e) => setFormData({ ...formData, mpn: e.target.value })}
                      className="mt-1.5 w-full rounded-lg border border-stone-300 p-2.5 text-sm font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-700">GTIN / Barcode</label>
                    <input
                      type="text"
                      value={formData.gtin}
                      onChange={(e) => setFormData({ ...formData, gtin: e.target.value })}
                      className="mt-1.5 w-full rounded-lg border border-stone-300 p-2.5 text-sm font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 6: VARIANTS */}
            {activeTab === 'variants' && (
              <div className="space-y-6 rounded-b-xl border border-t-0 border-stone-200 bg-white p-6 shadow-sm">
                <div>
                  <h3 className="text-sm font-semibold text-stone-900">Color Options & Image Swatches</h3>
                  {formData.colors.map((color: any, idx: number) => (
                    <div key={idx} className="mt-3 flex items-center gap-3 rounded-lg border border-stone-200 p-3">
                      <input
                        type="text"
                        placeholder="Color Name (e.g. Charcoal)"
                        value={color.label}
                        onChange={(e) => {
                          const updated = [...formData.colors]
                          updated[idx].label = e.target.value
                          setFormData({ ...formData, colors: updated })
                        }}
                        className="rounded border border-stone-300 p-2 text-xs"
                      />
                      <input
                        type="color"
                        value={color.value}
                        onChange={(e) => {
                          const updated = [...formData.colors]
                          updated[idx].value = e.target.value
                          setFormData({ ...formData, colors: updated })
                        }}
                        className="h-8 w-12 cursor-pointer rounded border border-stone-300 p-0"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 7: SEO */}
            {activeTab === 'seo' && (
              <div className="space-y-5 rounded-b-xl border border-t-0 border-stone-200 bg-white p-6 shadow-sm">
                <div>
                  <label className="block text-xs font-semibold text-stone-700">SEO Title</label>
                  <input
                    type="text"
                    value={formData.seoTitle}
                    onChange={(e) => setFormData({ ...formData, seoTitle: e.target.value })}
                    className="mt-1.5 w-full rounded-lg border border-stone-300 p-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700">SEO Meta Description</label>
                  <textarea
                    rows={3}
                    value={formData.seoDescription}
                    onChange={(e) => setFormData({ ...formData, seoDescription: e.target.value })}
                    className="mt-1.5 w-full rounded-lg border border-stone-300 p-2.5 text-sm"
                  />
                </div>
              </div>
            )}

          </div>

          {/* Sidebar Widgets (4 Columns) */}
          <div className="space-y-6 lg:col-span-4">
            
            {/* Google Merchant Readiness Scorecard Widget */}
            <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                  Google Merchant Readiness
                </h3>
                <Sparkles className="h-4 w-4 text-amber-700" />
              </div>

              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-bold text-stone-900">{googleScore}%</span>
                <span className="text-xs text-stone-500">Feed Compliance</span>
              </div>

              <div className="mt-2 h-2.5 w-full rounded-full bg-stone-100">
                <div
                  className={`h-2.5 rounded-full transition-all duration-300 ${
                    googleScore > 80 ? 'bg-emerald-600' : googleScore > 50 ? 'bg-amber-600' : 'bg-rose-600'
                  }`}
                  style={{ width: `${googleScore}%` }}
                />
              </div>

              <div className="mt-5 space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  {formData.name ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <AlertCircle className="h-4 w-4 text-amber-600" />}
                  <span className={formData.name ? 'text-stone-700' : 'text-stone-400'}>Product Title</span>
                </div>
                <div className="flex items-center gap-2">
                  {formData.price ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <AlertCircle className="h-4 w-4 text-amber-600" />}
                  <span className={formData.price ? 'text-stone-700' : 'text-stone-400'}>Price (UGX)</span>
                </div>
                <div className="flex items-center gap-2">
                  {formData.sku ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <AlertCircle className="h-4 w-4 text-amber-600" />}
                  <span className={formData.sku ? 'text-stone-700' : 'text-stone-400'}>Unique SKU</span>
                </div>
                <div className="flex items-center gap-2">
                  {formData.googleProductCategory ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <AlertCircle className="h-4 w-4 text-amber-600" />}
                  <span className={formData.googleProductCategory ? 'text-stone-700' : 'text-stone-400'}>Google Category</span>
                </div>
              </div>
            </div>

            {/* Visibility Settings */}
            <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                Visibility & Promotion
              </h3>

              <div className="mt-4 flex items-center gap-3">
                <input
                  type="checkbox"
                  id="featured"
                  checked={formData.featured}
                  onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                  className="h-4 w-4 rounded border-stone-300 text-amber-700"
                />
                <label htmlFor="featured" className="text-xs font-semibold text-stone-700">
                  Feature on Storefront Homepage
                </label>
              </div>
            </div>

          </div>

        </div>
      </div>
    </form>
  )
}
