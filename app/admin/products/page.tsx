import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Plus, 
  Search, 
  Filter, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  RefreshCw,
  PackageX
} from 'lucide-react';
import { db } from '@/lib/db'; // Adjust path if your Drizzle instance export differs
import { products } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';

// Ensures Next.js re-evaluates the page on request rather than statically caching stale DB data
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Helper for formatting UGX currency (handles Drizzle string decimal types cleanly)
function formatUGX(amount: string | number | null | undefined) {
  if (!amount) return 'UGX 0';
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  return new Intl.NumberFormat('en-UG', {
    style: 'currency',
    currency: 'UGX',
    maximumFractionDigits: 0,
  }).format(isNaN(numericAmount) ? 0 : numericAmount);
}

export default async function AdminProductsPage() {
  // Fetch products from database, ordered by latest update
  const productList = await db
    .select()
    .from(products)
    .orderBy(desc(products.updatedAt));

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6 bg-stone-50/50 min-h-screen">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <h1 className="text-2xl font-serif font-bold text-stone-900">
            Product Catalog
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Manage store inventory, auto-generated SKUs, and live Google Merchant API sync.
          </p>
        </div>

        <Link
          href="/admin/products/new"
          className="inline-flex items-center justify-center gap-2 bg-amber-800 hover:bg-amber-900 text-white font-medium text-xs px-4 py-2.5 rounded-lg shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Product</span>
        </Link>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-stone-200 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder="Search by name, SKU, or category..."
            className="w-full pl-9 pr-4 py-2 text-xs border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-800"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-stone-200 rounded-lg text-stone-700 bg-white hover:bg-stone-50">
            <Filter className="w-3.5 h-3.5 text-stone-400" />
            <span>Filter</span>
          </button>
          
          <span className="text-xs text-stone-400">|</span>

          <span className="text-xs font-mono text-stone-500">
            Total Products: <strong>{productList.length}</strong>
          </span>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
        {productList.length === 0 ? (
          /* Empty Database State */
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center mx-auto text-stone-400">
              <PackageX className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-stone-800">No products found in database</h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              Your PostgreSQL database is currently empty. Get started by publishing your first luxury furniture item.
            </p>
            <div className="pt-2">
              <Link
                href="/admin/products/new"
                className="inline-flex items-center gap-1.5 bg-amber-800 text-white text-xs px-3.5 py-2 rounded-lg hover:bg-amber-900 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Product</span>
              </Link>
            </div>
          </div>
        ) : (
          /* Real Database Records */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-stone-700 border-collapse">
              <thead className="bg-stone-100/70 border-b border-stone-200 text-stone-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4">SKU / Taxonomy</th>
                  <th className="py-3 px-4">Price (UGX)</th>
                  <th className="py-3 px-4">Availability</th>
                  <th className="py-3 px-4">Google Merchant Sync</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {productList.map((p) => (
                  <tr key={p.id} className="hover:bg-stone-50/80 transition-colors">
                    
                    {/* Product Name, Thumbnail & Published Status */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-stone-100 border border-stone-200 overflow-hidden relative flex-shrink-0">
                          {p.thumbnailImage ? (
                            <Image
                              src={p.thumbnailImage}
                              alt={p.name}
                              fill
                              sizes="40px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-stone-200 flex items-center justify-center text-[10px] text-stone-400 font-mono">
                              NO IMG
                            </div>
                          )}
                        </div>
                        <div>
                          <Link 
                            href={`/admin/products/${p.id}`}
                            className="font-medium text-stone-900 hover:text-amber-800 transition-colors"
                          >
                            {p.name}
                          </Link>
                          <p className="text-[11px] text-stone-400 mt-0.5">
                            Status: <span className="capitalize font-mono">{p.status || 'draft'}</span>
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Auto-generated SKU & Category / SubCategory */}
                    <td className="py-3.5 px-4 font-mono text-stone-600">
                      <span className="font-semibold text-stone-800">{p.sku}</span>
                      <p className="text-[10px] text-stone-400 font-sans mt-0.5">
                        {p.category} {p.subCategory ? `→ ${p.subCategory}` : ''}
                      </p>
                    </td>

                    {/* Base Price in UGX */}
                    <td className="py-3.5 px-4 font-semibold text-stone-900">
                      {formatUGX(p.price)}
                    </td>

                    {/* Stock & Availability Enum state */}
                    <td className="py-3.5 px-4">
                      {p.availability === 'in_stock' && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          In Stock ({p.quantity ?? 0})
                        </span>
                      )}
                      {p.availability === 'made_to_order' && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                          Made To Order {p.leadTime ? `(${p.leadTime})` : ''}
                        </span>
                      )}
                      {p.availability === 'pre_order' && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                          Pre-Order
                        </span>
                      )}
                      {p.availability === 'out_of_stock' && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                          Out of Stock
                        </span>
                      )}
                      {(!p.availability || p.availability === 'available_on_request') && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-stone-600 bg-stone-100 px-2 py-0.5 rounded-full border border-stone-200">
                          On Request
                        </span>
                      )}
                    </td>

                    {/* Live Google Merchant API Sync Badge */}
                    <td className="py-3.5 px-4">
                      {p.googleSyncStatus === 'synced' && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Synced
                        </span>
                      )}
                      {p.googleSyncStatus === 'error' && (
                        <div className="space-y-0.5">
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-700">
                            <AlertCircle className="w-3.5 h-3.5" /> Sync Error
                          </span>
                          <p className="text-[10px] text-rose-600 truncate max-w-[180px]" title={p.googleSyncError || ''}>
                            {p.googleSyncError || 'Validation failed'}
                          </p>
                        </div>
                      )}
                      {(!p.googleSyncStatus || p.googleSyncStatus === 'draft') && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-stone-400">
                          <Clock className="w-3.5 h-3.5" /> Draft
                        </span>
                      )}
                    </td>

                    {/* Action buttons */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/products/${p.id}`}
                          className="px-2.5 py-1 text-[11px] font-medium text-stone-700 border border-stone-200 rounded hover:bg-stone-100 transition-colors"
                        >
                          Edit
                        </Link>
                        <button 
                          title="Force sync with Google Merchant API"
                          className="p-1 text-stone-400 hover:text-amber-800 transition-colors"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}


// 'use client'

// import { useState, useEffect } from 'react'
// import { CldUploadWidget } from 'next-cloudinary'
// import Image from 'next/image'
// import { Button } from '@/components/ui/button'
// import { Card } from '@/components/ui/card'
// import { Input } from '@/components/ui/input'
// import { Plus, Edit, X, Loader2, UploadCloud, Trash2 } from 'lucide-react'

// const CATEGORIES = [
//   'Furniture',
//   'Lighting',
//   'Decor',
//   'Art & Mirrors',
//   'Rugs & Textiles',
//   'Outdoor',
//   'Wall Art',
// ]

// const STATUS_OPTIONS = [
//   { label: 'Published (Visible on site)', value: 'published' },
//   { label: 'Draft (Hidden)', value: 'draft' },
//   { label: 'Archived', value: 'archived' },
// ]

// interface ColorVariant {
//   label: string
//   value: string
//   images: string[]
// }

// interface FabricVariant {
//   label: string
//   priceDelta: string
// }

// const DEFAULT_FORM_STATE = {
//   name: '',
//   slug: '',
//   category: 'Furniture',
//   subCategory: '',
//   price: '',
//   originalPrice: '',
//   description: '',
//   longDescription: '',
//   quantity: '10',
//   status: 'published',
//   inStock: 'true',
//   featured: 'false',
//   sku: '',
//   weight: '',
//   material: '',
//   rating: '0',
//   ratingCount: '0',
//   seoTitle: '',
//   seoDescription: '',
// }

// export default function AdminProducts() {
//   const [products, setProducts] = useState<any[]>([])
//   const [loading, setLoading] = useState(true)
//   const [submitting, setSubmitting] = useState(false)
//   const [isFormOpen, setIsFormOpen] = useState(false)
//   const [editingId, setEditingId] = useState<string | null>(null)

//   const [formData, setFormData] = useState(DEFAULT_FORM_STATE)
//   const [colors, setColors] = useState<ColorVariant[]>([
//     { label: 'Standard', value: '#1C1C1C', images: [] },
//   ])
//   const [fabrics, setFabrics] = useState<FabricVariant[]>([])

//   useEffect(() => {
//     fetchProducts()
//   }, [])

//   const fetchProducts = async () => {
//     try {
//       setLoading(true)
//       const res = await fetch('/api/admin/products')
//       if (res.ok) {
//         const data = await res.json()
//         setProducts(data.data || [])
//       }
//     } catch (err) {
//       console.error('Failed to fetch products:', err)
//     } finally {
//       setLoading(false)
//     }
//   }

//   const handleNameChange = (name: string) => {
//     if (!editingId) {
//       const slug = name
//         .toLowerCase()
//         .replace(/[^a-z0-9]+/g, '-')
//         .replace(/(^-|-$)+/g, '')
//       const generatedSku =
//         name
//           .toUpperCase()
//           .replace(/[^A-Z0-9]/g, '')
//           .slice(0, 8) + '-01'

//       setFormData((prev) => ({
//         ...prev,
//         name,
//         slug,
//         sku: prev.sku || generatedSku,
//         seoTitle: name,
//       }))
//     } else {
//       setFormData((prev) => ({ ...prev, name }))
//     }
//   }

//   const handleEdit = (product: any) => {
//     setEditingId(product.id)
//     setFormData({
//       name: product.name || '',
//       slug: product.slug || '',
//       category: product.category || 'Furniture',
//       subCategory: product.subCategory || '',
//       price: product.price || '',
//       originalPrice: product.originalPrice || '',
//       description: product.description || '',
//       longDescription: product.longDescription || '',
//       quantity: product.quantity ? String(product.quantity) : '10',
//       status: product.status || 'published',
//       inStock: product.inStock ? 'true' : 'false',
//       featured: product.featured ? 'true' : 'false',
//       sku: product.sku || '',
//       weight: product.weight ? String(product.weight) : '',
//       material: product.material || '',
//       rating: product.rating ? String(product.rating) : '0',
//       ratingCount: product.ratingCount ? String(product.ratingCount) : '0',
//       seoTitle: product.seoTitle || product.name || '',
//       seoDescription: product.seoDescription || product.description || '',
//     })

//     // Populate Color Variants & Images
//     const rawColors = product.variants?.filter((v: any) => v.type === 'COLOR') || []
//     if (rawColors.length > 0) {
//       setColors(
//         rawColors.map((c: any) => ({
//           label: c.label || 'Standard',
//           value: c.value || '#1C1C1C',
//           images:
//             product.productImages
//               ?.filter((img: any) => img.colorId === c.id)
//               .map((img: any) => img.url) || [],
//         }))
//       )
//     } else {
//       setColors([{ label: 'Standard', value: '#1C1C1C', images: [] }])
//     }

//     // Populate Fabric Variants
//     const rawFabrics = product.variants?.filter((v: any) => v.type === 'FABRIC') || []
//     setFabrics(
//       rawFabrics.map((f: any) => ({
//         label: f.label,
//         priceDelta: f.priceDelta ? String(f.priceDelta) : '0',
//       }))
//     )

//     setIsFormOpen(true)
//   }

//   // Save (Create or Edit using POST)
//   const handleSaveProduct = async () => {
//     if (!formData.name || !formData.price || !formData.category) {
//       alert('Please fill in required fields (Name, Price & Category)')
//       return
//     }

//     setSubmitting(true)

//     const payload = {
//       ...(editingId ? { id: editingId } : {}),
//       ...formData,
//       quantity: parseInt(formData.quantity) || 10,
//       inStock: formData.inStock === 'true',
//       featured: formData.featured === 'true',
//       colors: colors.filter((c) => c.label.trim() !== ''),
//       fabrics: fabrics.filter((f) => f.label.trim() !== ''),
//     }

//     try {
//       const res = await fetch('/api/admin/products', {
//         method: 'POST', // Switched to POST for both creation and editing
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(payload),
//       })

//       if (res.ok) {
//         await fetchProducts()
//         resetForm()
//       } else {
//         const err = await res.json()
//         alert(`Error: ${err.error || 'Failed to save product'}`)
//       }
//     } catch (err) {
//       alert('Network error while saving product')
//     } finally {
//       setSubmitting(false)
//     }
//   }

//   // Color Helper Functions
//   const addColorVariant = () => {
//     setColors([...colors, { label: '', value: '#000000', images: [] }])
//   }

//   const removeColorVariant = (index: number) => {
//     setColors(colors.filter((_, i) => i !== index))
//   }

//   const updateColorVariant = (index: number, field: keyof ColorVariant, value: any) => {
//     const updated = [...colors]
//     updated[index] = { ...updated[index], [field]: value }
//     setColors(updated)
//   }

//   const handleImageUpload = (colorIndex: number, result: any) => {
//     if (result?.info?.secure_url) {
//       const updated = [...colors]
//       updated[colorIndex].images.push(result.info.secure_url)
//       setColors(updated)
//     }
//   }

//   const removeImage = (colorIndex: number, imgIndex: number) => {
//     const updated = [...colors]
//     updated[colorIndex].images = updated[colorIndex].images.filter((_, i) => i !== imgIndex)
//     setColors(updated)
//   }

//   // Fabric Helper Functions
//   const addFabricVariant = () => {
//     setFabrics([...fabrics, { label: '', priceDelta: '0' }])
//   }

//   const removeFabricVariant = (index: number) => {
//     setFabrics(fabrics.filter((_, i) => i !== index))
//   }

//   const updateFabricVariant = (index: number, field: keyof FabricVariant, value: string) => {
//     const updated = [...fabrics]
//     updated[index] = { ...updated[index], [field]: value }
//     setFabrics(updated)
//   }

//   const resetForm = () => {
//     setFormData(DEFAULT_FORM_STATE)
//     setColors([{ label: 'Standard', value: '#1C1C1C', images: [] }])
//     setFabrics([])
//     setEditingId(null)
//     setIsFormOpen(false)
//   }

//   return (
//     <div className="space-y-8 max-w-6xl mx-auto p-4 md:p-8">
//       <div className="flex justify-between items-center">
//         <div>
//           <h1 className="font-serif text-3xl font-light">Products Manager</h1>
//           <p className="text-muted-foreground text-xs mt-1">
//             Configure metadata, pricing, Cloudinary assets, and search settings
//           </p>
//         </div>
//         {!isFormOpen && (
//           <Button onClick={() => setIsFormOpen(true)} className="rounded-none">
//             <Plus className="w-4 h-4 mr-2" />
//             Add Product
//           </Button>
//         )}
//       </div>

//       {isFormOpen && (
//         <Card className="p-8 border shadow-sm space-y-8">
//           <div className="flex items-center justify-between border-b pb-4">
//             <h2 className="font-serif text-xl font-light">
//               {editingId ? 'Edit Product Parameters' : 'Add New Product'}
//             </h2>
//             <button onClick={resetForm} className="text-muted-foreground hover:text-foreground">
//               <X className="w-5 h-5" />
//             </button>
//           </div>

//           {/* SECTION 1: Core Details */}
//           <div className="space-y-4">
//             <h3 className="text-xs uppercase font-semibold text-amber-700 tracking-wider">
//               1. Basic Information
//             </h3>
//             <div className="grid md:grid-cols-3 gap-4">
//               <div>
//                 <label className="block text-xs font-medium mb-1">Product Name *</label>
//                 <Input
//                   value={formData.name}
//                   onChange={(e) => handleNameChange(e.target.value)}
//                   placeholder="e.g. Modern Accent Chair"
//                   className="rounded-none"
//                 />
//               </div>

//               <div>
//                 <label className="block text-xs font-medium mb-1">URL Slug *</label>
//                 <Input
//                   value={formData.slug}
//                   onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
//                   placeholder="modern-accent-chair"
//                   className="rounded-none"
//                 />
//               </div>

//               <div>
//                 <label className="block text-xs font-medium mb-1">SKU Code</label>
//                 <Input
//                   value={formData.sku}
//                   onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
//                   placeholder="MOD-CHAIR-01"
//                   className="rounded-none font-mono text-xs"
//                 />
//               </div>

//               <div>
//                 <label className="block text-xs font-medium mb-1">Category *</label>
//                 <select
//                   value={formData.category}
//                   onChange={(e) => setFormData({ ...formData, category: e.target.value })}
//                   className="w-full h-10 px-3 py-2 border bg-background text-xs rounded-none"
//                 >
//                   {CATEGORIES.map((cat) => (
//                     <option key={cat} value={cat}>
//                       {cat}
//                     </option>
//                   ))}
//                 </select>
//               </div>

//               <div>
//                 <label className="block text-xs font-medium mb-1">Sub Category</label>
//                 <Input
//                   value={formData.subCategory}
//                   onChange={(e) => setFormData({ ...formData, subCategory: e.target.value })}
//                   placeholder="e.g. Accent Chairs"
//                   className="rounded-none"
//                 />
//               </div>

//               <div>
//                 <label className="block text-xs font-medium mb-1">Status *</label>
//                 <select
//                   value={formData.status}
//                   onChange={(e) => setFormData({ ...formData, status: e.target.value })}
//                   className="w-full h-10 px-3 py-2 border bg-background text-xs rounded-none"
//                 >
//                   {STATUS_OPTIONS.map((st) => (
//                     <option key={st.value} value={st.value}>
//                       {st.label}
//                     </option>
//                   ))}
//                 </select>
//               </div>
//             </div>
//           </div>

//           {/* SECTION 2: Pricing & Inventory */}
//           <div className="space-y-4 pt-4 border-t">
//             <h3 className="text-xs uppercase font-semibold text-amber-700 tracking-wider">
//               2. Pricing, Inventory & Display
//             </h3>
//             <div className="grid md:grid-cols-4 gap-4">
//               <div>
//                 <label className="block text-xs font-medium mb-1">Base Price ($) *</label>
//                 <Input
//                   type="number"
//                   value={formData.price}
//                   onChange={(e) => setFormData({ ...formData, price: e.target.value })}
//                   placeholder="0.00"
//                   className="rounded-none"
//                 />
//               </div>

//               <div>
//                 <label className="block text-xs font-medium mb-1">Original Price ($)</label>
//                 <Input
//                   type="number"
//                   value={formData.originalPrice}
//                   onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
//                   placeholder="0.00 (For sale badge)"
//                   className="rounded-none"
//                 />
//               </div>

//               <div>
//                 <label className="block text-xs font-medium mb-1">Stock Quantity</label>
//                 <Input
//                   type="number"
//                   value={formData.quantity}
//                   onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
//                   className="rounded-none"
//                 />
//               </div>

//               <div>
//                 <label className="block text-xs font-medium mb-1">Availability</label>
//                 <select
//                   value={formData.inStock}
//                   onChange={(e) => setFormData({ ...formData, inStock: e.target.value })}
//                   className="w-full h-10 px-3 py-2 border bg-background text-xs rounded-none"
//                 >
//                   <option value="true">In Stock</option>
//                   <option value="false">Out of Stock</option>
//                 </select>
//               </div>

//               <div>
//                 <label className="block text-xs font-medium mb-1">Featured Item?</label>
//                 <select
//                   value={formData.featured}
//                   onChange={(e) => setFormData({ ...formData, featured: e.target.value })}
//                   className="w-full h-10 px-3 py-2 border bg-background text-xs rounded-none"
//                 >
//                   <option value="false">No (Standard List)</option>
//                   <option value="true">Yes (Homepage Featured)</option>
//                 </select>
//               </div>

//               <div>
//                 <label className="block text-xs font-medium mb-1">Weight (kg / lbs)</label>
//                 <Input
//                   value={formData.weight}
//                   onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
//                   placeholder="12.5"
//                   className="rounded-none"
//                 />
//               </div>

//               <div>
//                 <label className="block text-xs font-medium mb-1">Material</label>
//                 <Input
//                   value={formData.material}
//                   onChange={(e) => setFormData({ ...formData, material: e.target.value })}
//                   placeholder="Solid Oak / Velvet"
//                   className="rounded-none"
//                 />
//               </div>
//             </div>
//           </div>

//           {/* SECTION 3: Colors & Cloudinary Image Uploads */}
//           <div className="space-y-4 pt-4 border-t">
//             <div className="flex justify-between items-center">
//               <h3 className="text-xs uppercase font-semibold text-amber-700 tracking-wider">
//                 3. Color Variants & Images (Cloudinary)
//               </h3>
//               <Button onClick={addColorVariant} variant="outline" size="sm" className="rounded-none text-xs">
//                 <Plus className="w-3 h-3 mr-1" /> Add Color Option
//               </Button>
//             </div>

//             <div className="space-y-4">
//               {colors.map((color, colorIdx) => (
//                 <div key={colorIdx} className="p-4 border bg-muted/20 space-y-3">
//                   <div className="flex items-center gap-3">
//                     <Input
//                       placeholder="Color Name (e.g. Matte Black)"
//                       value={color.label}
//                       onChange={(e) => updateColorVariant(colorIdx, 'label', e.target.value)}
//                       className="rounded-none text-xs"
//                     />
//                     <input
//                       type="color"
//                       value={color.value}
//                       onChange={(e) => updateColorVariant(colorIdx, 'value', e.target.value)}
//                       className="w-10 h-10 border p-1 bg-background cursor-pointer"
//                     />
//                     {colors.length > 1 && (
//                       <button
//                         onClick={() => removeColorVariant(colorIdx)}
//                         className="text-red-500 hover:text-red-700"
//                       >
//                         <Trash2 className="w-4 h-4" />
//                       </button>
//                     )}
//                   </div>

//                   {/* Cloudinary Image Upload Widget */}
//                   <div>
//                     <label className="block text-[11px] font-medium text-muted-foreground mb-2">
//                       Variant Images ({color.images.length})
//                     </label>
//                     <div className="flex flex-wrap gap-2 items-center">
//                       {color.images.map((imgUrl, imgIdx) => (
//                         <div key={imgIdx} className="relative w-16 h-16 border bg-background">
//                           <Image src={imgUrl} alt="Variant" fill className="object-cover" />
//                           <button
//                             type="button"
//                             onClick={() => removeImage(colorIdx, imgIdx)}
//                             className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full p-0.5"
//                           >
//                             <X className="w-3 h-3" />
//                           </button>
//                         </div>
//                       ))}

//                       <CldUploadWidget
//                         uploadPreset="upload" // Replace with your Cloudinary upload preset if different
//                         onSuccess={(result) => handleImageUpload(colorIdx, result)}
//                       >
//                         {({ open }) => (
//                           <button
//                             type="button"
//                             onClick={() => open()}
//                             className="w-16 h-16 border border-dashed flex flex-col items-center justify-center text-xs text-muted-foreground hover:border-amber-600 hover:text-amber-600 transition-colors"
//                           >
//                             <UploadCloud className="w-4 h-4 mb-1" />
//                             Upload
//                           </button>
//                         )}
//                       </CldUploadWidget>
//                     </div>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </div>

//           {/* SECTION 4: Fabrics / Materials Options */}
//           <div className="space-y-4 pt-4 border-t">
//             <div className="flex justify-between items-center">
//               <h3 className="text-xs uppercase font-semibold text-amber-700 tracking-wider">
//                 4. Fabric & Material Variants
//               </h3>
//               <Button onClick={addFabricVariant} variant="outline" size="sm" className="rounded-none text-xs">
//                 <Plus className="w-3 h-3 mr-1" /> Add Fabric Option
//               </Button>
//             </div>

//             <div className="space-y-2">
//               {fabrics.map((fabric, fabricIdx) => (
//                 <div key={fabricIdx} className="flex items-center gap-3">
//                   <Input
//                     placeholder="Fabric Label (e.g. Italian Leather)"
//                     value={fabric.label}
//                     onChange={(e) => updateFabricVariant(fabricIdx, 'label', e.target.value)}
//                     className="rounded-none text-xs flex-1"
//                   />
//                   <div className="flex items-center gap-1">
//                     <span className="text-xs">$ +</span>
//                     <Input
//                       type="number"
//                       placeholder="Price Delta (e.g. 50)"
//                       value={fabric.priceDelta}
//                       onChange={(e) => updateFabricVariant(fabricIdx, 'priceDelta', e.target.value)}
//                       className="rounded-none text-xs w-28"
//                     />
//                   </div>
//                   <button
//                     onClick={() => removeFabricVariant(fabricIdx)}
//                     className="text-red-500 hover:text-red-700"
//                   >
//                     <Trash2 className="w-4 h-4" />
//                   </button>
//                 </div>
//               ))}
//             </div>
//           </div>

//           {/* SECTION 5: Descriptions */}
//           <div className="space-y-4 pt-4 border-t">
//             <h3 className="text-xs uppercase font-semibold text-amber-700 tracking-wider">
//               5. Detailed Content
//             </h3>
//             <div className="grid md:grid-cols-2 gap-4">
//               <div>
//                 <label className="block text-xs font-medium mb-1">Short Description</label>
//                 <textarea
//                   value={formData.description}
//                   onChange={(e) => setFormData({ ...formData, description: e.target.value })}
//                   rows={3}
//                   className="w-full p-2 border bg-background text-xs rounded-none resize-none"
//                   placeholder="Summary for product cards..."
//                 />
//               </div>

//               <div>
//                 <label className="block text-xs font-medium mb-1">Long Description / Specs</label>
//                 <textarea
//                   value={formData.longDescription}
//                   onChange={(e) => setFormData({ ...formData, longDescription: e.target.value })}
//                   rows={3}
//                   className="w-full p-2 border bg-background text-xs rounded-none resize-none"
//                   placeholder="Full detailed product specifications..."
//                 />
//               </div>
//             </div>
//           </div>

//           {/* Save Buttons */}
//           <div className="flex gap-3 pt-6 border-t">
//             <Button
//               onClick={handleSaveProduct}
//               disabled={submitting}
//               className="bg-primary text-primary-foreground rounded-none px-8"
//             >
//               {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
//               {editingId ? 'Update Product' : 'Create & Publish Product'}
//             </Button>
//             <Button onClick={resetForm} variant="outline" className="rounded-none">
//               Cancel
//             </Button>
//           </div>
//         </Card>
//       )}

//       {/* List display */}
//       <div className="space-y-3">
//         {loading ? (
//           <Card className="p-12 text-center border-dashed">
//             <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-muted-foreground" />
//             <p className="text-xs text-muted-foreground">Fetching catalogue database...</p>
//           </Card>
//         ) : (
//           products.map((p) => (
//             <Card key={p.id} className="p-4 border flex items-center justify-between">
//               <div>
//                 <div className="flex items-center gap-2">
//                   <span className="font-medium text-sm">{p.name}</span>
//                   <span className="text-[10px] uppercase px-1.5 py-0.5 bg-amber-100 text-amber-800 font-semibold">
//                     {p.category}
//                   </span>
//                   <span className="text-[10px] uppercase px-1.5 py-0.5 bg-gray-100 text-gray-700 font-semibold">
//                     {p.status}
//                   </span>
//                 </div>
//                 <p className="text-xs text-muted-foreground mt-1">
//                   ${p.price} | SKU: {p.sku || 'N/A'} | Quantity: {p.quantity}
//                 </p>
//               </div>

//               <Button onClick={() => handleEdit(p)} variant="ghost" size="sm">
//                 <Edit className="w-4 h-4" />
//               </Button>
//             </Card>
//           ))
//         )}
//       </div>
//     </div>
//   )
// }


// 'use client'

// import { useState, useEffect } from 'react'
// import { CldUploadWidget } from 'next-cloudinary'
// import Image from 'next/image'
// import { Button } from '@/components/ui/button'
// import { Card } from '@/components/ui/card'
// import { Input } from '@/components/ui/input'
// import { Plus, Edit, Trash2, Search, X, Loader2, UploadCloud, Image as ImageIcon } from 'lucide-react'

// interface ColorVariant {
//   label: string
//   value: string
//   images: string[]
// }

// interface FabricVariant {
//   label: string
//   priceDelta: string
// }

// interface Product {
//   id: string
//   name: string
//   slug: string
//   category: string
//   price: string
//   description: string
//   createdAt: string
//   variants?: any[]
//   productImages?: any[]
// }

// export default function AdminProducts() {
//   const [products, setProducts] = useState<Product[]>([])
//   const [loading, setLoading] = useState(true)
//   const [submitting, setSubmitting] = useState(false)
//   const [searchTerm, setSearchTerm] = useState('')
//   const [isFormOpen, setIsFormOpen] = useState(false)
//   const [editingId, setEditingId] = useState<string | null>(null)

//   // Core Form State
//   const [formData, setFormData] = useState({
//     name: '',
//     slug: '',
//     category: 'Furniture',
//     price: '',
//     description: '',
//   })

//   // Dynamic Color Swatches State
//   const [colors, setColors] = useState<ColorVariant[]>([
//     { label: 'Standard', value: '#1C1C1C', images: [] }
//   ])

//   // Dynamic Fabric State
//   const [fabrics, setFabrics] = useState<FabricVariant[]>([])

//   useEffect(() => {
//     fetchProducts()
//   }, [])

//   const fetchProducts = async () => {
//     try {
//       setLoading(true)
//       const res = await fetch('/api/admin/products')
//       if (res.ok) {
//         const data = await res.json()
//         setProducts(data.data || [])
//       }
//     } catch (err) {
//       console.error('Failed to fetch products:', err)
//     } finally {
//       setLoading(false)
//     }
//   }

//   const handleNameChange = (name: string) => {
//     if (!editingId) {
//       const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
//       setFormData((prev) => ({ ...prev, name, slug }))
//     } else {
//       setFormData((prev) => ({ ...prev, name }))
//     }
//   }

//   // --- Populate Form for Editing ---
//   const handleEdit = (product: Product) => {
//     setEditingId(product.id)
//     setFormData({
//       name: product.name,
//       slug: product.slug,
//       category: product.category || 'Furniture',
//       price: product.price,
//       description: product.description || '',
//     })

//     // Reconstruct Color Swatches & mapped images
//     const rawColors = product.variants?.filter((v) => v.type === 'COLOR') || []
//     if (rawColors.length > 0) {
//       const parsedColors = rawColors.map((c) => {
//         const cImages = product.productImages
//           ?.filter((img) => img.colorId === c.id)
//           .map((img) => img.url) || []
//         return {
//           label: c.label,
//           value: c.value || '#000000',
//           images: cImages,
//         }
//       })
//       setColors(parsedColors)
//     } else {
//       setColors([{ label: 'Standard', value: '#1C1C1C', images: [] }])
//     }

//     // Reconstruct Fabric Options
//     const rawFabrics = product.variants?.filter((v) => v.type === 'FABRIC') || []
//     setFabrics(
//       rawFabrics.map((f) => ({
//         label: f.label,
//         priceDelta: f.priceDelta ? f.priceDelta.toString() : '0',
//       }))
//     )

//     setIsFormOpen(true)
//   }

//   // --- Swatch Handlers ---
//   const addColorVariant = () => {
//     setColors([...colors, { label: '', value: '#000000', images: [] }])
//   }

//   const updateColor = (index: number, field: keyof ColorVariant, val: any) => {
//     const updated = [...colors]
//     updated[index] = { ...updated[index], [field]: val }
//     setColors(updated)
//   }

//   const handleCloudinarySuccess = (colorIdx: number, result: any) => {
//     if (result?.info?.secure_url) {
//       const url = result.info.secure_url
//       const updated = [...colors]
//       updated[colorIdx].images.push(url)
//       setColors(updated)
//     }
//   }

//   const removeColorImage = (colorIdx: number, imgIdx: number) => {
//     const updated = [...colors]
//     updated[colorIdx].images.splice(imgIdx, 1)
//     setColors(updated)
//   }

//   // --- Fabric Handlers ---
//   const addFabricVariant = () => {
//     setFabrics([...fabrics, { label: '', priceDelta: '0' }])
//   }

//   const updateFabric = (index: number, field: keyof FabricVariant, val: string) => {
//     const updated = [...fabrics]
//     updated[index] = { ...updated[index], [field]: val }
//     setFabrics(updated)
//   }

//   // --- Create / Update Action ---
//   const handleSaveProduct = async () => {
//   if (!formData.name || !formData.price) {
//     alert('Please fill in required fields (Name & Price)')
//     return
//   }

//   setSubmitting(true)

//   const payload = {
//     ...(editingId ? { id: editingId } : {}),
//     name: formData.name.trim(),
//     slug: formData.slug.trim(),
//     price: formData.price,
//     category: formData.category || 'Furniture',
//     description: formData.description || '',
//     colors: colors.filter((c) => c.label.trim() !== ''),
//     fabrics: fabrics.filter((f) => f.label.trim() !== ''),
//   }

//   try {
//     const res = await fetch('/api/admin/products', {
//       method: editingId ? 'PUT' : 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify(payload),
//     })

//     if (res.ok) {
//       await fetchProducts()
//       resetForm()
//     } else {
//       const err = await res.json()
//       alert(`Error: ${err.error || 'Failed to save product'}`)
//     }
//   } catch (err) {
//     console.error(err)
//     alert('Network error while saving product')
//   } finally {
//     setSubmitting(false)
//   }
// }


//   const resetForm = () => {
//     setFormData({ name: '', slug: '', category: 'Furniture', price: '', description: '' })
//     setColors([{ label: 'Standard', value: '#1C1C1C', images: [] }])
//     setFabrics([])
//     setEditingId(null)
//     setIsFormOpen(false)
//   }

//   const filteredProducts = products.filter((p) =>
//     p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
//     (p.category && p.category.toLowerCase().includes(searchTerm.toLowerCase()))
//   )

//   return (
//     <div className="space-y-8 max-w-6xl mx-auto p-4 md:p-8">
//       <div>
//         <h1 className="font-serif text-4xl font-light text-foreground">Products Dashboard</h1>
//         <p className="text-muted-foreground mt-2">Create, edit, and upload reactive Cloudinary media for product swatches</p>
//       </div>

//       {/* Product Form Modal */}
//       {isFormOpen && (
//         <Card className="p-8 border-border/20 shadow-sm">
//           <div className="flex items-center justify-between mb-6 border-b pb-4">
//             <h2 className="font-serif text-2xl font-light text-foreground">
//               {editingId ? 'Edit Product' : 'Add New Product'}
//             </h2>
//             <button onClick={resetForm} className="text-muted-foreground hover:text-foreground">
//               <X className="w-5 h-5" />
//             </button>
//           </div>

//           <div className="grid md:grid-cols-2 gap-6 mb-6">
//             <div>
//               <label className="block text-sm font-medium text-foreground mb-2">Product Name *</label>
//               <Input
//                 value={formData.name}
//                 onChange={(e) => handleNameChange(e.target.value)}
//                 placeholder="e.g., Savannah Modular Sofa"
//                 className="rounded-none"
//               />
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-foreground mb-2">URL Slug *</label>
//               <Input
//                 value={formData.slug}
//                 onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
//                 placeholder="savannah-modular-sofa"
//                 className="rounded-none"
//               />
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-foreground mb-2">Base Price (USD) *</label>
//               <Input
//                 type="number"
//                 value={formData.price}
//                 onChange={(e) => setFormData({ ...formData, price: e.target.value })}
//                 placeholder="0.00"
//                 className="rounded-none"
//               />
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-foreground mb-2">Category</label>
//               <Input
//                 value={formData.category}
//                 onChange={(e) => setFormData({ ...formData, category: e.target.value })}
//                 placeholder="e.g., Furniture"
//                 className="rounded-none"
//               />
//             </div>

//             <div className="md:col-span-2">
//               <label className="block text-sm font-medium text-foreground mb-2">Description</label>
//               <textarea
//                 value={formData.description}
//                 onChange={(e) => setFormData({ ...formData, description: e.target.value })}
//                 rows={3}
//                 className="w-full px-4 py-2 border rounded-none bg-background text-foreground font-light resize-none"
//                 placeholder="Detailed description..."
//               />
//             </div>
//           </div>

//           {/* Color & Cloudinary Drag/Drop Uploader */}
//           <div className="space-y-6 pt-6 border-t">
//             <div className="flex items-center justify-between">
//               <div>
//                 <h3 className="font-serif text-lg text-foreground">Color Swatches & Image Gallery</h3>
//                 <p className="text-xs text-muted-foreground">Upload images via Cloudinary directly for each color option.</p>
//               </div>
//               <Button type="button" onClick={addColorVariant} variant="outline" size="sm" className="rounded-none">
//                 + Add Color Swatch
//               </Button>
//             </div>

//             {colors.map((c, cIdx) => (
//               <Card key={cIdx} className="p-4 border bg-muted/10 space-y-4">
//                 <div className="grid grid-cols-2 gap-4">
//                   <Input
//                     placeholder="Color Label (e.g. Emerald)"
//                     value={c.label}
//                     onChange={(e) => updateColor(cIdx, 'label', e.target.value)}
//                     className="rounded-none bg-background"
//                   />
//                   <div className="flex items-center gap-2">
//                     <Input
//                       type="color"
//                       value={c.value}
//                       onChange={(e) => updateColor(cIdx, 'value', e.target.value)}
//                       className="w-12 h-10 p-1 cursor-pointer rounded-none"
//                     />
//                     <Input
//                       placeholder="#HEX Code"
//                       value={c.value}
//                       onChange={(e) => updateColor(cIdx, 'value', e.target.value)}
//                       className="rounded-none bg-background font-mono text-xs"
//                     />
//                   </div>
//                 </div>

//                 {/* Cloudinary Drag and Drop Area */}
//                 <div>
//                   <label className="block text-xs font-medium uppercase text-muted-foreground mb-2">
//                     Images for {c.label || 'this color'}
//                   </label>

//                   {/* Thumbnail Preview Grid */}
//                   <div className="flex flex-wrap gap-3 mb-3">
//                     {c.images.map((url, imgIdx) => (
//                       <div key={imgIdx} className="relative size-20 border rounded overflow-hidden group">
//                         <Image src={url} alt="" fill className="object-cover" />
//                         <button
//                           type="button"
//                           onClick={() => removeColorImage(cIdx, imgIdx)}
//                           className="absolute top-1 right-1 bg-black/70 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
//                         >
//                           <X className="w-3 h-3" />
//                         </button>
//                       </div>
//                     ))}
//                   </div>

//                   {/* Cloudinary Widget */}
//                   <CldUploadWidget
//                     uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
//                     onSuccess={(result) => handleCloudinarySuccess(cIdx, result)}
//                   >
//                     {({ open }) => (
//                       <button
//                         type="button"
//                         onClick={() => open()}
//                         className="w-full border-2 border-dashed border-muted-foreground/30 hover:border-amber-600 p-4 rounded-none flex items-center justify-center gap-2 text-xs text-muted-foreground hover:text-amber-600 transition-colors"
//                       >
//                         <UploadCloud className="w-4 h-4" />
//                         Drag & Drop or Upload Photos to Cloudinary for {c.label || 'Swatch'}
//                       </button>
//                     )}
//                   </CldUploadWidget>
//                 </div>
//               </Card>
//             ))}
//           </div>

//           {/* Fabric Variant Builder */}
//           <div className="space-y-4 pt-6 border-t mt-6">
//             <div className="flex items-center justify-between">
//               <div>
//                 <h3 className="font-serif text-lg text-foreground">Fabric & Material Options</h3>
//                 <p className="text-xs text-muted-foreground">Add materials and extra charges (+USD).</p>
//               </div>
//               <Button type="button" onClick={addFabricVariant} variant="outline" size="sm" className="rounded-none">
//                 + Add Material
//               </Button>
//             </div>

//             {fabrics.map((f, fIdx) => (
//               <div key={fIdx} className="grid grid-cols-2 gap-4">
//                 <Input
//                   placeholder="Material (e.g. Performance Velvet)"
//                   value={f.label}
//                   onChange={(e) => updateFabric(fIdx, 'label', e.target.value)}
//                   className="rounded-none"
//                 />
//                 <Input
//                   type="number"
//                   placeholder="Extra Cost ($)"
//                   value={f.priceDelta}
//                   onChange={(e) => updateFabric(fIdx, 'priceDelta', e.target.value)}
//                   className="rounded-none"
//                 />
//               </div>
//             ))}
//           </div>

//           {/* Submit Actions */}
//           <div className="flex gap-3 pt-8 mt-6 border-t">
//             <Button
//               onClick={handleSaveProduct}
//               disabled={submitting}
//               className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-none px-8"
//             >
//               {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
//               {editingId ? 'Update Product' : 'Create Product'}
//             </Button>
//             <Button onClick={resetForm} variant="outline" className="rounded-none">
//               Cancel
//             </Button>
//           </div>
//         </Card>
//       )}

//       {/* Search Toolbar */}
//       <div className="flex items-center gap-4">
//         <div className="flex-1 relative">
//           <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
//           <Input
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//             placeholder="Search products..."
//             className="pl-10 rounded-none"
//           />
//         </div>
//         {!isFormOpen && (
//           <Button onClick={() => setIsFormOpen(true)} className="rounded-none">
//             <Plus className="w-4 h-4 mr-2" />
//             Add Product
//           </Button>
//         )}
//       </div>

//       {/* Products List */}
//       <div className="space-y-3">
//         {loading ? (
//           <Card className="p-12 border border-dashed text-center">
//             <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground mb-2" />
//             <p className="text-sm text-muted-foreground">Loading products from PostgreSQL...</p>
//           </Card>
//         ) : filteredProducts.length === 0 ? (
//           <Card className="p-12 border-dashed text-center">
//             <p className="text-muted-foreground mb-2">No products found</p>
//           </Card>
//         ) : (
//           filteredProducts.map((product) => (
//             <Card key={product.id} className="p-6 border-border/20 hover:border-primary/20 transition-colors">
//               <div className="flex items-start justify-between">
//                 <div className="flex-1">
//                   <div className="flex items-center gap-3 mb-2">
//                     <h3 className="font-medium text-foreground text-lg">{product.name}</h3>
//                     <span className="text-xs px-2 py-0.5 rounded bg-amber-100/20 text-amber-700 uppercase font-medium">
//                       {product.category || 'Furniture'}
//                     </span>
//                   </div>
//                   <div className="grid grid-cols-4 gap-6 text-sm">
//                     <div>
//                       <p className="text-muted-foreground text-xs uppercase tracking-wider">Base Price</p>
//                       <p className="text-foreground font-medium">${product.price}</p>
//                     </div>
//                     <div>
//                       <p className="text-muted-foreground text-xs uppercase tracking-wider">Slug</p>
//                       <p className="text-foreground font-mono text-xs">{product.slug}</p>
//                     </div>
//                     <div>
//                       <p className="text-muted-foreground text-xs uppercase tracking-wider">Variants</p>
//                       <p className="text-foreground font-medium">{product.variants?.length || 0} Swatches/Fabrics</p>
//                     </div>
//                     <div>
//                       <p className="text-muted-foreground text-xs uppercase tracking-wider">Gallery Media</p>
//                       <p className="text-foreground font-medium">{product.productImages?.length || 0} Cloudinary Photos</p>
//                     </div>
//                   </div>
//                 </div>

//                 <div className="flex gap-2 ml-4">
//                   <Button
//                     onClick={() => handleEdit(product)}
//                     variant="ghost"
//                     size="icon"
//                     className="hover:bg-primary/10 text-primary"
//                     title="Edit Product"
//                   >
//                     <Edit className="w-4 h-4" />
//                   </Button>
//                 </div>
//               </div>
//             </Card>
//           ))
//         )}
//       </div>
//     </div>
//   )
// }
