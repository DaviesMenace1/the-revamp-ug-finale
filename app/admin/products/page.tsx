'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Plus, Edit, Trash2, Search, X } from 'lucide-react'
import { products as seedProducts, Product as SeedProduct } from '@/lib/data/products'

interface Product {
  id: string
  name: string
  price: string
  collection: string
  description: string
  status: 'draft' | 'published'
  createdAt: string
}

const SEED_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Savannah Modular Sofa',
    price: '3200',
    collection: 'Living Room',
    description: 'Contemporary modular sofa with premium upholstery. Features adjustable configuration for flexible living spaces.',
    status: 'published',
    createdAt: new Date().toLocaleDateString(),
  },
  {
    id: '2',
    name: 'Aria Lounge Chair',
    price: '1800',
    collection: 'Seating',
    description: 'Elegant lounge chair with ergonomic design. Perfect for reading nooks and accent spaces.',
    status: 'published',
    createdAt: new Date().toLocaleDateString(),
  },
  {
    id: '3',
    name: 'Horizon Coffee Table',
    price: '890',
    collection: 'Tables',
    description: 'Minimalist coffee table with natural wood finish. Features clean lines and sustainable materials.',
    status: 'published',
    createdAt: new Date().toLocaleDateString(),
  },
  {
    id: '4',
    name: 'Eclipse Floor Lamp',
    price: '450',
    collection: 'Lighting',
    description: 'Statement floor lamp with adjustable head. Creates ambient lighting for any room.',
    status: 'draft',
    createdAt: new Date().toLocaleDateString(),
  },
  {
    id: '5',
    name: 'Luxe Area Rug',
    price: '2100',
    collection: 'Textiles',
    description: 'Handwoven area rug with traditional African patterns. Adds warmth and character to living spaces.',
    status: 'published',
    createdAt: new Date().toLocaleDateString(),
  },
]

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    collection: '',
    description: '',
    status: 'published',
  })

  useEffect(() => {
    // Seed products from data file on initial load
    const initialProducts: Product[] = seedProducts.map((p: SeedProduct) => ({
      id: p.id,
      name: p.name,
      price: p.price.toString(),
      collection: p.space,
      description: p.description,
      status: 'published' as const,
      createdAt: p.createdAt,
    }))
    setProducts(initialProducts)
  }, [])

  const handleAddProduct = () => {
    if (!formData.name || !formData.price) {
      alert('Please fill in required fields')
      return
    }

    if (editingId) {
      setProducts(products.map(p =>
        p.id === editingId
          ? { ...p, ...formData, status: formData.status as 'draft' | 'published' }
          : p
      ))
      setEditingId(null)
    } else {
      const newProduct: Product = {
        id: Date.now().toString(),
        name: formData.name,
        price: formData.price,
        collection: formData.collection,
        description: formData.description,
        status: formData.status as 'draft' | 'published',
        createdAt: new Date().toLocaleDateString(),
      }
      setProducts([newProduct, ...products])
    }

    setFormData({ name: '', price: '', collection: '', description: '', status: 'published' })
    setIsFormOpen(false)
  }

  const handleEdit = (product: Product) => {
    setFormData({
      name: product.name,
      price: product.price,
      collection: product.collection,
      description: product.description,
      status: product.status,
    })
    setEditingId(product.id)
    setIsFormOpen(true)
  }

  const handleDelete = (id: string) => {
    if (confirm('Delete this product?')) {
      setProducts(products.filter(p => p.id !== id))
    }
  }

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.collection.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-4xl font-light text-foreground">Products</h1>
        <p className="text-muted-foreground mt-2">Create, edit, and manage your product catalog</p>
      </div>

      {/* Add/Edit Form */}
      {isFormOpen && (
        <Card className="p-8 border-border/20">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-serif text-2xl font-light text-foreground">
              {editingId ? 'Edit Product' : 'Add New Product'}
            </h2>
            <button
              onClick={() => {
                setIsFormOpen(false)
                setEditingId(null)
                setFormData({ name: '', price: '', collection: '', description: '', status: 'published' })
              }}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Product Name *</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Savannah Modular Sofa"
                className="rounded-none border-muted"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Price (USD) *</label>
              <Input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="0.00"
                className="rounded-none border-muted"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Collection</label>
              <Input
                value={formData.collection}
                onChange={(e) => setFormData({ ...formData, collection: e.target.value })}
                placeholder="e.g., Living Room"
                className="rounded-none border-muted"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as 'draft' | 'published' })}
                className="w-full px-4 py-2 border border-muted rounded-none bg-background text-foreground"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-foreground mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Product description..."
                rows={4}
                className="w-full px-4 py-2 border border-muted rounded-none bg-background text-foreground font-light resize-none"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleAddProduct}
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-none"
            >
              {editingId ? 'Update Product' : 'Create Product'}
            </Button>
            <Button
              onClick={() => {
                setIsFormOpen(false)
                setEditingId(null)
                setFormData({ name: '', price: '', collection: '', description: '', status: 'published' })
              }}
              variant="outline"
              className="rounded-none"
            >
              Cancel
            </Button>
          </div>
        </Card>
      )}

      {/* Search & Add Button */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search products..."
            className="pl-10 rounded-none border-muted"
          />
        </div>
        {!isFormOpen && (
          <Button
            onClick={() => setIsFormOpen(true)}
            className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-none"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        )}
      </div>

      {/* Products List */}
      <div className="space-y-3">
        {filteredProducts.length === 0 ? (
          <Card className="p-12 border-border/20 border-dashed text-center">
            <p className="text-muted-foreground mb-2">No products yet</p>
            <p className="text-sm text-muted-foreground/70">Click "Add Product" to create your first item.</p>
          </Card>
        ) : (
          filteredProducts.map(product => (
            <Card key={product.id} className="p-6 border-border/20 hover:border-primary/20 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="font-medium text-foreground text-lg">{product.name}</h3>
                    <span className={`text-xs px-2 py-1 rounded uppercase font-medium ${
                      product.status === 'published'
                        ? 'bg-green-100/20 text-green-700'
                        : 'bg-yellow-100/20 text-yellow-700'
                    }`}>
                      {product.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-6 text-sm">
                    <div>
                      <p className="text-muted-foreground text-xs uppercase tracking-wider">Price</p>
                      <p className="text-foreground font-medium">${product.price}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs uppercase tracking-wider">Collection</p>
                      <p className="text-foreground">{product.collection || '-'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs uppercase tracking-wider">Created</p>
                      <p className="text-foreground">{product.createdAt}</p>
                    </div>
                    {product.description && (
                      <div>
                        <p className="text-muted-foreground text-xs uppercase tracking-wider">Description</p>
                        <p className="text-foreground truncate">{product.description}</p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => handleEdit(product)}
                    className="p-2 text-primary hover:bg-primary/10 rounded transition-colors"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="p-2 text-destructive hover:bg-destructive/10 rounded transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Stats */}
      {products.length > 0 && (
        <div className="grid md:grid-cols-3 gap-6 pt-8 border-t border-border/20">
          <Card className="p-6 border-border/20">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">Total Products</p>
            <p className="font-serif text-4xl font-light text-foreground">{products.length}</p>
          </Card>
          <Card className="p-6 border-border/20">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">Published</p>
            <p className="font-serif text-4xl font-light text-foreground">{products.filter(p => p.status === 'published').length}</p>
          </Card>
          <Card className="p-6 border-border/20">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">Drafts</p>
            <p className="font-serif text-4xl font-light text-foreground">{products.filter(p => p.status === 'draft').length}</p>
          </Card>
        </div>
      )}
    </div>
  )
}
