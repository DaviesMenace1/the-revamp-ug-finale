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
  getServiceForAdmin,
} from '@/lib/actions/services'
import { StructuredListEditor } from '@/components/admin/structured-list-editor'
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
  longDescription?: string | null
  visionStatement?: string | null
  whatWeSolve?: string | null
  approach?: string | null
  deliverables?: string[] | null
  relatedServices?: string[] | null
  relatedProjects?: string[] | null
  image: string | null
  gallery?: string[] | null
  storySections?: unknown[] | null
  processSteps?: unknown[] | null
  faqs?: unknown[] | null
  highlights?: unknown[] | null
  status: string | null
  featured: boolean | null
}

const emptyServiceForm = {
  categoryId: '',
  name: '',
  description: '',
  longDescription: '',
  visionStatement: '',
  whatWeSolve: '',
  approach: '',
  deliverables: [] as string[],
  relatedServices: [] as string[],
  relatedProjects: [] as string[],
  image: '',
  gallery: [] as string[],
  storySections: [] as unknown[], processSteps: [] as unknown[], faqs: [] as unknown[], highlights: [] as unknown[],
}

export default function ServicesClient({
  initialCategories = [],
  initialServices = [],
  loadError = null,
}: {
  initialCategories: ServiceCategory[]
  initialServices: Service[]
  loadError?: string | null
}) {
  const [categories, setCategories] = useState(initialCategories)
  const [servicesList, setServicesList] = useState(initialServices)
  const [searchTerm, setSearchTerm] = useState('')
  const [isPending, startTransition] = useTransition()
  const [actionError, setActionError] = useState<string | null>(null)

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
    if (!categoryForm.name.trim()) {
      setActionError('Add a category name before saving.')
      return
    }
    setActionError(null)
    startTransition(async () => {
      try {
        const res = await createServiceCategory(categoryForm)
        if (!res.success || !res.category) {
          setActionError(res.error || 'The service category could not be created.')
          return
        }
        setCategories((prev) => [...prev, res.category as ServiceCategory])
        setCategoryForm({ name: '', description: '', image: '' })
        setShowCategoryForm(false)
      } catch (error) {
        console.error('Failed to create service category:', error)
        setActionError('The service category could not be created. Check your connection and try again.')
      }
    })
  }

  function handleDeleteCategory(id: string) {
    if (!confirm('Delete this category? Services inside it must be moved or deleted first.')) return
    setActionError(null)
    startTransition(async () => {
      try {
        const res = await deleteServiceCategory(id)
        if (res.success) {
          setCategories((prev) => prev.filter((c) => c.id !== id))
        } else {
          setActionError(res.error || 'The service category could not be deleted.')
        }
      } catch (error) {
        console.error('Failed to delete service category:', error)
        setActionError('The service category could not be deleted. Check your connection and try again.')
      }
    })
  }

  function openNewService() {
    setServiceForm({ ...emptyServiceForm, categoryId: categories[0]?.id ?? '' })
    setEditingServiceId(null)
    setShowServiceForm(true)
  }

  function openEditService(service: Service) {
    startTransition(async () => {
      const result = await getServiceForAdmin(service.id)
      if (!result.success || !result.service) {
        alert(result.error || 'Failed to load the service editor. Refresh the page and try again.')
        return
      }
      const detail = result.service
      setServiceForm({
        categoryId: detail.categoryId,
        name: detail.name,
        description: detail.description ?? '',
        longDescription: detail.longDescription ?? '',
        visionStatement: detail.visionStatement ?? '',
        whatWeSolve: detail.whatWeSolve ?? '',
        approach: detail.approach ?? '',
        deliverables: Array.isArray(detail.deliverables) ? detail.deliverables as string[] : [],
        relatedServices: Array.isArray(detail.relatedServices) ? detail.relatedServices as string[] : [],
        relatedProjects: Array.isArray(detail.relatedProjects) ? detail.relatedProjects as string[] : [],
        image: detail.image ?? '',
        gallery: Array.isArray(detail.gallery) ? detail.gallery as string[] : [],
        storySections: Array.isArray(detail.storySections) ? detail.storySections : [],
        processSteps: Array.isArray(detail.processSteps) ? detail.processSteps : [],
        faqs: Array.isArray(detail.faqs) ? detail.faqs : [],
        highlights: Array.isArray(detail.highlights) ? detail.highlights : [],
      })
      setEditingServiceId(detail.id)
      setShowServiceForm(true)
    })
  }

  function handleSaveService() {
    if (!serviceForm.name.trim()) {
      setActionError('Add a service name before saving.')
      return
    }
    if (!serviceForm.categoryId) {
      setActionError('Select a service category before saving.')
      return
    }

    setActionError(null)
    startTransition(async () => {
      try {
        if (editingServiceId) {
          const res = await updateService(editingServiceId, serviceForm)
          if (!res.success) {
            setActionError(res.error || 'The service could not be saved.')
            return
          }
          setServicesList((prev) =>
            prev.map((s) => (s.id === editingServiceId ? { ...s, ...serviceForm } : s)),
          )
          setShowServiceForm(false)
        } else {
          const res = await createService(serviceForm)
          if (!res.success || !res.service) {
            setActionError(res.error || 'The service could not be created.')
            return
          }
          setServicesList((prev) => [...prev, res.service as Service])
          setShowServiceForm(false)
        }
      } catch (error) {
        console.error('Failed to save service:', error)
        setActionError('The service could not be saved. Check your connection and try again.')
      }
    })
  }

  function handleDeleteService(id: string) {
    if (!confirm('Delete this service?')) return
    setActionError(null)
    startTransition(async () => {
      try {
        const res = await deleteService(id)
        if (res.success) {
          setServicesList((prev) => prev.filter((s) => s.id !== id))
        } else {
          setActionError(res.error || 'The service could not be deleted.')
        }
      } catch (error) {
        console.error('Failed to delete service:', error)
        setActionError('The service could not be deleted. Check your connection and try again.')
      }
    })
  }

  return (
    <div className="space-y-8 p-8">
      {loadError && <div role="status" className="flex flex-wrap items-center justify-between gap-4 rounded border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-400/30 dark:bg-amber-950/30 dark:text-amber-100"><span>{loadError}</span><button type="button" onClick={() => window.location.reload()} className="font-medium underline underline-offset-4">Retry</button></div>}
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

      {actionError && <div role="alert" className="rounded border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{actionError}</div>}

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
              <button type="button" onClick={() => handleDeleteCategory(category.id)}>
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
                      <button type="button" onClick={() => openEditService(service)}>
                        <Edit className="w-4 h-4 text-muted-foreground" />
                      </button>
                      <button type="button" onClick={() => handleDeleteService(service.id)}>
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
              <button type="button" onClick={() => setShowCategoryForm(false)}>
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
              <Button type="button" disabled={isPending} onClick={handleCreateCategory} className="rounded-none w-full">
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
              <button type="button" onClick={() => setShowServiceForm(false)}>
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
              <div className="grid gap-3 rounded border border-border/60 bg-muted/20 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Editorial template</p>
                <Textarea placeholder="Vision statement" value={serviceForm.visionStatement} onChange={(e) => setServiceForm((f) => ({ ...f, visionStatement: e.target.value }))} />
                <Textarea placeholder="What this service solves" value={serviceForm.whatWeSolve} onChange={(e) => setServiceForm((f) => ({ ...f, whatWeSolve: e.target.value }))} />
                <Textarea placeholder="Our approach" value={serviceForm.approach} onChange={(e) => setServiceForm((f) => ({ ...f, approach: e.target.value }))} />
                <Textarea placeholder="Deliverables, one per line" value={serviceForm.deliverables.join('\n')} onChange={(e) => setServiceForm((f) => ({ ...f, deliverables: e.target.value.split('\n').map((item) => item.trim()).filter(Boolean) }))} />
                <Input placeholder="Related service slugs, comma separated" value={serviceForm.relatedServices.join(', ')} onChange={(e) => setServiceForm((f) => ({ ...f, relatedServices: e.target.value.split(',').map((item) => item.trim()).filter(Boolean) }))} />
                <Input placeholder="Related project slugs, comma separated" value={serviceForm.relatedProjects.join(', ')} onChange={(e) => setServiceForm((f) => ({ ...f, relatedProjects: e.target.value.split(',').map((item) => item.trim()).filter(Boolean) }))} />
              </div>
              <StructuredListEditor kind="story" value={serviceForm.storySections} onChange={(storySections) => setServiceForm((f) => ({ ...f, storySections }))} />
              <StructuredListEditor kind="process" value={serviceForm.processSteps} onChange={(processSteps) => setServiceForm((f) => ({ ...f, processSteps }))} />
              <StructuredListEditor kind="faq" value={serviceForm.faqs} onChange={(faqs) => setServiceForm((f) => ({ ...f, faqs }))} />
              <StructuredListEditor kind="highlight" value={serviceForm.highlights} onChange={(highlights) => setServiceForm((f) => ({ ...f, highlights }))} />
              <div>
                <label className="text-sm font-medium text-foreground">Gallery</label>
                <div className="mt-2">
                  <ImageUpload
                    value={serviceForm.gallery}
                    onChange={(gallery) =>
                      setServiceForm((f) => ({ ...f, gallery, image: f.image || gallery[0] || '' }))
                    }
                    maxImages={40}
                  />
                </div>
              </div>
              <Button type="button" disabled={isPending} onClick={handleSaveService} className="rounded-none w-full">
                {editingServiceId ? 'Save Changes' : 'Create Service'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
