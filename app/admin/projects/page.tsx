'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Plus, Edit, Trash2, Search, X } from 'lucide-react'
import { projects as seedProjects, Project as SeedProject } from '@/lib/data/projects'

interface Project {
  id: string
  name: string
  client: string
  description: string
  status: 'draft' | 'in-progress' | 'completed' | 'on-hold'
  progress: number
  dueDate: string
  createdAt: string
}

const SEED_PROJECTS: Project[] = [
  {
    id: '1',
    name: 'Nakasero Residence',
    client: 'Sarah Kiwanuka',
    description: 'Modern family home renovation with contemporary interior design. Focus on open-plan living and sustainable materials.',
    status: 'in-progress',
    progress: 65,
    dueDate: '2026-09-15',
    createdAt: new Date().toLocaleDateString(),
  },
  {
    id: '2',
    name: 'Kololo Villa Renovation',
    client: 'James Mutua',
    description: 'Luxury villa renovation featuring custom furniture and bespoke design elements. Multi-phase project with high-end finishes.',
    status: 'in-progress',
    progress: 45,
    dueDate: '2026-10-30',
    createdAt: new Date().toLocaleDateString(),
  },
  {
    id: '3',
    name: 'Serena Penthouse Suite',
    client: 'Hotel Management',
    description: 'Five-star hotel penthouse suite complete interior design. Premium materials and luxury finishes throughout.',
    status: 'completed',
    progress: 100,
    dueDate: '2026-08-20',
    createdAt: new Date().toLocaleDateString(),
  },
  {
    id: '4',
    name: 'Muyenga Heritage Home',
    client: 'Family Trust',
    description: 'Heritage home preservation with modern amenities. Blending traditional architecture with contemporary comfort.',
    status: 'on-hold',
    progress: 30,
    dueDate: '2026-11-10',
    createdAt: new Date().toLocaleDateString(),
  },
  {
    id: '5',
    name: 'Pearl Marina Corporate HQ',
    client: 'Corporate Client',
    description: 'Corporate headquarters interior design. Conference rooms, executive offices, and collaborative workspaces.',
    status: 'in-progress',
    progress: 75,
    dueDate: '2026-09-30',
    createdAt: new Date().toLocaleDateString(),
  },
]

