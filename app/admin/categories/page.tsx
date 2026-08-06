'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Plus, Edit, Trash2, Search, ChevronDown, ChevronUp, X } from 'lucide-react'
import { PRODUCT_CATEGORIES, Category } from '@/lib/data/categories'

interface EditingCategory extends Category {
  isNew?: boolean
}

export default function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>(PRODUCT_CATEGORIES)
  const [searchTerm, setSearchTerm] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
  })
  const [subcategoryForm, setSubcategoryForm] = useState({
    categoryId: '',
    label: '',
    value: '',
  })

  const filteredCategories = useMemo(() => {
    return categories.filter((cat) =>
      cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cat.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [categories, searchTerm])

  const handleAddCategory = () => {
    if (!formData.name || !formData.slug) {
      alert('Please fill in required fields')
      return
    }

    const newCategory: Category = {
      id: formData.slug.toLowerCase().replace(/\s+/g, '-'),
      name: formData.name,
      slug: formData.slug.toLowerCase().replace(/\s+/g, '-'),
      description: formData.description,
      subcategories: [],
    }

    if (editingId) {
      setCategories(
        categories.map((cat) => (cat.id === editingId ? { ...newCategory, id: editingId } : cat))
      )
      setEditingId(null)
    } else {
      setCategories([...categories, newCategory])
    }

    setFormData({ name: '', slug: '', description: '' })
    setIsFormOpen(false)
  }

  const handleEditCategory = (category: Category) => {
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description,
    })
    setEditingId(category.id)
    setIsFormOpen(true)
  }

  const handleDeleteCategory = (id: string) => {
    if (confirm('Are you sure you want to delete this category?')) {
      setCategories(categories.filter((cat) => cat.id !== id))
    }
  }

  const handleAddSubcategory = () => {
    if (!subcategoryForm.label || !subcategoryForm.value || !subcategoryForm.categoryId) {
      alert('Please fill in all fields')
      return
    }

    setCategories(
      categories.map((cat) => {
        if (cat.id === subcategoryForm.categoryId) {
          return {
            ...cat,
            subcategories: [
              ...cat.subcategories,
              {
                id: subcategoryForm.value.toLowerCase().replace(/\s+/g, '-'),
                label: subcategoryForm.label,
                value: subcategoryForm.value.toLowerCase().replace(/\s+/g, '-'),
              },
            ],
          }
        }
        return cat
      })
    )

    setSubcategoryForm({ categoryId: '', label: '', value: '' })
  }

  const handleDeleteSubcategory = (categoryId: string, subcategoryId: string) => {
    setCategories(
      categories.map((cat) => {
        if (cat.id === categoryId) {
          return {
            ...cat,
            subcategories: cat.subcategories.filter((sub) => sub.id !== subcategoryId),
          }
        }
        return cat
      })
    )
  }

  const handleCancel = () => {
    setIsFormOpen(false)
    setEditingId(null)
    setFormData({ name: '', slug: '', description: '' })
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-light text-foreground">Product Categories</h1>
          <p className="text-muted-foreground mt-1">Manage your product categories and subcategories</p>
        </div>
        <Button
          onClick={() => {
            setIsFormOpen(!isFormOpen)
            if (isFormOpen) handleCancel()
          }}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          New Category
        </Button>
      </div>

      {/* Add/Edit Form */}
      {isFormOpen && (
        <Card className="p-6 space-y-4 bg-muted/50">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">
              {editingId ? 'Edit Category' : 'Add New Category'}
            </h2>
            <button
              onClick={handleCancel}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Category Name *
              </label>
              <Input
                placeholder="e.g., Living Room"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Slug (URL friendly) *
              </label>
              <Input
                placeholder="e.g., living-room"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Description
              </label>
              <textarea
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="Category description"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleAddCategory}>
              {editingId ? 'Update Category' : 'Add Category'}
            </Button>
          </div>
        </Card>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search categories..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Categories List */}
      <div className="space-y-3">
        {filteredCategories.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">No categories found</p>
          </Card>
        ) : (
          filteredCategories.map((category) => (
            <Card key={category.id} className="overflow-hidden">
              <div
                className="p-4 cursor-pointer hover:bg-muted/50 transition-colors flex items-center justify-between"
                onClick={() => setExpandedId(expandedId === category.id ? null : category.id)}
              >
                <div className="flex-1">
                  <h3 className="font-medium text-foreground">{category.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{category.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {category.subcategories.length} subcategories
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleEditCategory(category)
                    }}
                    className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteCategory(category.id)
                    }}
                    className="p-2 hover:bg-destructive/10 rounded-lg transition-colors text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  {expandedId === category.id ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
              </div>

              {/* Expanded Subcategories */}
              {expandedId === category.id && (
                <div className="bg-muted/30 border-t border-border p-4 space-y-4">
                  {/* Subcategories List */}
                  {category.subcategories.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm text-foreground">Subcategories</h4>
                      <div className="grid gap-2 max-h-96 overflow-y-auto">
                        {category.subcategories.map((sub) => (
                          <div
                            key={sub.id}
                            className="flex items-center justify-between bg-background p-3 rounded-md border border-border/50"
                          >
                            <div>
                              <p className="text-sm font-medium text-foreground">{sub.label}</p>
                              <p className="text-xs text-muted-foreground">{sub.value}</p>
                            </div>
                            <button
                              onClick={() => handleDeleteSubcategory(category.id, sub.id)}
                              className="p-1 hover:bg-destructive/10 rounded transition-colors text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Add Subcategory Form */}
                  <div className="pt-2 border-t border-border space-y-3 bg-background p-3 rounded-md">
                    <h4 className="font-medium text-sm text-foreground">Add Subcategory</h4>
                    <div className="grid gap-2">
                      <Input
                        placeholder="Label (e.g., Sofas)"
                        value={subcategoryForm.label}
                        onChange={(e) => setSubcategoryForm({ ...subcategoryForm, label: e.target.value })}
                      />
                      <Input
                        placeholder="Value (e.g., sofas)"
                        value={subcategoryForm.value}
                        onChange={(e) => setSubcategoryForm({ ...subcategoryForm, value: e.target.value })}
                      />
                      <Button
                        size="sm"
                        onClick={() => {
                          setSubcategoryForm({ ...subcategoryForm, categoryId: category.id })
                          handleAddSubcategory()
                        }}
                        className="w-full"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Add Subcategory
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          ))
        )}
      </div>

      {/* Stats */}
      <Card className="p-4 bg-muted/50">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Total Categories</p>
            <p className="text-2xl font-light text-foreground mt-1">{categories.length}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Subcategories</p>
            <p className="text-2xl font-light text-foreground mt-1">
              {categories.reduce((acc, cat) => acc + cat.subcategories.length, 0)}
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
