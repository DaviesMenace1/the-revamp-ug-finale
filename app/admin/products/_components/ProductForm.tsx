'use client'

import React, { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { CldUploadWidget } from 'next-cloudinary'
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
  Layers,
  Search,
  FileText,
  Upload,
  X,
  Image as ImageIcon
} from '@/components/ui/luxury-icons'

// Cascading Google Taxonomy Categories Data Structure
const GOOGLE_TAXONOMY_TREE: Record<string, Record<string, string[]>> = {
  "Furniture": {
    "Chairs": [
      "Furniture > Chairs > Armchairs, Recliners & Tilt Chairs",
      "Furniture > Chairs > Accent Chairs",
      "Furniture > Chairs > Kitchen & Dining Room Chairs",
      "Furniture > Chairs > Benches & Stools"
    ],
    "Tables": [
      "Furniture > Tables > Coffee Tables",
      "Furniture > Tables > Dining Room Tables",
      "Furniture > Tables > End Tables & Accent Tables",
      "Furniture > Tables > Desks"
    ],
    "Sofas & Couches": [
      "Furniture > Sofas",
      "Furniture > Sectional Sofas",
      "Furniture > Daybeds & Chaises"
    ],
    "Beds & Bedroom": [
      "Furniture > Beds & Accessories > Beds & Bed Frames",
      "Furniture > Beds & Accessories > Headboards",
      "Furniture > Nightstands"
    ],
    "Storage & Cabinets": [
      "Furniture > Cabinets & Storage > Credenzas & Sideboards",
      "Furniture > Shelving > Bookcases"
    ]
  },
  "Home & Garden": {
    "Decor": [
      "Home & Garden > Decor > Mirrors",
      "Home & Garden > Decor > Rugs",
      "Home & Garden > Decor > Artwork & Wall Hangings"
    ],
    "Lighting": [
      "Home & Garden > Lighting > Table Lamps",
      "Home & Garden > Lighting > Floor Lamps",
      "Home & Garden > Lighting > Chandeliers"
    ]
  }
}

interface ProductFormProps {
  initialData?: any
  isEdit?: boolean
}