export default function AdminProjects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    client: '',
    description: '',
    status: 'draft' as 'draft' | 'in-progress' | 'completed' | 'on-hold',
    progress: '0',
    dueDate: '',
  })

  useEffect(() => {
    // Seed projects from data file on initial load
    const initialProjects: Project[] = seedProjects.map((p: SeedProject) => ({
      id: p.id,
      name: p.name,
      client: p.client,
      description: p.description,
      status: p.status,
      progress: p.progress,
      dueDate: p.dueDate,
      createdAt: p.createdAt,
    }))
    setProjects(initialProjects)
  }, [])

  const handleAddProject = () => {
    if (!formData.name || !formData.client || !formData.dueDate) {
      alert('Please fill in required fields')
      return
    }

    if (editingId) {
      setProjects(projects.map(p =>
        p.id === editingId
          ? { ...p, ...formData, progress: Number(formData.progress), status: formData.status as Project['status'] }
          : p
      ))
      setEditingId(null)
    } else {
      const newProject: Project = {
        id: Date.now().toString(),
        name: formData.name,
        client: formData.client,
        description: formData.description,
        status: formData.status as Project['status'],
        progress: Number(formData.progress),
        dueDate: formData.dueDate,
        createdAt: new Date().toLocaleDateString(),
      }
      setProjects([newProject, ...projects])
    }

    setFormData({ name: '', client: '', description: '', status: 'draft', progress: '0', dueDate: '' })
    setIsFormOpen(false)
  }

  const handleEdit = (project: Project) => {
    setFormData({
      name: project.name,
      client: project.client,
      description: project.description,
      status: project.status,
      progress: project.progress.toString(),
      dueDate: project.dueDate,
    })
    setEditingId(project.id)
    setIsFormOpen(true)
  }

  const handleDelete = (id: string) => {
    if (confirm('Delete this project?')) {
      setProjects(projects.filter(p => p.id !== id))
    }
  }

  const filteredProjects = projects.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.client.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const statusColors = {
    'draft': 'bg-gray-100/20 text-gray-700',
    'in-progress': 'bg-blue-100/20 text-blue-700',
    'completed': 'bg-green-100/20 text-green-700',
    'on-hold': 'bg-orange-100/20 text-orange-700',
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-4xl font-light text-foreground">Projects</h1>
        <p className="text-muted-foreground mt-2">Create, edit, and manage design projects</p>
      </div>

      {/* Add/Edit Form */}
      {isFormOpen && (
        <Card className="p-8 border-border/20">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-serif text-2xl font-light text-foreground">
              {editingId ? 'Edit Project' : 'New Project'}
            </h2>
            <button
              onClick={() => {
                setIsFormOpen(false)
                setEditingId(null)
                setFormData({ name: '', client: '', description: '', status: 'draft', progress: '0', dueDate: '' })
              }}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Project Name *</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Nakasero Residence"
                className="rounded-none border-muted"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Client Name *</label>
              <Input
                value={formData.client}
                onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                placeholder="e.g., Sarah Kiwanuka"
                className="rounded-none border-muted"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as Project['status'] })}
                className="w-full px-4 py-2 border border-muted rounded-none bg-background text-foreground"
              >
                <option value="draft">Draft</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="on-hold">On Hold</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Progress (%)</label>
              <Input
                type="number"
                min="0"
                max="100"
                value={formData.progress}
                onChange={(e) => setFormData({ ...formData, progress: e.target.value })}
                placeholder="0-100"
                className="rounded-none border-muted"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Due Date *</label>
              <Input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="rounded-none border-muted"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-foreground mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Project description and details..."
                rows={4}
                className="w-full px-4 py-2 border border-muted rounded-none bg-background text-foreground font-light resize-none"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleAddProject}
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-none"
            >
              {editingId ? 'Update Project' : 'Create Project'}
            </Button>
            <Button
              onClick={() => {
                setIsFormOpen(false)
                setEditingId(null)
                setFormData({ name: '', client: '', description: '', status: 'draft', progress: '0', dueDate: '' })
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
            placeholder="Search projects..."
            className="pl-10 rounded-none border-muted"
          />
        </div>
        {!isFormOpen && (
          <Button
            onClick={() => setIsFormOpen(true)}
            className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-none"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Project
          </Button>
        )}
      </div>

      {/* Projects List */}
      <div className="space-y-3">
        {filteredProjects.length === 0 ? (
          <Card className="p-12 border-border/20 border-dashed text-center">
            <p className="text-muted-foreground mb-2">No projects yet</p>
            <p className="text-sm text-muted-foreground/70">Click "New Project" to create your first project.</p>
          </Card>
        ) : (
          filteredProjects.map(project => (
            <Card key={project.id} className="p-6 border-border/20 hover:border-primary/20 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="font-medium text-foreground text-lg">{project.name}</h3>
                    <span className={`text-xs px-2 py-1 rounded uppercase font-medium ${statusColors[project.status]}`}>
                      {project.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-6 text-sm mb-4">
                    <div>
                      <p className="text-muted-foreground text-xs uppercase tracking-wider">Client</p>
                      <p className="text-foreground">{project.client}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs uppercase tracking-wider">Due Date</p>
                      <p className="text-foreground">{project.dueDate}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs uppercase tracking-wider">Created</p>
                      <p className="text-foreground">{project.createdAt}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs uppercase tracking-wider">Progress</p>
                      <p className="text-foreground font-medium">{project.progress}%</p>
                    </div>
                  </div>
                  {project.description && (
                    <p className="text-sm text-muted-foreground/80 line-clamp-2">{project.description}</p>
                  )}
                  <div className="mt-3 w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => handleEdit(project)}
                    className="p-2 text-primary hover:bg-primary/10 rounded transition-colors"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(project.id)}
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
      {projects.length > 0 && (
        <div className="grid md:grid-cols-4 gap-6 pt-8 border-t border-border/20">
          <Card className="p-6 border-border/20">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">Total Projects</p>
            <p className="font-serif text-4xl font-light text-foreground">{projects.length}</p>
          </Card>
          <Card className="p-6 border-border/20">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">In Progress</p>
            <p className="font-serif text-4xl font-light text-foreground">{projects.filter(p => p.status === 'in-progress').length}</p>
          </Card>
          <Card className="p-6 border-border/20">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">Completed</p>
            <p className="font-serif text-4xl font-light text-foreground">{projects.filter(p => p.status === 'completed').length}</p>
          </Card>
          <Card className="p-6 border-border/20">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">Avg Progress</p>
            <p className="font-serif text-4xl font-light text-foreground">
              {Math.round(projects.reduce((sum, p) => sum + p.progress, 0) / projects.length)}%
            </p>
          </Card>
        </div>
      )}
    </div>
  )
}
