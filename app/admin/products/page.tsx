'use client'

import { useState, useEffect } from 'react'
import { CldUploadWidget } from 'next-cloudinary'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Plus, Edit, Trash2, Search, X, Loader2, UploadCloud, Image as ImageIcon } from 'lucide-react'

interface ColorVariant {
  label: string
  value: string
  images: string[]
}

interface FabricVariant {
  label: string
  priceDelta: string
}

interface Product {
  id: string
  name: string
  slug: string
  category: string
  price: string
  description: string
  createdAt: string
  variants?: any[]
  productImages?: any[]
}

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  // Core Form State
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    category: 'Furniture',
    price: '',
    description: '',
  })

  // Dynamic Color Swatches State
  const [colors, setColors] = useState<ColorVariant[]>([
    { label: 'Standard', value: '#1C1C1C', images: [] }
  ])

  // Dynamic Fabric State
  const [fabrics, setFabrics] = useState<FabricVariant[]>([])

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/products')
      if (res.ok) {
        const data = await res.json()
        setProducts(data.data || [])
      }
    } catch (err) {
      console.error('Failed to fetch products:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleNameChange = (name: string) => {
    if (!editingId) {
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
      setFormData((prev) => ({ ...prev, name, slug }))
    } else {
      setFormData((prev) => ({ ...prev, name }))
    }
  }

  // --- Populate Form for Editing ---
  const handleEdit = (product: Product) => {
    setEditingId(product.id)
    setFormData({
      name: product.name,
      slug: product.slug,
      category: product.category || 'Furniture',
      price: product.price,
      description: product.description || '',
    })

    // Reconstruct Color Swatches & mapped images
    const rawColors = product.variants?.filter((v) => v.type === 'COLOR') || []
    if (rawColors.length > 0) {
      const parsedColors = rawColors.map((c) => {
        const cImages = product.productImages
          ?.filter((img) => img.colorId === c.id)
          .map((img) => img.url) || []
        return {
          label: c.label,
          value: c.value || '#000000',
          images: cImages,
        }
      })
      setColors(parsedColors)
    } else {
      setColors([{ label: 'Standard', value: '#1C1C1C', images: [] }])
    }

    // Reconstruct Fabric Options
    const rawFabrics = product.variants?.filter((v) => v.type === 'FABRIC') || []
    setFabrics(
      rawFabrics.map((f) => ({
        label: f.label,
        priceDelta: f.priceDelta ? f.priceDelta.toString() : '0',
      }))
    )

    setIsFormOpen(true)
  }

  // --- Swatch Handlers ---
  const addColorVariant = () => {
    setColors([...colors, { label: '', value: '#000000', images: [] }])
  }

  const updateColor = (index: number, field: keyof ColorVariant, val: any) => {
    const updated = [...colors]
    updated[index] = { ...updated[index], [field]: val }
    setColors(updated)
  }

  const handleCloudinarySuccess = (colorIdx: number, result: any) => {
    if (result?.info?.secure_url) {
      const url = result.info.secure_url
      const updated = [...colors]
      updated[colorIdx].images.push(url)
      setColors(updated)
    }
  }

  const removeColorImage = (colorIdx: number, imgIdx: number) => {
    const updated = [...colors]
    updated[colorIdx].images.splice(imgIdx, 1)
    setColors(updated)
  }

  // --- Fabric Handlers ---
  const addFabricVariant = () => {
    setFabrics([...fabrics, { label: '', priceDelta: '0' }])
  }

  const updateFabric = (index: number, field: keyof FabricVariant, val: string) => {
    const updated = [...fabrics]
    updated[index] = { ...updated[index], [field]: val }
    setFabrics(updated)
  }

  // --- Create / Update Action ---
  const handleSaveProduct = async () => {
    if (!formData.name || !formData.price) {
      alert('Please fill in required fields (Name & Price)')
      return
    }

    setSubmitting(true)

    const payload = {
      ...(editingId ? { id: editingId } : {}),
      ...formData,
      colors: colors.filter((c) => c.label.trim() !== ''),
      fabrics: fabrics.filter((f) => f.label.trim() !== ''),
    }

    try {
      const res = await fetch('/api/admin/products', {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        await fetchProducts()
        resetForm()
      } else {
        const err = await res.json()
        alert(`Error: ${err.error || 'Failed to save product'}`)
      }
    } catch (err) {
      console.error(err)
      alert('Network error while saving product')
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormData({ name: '', slug: '', category: 'Furniture', price: '', description: '' })
    setColors([{ label: 'Standard', value: '#1C1C1C', images: [] }])
    setFabrics([])
    setEditingId(null)
    setIsFormOpen(false)
  }

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.category && p.category.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <div className="space-y-8 max-w-6xl mx-auto p-4 md:p-8">
      <div>
        <h1 className="font-serif text-4xl font-light text-foreground">Products Dashboard</h1>
        <p className="text-muted-foreground mt-2">Create, edit, and upload reactive Cloudinary media for product swatches</p>
      </div>

      {/* Product Form Modal */}
      {isFormOpen && (
        <Card className="p-8 border-border/20 shadow-sm">
          <div className="flex items-center justify-between mb-6 border-b pb-4">
            <h2 className="font-serif text-2xl font-light text-foreground">
              {editingId ? 'Edit Product' : 'Add New Product'}
            </h2>
            <button onClick={resetForm} className="text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Product Name *</label>
              <Input
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g., Savannah Modular Sofa"
                className="rounded-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">URL Slug *</label>
              <Input
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="savannah-modular-sofa"
                className="rounded-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Base Price (USD) *</label>
              <Input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="0.00"
                className="rounded-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Category</label>
              <Input
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="e.g., Furniture"
                className="rounded-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-foreground mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border rounded-none bg-background text-foreground font-light resize-none"
                placeholder="Detailed description..."
              />
            </div>
          </div>

          {/* Color & Cloudinary Drag/Drop Uploader */}
          <div className="space-y-6 pt-6 border-t">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif text-lg text-foreground">Color Swatches & Image Gallery</h3>
                <p className="text-xs text-muted-foreground">Upload images via Cloudinary directly for each color option.</p>
              </div>
              <Button type="button" onClick={addColorVariant} variant="outline" size="sm" className="rounded-none">
                + Add Color Swatch
              </Button>
            </div>

            {colors.map((c, cIdx) => (
              <Card key={cIdx} className="p-4 border bg-muted/10 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    placeholder="Color Label (e.g. Emerald)"
                    value={c.label}
                    onChange={(e) => updateColor(cIdx, 'label', e.target.value)}
                    className="rounded-none bg-background"
                  />
                  <div className="flex items-center gap-2">
                    <Input
                      type="color"
                      value={c.value}
                      onChange={(e) => updateColor(cIdx, 'value', e.target.value)}
                      className="w-12 h-10 p-1 cursor-pointer rounded-none"
                    />
                    <Input
                      placeholder="#HEX Code"
                      value={c.value}
                      onChange={(e) => updateColor(cIdx, 'value', e.target.value)}
                      className="rounded-none bg-background font-mono text-xs"
                    />
                  </div>
                </div>

                {/* Cloudinary Drag and Drop Area */}
                <div>
                  <label className="block text-xs font-medium uppercase text-muted-foreground mb-2">
                    Images for {c.label || 'this color'}
                  </label>

                  {/* Thumbnail Preview Grid */}
                  <div className="flex flex-wrap gap-3 mb-3">
                    {c.images.map((url, imgIdx) => (
                      <div key={imgIdx} className="relative size-20 border rounded overflow-hidden group">
                        <Image src={url} alt="" fill className="object-cover" />
                        <button
                          type="button"
                          onClick={() => removeColorImage(cIdx, imgIdx)}
                          className="absolute top-1 right-1 bg-black/70 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Cloudinary Widget */}
                  <CldUploadWidget
                    uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
                    onSuccess={(result) => handleCloudinarySuccess(cIdx, result)}
                  >
                    {({ open }) => (
                      <button
                        type="button"
                        onClick={() => open()}
                        className="w-full border-2 border-dashed border-muted-foreground/30 hover:border-amber-600 p-4 rounded-none flex items-center justify-center gap-2 text-xs text-muted-foreground hover:text-amber-600 transition-colors"
                      >
                        <UploadCloud className="w-4 h-4" />
                        Drag & Drop or Upload Photos to Cloudinary for {c.label || 'Swatch'}
                      </button>
                    )}
                  </CldUploadWidget>
                </div>
              </Card>
            ))}
          </div>

          {/* Fabric Variant Builder */}
          <div className="space-y-4 pt-6 border-t mt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif text-lg text-foreground">Fabric & Material Options</h3>
                <p className="text-xs text-muted-foreground">Add materials and extra charges (+USD).</p>
              </div>
              <Button type="button" onClick={addFabricVariant} variant="outline" size="sm" className="rounded-none">
                + Add Material
              </Button>
            </div>

            {fabrics.map((f, fIdx) => (
              <div key={fIdx} className="grid grid-cols-2 gap-4">
                <Input
                  placeholder="Material (e.g. Performance Velvet)"
                  value={f.label}
                  onChange={(e) => updateFabric(fIdx, 'label', e.target.value)}
                  className="rounded-none"
                />
                <Input
                  type="number"
                  placeholder="Extra Cost ($)"
                  value={f.priceDelta}
                  onChange={(e) => updateFabric(fIdx, 'priceDelta', e.target.value)}
                  className="rounded-none"
                />
              </div>
            ))}
          </div>

          {/* Submit Actions */}
          <div className="flex gap-3 pt-8 mt-6 border-t">
            <Button
              onClick={handleSaveProduct}
              disabled={submitting}
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-none px-8"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {editingId ? 'Update Product' : 'Create Product'}
            </Button>
            <Button onClick={resetForm} variant="outline" className="rounded-none">
              Cancel
            </Button>
          </div>
        </Card>
      )}

      {/* Search Toolbar */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search products..."
            className="pl-10 rounded-none"
          />
        </div>
        {!isFormOpen && (
          <Button onClick={() => setIsFormOpen(true)} className="rounded-none">
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        )}
      </div>

      {/* Products List */}
      <div className="space-y-3">
        {loading ? (
          <Card className="p-12 border border-dashed text-center">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">Loading products from PostgreSQL...</p>
          </Card>
        ) : filteredProducts.length === 0 ? (
          <Card className="p-12 border-dashed text-center">
            <p className="text-muted-foreground mb-2">No products found</p>
          </Card>
        ) : (
          filteredProducts.map((product) => (
            <Card key={product.id} className="p-6 border-border/20 hover:border-primary/20 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-medium text-foreground text-lg">{product.name}</h3>
                    <span className="text-xs px-2 py-0.5 rounded bg-amber-100/20 text-amber-700 uppercase font-medium">
                      {product.category || 'Furniture'}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-6 text-sm">
                    <div>
                      <p className="text-muted-foreground text-xs uppercase tracking-wider">Base Price</p>
                      <p className="text-foreground font-medium">${product.price}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs uppercase tracking-wider">Slug</p>
                      <p className="text-foreground font-mono text-xs">{product.slug}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs uppercase tracking-wider">Variants</p>
                      <p className="text-foreground font-medium">{product.variants?.length || 0} Swatches/Fabrics</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs uppercase tracking-wider">Gallery Media</p>
                      <p className="text-foreground font-medium">{product.productImages?.length || 0} Cloudinary Photos</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 ml-4">
                  <Button
                    onClick={() => handleEdit(product)}
                    variant="ghost"
                    size="icon"
                    className="hover:bg-primary/10 text-primary"
                    title="Edit Product"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
