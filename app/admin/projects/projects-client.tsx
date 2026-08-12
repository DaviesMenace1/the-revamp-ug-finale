'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Plus, Search, X, Upload, Edit, Trash2 } from 'lucide-react'
import Image from 'next/image'
import { CldUploadWidget } from 'next-cloudinary'
import { createProject, updateProject, deleteProject } from '@/lib/actions/projects'

function ImageUpload({ value = [], onChange, maxImages = 5, label = "Upload Image" }: { value: string[]; onChange: (val: string[]) => void; maxImages?: number, label?: string }) {
  const handleRemove = (urlToRemove: string) => {
    onChange(value.filter((url) => url !== urlToRemove))
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {value.map((url, idx) => (
          <div key={idx} className="relative h-32 rounded-lg overflow-hidden border border-border/20 group">
            <Image src={url} alt="Uploaded project asset" fill className="object-cover" />
            <button
              type="button"
              onClick={() => handleRemove(url)}
              className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}

        {value.length < maxImages && (
          <CldUploadWidget
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
                  className="border-2 border-dashed border-border/40 hover:border-primary/50 rounded-lg h-32 flex flex-col items-center justify-center cursor-pointer bg-muted/5 transition-colors w-full"
                >
                  <Upload className="w-6 h-6 text-muted-foreground mb-1" />
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

const defaultForm = {
  title: '', slug: '', clientName: '', location: '', category: '', subCategory: '', designer: '', budget: '',
  description: '', longDescription: '', thumbnailImage: '', tags: '', images: [], gallery: [], publishStatus: 'published'
}

export default function ProjectsClient({ initialProjects = [] }: { initialProjects: any[] }) {
  const [projects, setProjects] = useState(initialProjects)
  const [searchTerm, setSearchTerm] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

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
      location: project.location || '',
      category: project.category || '',
      subCategory: project.subCategory || '',
      designer: project.designer || '',
      budget: project.budget || '',
      description: project.description || '',
      longDescription: project.longDescription || '',
      thumbnailImage: project.thumbnailImage || '',
      tags: Array.isArray(project.tags) ? project.tags.join(', ') : '',
      images: project.images || [],
      gallery: project.gallery || [],
      publishStatus: project.publishStatus || 'published',
    })
    setEditingId(project.id)
    setIsFormOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project? This cannot be undone.')) return
    
    startTransition(async () => {
      const res = await deleteProject(id)
      if (res.success) {
        setProjects(projects.filter(p => p.id !== id))
      }
    })
  }

  const handleSubmit = async () => {
    if (!formData.title || !formData.slug) {
      alert('Please fill in required fields (Title and Slug)')
      return
    }

    const submissionData = {
      ...formData,
      tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
    }

    startTransition(async () => {
      if (editingId) {
        const res = await updateProject(editingId, submissionData)
        if (res.success) {
          // Update local state to reflect change without full reload
          setProjects(projects.map(p => p.id === editingId ? { ...p, ...submissionData } : p))
          setEditingId(null)
          setIsFormOpen(false)
        }
      } else {
        const res = await createProject(submissionData)
        if (res.success) {
          // Force a hard refresh to get the new ID from the database
          window.location.reload() 
        }
      }
      setFormData(defaultForm)
    })
  }

  const filteredProjects = projects.filter(p => 
    p.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.clientName?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl font-light text-foreground">Projects Management</h1>
          <p className="text-muted-foreground mt-2">Manage your portfolio, project details, and galleries</p>
        </div>
        
        {!isFormOpen && (
          <Button onClick={() => { setFormData(defaultForm); setEditingId(null); setIsFormOpen(true); }} className="bg-primary text-primary-foreground rounded-none shrink-0">
            <Plus className="w-4 h-4 mr-2" />
            New Project
          </Button>
        )}
      </div>

      {isFormOpen ? (
        <Card className="p-8 border-border/20">
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-border/10">
            <h2 className="font-serif text-2xl font-light text-foreground">
              {editingId ? 'Edit Project Details' : 'Create New Project'}
            </h2>
            <button onClick={() => { setIsFormOpen(false); setEditingId(null); }} className="text-muted-foreground hover:text-foreground">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Basic Info */}
            <div className="md:col-span-2"><h3 className="text-lg font-medium border-b pb-2">Basic Information</h3></div>
            
            <div><label className="block text-sm mb-2">Project Title *</label><Input value={formData.title} onChange={(e) => handleTitleChange(e.target.value)} placeholder="Nakasero Residence" className="rounded-none" /></div>
            <div><label className="block text-sm mb-2">URL Slug *</label><Input value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} placeholder="nakasero-residence" className="rounded-none" /></div>
            <div className="md:col-span-2"><label className="block text-sm mb-2">Short Description (Card Teaser)</label><Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="A brief 1-sentence tagline..." className="rounded-none" /></div>

            {/* Details */}
            <div className="md:col-span-2 mt-4"><h3 className="text-lg font-medium border-b pb-2">Project Details</h3></div>
            
            <div><label className="block text-sm mb-2">Client Name</label><Input value={formData.clientName} onChange={(e) => setFormData({ ...formData, clientName: e.target.value })} placeholder="Client or Company Name" className="rounded-none" /></div>
            <div><label className="block text-sm mb-2">Location</label><Input value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} placeholder="City, Country" className="rounded-none" /></div>
            <div><label className="block text-sm mb-2">Category</label><Input value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} placeholder="e.g. Interior Design" className="rounded-none" /></div>
            <div><label className="block text-sm mb-2">Sub-Category</label><Input value={formData.subCategory} onChange={(e) => setFormData({ ...formData, subCategory: e.target.value })} placeholder="e.g. Residential" className="rounded-none" /></div>
            <div><label className="block text-sm mb-2">Lead Designer</label><Input value={formData.designer} onChange={(e) => setFormData({ ...formData, designer: e.target.value })} placeholder="Designer Name" className="rounded-none" /></div>
            <div><label className="block text-sm mb-2">Project Budget</label><Input type="number" value={formData.budget} onChange={(e) => setFormData({ ...formData, budget: e.target.value })} placeholder="50000.00" className="rounded-none" /></div>
            
            <div className="md:col-span-2">
              <label className="block text-sm mb-2">Full Project Story / Long Description</label>
              <textarea value={formData.longDescription} onChange={(e) => setFormData({ ...formData, longDescription: e.target.value })} rows={6} className="w-full px-4 py-2 border border-input rounded-none bg-background text-foreground resize-none focus:ring-1 focus:ring-ring" placeholder="Describe the challenges, the design process, and the final solution..." />
            </div>
            
            <div className="md:col-span-2"><label className="block text-sm mb-2">Tags (Comma separated)</label><Input value={formData.tags} onChange={(e) => setFormData({ ...formData, tags: e.target.value })} placeholder="modern, minimalist, kitchen, renovation" className="rounded-none" /></div>

            {/* Media */}
            <div className="md:col-span-2 mt-4"><h3 className="text-lg font-medium border-b pb-2">Media & Assets</h3></div>

            <div className="md:col-span-2"><label className="block text-sm mb-2">Thumbnail Image URL (Main Display)</label><Input value={formData.thumbnailImage} onChange={(e) => setFormData({ ...formData, thumbnailImage: e.target.value })} placeholder="Paste Cloudinary URL here..." className="rounded-none" /></div>
            
            <div className="md:col-span-2">
              <label className="block text-sm mb-2">Main Project Images (Hero Carousel)</label>
              <ImageUpload value={formData.images} onChange={(images) => setFormData({ ...formData, images })} maxImages={10} label="Upload Hero Image" />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm mb-2">Extended Gallery (Before/Afters, Details)</label>
              <ImageUpload value={formData.gallery} onChange={(gallery) => setFormData({ ...formData, gallery })} maxImages={20} label="Upload Gallery Image" />
            </div>
          </div>

          <div className="flex items-center gap-4 pt-6 border-t border-border/10">
            <Button onClick={handleSubmit} disabled={isPending} className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-none px-8">
              {isPending ? 'Saving...' : editingId ? 'Save Changes' : 'Publish Project'}
            </Button>
            <Button onClick={() => { setIsFormOpen(false); setEditingId(null); }} variant="outline" className="rounded-none">
              Cancel
            </Button>
          </div>
        </Card>
      ) : (
        <>
          {/* Dashboard View - List of Projects */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search projects by title, client, or category..." className="pl-10 rounded-none border-muted max-w-md" />
          </div>

          {filteredProjects.length === 0 ? (
            <div className="text-center py-20 border-2 border-dashed border-border/40 text-muted-foreground">
              No projects found. Create one to get started!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((project) => (
                <Card key={project.id} className="overflow-hidden border-border/20 rounded-none group">
                  <div className="relative h-48 bg-muted">
                    {project.thumbnailImage || project.images?.[0] ? (
                      <Image src={project.thumbnailImage || project.images[0]} alt={project.title} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground/50 text-sm">No Image</div>
                    )}
                    <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEdit(project)} className="p-2 bg-white/90 text-black hover:bg-white rounded shadow-sm" title="Edit">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(project.id)} className="p-2 bg-destructive/90 text-white hover:bg-destructive rounded shadow-sm" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium text-lg truncate">{project.title}</h3>
                    <p className="text-sm text-muted-foreground truncate">{project.clientName || 'No client specified'} • {project.category || 'Uncategorized'}</p>
                    <div className="mt-4 flex gap-2 flex-wrap">
                      {(project.tags || []).slice(0, 3).map((tag: string, i: number) => (
                        <span key={i} className="text-[10px] uppercase tracking-wider bg-secondary px-2 py-1">{tag}</span>
                      ))}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
