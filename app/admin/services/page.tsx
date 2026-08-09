'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Edit, Trash2, Search, X, ChevronDown } from 'lucide-react'
import { SERVICES } from '@/lib/data/services'
import { cn } from '@/lib/utils'

interface ServiceItem {
  id: string
  categoryId: string
  categoryName: string
  name: string
  slug: string
  description: string
  longDescription: string
  icon: string
  order: number
  status: 'draft' | 'published'
  createdAt: string
}

interface FormData {
  categoryId: string
  name: string
  slug: string
  description: string
  longDescription: string
  icon: string
  status: 'draft' | 'published'
}

export default function AdminServices() {
  const [services, setServices] = useState<ServiceItem[]>(() => {
    return SERVICES.flatMap((category) =>
      category.services.map((service, idx) => ({
        id: `${category.id}-${idx}`,
        categoryId: category.id,
        categoryName: category.name,
        name: service.name,
        slug: service.slug,
        description: service.description ?? `${service.name} services from The Revamp UG`,
        longDescription: service.longDescription ?? service.description ?? `${service.name} services from The Revamp UG`,
        icon: service.icon ?? 'Briefcase',
        order: idx,
        status: 'published' as const,
        createdAt: new Date().toLocaleDateString(),
      }))
    )
  })

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)

  const [formData, setFormData] = useState<FormData>({
    categoryId: '',
    name: '',
    slug: '',
    description: '',
    longDescription: '',
    icon: '',
    status: 'published',
  })

  const filteredServices = useMemo(() => {
    return services.filter((service) => {
      const matchesSearch =
        service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.description.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = selectedCategory === 'all' || service.categoryId === selectedCategory
      return matchesSearch && matchesCategory
    })
  }, [services, searchTerm, selectedCategory])

  const handleAddService = () => {
    if (!formData.categoryId || !formData.name || !formData.slug) {
      alert('Please fill in required fields')
      return
    }

    if (editingId) {
      setServices(
        services.map((s) =>
          s.id === editingId
            ? {
                ...s,
                ...formData,
                categoryName: SERVICES.find((c) => c.id === formData.categoryId)?.name || '',
              }
            : s
        )
      )
    } else {
      const newService: ServiceItem = {
        id: Math.random().toString(36).substr(2, 9),
        categoryName: SERVICES.find((c) => c.id === formData.categoryId)?.name || '',
        ...formData,
        order: services.length,
        createdAt: new Date().toLocaleDateString(),
      }
      setServices([...services, newService])
    }

    resetForm()
  }

  const handleEditService = (service: ServiceItem) => {
    setFormData({
      categoryId: service.categoryId,
      name: service.name,
      slug: service.slug,
      description: service.description,
      longDescription: service.longDescription,
      icon: service.icon,
      status: service.status,
    })
    setEditingId(service.id)
    setIsFormOpen(true)
  }

  const handleDeleteService = (id: string) => {
    if (confirm('Are you sure you want to delete this service?')) {
      setServices(services.filter((s) => s.id !== id))
    }
  }

  const resetForm = () => {
    setFormData({
      categoryId: '',
      name: '',
      slug: '',
      description: '',
      longDescription: '',
      icon: '',
      status: 'published',
    })
    setEditingId(null)
    setIsFormOpen(false)
  }

  const categoriesGrouped = useMemo(() => {
    return SERVICES.map((category) => {
      const categoryServices = services.filter((s) => s.categoryId === category.id)
      return { ...category, serviceCount: categoryServices.length }
    })
  }, [services])

  const stats = {
    totalServices: services.length,
    published: services.filter((s) => s.status === 'published').length,
    draft: services.filter((s) => s.status === 'draft').length,
    categories: SERVICES.length,
  }

  return (
    <div className="w-full space-y-8 p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-light text-foreground">Services Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage service categories and sub-services</p>
        </div>
        <Button onClick={() => setIsFormOpen(!isFormOpen)} className="gap-2 bg-gold hover:bg-gold/90">
          <Plus size={16} /> Add Service
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Services', value: stats.totalServices },
          { label: 'Published', value: stats.published },
          { label: 'Drafts', value: stats.draft },
          { label: 'Categories', value: stats.categories },
        ].map((stat) => (
          <Card key={stat.label} className="p-4 bg-card">
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <p className="text-2xl font-light mt-2 text-foreground">{stat.value}</p>
          </Card>
        ))}
      </div>

      {/* Form */}
      {isFormOpen && (
        <Card className="p-6 bg-card border border-border/50">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-light">{editingId ? 'Edit Service' : 'Add New Service'}</h2>
            <button onClick={resetForm} className="text-muted-foreground hover:text-foreground">
              <X size={20} />
            </button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground">Category *</label>
                <select
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-border rounded bg-background text-foreground text-sm"
                >
                  <option value="">Select category</option>
                  {SERVICES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full mt-1 px-3 py-2 border border-border rounded bg-background text-foreground text-sm"
                >
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">Name *</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Service name"
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">Slug *</label>
              <Input
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="service-slug"
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">Icon (Lucide name)</label>
              <Input
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                placeholder="e.g., Armchair, Sofa, Home"
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">Description *</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description"
                className="mt-1 min-h-24"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">Long Description</label>
              <Textarea
                value={formData.longDescription}
                onChange={(e) => setFormData({ ...formData, longDescription: e.target.value })}
                placeholder="Detailed description for service page"
                className="mt-1 min-h-32"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button onClick={handleAddService} className="bg-gold hover:bg-gold/90">
                {editingId ? 'Update Service' : 'Add Service'}
              </Button>
              <Button onClick={resetForm} variant="outline" className="border-border">
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input
            placeholder="Search services..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-2 border border-border rounded bg-background text-foreground text-sm"
        >
          <option value="all">All Categories</option>
          {SERVICES.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* Services List by Category */}
      <div className="space-y-4">
        {categoriesGrouped.map((category) => {
          const categoryServices = services.filter((s) => s.categoryId === category.id)
          const isExpanded = expandedCategory === category.id
          const showCategory = selectedCategory === 'all' || selectedCategory === category.id

          if (!showCategory) return null

          return (
            <Card key={category.id} className="bg-card border border-border/50 overflow-hidden">
              <button
                onClick={() => setExpandedCategory(isExpanded ? null : category.id)}
                className="w-full p-4 flex items-center justify-between hover:bg-background/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <h3 className="font-medium text-foreground">{category.name}</h3>
                  <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded">
                    {categoryServices.length} services
                  </span>
                </div>
                <ChevronDown
                  size={18}
                  className={cn('text-muted-foreground transition-transform', isExpanded && 'rotate-180')}
                />
              </button>

              {isExpanded && (
                <div className="border-t border-border/50">
                  {categoryServices.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">No services in this category</div>
                  ) : (
                    <div className="divide-y divide-border/50">
                      {categoryServices
                        .filter(
                          (s) =>
                            s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            s.description.toLowerCase().includes(searchTerm.toLowerCase())
                        )
                        .map((service) => (
                          <div
                            key={service.id}
                            className="p-4 flex items-start justify-between hover:bg-background/30 transition-colors"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium text-foreground">{service.name}</h4>
                                <span
                                  className={cn(
                                    'text-xs px-2 py-1 rounded',
                                    service.status === 'published'
                                      ? 'bg-green-500/10 text-green-700'
                                      : 'bg-yellow-500/10 text-yellow-700'
                                  )}
                                >
                                  {service.status}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">{service.description}</p>
                              <p className="text-xs text-muted-foreground mt-1">Slug: {service.slug}</p>
                            </div>

                            <div className="flex items-center gap-2 ml-4">
                              <button
                                onClick={() => handleEditService(service)}
                                className="p-1 hover:bg-muted rounded transition-colors text-muted-foreground hover:text-foreground"
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                onClick={() => handleDeleteService(service.id)}
                                className="p-1 hover:bg-red-500/10 rounded transition-colors text-muted-foreground hover:text-red-600"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}
