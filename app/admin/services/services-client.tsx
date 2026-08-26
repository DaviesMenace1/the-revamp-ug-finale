'use client'

import { useState, useTransition, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Edit, Trash2, Search, X } from 'lucide-react'
import { ImageUpload } from '@/components/admin/image-upload'
import {
  createServiceCategory,
  updateServiceCategory,
  deleteServiceCategory,
  createService,
  updateService,
  deleteService,
} from '@/lib/actions/services'

type ServiceCategory = {
  id: string
  name: string
  slug: string
  description: string | null
  image: string | null
  status: string | null
}

type Service = {
  id: string
  categoryId: string
  name: string
  slug: string
  description: string | null
  longDescription: string | null
  image: string | null
  gallery: string[]
  status: string | null
  featured: boolean | null
}

const emptyServiceForm = {
  categoryId: '',
  name: '',
  description: '',
  longDescription: '',
  image: '',
  gallery: [] as string[],
}

export default function ServicesClient({
  initialCategories = [],
  initialServices = [],
}: {
  initialCategories: ServiceCategory[]
  initialServices: Service[]
}) {
  const [categories, setCategories] = useState(initialCategories)
  const [servicesList, setServicesList] = useState(initialServices)
  const [searchTerm, setSearchTerm] = useState('')
  const [isPending, startTransition] = useTransition()

  const [categoryForm, setCategoryForm] = useState({ name: '', description: '', image: '' })
  const [showCategoryForm, setShowCategoryForm] = useState(false)

  const [serviceForm, setServiceForm] = useState(emptyServiceForm)
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null)
  const [showServiceForm, setShowServiceForm] = useState(false)

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) return servicesList
    return servicesList.filter((s) => s.name.toLowerCase().includes(term))
  }, [servicesList, searchTerm])

  function handleCreateCategory() {
    if (!categoryForm.name.trim()) return
    startTransition(async () => {
      const res = await createServiceCategory(categoryForm)
      if (res.success && res.category) {
        setCategories((prev) => [...prev, res.category as ServiceCategory])
        setCategoryForm({ name: '', description: '', image: '' })
        setShowCategoryForm(false)
      }
    })
  }

  function handleDeleteCategory(id: string) {
    if (!confirm('Delete this category? Services inside it must be moved or deleted first.')) return
    startTransition(async () => {
      const res = await deleteServiceCategory(id)
      if (res.success) {
        setCategories((prev) => prev.filter((c) => c.id !== id))
      } else if (res.error) {
        alert(res.error)
      }
    })
  }

  function openNewService() {
    setServiceForm({ ...emptyServiceForm, categoryId: categories[0]?.id ?? '' })
    setEditingServiceId(null)
    setShowServiceForm(true)
  }

  function openEditService(service: Service) {
    setServiceForm({
      categoryId: service.categoryId,
      name: service.name,
      description: service.description ?? '',
      longDescription: service.longDescription ?? '',
      image: service.image ?? '',
      gallery: service.gallery ?? [],
    })
    setEditingServiceId(service.id)
    setShowServiceForm(true)
  }

  function handleSaveService() {
    if (!serviceForm.name.trim() || !serviceForm.categoryId) return

    startTransition(async () => {
      if (editingServiceId) {
        const res = await updateService(editingServiceId, serviceForm)
        if (res.success) {
          setServicesList((prev) =>
            prev.map((s) => (s.id === editingServiceId ? { ...s, ...serviceForm } : s)),
          )
          setShowServiceForm(false)
        }
      } else {
        const res = await createService(serviceForm)
        if (res.success && res.service) {
          setServicesList((prev) => [...prev, res.service as Service])
          setShowServiceForm(false)
        }
      }
    })
  }

  function handleDeleteService(id: string) {
    if (!confirm('Delete this service?')) return
    startTransition(async () => {
      const res = await deleteService(id)
      if (res.success) {
        setServicesList((prev) => prev.filter((s) => s.id !== id))
      }
    })
  }

  return (
    <div className="space-y-8 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-4xl font-light text-foreground">Services</h1>
          <p className="text-muted-foreground mt-2">Manage service categories and offerings</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-none" onClick={() => setShowCategoryForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Category
          </Button>
          <Button
            className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-none"
            onClick={openNewService}
            disabled={categories.length === 0}
          >
            <Plus className="w-4 h-4 mr-2" />
            Service
          </Button>
        </div>
      </div>

      <div className="relative w-64">
        <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search services..."
          className="pl-10 rounded-none border-muted"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid gap-4">
        {categories.map((category) => (
          <Card key={category.id} className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-foreground">{category.name}</h3>
                <p className="text-sm text-muted-foreground">{category.description}</p>
              </div>
              <button onClick={() => handleDeleteCategory(category.id)}>
                <Trash2 className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            <div className="mt-4 space-y-2">
              {filtered
                .filter((s) => s.categoryId === category.id)
                .map((service) => (
                  <div
                    key={service.id}
                    className="flex items-center justify-between rounded border border-border/20 p-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">{service.name}</p>
                      <p className="text-xs text-muted-foreground">{service.description}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => openEditService(service)}>
                        <Edit className="w-4 h-4 text-muted-foreground" />
                      </button>
                      <button onClick={() => handleDeleteService(service.id)}>
                        <Trash2 className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </Card>
        ))}

        {categories.length === 0 && (
          <p className="text-sm text-muted-foreground">No service categories yet. Add one to get started.</p>
        )}
      </div>

      {showCategoryForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg bg-background p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-foreground">New Category</h2>
              <button onClick={() => setShowCategoryForm(false)}>
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            <div className="mt-4 space-y-3">
              <Input
                placeholder="Category name"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm((f) => ({ ...f, name: e.target.value }))}
              />
              <Textarea
                placeholder="Description"
                value={categoryForm.description}
                onChange={(e) => setCategoryForm((f) => ({ ...f, description: e.target.value }))}
              />
              <Button disabled={isPending} onClick={handleCreateCategory} className="rounded-none w-full">
                Create Category
              </Button>
            </div>
          </div>
        </div>
      )}

      {showServiceForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-lg bg-background p-6 shadow-xl my-8">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-foreground">
                {editingServiceId ? 'Edit Service' : 'New Service'}
              </h2>
              <button onClick={() => setShowServiceForm(false)}>
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            <div className="mt-4 space-y-3">
              <select
                value={serviceForm.categoryId}
                onChange={(e) => setServiceForm((f) => ({ ...f, categoryId: e.target.value }))}
                className="w-full rounded border border-muted bg-transparent p-2.5 text-sm"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <Input
                placeholder="Service name"
                value={serviceForm.name}
                onChange={(e) => setServiceForm((f) => ({ ...f, name: e.target.value }))}
              />
              <Textarea
                placeholder="Short description"
                value={serviceForm.description}
                onChange={(e) => setServiceForm((f) => ({ ...f, description: e.target.value }))}
              />
              <Textarea
                placeholder="Full description"
                rows={4}
                value={serviceForm.longDescription}
                onChange={(e) => setServiceForm((f) => ({ ...f, longDescription: e.target.value }))}
              />
              <div>
                <label className="text-sm font-medium text-foreground">Gallery</label>
                <div className="mt-2">
                  <ImageUpload
                    value={serviceForm.gallery}
                    onChange={(gallery) =>
                      setServiceForm((f) => ({ ...f, gallery, image: f.image || gallery[0] || '' }))
                    }
                    maxImages={8}
                  />
                </div>
              </div>
              <Button disabled={isPending} onClick={handleSaveService} className="rounded-none w-full">
                {editingServiceId ? 'Save Changes' : 'Create Service'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