export default function ProductForm({ initialData, isEdit = false }: ProductFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [activeTab, setActiveTab] = useState<'general' | 'media' | 'pricing' | 'specs' | 'variants' | 'google' | 'seo'>('general')

  // ---- SAFE EXTRACTION (never call .map on non-arrays) ----

  const productImagesArr: any[] = Array.isArray(initialData?.productImages)
    ? initialData.productImages
    : []

  const productVariantsArr: any[] = Array.isArray(initialData?.productVariants)
    ? initialData.productVariants
    : Array.isArray(initialData?.variants)
    ? initialData.variants
    : []

  const initialPrimaryImage =
    productImagesArr.find((img) => img.isPrimary)?.url ||
    productImagesArr[0]?.url ||
    initialData?.thumbnailImage ||
    ''

  const initialGalleryImages: string[] = productImagesArr
    .filter((img) => !img.isPrimary && img.url !== initialPrimaryImage)
    .map((img) => img.url)
    .filter(Boolean)

  const initialColors =
    productVariantsArr
      .filter((v) => v.type === 'COLOR')
      .map((v) => ({
        label: v.label || '',
        value: v.value || '#000000',
        imageUrl: v.imageUrl || '',
      }))

  const safeInitialColors =
    initialColors.length > 0
      ? initialColors
      : [{ label: 'Standard Mahogany', value: '#5C4033', imageUrl: '' }]

  const initialFabrics =
    productVariantsArr
      .filter((v) => v.type === 'FABRIC')
      .map((v) => ({
        label: v.label || '',
        priceDelta: Number(v.priceDelta || 0),
        imageUrl: v.imageUrl || '',
      }))

  // Google Cascading Dropdowns State
  const [gLevel1, setGLevel1] = useState<string>(initialData?.googleProductCategory ? 'Furniture' : '')
  const [gLevel2, setGLevel2] = useState<string>('')

  // Consolidated Form State
  const [formData, setFormData] = useState({
    id: initialData?.id || undefined,
    name: initialData?.name || '',
    slug: initialData?.slug || '',
    sku: initialData?.sku || '',
    mpn: initialData?.mpn || '',
    gtin: initialData?.gtin || '',
    brand: initialData?.brand || 'The Revamp UG',
    department: initialData?.department || '01: Furniture',
    category: initialData?.category || 'Living Room',
    subCategory: initialData?.subCategory || '',
    googleProductCategory: initialData?.googleProductCategory || 'Furniture > Chairs > Armchairs, Recliners & Tilt Chairs',

    // Media State
    thumbnailImage: initialPrimaryImage,
       gallery: initialGalleryImages.length > 0 ? initialGalleryImages : [],

    price: initialData?.price || '',
    originalPrice: initialData?.originalPrice || '',
    currency: initialData?.currency || 'UGX',
    weight: initialData?.weight || '',
    weightUnit: initialData?.weightUnit || 'kg',

    condition: initialData?.condition || 'new',
    availability: initialData?.availability || 'in_stock',
    inStock: initialData?.inStock ?? true,
    quantity: initialData?.quantity || 0,
    leadTime: initialData?.leadTime || '',

    description: initialData?.description || '',
    longDescription: initialData?.longDescription || '',

    material: initialData?.material || '',
    materialSwatchUrl: initialData?.materialSwatchUrl || '',
    finish: initialData?.finish || '',
    careInstructions: initialData?.careInstructions || '',
    whatsIncluded: Array.isArray(initialData?.whatsIncluded)
      ? initialData.whatsIncluded.join(', ')
      : (initialData?.whatsIncluded || ''),

    seoTitle: initialData?.seoTitle || '',
    seoDescription: initialData?.seoDescription || '',
    featured: initialData?.featured ?? false,
    status: initialData?.status || 'draft',

    colors: safeInitialColors,
    fabrics: initialFabrics,
  })

  // Auto-generate Slug & SKU on Name Change
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

  // Calculate Google Merchant Compliance Score
  const calculateGoogleScore = () => {
    let score = 0
    if (formData.name) score += 15
    if (formData.description) score += 15
    if (formData.price) score += 15
    if (formData.thumbnailImage) score += 15
    if (formData.weight && Number(formData.weight) > 0) score += 10
    if (formData.sku) score += 10
    if (formData.brand) score += 5
    if (formData.googleProductCategory) score += 15
    return score
  }

  const googleScore = calculateGoogleScore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      try {
        const payload = {
          ...formData,
          whatsIncluded: typeof formData.whatsIncluded === 'string'
            ? formData.whatsIncluded.split(',').map((s: string) => s.trim()).filter(Boolean)
            : formData.whatsIncluded,
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
      {/* Top Bar */}
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
              <p className="text-xs text-stone-500">UGX Catalog & Cloudinary Media Ready</p>
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

          <div className="space-y-6 lg:col-span-8">

            {/* Tab Navigation */}
            <div className="flex flex-wrap border-b border-stone-200 bg-white px-4 pt-2 shadow-sm rounded-t-xl">
              {[
                { id: 'general', label: 'General', icon: Package },
                { id: 'media', label: 'Images & Gallery', icon: ImageIcon },
                { id: 'pricing', label: 'Pricing & Stock', icon: DollarSign },
                { id: 'specs', label: 'Specs & Material', icon: FileText },
                { id: 'variants', label: 'Swatches & Variants', icon: Layers },
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
                    placeholder="e.g. Luna Mahogany Lounge Chair"
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

                <div>
                  <label className="block text-xs font-semibold text-stone-700">Description</label>
                  <textarea
                    rows={4}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="mt-1.5 w-full rounded-lg border border-stone-300 p-2.5 text-sm"
                  />
                </div>
              </div>
            )}

            {/* TAB 2: MEDIA (CLOUDINARY) */}
            {activeTab === 'media' && (
              <div className="space-y-6 rounded-b-xl border border-t-0 border-stone-200 bg-white p-6 shadow-sm">

                {/* Primary Cover Upload */}
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-2">Primary Cover / Thumbnail Image *</label>
                  {formData.thumbnailImage ? (
                    <div className="relative h-48 w-48 overflow-hidden rounded-xl border border-stone-300 bg-stone-100">
                      <img src={formData.thumbnailImage} alt="Main Preview" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, thumbnailImage: '' })}
                        className="absolute right-2 top-2 rounded-full bg-rose-600 p-1.5 text-white shadow-md hover:bg-rose-700"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <CldUploadWidget
                      uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
                      onSuccess={(result: any) => {
                        const url = result?.info?.secure_url
                        if (url) setFormData((prev) => ({ ...prev, thumbnailImage: url }))
                      }}
                    >
                      {({ open }) => (
                        <button
                          type="button"
                          onClick={() => open()}
                          className="flex h-40 w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-stone-300 bg-stone-50 hover:bg-stone-100 transition-colors"
                        >
                          <Upload className="h-6 w-6 text-stone-400" />
                          <span className="mt-2 text-xs font-semibold text-stone-600">Upload Cover Image via Cloudinary</span>
                        </button>
                      )}
                    </CldUploadWidget>
                  )}
                </div>

                <hr className="border-stone-200" />

                {/* Gallery Upload */}
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-2">Product Gallery Images</label>
                  <div className="grid grid-cols-4 gap-4">
                    {(Array.isArray(formData.gallery) ? formData.gallery : []).map((imgUrl, idx) => (
                      <div key={idx} className="relative h-28 w-full overflow-hidden rounded-lg border border-stone-200 bg-stone-50">
                        <img src={imgUrl} alt={`Gallery ${idx}`} className="h-full w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => {
                            const updated = formData.gallery.filter((_, i) => i !== idx)
                            setFormData({ ...formData, gallery: updated })
                          }}
                          className="absolute right-1 top-1 rounded-full bg-rose-600 p-1 text-white hover:bg-rose-700"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}

                    <CldUploadWidget
                      uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
                      onSuccess={(result: any) => {
                        const url = result?.info?.secure_url
                        if (url) setFormData((prev) => ({ ...prev, gallery: [...prev.gallery, url] }))
                      }}
                    >
                      {({ open }) => (
                        <button
                          type="button"
                          onClick={() => open()}
                          className="flex h-28 w-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-stone-300 bg-stone-50 hover:bg-stone-100"
                        >
                          <Plus className="h-5 w-5 text-stone-400" />
                          <span className="text-[10px] font-semibold text-stone-500 mt-1">Add Image</span>
                        </button>
                      )}
                    </CldUploadWidget>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: PRICING */}
            {activeTab === 'pricing' && (
              <div className="space-y-5 rounded-b-xl border border-t-0 border-stone-200 bg-white p-6 shadow-sm">
                <div className="grid grid-cols-2 gap-4">
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
                    <label className="block text-xs font-semibold text-stone-700">Original Price (Strike-through)</label>
                    <input
                      type="number"
                      value={formData.originalPrice}
                      onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                      className="mt-1.5 w-full rounded-lg border border-stone-300 p-2.5 text-sm font-mono"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700">Shipping weight *</label>
                    <input type="number" min="0.001" step="0.001" value={formData.weight} onChange={(e) => setFormData({ ...formData, weight: e.target.value })} placeholder="e.g. 12.500" className="mt-1.5 w-full rounded-lg border border-stone-300 p-2.5 text-sm font-mono" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-700">Weight unit *</label>
                    <select value={formData.weightUnit} onChange={(e) => setFormData({ ...formData, weightUnit: e.target.value })} className="mt-1.5 w-full rounded-lg border border-stone-300 bg-white p-2.5 text-sm">
                      <option value="kg">Kilograms (kg)</option><option value="g">Grams (g)</option><option value="lb">Pounds (lb)</option><option value="oz">Ounces (oz)</option>
                    </select>
                  </div>
                </div>
                <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-900">Google Merchant readiness: {googleScore}%. A real cover image, valid shipping weight, brand, SKU, category, description, and price are required before API sync.</p>
              </div>
            )}

            {/* TAB 4: SPECS & MATERIAL */}
            {activeTab === 'specs' && (
              <div className="space-y-5 rounded-b-xl border border-t-0 border-stone-200 bg-white p-6 shadow-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700">Primary Material Name</label>
                    <input
                      type="text"
                      value={formData.material}
                      onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                      placeholder="e.g. Solid Ugandan Mahogany Wood"
                      className="mt-1.5 w-full rounded-lg border border-stone-300 p-2.5 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700">Material Texture Swatch</label>
                    <div className="mt-1.5 flex items-center gap-3">
                      {formData.materialSwatchUrl ? (
                        <div className="relative h-12 w-12 rounded-lg border border-stone-300 overflow-hidden">
                          <img src={formData.materialSwatchUrl} alt="Material Swatch" className="h-full w-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, materialSwatchUrl: '' })}
                            className="absolute right-0 top-0 bg-rose-600 p-0.5 text-white"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <CldUploadWidget
                          uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
                          onSuccess={(result: any) => {
                            const url = result?.info?.secure_url
                            if (url) setFormData((prev) => ({ ...prev, materialSwatchUrl: url }))
                          }}
                        >
                          {({ open }) => (
                            <button
                              type="button"
                              onClick={() => open()}
                              className="flex h-12 flex-1 items-center justify-center rounded-lg border border-dashed border-stone-300 bg-stone-50 px-3 hover:bg-stone-100"
                            >
                              <Upload className="h-4 w-4 text-stone-400 mr-2" />
                              <span className="text-xs text-stone-600">Upload Swatch</span>
                            </button>
                          )}
                        </CldUploadWidget>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700">What's Included (Comma separated)</label>
                  <input
                    type="text"
                    value={formData.whatsIncluded}
                    onChange={(e) => setFormData({ ...formData, whatsIncluded: e.target.value })}
                    placeholder="e.g. 1 x Dining Table, 6 x Cushioned Chairs"
                    className="mt-1.5 w-full rounded-lg border border-stone-300 p-2.5 text-sm"
                  />
                </div>
              </div>
            )}

            {/* TAB 5: VARIANTS & SWATCHES */}
            {activeTab === 'variants' && (
              <div className="space-y-6 rounded-b-xl border border-t-0 border-stone-200 bg-white p-6 shadow-sm">

                {/* COLOR SWATCHES */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-700">Color Swatch Options</h3>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, colors: [...formData.colors, { label: '', value: '#000000', imageUrl: '' }] })}
                      className="flex items-center gap-1 text-xs font-semibold text-amber-800 hover:text-amber-900"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add Color Option
                    </button>
                  </div>

                  {(Array.isArray(formData.colors) ? formData.colors : []).map((color, idx) => (
                    <div key={idx} className="mt-3 flex items-center gap-3 rounded-lg border border-stone-200 p-3 bg-stone-50">
                      <input
                        type="text"
                        placeholder="Color Name (e.g. Amber Teak)"
                        value={color.label}
                        onChange={(e) => {
                          const updated = [...formData.colors]
                          updated[idx].label = e.target.value
                          setFormData({ ...formData, colors: updated })
                        }}
                        className="flex-1 rounded border border-stone-300 p-2 text-xs"
                      />

                      <input
                        type="color"
                        value={color.value}
                        onChange={(e) => {
                          const updated = [...formData.colors]
                          updated[idx].value = e.target.value
                          setFormData({ ...formData, colors: updated })
                        }}
                        className="h-9 w-12 cursor-pointer rounded border border-stone-300 p-0"
                      />

                      <div className="flex items-center gap-2">
                        {color.imageUrl ? (
                          <div className="relative h-9 w-9 rounded border border-stone-300 overflow-hidden">
                            <img src={color.imageUrl} alt="Variant" className="h-full w-full object-cover" />
                            <button
                              type="button"
                              onClick={() => {
                                const updated = [...formData.colors]
                                updated[idx].imageUrl = ''
                                setFormData({ ...formData, colors: updated })
                              }}
                              className="absolute right-0 top-0 bg-rose-600 p-0.5 text-white"
                            >
                              <X className="h-2.5 w-2.5" />
                            </button>
                          </div>
                        ) : (
                          <CldUploadWidget
                            uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
                            onSuccess={(result: any) => {
                              const url = result?.info?.secure_url
                              if (url) {
                                const updated = [...formData.colors]
                                updated[idx].imageUrl = url
                                setFormData({ ...formData, colors: updated })
                              }
                            }}
                          >
                            {({ open }) => (
                              <button
                                type="button"
                                onClick={() => open()}
                                className="flex h-9 items-center rounded border border-stone-300 bg-white px-2.5 text-[11px] font-medium text-stone-600 hover:bg-stone-100"
                              >
                                <Upload className="h-3 w-3 mr-1" /> Image
                              </button>
                            )}
                          </CldUploadWidget>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          const updated = formData.colors.filter((_, i) => i !== idx)
                          setFormData({ ...formData, colors: updated })
                        }}
                        className="text-stone-400 hover:text-rose-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <hr className="border-stone-200" />

                {/* FABRIC SWATCHES */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-700">Fabric & Upholstery Options</h3>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, fabrics: [...formData.fabrics, { label: '', priceDelta: 0, imageUrl: '' }] })}
                      className="flex items-center gap-1 text-xs font-semibold text-amber-800 hover:text-amber-900"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add Fabric Option
                    </button>
                  </div>

                  {(Array.isArray(formData.fabrics) ? formData.fabrics : []).map((fabric, idx) => (
                    <div key={idx} className="mt-3 flex items-center gap-3 rounded-lg border border-stone-200 p-3 bg-stone-50">
                      <input
                        type="text"
                        placeholder="Fabric Name (e.g. Royal Emerald Velvet)"
                        value={fabric.label}
                        onChange={(e) => {
                          const updated = [...formData.fabrics]
                          updated[idx].label = e.target.value
                          setFormData({ ...formData, fabrics: updated })
                        }}
                        className="flex-1 rounded border border-stone-300 p-2 text-xs"
                      />

                      <input
                        type="number"
                        placeholder="Extra Cost (UGX)"
                        value={fabric.priceDelta}
                        onChange={(e) => {
                          const updated = [...formData.fabrics]
                          updated[idx].priceDelta = Number(e.target.value)
                          setFormData({ ...formData, fabrics: updated })
                        }}
                        className="w-32 rounded border border-stone-300 p-2 text-xs font-mono"
                      />

                      <div className="flex items-center gap-2">
                        {fabric.imageUrl ? (
                          <div className="relative h-9 w-9 rounded border border-stone-300 overflow-hidden">
                            <img src={fabric.imageUrl} alt="Fabric" className="h-full w-full object-cover" />
                            <button
                              type="button"
                              onClick={() => {
                                const updated = [...formData.fabrics]
                                updated[idx].imageUrl = ''
                                setFormData({ ...formData, fabrics: updated })
                              }}
                              className="absolute right-0 top-0 bg-rose-600 p-0.5 text-white"
                            >
                              <X className="h-2.5 w-2.5" />
                            </button>
                          </div>
                        ) : (
                          <CldUploadWidget
                            uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
                            onSuccess={(result: any) => {
                              const url = result?.info?.secure_url
                              if (url) {
                                const updated = [...formData.fabrics]
                                updated[idx].imageUrl = url
                                setFormData({ ...formData, fabrics: updated })
                              }
                            }}
                          >
                            {({ open }) => (
                              <button
                                type="button"
                                onClick={() => open()}
                                className="flex h-9 items-center rounded border border-stone-300 bg-white px-2.5 text-[11px] font-medium text-stone-600 hover:bg-stone-100"
                              >
                                <Upload className="h-3 w-3 mr-1" /> Swatch
                              </button>
                            )}
                          </CldUploadWidget>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          const updated = formData.fabrics.filter((_, i) => i !== idx)
                          setFormData({ ...formData, fabrics: updated })
                        }}
                        className="text-stone-400 hover:text-rose-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>

              </div>
            )}

            {/* TAB 6: CASCADING GOOGLE MERCHANT CATEGORIES */}
            {activeTab === 'google' && (
              <div className="space-y-5 rounded-b-xl border border-t-0 border-stone-200 bg-white p-6 shadow-sm">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Google Merchant Taxonomy Cascading Selector
                  </label>
                  <p className="text-xs text-stone-500 mb-4">
                    Select department and group to populate compliant canonical category strings.
                  </p>

                  <div className="grid grid-cols-3 gap-3">
                    {/* Tier 1 Dropdown */}
                    <div>
                      <label className="block text-[11px] font-medium text-stone-500 mb-1">1. Department</label>
                      <select
                        value={gLevel1}
                        onChange={(e) => {
                          setGLevel1(e.target.value)
                          setGLevel2('')
                        }}
                        className="w-full rounded-lg border border-stone-300 p-2.5 text-xs"
                      >
                        <option value="">Select Department...</option>
                        {Object.keys(GOOGLE_TAXONOMY_TREE).map((dept) => (
                          <option key={dept} value={dept}>{dept}</option>
                        ))}
                      </select>
                    </div>

                    {/* Tier 2 Dropdown */}
                    <div>
                      <label className="block text-[11px] font-medium text-stone-500 mb-1">2. Furniture Group</label>
                      <select
                        disabled={!gLevel1}
                        value={gLevel2}
                        onChange={(e) => setGLevel2(e.target.value)}
                        className="w-full rounded-lg border border-stone-300 p-2.5 text-xs disabled:bg-stone-100"
                      >
                        <option value="">Select Group...</option>
                        {gLevel1 && Object.keys(GOOGLE_TAXONOMY_TREE[gLevel1] || {}).map((group) => (
                          <option key={group} value={group}>{group}</option>
                        ))}
                      </select>
                    </div>

                    {/* Tier 3 Dropdown */}
                    <div>
                      <label className="block text-[11px] font-medium text-stone-500 mb-1">3. Canonical Google Category</label>
                      <select
                        disabled={!gLevel2}
                        value={formData.googleProductCategory}
                        onChange={(e) => setFormData({ ...formData, googleProductCategory: e.target.value })}
                        className="w-full rounded-lg border border-stone-300 p-2.5 text-xs disabled:bg-stone-100"
                      >
                        <option value="">Select Category...</option>
                        {gLevel1 && gLevel2 && GOOGLE_TAXONOMY_TREE[gLevel1][gLevel2]?.map((cat) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="mt-4 rounded-lg bg-stone-100 p-3 border border-stone-200">
                    <p className="text-[11px] text-stone-500">Active Selected Taxonomy String:</p>
                    <p className="text-xs font-mono font-semibold text-stone-800 mt-0.5">
                      {formData.googleProductCategory || 'None Selected'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
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
                    <label className="block text-xs font-semibold text-stone-700">MPN / Model Number</label>
                    <input
                      type="text"
                      value={formData.mpn}
                      onChange={(e) => setFormData({ ...formData, mpn: e.target.value })}
                      className="mt-1.5 w-full rounded-lg border border-stone-300 p-2.5 text-sm font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 7: SEO */}
            {activeTab === 'seo' && (
              <div className="space-y-5 rounded-b-xl border border-t-0 border-stone-200 bg-white p-6 shadow-sm">
                <div>
                  <label className="block text-xs font-semibold text-stone-700">SEO Meta Title</label>
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

          {/* Right Sidebar Widget */}
          <div className="space-y-6 lg:col-span-4">
            <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                  Merchant Scorecard
                </h3>
                <Sparkles className="h-4 w-4 text-amber-700" />
              </div>

              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-bold text-stone-900">{googleScore}%</span>
                <span className="text-xs text-stone-500">Compliance</span>
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
                  {formData.thumbnailImage ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <AlertCircle className="h-4 w-4 text-amber-600" />}
                  <span className={formData.thumbnailImage ? 'text-stone-700' : 'text-stone-400'}>Main Cover Image</span>
                </div>
                <div className="flex items-center gap-2">
                  {formData.googleProductCategory ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <AlertCircle className="h-4 w-4 text-amber-600" />}
                  <span className={formData.googleProductCategory ? 'text-stone-700' : 'text-stone-400'}>Google Taxonomy Category</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </form>
  )
}





// 'use client'

// import { useState, useTransition } from 'react'
// import { useRouter } from 'next/navigation'
// import Link from 'next/link'
// import {
//   ArrowLeft,
//   Save,
//   Sparkles,
//   Plus,
//   Trash2,
//   CheckCircle2,
//   AlertCircle,
//   Package,
//   DollarSign,
//   Truck,
//   Layers,
//   Search,
//   FileText
// } from '@/components/ui/luxury-icons'

// interface ProductFormProps {
//   initialData?: any
//   isEdit?: boolean
// }

// export default function ProductForm({ initialData, isEdit = false }: ProductFormProps) {
//   const router = useRouter()
//   const [isPending, startTransition] = useTransition()
//   const [activeTab, setActiveTab] = useState<'general' | 'pricing' | 'logistics' | 'specs' | 'variants' | 'google' | 'seo'>('general')

//   // Form State initialized with defaults or passed data
//   const [formData, setFormData] = useState({
//     id: initialData?.id || undefined,
//     name: initialData?.name || '',
//     slug: initialData?.slug || '',
//     sku: initialData?.sku || '',
//     mpn: initialData?.mpn || '',
//     gtin: initialData?.gtin || '',
//     brand: initialData?.brand || 'The Revamp UG',
//     department: initialData?.department || '01: Furniture',
//     category: initialData?.category || 'Living Room',
//     subCategory: initialData?.subCategory || '',
//     googleProductCategory: initialData?.googleProductCategory || 'Furniture > Chairs > Armchairs',

//     price: initialData?.price || '',
//     originalPrice: initialData?.originalPrice || '',
//     currency: initialData?.currency || 'UGX',

//     condition: initialData?.condition || 'new',
//     availability: initialData?.availability || 'in_stock',
//     inStock: initialData?.inStock ?? true,
//     quantity: initialData?.quantity || 0,
//     leadTime: initialData?.leadTime || '',

//     description: initialData?.description || '',
//     longDescription: initialData?.longDescription || '',

//     material: initialData?.material || '',
//     finish: initialData?.finish || '',
//     careInstructions: initialData?.careInstructions || '',
//     whatsIncluded: initialData?.whatsIncluded?.join(', ') || '',
//     weight: initialData?.weight || '',
//     weightUnit: initialData?.weightUnit || 'kg',

//     seoTitle: initialData?.seoTitle || '',
//     seoDescription: initialData?.seoDescription || '',
//     featured: initialData?.featured ?? false,
//     status: initialData?.status || 'draft',

//     // Variants State
//     colors: initialData?.variants?.filter((v: any) => v.type === 'COLOR').map((v: any) => ({
//       label: v.label,
//       value: v.value,
//       images: initialData?.productImages?.filter((img: any) => img.colorId === v.id).map((img: any) => img.url) || []
//     })) || [{ label: 'Standard', value: '#1C1C1C', images: [] }],

//     fabrics: initialData?.variants?.filter((v: any) => v.type === 'FABRIC').map((v: any) => ({
//       label: v.label,
//       priceDelta: v.priceDelta || 0
//     })) || []
//   })

//   // Auto-generate Slug & SKU helpers
//   const handleNameChange = (name: string) => {
//     const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
//     const generatedSku = slug ? `REV-${slug.slice(0, 10).toUpperCase()}-001` : ''
//     setFormData(prev => ({
//       ...prev,
//       name,
//       slug: isEdit ? prev.slug : slug,
//       sku: isEdit ? prev.sku : generatedSku,
//       mpn: isEdit ? prev.mpn : generatedSku
//     }))
//   }

//   // Calculate Google Readiness Score
//   const calculateGoogleScore = () => {
//     let score = 0
//     if (formData.name) score += 15
//     if (formData.description) score += 15
//     if (formData.price) score += 15
//     if (formData.sku) score += 10
//     if (formData.gtin || formData.mpn) score += 10
//     if (formData.brand) score += 10
//     if (formData.googleProductCategory) score += 15
//     if (formData.availability === 'made_to_order' ? formData.leadTime : true) score += 10
//     return score
//   }

//   const googleScore = calculateGoogleScore()

//   // Save / Update Handler
//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault()
//     startTransition(async () => {
//       try {
//         const payload = {
//           ...formData,
//           whatsIncluded: formData.whatsIncluded.split(',').map((s: string) => s.trim()).filter(Boolean),
//           price: String(formData.price),
//           originalPrice: formData.originalPrice ? String(formData.originalPrice) : null,
//         }

//         const res = await fetch('/api/admin/products', {
//           method: 'POST',
//           headers: { 'Content-Type': 'application/json' },
//           body: JSON.stringify(payload),
//         })

//         const result = await res.json()
//         if (result.success) {
//           router.push('/admin/products')
//           router.refresh()
//         } else {
//           alert(`Error saving product: ${result.error}`)
//         }
//       } catch (err: any) {
//         alert(`System error: ${err.message}`)
//       }
//     })
//   }

//   return (
//     <form onSubmit={handleSubmit} className="min-h-screen bg-stone-50 pb-24 text-stone-800">
//       {/* Sticky Header Action Bar */}
//       <div className="sticky top-0 z-30 border-b border-stone-200 bg-white/95 px-6 py-4 backdrop-blur-md">
//         <div className="mx-auto flex max-w-7xl items-center justify-between">
//           <div className="flex items-center gap-4">
//             <Link href="/admin/products" className="rounded-lg p-2 text-stone-500 hover:bg-stone-100">
//               <ArrowLeft className="h-5 w-5" />
//             </Link>
//             <div>
//               <h1 className="text-xl font-semibold text-stone-900">
//                 {isEdit ? `Edit: ${formData.name || 'Product'}` : 'New Product Entry'}
//               </h1>
//               <p className="text-xs text-stone-500">UGX Catalog & Google Merchant API Ready</p>
//             </div>
//           </div>

//           <div className="flex items-center gap-3">
//             <select
//               value={formData.status}
//               onChange={(e) => setFormData({ ...formData, status: e.target.value })}
//               className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs font-medium shadow-sm"
//             >
//               <option value="draft">Draft</option>
//               <option value="published">Published</option>
//               <option value="archived">Archived</option>
//             </select>

//             <button
//               type="submit"
//               disabled={isPending}
//               className="flex items-center gap-2 rounded-lg bg-stone-900 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-stone-800 disabled:opacity-50"
//             >
//               <Save className="h-4 w-4" />
//               {isPending ? 'Saving...' : isEdit ? 'Update Product' : 'Save Product'}
//             </button>
//           </div>
//         </div>
//       </div>

//       <div className="mx-auto mt-8 max-w-7xl px-6">
//         <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">

//           {/* Main Form Tabs (8 Columns) */}
//           <div className="space-y-6 lg:col-span-8">

//             {/* Tab Navigation */}
//             <div className="flex flex-wrap border-b border-stone-200 bg-white px-4 pt-2 shadow-sm rounded-t-xl">
//               {[
//                 { id: 'general', label: 'General', icon: Package },
//                 { id: 'pricing', label: 'Pricing & Stock', icon: DollarSign },
//                 { id: 'logistics', label: 'Logistics', icon: Truck },
//                 { id: 'specs', label: 'Specifications', icon: FileText },
//                 { id: 'variants', label: 'Variants', icon: Layers },
//                 { id: 'google', label: 'Google Merchant', icon: Sparkles },
//                 { id: 'seo', label: 'SEO & Search', icon: Search },
//               ].map((tab) => {
//                 const Icon = tab.icon
//                 return (
//                   <button
//                     key={tab.id}
//                     type="button"
//                     onClick={() => setActiveTab(tab.id as any)}
//                     className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-medium transition-colors ${
//                       activeTab === tab.id
//                         ? 'border-amber-700 text-amber-900'
//                         : 'border-transparent text-stone-500 hover:text-stone-800'
//                     }`}
//                   >
//                     <Icon className="h-4 w-4" />
//                     {tab.label}
//                   </button>
//                 )
//               })}
//             </div>

//             {/* TAB 1: GENERAL */}
//             {activeTab === 'general' && (
//               <div className="space-y-5 rounded-b-xl border border-t-0 border-stone-200 bg-white p-6 shadow-sm">
//                 <div>
//                   <label className="block text-xs font-semibold text-stone-700">Product Name *</label>
//                   <input
//                     type="text"
//                     value={formData.name}
//                     onChange={(e) => handleNameChange(e.target.value)}
//                     placeholder="e.g. Luna Velvet Lounge Chair"
//                     className="mt-1.5 w-full rounded-lg border border-stone-300 p-2.5 text-sm focus:border-amber-600 focus:outline-none"
//                     required
//                   />
//                 </div>

//                 <div className="grid grid-cols-2 gap-4">
//                   <div>
//                     <label className="block text-xs font-semibold text-stone-700">URL Slug *</label>
//                     <input
//                       type="text"
//                       value={formData.slug}
//                       onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
//                       className="mt-1.5 w-full rounded-lg border border-stone-300 p-2.5 text-sm font-mono"
//                       required
//                     />
//                   </div>
//                   <div>
//                     <label className="block text-xs font-semibold text-stone-700">Brand Name</label>
//                     <input
//                       type="text"
//                       value={formData.brand}
//                       onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
//                       className="mt-1.5 w-full rounded-lg border border-stone-300 p-2.5 text-sm"
//                     />
//                   </div>
//                 </div>

//                 <div className="grid grid-cols-3 gap-4">
//                   <div>
//                     <label className="block text-xs font-semibold text-stone-700">Department</label>
//                     <input
//                       type="text"
//                       value={formData.department}
//                       onChange={(e) => setFormData({ ...formData, department: e.target.value })}
//                       className="mt-1.5 w-full rounded-lg border border-stone-300 p-2.5 text-sm"
//                     />
//                   </div>
//                   <div>
//                     <label className="block text-xs font-semibold text-stone-700">Category *</label>
//                     <input
//                       type="text"
//                       value={formData.category}
//                       onChange={(e) => setFormData({ ...formData, category: e.target.value })}
//                       className="mt-1.5 w-full rounded-lg border border-stone-300 p-2.5 text-sm"
//                       required
//                     />
//                   </div>
//                   <div>
//                     <label className="block text-xs font-semibold text-stone-700">Sub-Category</label>
//                     <input
//                       type="text"
//                       value={formData.subCategory}
//                       onChange={(e) => setFormData({ ...formData, subCategory: e.target.value })}
//                       className="mt-1.5 w-full rounded-lg border border-stone-300 p-2.5 text-sm"
//                     />
//                   </div>
//                 </div>

//                 <div>
//                   <label className="block text-xs font-semibold text-stone-700">Short Summary</label>
//                   <textarea
//                     rows={3}
//                     value={formData.description}
//                     onChange={(e) => setFormData({ ...formData, description: e.target.value })}
//                     className="mt-1.5 w-full rounded-lg border border-stone-300 p-2.5 text-sm"
//                   />
//                 </div>
//               </div>
//             )}

//             {/* TAB 2: PRICING & STOCK */}
//             {activeTab === 'pricing' && (
//               <div className="space-y-5 rounded-b-xl border border-t-0 border-stone-200 bg-white p-6 shadow-sm">
//                 <div className="grid grid-cols-3 gap-4">
//                   <div>
//                     <label className="block text-xs font-semibold text-stone-700">Price (UGX) *</label>
//                     <input
//                       type="number"
//                       value={formData.price}
//                       onChange={(e) => setFormData({ ...formData, price: e.target.value })}
//                       placeholder="e.g. 2500000"
//                       className="mt-1.5 w-full rounded-lg border border-stone-300 p-2.5 text-sm font-mono"
//                       required
//                     />
//                   </div>
//                   <div>
//                     <label className="block text-xs font-semibold text-stone-700">Original / Compare-At Price</label>
//                     <input
//                       type="number"
//                       value={formData.originalPrice}
//                       onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
//                       className="mt-1.5 w-full rounded-lg border border-stone-300 p-2.5 text-sm font-mono"
//                     />
//                   </div>
//                   <div>
//                     <label className="block text-xs font-semibold text-stone-700">Currency</label>
//                     <input
//                       type="text"
//                       disabled
//                       value={formData.currency}
//                       className="mt-1.5 w-full rounded-lg border border-stone-200 bg-stone-100 p-2.5 text-sm font-mono"
//                     />
//                   </div>
//                 </div>

//                 <div className="grid grid-cols-2 gap-4">
//                   <div>
//                     <label className="block text-xs font-semibold text-stone-700">Stock Quantity</label>
//                     <input
//                       type="number"
//                       value={formData.quantity}
//                       onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
//                       className="mt-1.5 w-full rounded-lg border border-stone-300 p-2.5 text-sm"
//                     />
//                   </div>
//                   <div className="flex items-center gap-3 pt-6">
//                     <input
//                       type="checkbox"
//                       id="inStock"
//                       checked={formData.inStock}
//                       onChange={(e) => setFormData({ ...formData, inStock: e.target.checked })}
//                       className="h-4 w-4 rounded border-stone-300 text-amber-700"
//                     />
//                     <label htmlFor="inStock" className="text-xs font-semibold text-stone-700">Available for Immediate Sale</label>
//                   </div>
//                 </div>
//               </div>
//             )}

//             {/* TAB 3: LOGISTICS */}
//             {activeTab === 'logistics' && (
//               <div className="space-y-5 rounded-b-xl border border-t-0 border-stone-200 bg-white p-6 shadow-sm">
//                 <div className="grid grid-cols-2 gap-4">
//                   <div>
//                     <label className="block text-xs font-semibold text-stone-700">Availability Status</label>
//                     <select
//                       value={formData.availability}
//                       onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
//                       className="mt-1.5 w-full rounded-lg border border-stone-300 p-2.5 text-sm"
//                     >
//                       <option value="in_stock">In Stock (Ready to Ship)</option>
//                       <option value="made_to_order">Made to Order (Crafting Required)</option>
//                       <option value="pre_order">Pre-Order</option>
//                       <option value="out_of_stock">Out of Stock</option>
//                     </select>
//                   </div>

//                   <div>
//                     <label className="block text-xs font-semibold text-stone-700">Lead Time / Production Window</label>
//                     <input
//                       type="text"
//                       value={formData.leadTime}
//                       onChange={(e) => setFormData({ ...formData, leadTime: e.target.value })}
//                       placeholder="e.g. 4–6 weeks"
//                       className="mt-1.5 w-full rounded-lg border border-stone-300 p-2.5 text-sm"
//                     />
//                   </div>
//                 </div>
//               </div>
//             )}

//             {/* TAB 4: SPECS */}
//             {activeTab === 'specs' && (
//               <div className="space-y-5 rounded-b-xl border border-t-0 border-stone-200 bg-white p-6 shadow-sm">
//                 <div className="grid grid-cols-2 gap-4">
//                   <div>
//                     <label className="block text-xs font-semibold text-stone-700">Primary Material</label>
//                     <input
//                       type="text"
//                       value={formData.material}
//                       onChange={(e) => setFormData({ ...formData, material: e.target.value })}
//                       placeholder="e.g. Teak Wood, Brass"
//                       className="mt-1.5 w-full rounded-lg border border-stone-300 p-2.5 text-sm"
//                     />
//                   </div>
//                   <div>
//                     <label className="block text-xs font-semibold text-stone-700">Finish Detail</label>
//                     <input
//                       type="text"
//                       value={formData.finish}
//                       onChange={(e) => setFormData({ ...formData, finish: e.target.value })}
//                       placeholder="e.g. Matte Oil Finish"
//                       className="mt-1.5 w-full rounded-lg border border-stone-300 p-2.5 text-sm"
//                     />
//                   </div>
//                 </div>

//                 <div>
//                   <label className="block text-xs font-semibold text-stone-700">What's Included (Comma-Separated)</label>
//                   <input
//                     type="text"
//                     value={formData.whatsIncluded}
//                     onChange={(e) => setFormData({ ...formData, whatsIncluded: e.target.value })}
//                     placeholder="1x Lounge Chair, 2x Accent Cushions"
//                     className="mt-1.5 w-full rounded-lg border border-stone-300 p-2.5 text-sm"
//                   />
//                 </div>
//               </div>
//             )}

//             {/* TAB 5: GOOGLE MERCHANT */}
//             {activeTab === 'google' && (
//               <div className="space-y-5 rounded-b-xl border border-t-0 border-stone-200 bg-white p-6 shadow-sm">
//                 <div>
//                   <label className="block text-xs font-semibold text-stone-700">Google Product Taxonomy Category</label>
//                   <input
//                     type="text"
//                     value={formData.googleProductCategory}
//                     onChange={(e) => setFormData({ ...formData, googleProductCategory: e.target.value })}
//                     className="mt-1.5 w-full rounded-lg border border-stone-300 p-2.5 text-sm font-mono"
//                   />
//                 </div>

//                 <div className="grid grid-cols-3 gap-4">
//                   <div>
//                     <label className="block text-xs font-semibold text-stone-700">SKU *</label>
//                     <input
//                       type="text"
//                       value={formData.sku}
//                       onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
//                       className="mt-1.5 w-full rounded-lg border border-stone-300 p-2.5 text-sm font-mono"
//                       required
//                     />
//                   </div>
//                   <div>
//                     <label className="block text-xs font-semibold text-stone-700">MPN</label>
//                     <input
//                       type="text"
//                       value={formData.mpn}
//                       onChange={(e) => setFormData({ ...formData, mpn: e.target.value })}
//                       className="mt-1.5 w-full rounded-lg border border-stone-300 p-2.5 text-sm font-mono"
//                     />
//                   </div>
//                   <div>
//                     <label className="block text-xs font-semibold text-stone-700">GTIN / Barcode</label>
//                     <input
//                       type="text"
//                       value={formData.gtin}
//                       onChange={(e) => setFormData({ ...formData, gtin: e.target.value })}
//                       className="mt-1.5 w-full rounded-lg border border-stone-300 p-2.5 text-sm font-mono"
//                     />
//                   </div>
//                 </div>
//               </div>
//             )}

//             {/* TAB 6: VARIANTS */}
//             {activeTab === 'variants' && (
//               <div className="space-y-6 rounded-b-xl border border-t-0 border-stone-200 bg-white p-6 shadow-sm">
//                 <div>
//                   <h3 className="text-sm font-semibold text-stone-900">Color Options & Image Swatches</h3>
//                   {formData.colors.map((color: any, idx: number) => (
//                     <div key={idx} className="mt-3 flex items-center gap-3 rounded-lg border border-stone-200 p-3">
//                       <input
//                         type="text"
//                         placeholder="Color Name (e.g. Charcoal)"
//                         value={color.label}
//                         onChange={(e) => {
//                           const updated = [...formData.colors]
//                           updated[idx].label = e.target.value
//                           setFormData({ ...formData, colors: updated })
//                         }}
//                         className="rounded border border-stone-300 p-2 text-xs"
//                       />
//                       <input
//                         type="color"
//                         value={color.value}
//                         onChange={(e) => {
//                           const updated = [...formData.colors]
//                           updated[idx].value = e.target.value
//                           setFormData({ ...formData, colors: updated })
//                         }}
//                         className="h-8 w-12 cursor-pointer rounded border border-stone-300 p-0"
//                       />
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             )}

//             {/* TAB 7: SEO */}
//             {activeTab === 'seo' && (
//               <div className="space-y-5 rounded-b-xl border border-t-0 border-stone-200 bg-white p-6 shadow-sm">
//                 <div>
//                   <label className="block text-xs font-semibold text-stone-700">SEO Title</label>
//                   <input
//                     type="text"
//                     value={formData.seoTitle}
//                     onChange={(e) => setFormData({ ...formData, seoTitle: e.target.value })}
//                     className="mt-1.5 w-full rounded-lg border border-stone-300 p-2.5 text-sm"
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-xs font-semibold text-stone-700">SEO Meta Description</label>
//                   <textarea
//                     rows={3}
//                     value={formData.seoDescription}
//                     onChange={(e) => setFormData({ ...formData, seoDescription: e.target.value })}
//                     className="mt-1.5 w-full rounded-lg border border-stone-300 p-2.5 text-sm"
//                   />
//                 </div>
//               </div>
//             )}

//           </div>

//           {/* Sidebar Widgets (4 Columns) */}
//           <div className="space-y-6 lg:col-span-4">

//             {/* Google Merchant Readiness Scorecard Widget */}
//             <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
//               <div className="flex items-center justify-between">
//                 <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500">
//                   Google Merchant Readiness
//                 </h3>
//                 <Sparkles className="h-4 w-4 text-amber-700" />
//               </div>

//               <div className="mt-4 flex items-baseline gap-2">
//                 <span className="text-3xl font-bold text-stone-900">{googleScore}%</span>
//                 <span className="text-xs text-stone-500">Feed Compliance</span>
//               </div>

//               <div className="mt-2 h-2.5 w-full rounded-full bg-stone-100">
//                 <div
//                   className={`h-2.5 rounded-full transition-all duration-300 ${
//                     googleScore > 80 ? 'bg-emerald-600' : googleScore > 50 ? 'bg-amber-600' : 'bg-rose-600'
//                   }`}
//                   style={{ width: `${googleScore}%` }}
//                 />
//               </div>

//               <div className="mt-5 space-y-2 text-xs">
//                 <div className="flex items-center gap-2">
//                   {formData.name ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <AlertCircle className="h-4 w-4 text-amber-600" />}
//                   <span className={formData.name ? 'text-stone-700' : 'text-stone-400'}>Product Title</span>
//                 </div>
//                 <div className="flex items-center gap-2">
//                   {formData.price ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <AlertCircle className="h-4 w-4 text-amber-600" />}
//                   <span className={formData.price ? 'text-stone-700' : 'text-stone-400'}>Price (UGX)</span>
//                 </div>
//                 <div className="flex items-center gap-2">
//                   {formData.sku ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <AlertCircle className="h-4 w-4 text-amber-600" />}
//                   <span className={formData.sku ? 'text-stone-700' : 'text-stone-400'}>Unique SKU</span>
//                 </div>
//                 <div className="flex items-center gap-2">
//                   {formData.googleProductCategory ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <AlertCircle className="h-4 w-4 text-amber-600" />}
//                   <span className={formData.googleProductCategory ? 'text-stone-700' : 'text-stone-400'}>Google Category</span>
//                 </div>
//               </div>
//             </div>

//             {/* Visibility Settings */}
//             <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
//               <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500">
//                 Visibility & Promotion
//               </h3>

//               <div className="mt-4 flex items-center gap-3">
//                 <input
//                   type="checkbox"
//                   id="featured"
//                   checked={formData.featured}
//                   onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
//                   className="h-4 w-4 rounded border-stone-300 text-amber-700"
//                 />
//                 <label htmlFor="featured" className="text-xs font-semibold text-stone-700">
//                   Feature on Storefront Homepage
//                 </label>
//               </div>
//             </div>

//           </div>

//         </div>
//       </div>
//     </form>
//   )
// }
