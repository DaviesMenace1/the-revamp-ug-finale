'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Plus, Search, X, Upload, Edit, Trash2, Eye, MapPin, Tag } from 'lucide-react'
import Image from 'next/image'
import { CldUploadWidget } from 'next-cloudinary'
import { createProject, updateProject, deleteProject } from '@/lib/actions/projects'
import { StructuredListEditor } from '@/components/admin/structured-list-editor'
import { SingleImageUpload } from '@/components/admin/single-image-upload'

function ImageUpload({
  value = [],
  onChange,
  maxImages = 5,
  label = "Upload Image"
}: {
  value: string[];
  onChange: (val: string[]) => void;
  maxImages?: number;
  label?: string
}) {
  const handleRemove = (urlToRemove: string) => {
    onChange(value.filter((url) => url !== urlToRemove))
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {value.map((url, idx) => (
          <div key={idx} className="relative h-28 rounded-lg overflow-hidden border border-border/20 group">
            <Image src={url} alt="Uploaded project asset" fill className="object-cover" />
            <button
              type="button"
              onClick={() => handleRemove(url)}
              className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}

        {value.length < maxImages && (
          <CldUploadWidget
            options={{ multiple: true, maxFiles: Math.max(1, maxImages - value.length) }}
            uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'revamp_preset'}
            onSuccess={(result: any) => {
              if (result?.info?.secure_url) {
                onChange([...value, result.info.secure_url])
              }
            }}
          >
            {({ open }) => {
              return (
                <button
                  type="button"
                  onClick={() => open()}
                  className="border-2 border-dashed border-border/40 hover:border-primary/50 rounded-lg h-28 flex flex-col items-center justify-center cursor-pointer bg-muted/5 transition-colors w-full"
                >
                  <Upload className="w-5 h-5 text-muted-foreground mb-1" />
                  <span className="text-xs text-muted-foreground font-light text-center px-2">{label}</span>
                </button>
              )
            }}
          </CldUploadWidget>
        )}
      </div>
    </div>
  )
}

const defaultForm: {
  title: string
  slug: string
  clientName: string
  client: string
  location: string
  category: string
  subCategory: string
  designer: string
  budget: string
  description: string
  longDescription: string
  shortDescription: string
  thumbnailImage: string
  tags: string
  images: string[]
  gallery: string[]
  storySections: unknown[]
  highlights: unknown[]
  publishStatus: string
  year: string
  progress: string
  dueDate: string
} = {
  title: '', slug: '', clientName: '', client: '', location: '', category: '', subCategory: '', designer: '', budget: '',
  description: '', longDescription: '', shortDescription: '', thumbnailImage: '', tags: '',
  images: [], gallery: [], storySections: [], highlights: [], publishStatus: 'published', year: '', progress: '0', dueDate: '',
}

export default function ProjectsClient({ initialProjects = [], loadError = null }: { initialProjects: any[]; loadError?: string | null }) {
  const [projects, setProjects] = useState(initialProjects)
  const [searchTerm, setSearchTerm] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [actionError, setActionError] = useState<string | null>(null)

  const [formData, setFormData] = useState(defaultForm)

  const handleTitleChange = (title: string) => {
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    setFormData({ ...formData, title, slug })
  }

  const handleEdit = (project: any) => {
    setFormData({
      title: project.title || '',
      slug: project.slug || '',
      clientName: project.clientName || '',
      client: project.client || '',
      location: project.location || '',
      category: project.category || '',
      subCategory: project.subCategory || '',
      designer: project.designer || '',
      budget: project.budget || '',
      description: project.description || '',
      longDescription: project.longDescription || '',
      shortDescription: project.shortDescription || '',
      thumbnailImage: project.thumbnailImage || '',
      tags: Array.isArray(project.tags) ? project.tags.join(', ') : '',
      images: project.images || [],
      gallery: project.gallery || [], storySections: project.storySections || [], highlights: project.highlights || [],
      publishStatus: project.publishStatus || 'published',
      year: project.year || '',
      progress: project.progress != null ? String(project.progress) : '0',
      dueDate: project.dueDate ? String(project.dueDate).slice(0, 10) : '',
    })
    setEditingId(project.id)
    setIsFormOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return

    setActionError(null)
    startTransition(async () => {
      const res = await deleteProject(id)
      if (res.success) {
        setProjects((current) => current.filter((project) => project.id !== id))
      } else {
        setActionError(res.error || 'Failed to delete project. Refresh the page and try again.')
      }
    })
  }

  const handleSubmit = async () => {
    if (!formData.title) {
      alert('Please enter a project title.')
      return
    }

    const submissionData = {
      ...formData,
      tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      progress: formData.progress ? parseInt(formData.progress, 10) : 0,
      dueDate: formData.dueDate ? new Date(formData.dueDate) : null,
      storySections: formData.storySections, highlights: formData.highlights,
    }

    setActionError(null)
    startTransition(async () => {
      if (editingId) {
        const res = await updateProject(editingId, submissionData)
        if (res.success) {
          setProjects((current) => current.map((project) => project.id === editingId ? { ...project, ...submissionData, slug: res.project?.slug || submissionData.slug } : project))
          setEditingId(null)
          setIsFormOpen(false)
          setFormData(defaultForm)
        } else {
          setActionError(res.error || 'Failed to update project. Check the fields and try again.')
        }
      } else {
        const res = await createProject(submissionData)
        if (res.success) {
          window.location.reload()
        } else {
          setActionError(res.error || 'Failed to create project. Check the fields and try again.')
        }
      }
    })
  }

  const filteredProjects = projects.filter(p =>
    p.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b">
        <div>
          <h1 className="font-serif text-3xl font-normal text-foreground">Projects Catalog</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage project portfolios, client assets, and page visibility</p>
        </div>

        {!isFormOpen && (
          <Button
            onClick={() => { setFormData(defaultForm); setEditingId(null); setIsFormOpen(true); }}
            className="bg-primary text-primary-foreground rounded-none shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add New Project
          </Button>
        )}
      </div>

      {loadError && (
        <div role="status" className="flex items-center justify-between gap-4 rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
          <span>{loadError}</span>
          <button type="button" onClick={() => window.location.reload()} className="font-medium underline underline-offset-4">Retry</button>
        </div>
      )}

      {actionError && (
        <div role="alert" className="flex items-center justify-between gap-4 rounded border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
          <span>{actionError}</span>
          <button type="button" onClick={() => setActionError(null)} className="font-medium underline underline-offset-4">Dismiss</button>
        </div>
      )}

      {isFormOpen ? (
        /* Edit / Create Form */
        <Card className="p-8 border-border/30 rounded-none">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-border/20">
            <h2 className="font-serif text-2xl font-light text-foreground">
              {editingId ? 'Edit Project Details' : 'Create New Project'}
            </h2>
            <button onClick={() => { setIsFormOpen(false); setEditingId(null); }} className="text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="md:col-span-2"><h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground border-b pb-2">Overview</h3></div>

            <div><label className="block text-xs font-medium text-muted-foreground mb-1">Project Title *</label><Input value={formData.title} onChange={(e) => handleTitleChange(e.target.value)} placeholder="Nakasero Luxury Residence" className="rounded-none" /></div>
            <div><label className="block text-xs font-medium text-muted-foreground mb-1">URL Slug *</label><Input value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} placeholder="nakasero-luxury-residence" className="rounded-none" /></div>
            <div className="md:col-span-2"><label className="block text-xs font-medium text-muted-foreground mb-1">Short Teaser Description</label><Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Modern minimalist 4-bedroom architectural redesign..." className="rounded-none" /></div>

            <div className="md:col-span-2 mt-2"><h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground border-b pb-2">Specifications</h3></div>

            <div><label className="block text-xs font-medium text-muted-foreground mb-1">Client Name</label><Input value={formData.clientName} onChange={(e) => setFormData({ ...formData, clientName: e.target.value })} placeholder="Sarah Kiwanuka" className="rounded-none" /></div>
            <div><label className="block text-xs font-medium text-muted-foreground mb-1">Client (display label)</label><Input value={formData.client} onChange={(e) => setFormData({ ...formData, client: e.target.value })} placeholder="Private Residence" className="rounded-none" /></div>
            <div><label className="block text-xs font-medium text-muted-foreground mb-1">Location</label><Input value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} placeholder="Kampala, Uganda" className="rounded-none" /></div>
            <div><label className="block text-xs font-medium text-muted-foreground mb-1">Category</label><Input value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} placeholder="Residential Interior" className="rounded-none" /></div>
            <div><label className="block text-xs font-medium text-muted-foreground mb-1">Sub-Category</label><Input value={formData.subCategory} onChange={(e) => setFormData({ ...formData, subCategory: e.target.value })} placeholder="Living Room" className="rounded-none" /></div>
            <div><label className="block text-xs font-medium text-muted-foreground mb-1">Lead Designer</label><Input value={formData.designer} onChange={(e) => setFormData({ ...formData, designer: e.target.value })} placeholder="Revamp Design Team" className="rounded-none" /></div>
            <div><label className="block text-xs font-medium text-muted-foreground mb-1">Estimated Budget ($)</label><Input type="number" value={formData.budget} onChange={(e) => setFormData({ ...formData, budget: e.target.value })} placeholder="45000" className="rounded-none" /></div>
            <div><label className="block text-xs font-medium text-muted-foreground mb-1">Year</label><Input value={formData.year} onChange={(e) => setFormData({ ...formData, year: e.target.value })} placeholder="2026" className="rounded-none" /></div>
            <div><label className="block text-xs font-medium text-muted-foreground mb-1">Completion Progress (%)</label><Input type="number" min="0" max="100" value={formData.progress} onChange={(e) => setFormData({ ...formData, progress: e.target.value })} placeholder="75" className="rounded-none" /></div>
            <div><label className="block text-xs font-medium text-muted-foreground mb-1">Due Date</label><Input type="date" value={formData.dueDate} onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })} className="rounded-none" /></div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-muted-foreground mb-1">Short Description (portfolio card summary)</label>
              <textarea value={formData.shortDescription} onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })} rows={2} className="w-full px-3 py-2 border border-input rounded-none bg-background text-sm resize-none" placeholder="A one or two line summary shown on portfolio cards..." />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-muted-foreground mb-1">Full Project Story</label>
              <textarea value={formData.longDescription} onChange={(e) => setFormData({ ...formData, longDescription: e.target.value })} rows={5} className="w-full px-3 py-2 border border-input rounded-none bg-background text-sm resize-none" placeholder="Explain spatial layout, material selections, and lighting strategy..." />
            </div>

            <div className="md:col-span-2 grid gap-4 md:grid-cols-2">
              <StructuredListEditor kind="story" value={formData.storySections} onChange={(storySections) => setFormData({ ...formData, storySections })} />
              <StructuredListEditor kind="highlight" value={formData.highlights} onChange={(highlights) => setFormData({ ...formData, highlights })} />
            </div>

            <div className="md:col-span-2"><label className="block text-xs font-medium text-muted-foreground mb-1">Tags (Comma-separated)</label><Input value={formData.tags} onChange={(e) => setFormData({ ...formData, tags: e.target.value })} placeholder="minimalist, hardwood, accent-lighting" className="rounded-none" /></div>

            <div className="md:col-span-2 mt-2"><h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground border-b pb-2">Media & Galleries</h3></div>

            <div className="md:col-span-2"><label className="block text-xs font-medium text-muted-foreground mb-2">Main Cover Thumbnail</label><SingleImageUpload value={formData.thumbnailImage} onChange={(thumbnailImage) => setFormData({ ...formData, thumbnailImage })} label="Upload cover thumbnail" /></div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-muted-foreground mb-2">Project Key Showcase Images</label>
              <ImageUpload value={formData.images} onChange={(images) => setFormData({ ...formData, images })} maxImages={15} label="Upload Main Photo" />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-muted-foreground mb-2">Extended Photo Gallery</label>
              <ImageUpload value={formData.gallery} onChange={(gallery) => setFormData({ ...formData, gallery })} maxImages={40} label="Upload Gallery Detail" />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-4 border-t">
            <Button onClick={handleSubmit} disabled={isPending} className="bg-primary text-primary-foreground rounded-none px-6">
              {isPending ? 'Saving...' : editingId ? 'Update Project' : 'Publish Project'}
            </Button>
            <Button onClick={() => { setIsFormOpen(false); setEditingId(null); }} variant="outline" className="rounded-none">
              Cancel
            </Button>
          </div>
        </Card>
      ) : (
        /* Products-Style Table View */
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by title, client, or category..."
                className="pl-9 rounded-none text-sm"
              />
            </div>
            <div className="text-xs text-muted-foreground">
              Showing <span className="font-semibold text-foreground">{filteredProjects.length}</span> projects
            </div>
          </div>

          <div className="border border-border/40 rounded-none bg-background overflow-x-auto shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/40 text-muted-foreground uppercase text-[11px] font-semibold tracking-wider border-b border-border/30">
                <tr>
                  <th className="py-3 px-4 w-16">Image</th>
                  <th className="py-3 px-4">Project / Slug</th>
                  <th className="py-3 px-4">Client & Location</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Budget</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {filteredProjects.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-muted-foreground font-light">
                      No projects match your search criteria.
                    </td>
                  </tr>
                ) : (
                  filteredProjects.map((project) => {
                    const thumb = project.thumbnailImage || project.images?.[0]
                    return (
                      <tr key={project.id} className="hover:bg-muted/10 transition-colors group">
                        {/* Thumbnail */}
                        <td className="py-3 px-4">
                          <div className="relative w-12 h-12 rounded bg-muted overflow-hidden border border-border/20 shrink-0">
                            {thumb ? (
                              <Image src={thumb} alt={project.title} fill className="object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[10px] text-muted-foreground">No img</div>
                            )}
                          </div>
                        </td>

                        {/* Title & Slug */}
                        <td className="py-3 px-4">
                          <div className="font-medium text-foreground group-hover:text-primary transition-colors">
                            {project.title}
                          </div>
                          <div className="text-xs text-muted-foreground font-mono truncate max-w-[180px]">
                            /{project.slug}
                          </div>
                        </td>

                        {/* Client & Location */}
                        <td className="py-3 px-4">
                          <div className="text-xs font-medium text-foreground">{project.clientName || 'N/A'}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3" />
                            {project.location || 'N/A'}
                          </div>
                        </td>

                        {/* Category */}
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1 text-xs bg-muted/50 px-2 py-0.5 border border-border/30 rounded-none">
                            <Tag className="w-3 h-3 text-muted-foreground" />
                            {project.category || 'Uncategorized'}
                          </span>
                        </td>

                        {/* Budget */}
                        <td className="py-3 px-4 font-mono text-xs">
                          {project.budget ? `$${Number(project.budget).toLocaleString()}` : 'N/A'}
                        </td>

                        {/* Status Badge */}
                        <td className="py-3 px-4">
                          <span className="inline-block px-2 py-0.5 text-[10px] uppercase font-semibold tracking-wider bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 rounded-none">
                            {project.publishStatus || 'Published'}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEdit(project)}
                              className="h-8 px-2 text-muted-foreground hover:text-foreground"
                              title="Edit Project"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(project.id)}
                              className="h-8 px-2 text-destructive hover:bg-destructive/10"
                              title="Delete Project"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

