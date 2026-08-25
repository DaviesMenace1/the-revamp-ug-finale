'use client'

import { useState, useTransition, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Upload, Trash2, Loader2, FileText, Clock, Plus, CheckSquare, Square } from 'lucide-react'
import { updateClientProject } from '@/lib/actions/client-projects'
import ProjectNotesPanel from '@/components/projects/project-notes-panel'
import { createTask, updateTaskStatus, deleteTask } from '@/lib/actions/tasks'

const PHASE_STEPS = [
  'consultation',
  'concept',
  'design',
  'visualization',
  'approval',
  'procurement',
  'installation',
  'handover',
]

const PHASE_LABELS: Record<string, string> = {
  consultation: 'Briefing & discovery',
  concept: 'Concept direction',
  design: 'Design development',
  visualization: '3D visualization',
  approval: 'Client approval',
  procurement: 'Procurement',
  installation: 'Installation',
  handover: 'Handover',
}

const ASSET_TYPES = [
    '3d_render',
  '3d_model',
  'glb',
  'gltf',
  'floor_plan',

  'elevation',
  'section',
  'cad',
  'pdf',
  'image',
  'video',
  '360_view',
  'moodboard',
  'presentation',
]

const DOCUMENT_EXTENSIONS = new Set(['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.csv', '.rtf', '.odt', '.ods', '.odp'])
const STORAGE_UPLOAD_TIMEOUT_MS = 5 * 60 * 1000

async function uploadToStorage(uploadUrl: string, file: File, contentType: string) {
  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), STORAGE_UPLOAD_TIMEOUT_MS)
  try {
    return await fetch(uploadUrl, {
      method: 'PUT',
      mode: 'cors',
      headers: { 'Content-Type': contentType },
      body: file,
      signal: controller.signal,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('The storage upload timed out. Check your connection and R2 CORS settings, then try again.')
    }
    if (error instanceof TypeError) {
      const origin = typeof window !== 'undefined' ? window.location.origin : 'this site'
      throw new Error(`The browser could not reach storage from ${origin}. Add this exact origin and its preview domain to the R2 bucket CORS origins, allow PUT, and allow the Content-Type header.`)
    }
    throw error
  } finally {
    window.clearTimeout(timeoutId)
  }
}

const APPROVAL_BADGE: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  approved: 'bg-emerald-100 text-emerald-800',
  changes_requested: 'bg-rose-100 text-rose-800',
}

type Asset = {
  id: string
  title: string
  description: string | null
  assetType: string
  fileUrl: string
  thumbnailUrl: string | null
  version: number
  isCurrentVersion: boolean
  visibility: string
  approvalStatus: string
  createdAt: string
}

type Document = {
  id: string
  name: string
  category: string | null
  fileUrl: string
  visibility: string
  signatureStatus: string | null
  createdAt: string
}

type Task = {
  id: string
  title: string
  description: string | null
  assignedTo: string
  status: string
  dueDate: string | null
  createdAt: string
}

type ActivityItem = {
  id: string
  action: string
  summary: string
  actorType: string
  createdAt: string
}

type Project = {
  id: string
  title: string
  description: string | null
  location: string | null
  budget: string | null
  designer: string | null
  status: string | null
  currentPhase: string
  progress: number
  dueDate: string | null
  client: { name: string; email: string } | null
  assets: Asset[]
  documents: Document[]
  tasks: Task[]
  activity: ActivityItem[]
  notes: { id: string; body: string; authorType: string; createdAt: string }[]
  notesAvailable: boolean
}

export default function ClientProjectDetailClient({ project: initialProject }: { project: Project }) {
  const [project, setProject] = useState(initialProject)
  const [isPending, startTransition] = useTransition()
  const [uploadingAsset, setUploadingAsset] = useState(false)
  const [uploadingDoc, setUploadingDoc] = useState(false)
  const [error, setError] = useState('')

  const [assetForm, setAssetForm] = useState({ title: '', assetType: '3d_render', visibility: 'client' })
  const assetFileRef = useRef<HTMLInputElement>(null)

  const [docForm, setDocForm] = useState({ name: '', category: 'general', visibility: 'client', signatureStatus: 'n/a' })
  const docFileRef = useRef<HTMLInputElement>(null)

  const [taskForm, setTaskForm] = useState({ title: '', description: '', assignedTo: 'client', dueDate: '' })
  const [showTaskForm, setShowTaskForm] = useState(false)

  function handlePhaseChange(phase: string) {
    startTransition(async () => {
      const res = await updateClientProject(project.id, { currentPhase: phase })
      if (res.success) setProject((p) => ({ ...p, currentPhase: phase }))
    })
  }

  function handleProgressChange(progress: number) {
    startTransition(async () => {
      const res = await updateClientProject(project.id, { progress })
      if (res.success) setProject((p) => ({ ...p, progress }))
    })
  }

  async function parseApiResponse<T>(response: Response, fallback: string) {
    const text = await response.text()
    try {
      return JSON.parse(text) as T
    } catch {
      throw new Error(response.ok ? fallback : `${fallback} (HTTP ${response.status}).`)
    }
  }

  async function handleUploadAsset() {
    const file = assetFileRef.current?.files?.[0]
    if (!file || !assetForm.title.trim()) {
      setError('Title and file are required.')
      return
    }
    if (file.size <= 0 || file.size > 100 * 1024 * 1024) {
      setError('Assets must be between 1 byte and 100 MB.')
      return
    }

    setError('')
    setUploadingAsset(true)

    try {
      const prepareResponse = await fetch(`/api/admin/projects/${project.id}/assets/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'presign',
          filename: file.name,
          assetType: assetForm.assetType,
          contentType: file.type,
        }),
      })
      const prepared = await parseApiResponse<{ success?: boolean; uploadUrl?: string; storageKey?: string; contentType?: string; error?: string }>(prepareResponse, 'The asset upload could not be prepared.')
      if (!prepareResponse.ok || !prepared.success || !prepared.uploadUrl || !prepared.storageKey) {
        throw new Error(prepared.error || 'The asset upload could not be prepared.')
      }

      const uploadResponse = await uploadToStorage(prepared.uploadUrl, file, prepared.contentType || file.type || 'application/octet-stream')
      if (!uploadResponse.ok) throw new Error(`The file could not be sent to storage (HTTP ${uploadResponse.status}). Check the R2 bucket CORS settings and try again.`)

      const completeResponse = await fetch(`/api/admin/projects/${project.id}/assets/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'complete',
          title: assetForm.title,
          assetType: assetForm.assetType,
          visibility: assetForm.visibility,
          filename: file.name,
          contentType: file.type,
          storageKey: prepared.storageKey,
        }),
      })
      const data = await parseApiResponse<{ success?: boolean; asset?: Asset; error?: string }>(completeResponse, 'The asset was uploaded but could not be added to the project.')
      if (!completeResponse.ok || !data.success || !data.asset) throw new Error(data.error || 'The asset was uploaded but could not be added to the project.')

      setProject((p) => ({ ...p, assets: [data.asset as Asset, ...p.assets] }))
      setAssetForm({ title: '', assetType: '3d_render', visibility: 'client' })
      if (assetFileRef.current) assetFileRef.current.value = ''
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload asset.')
    } finally {
      setUploadingAsset(false)
    }
  }

  async function handleUploadDocument() {
    const file = docFileRef.current?.files?.[0]
    if (!file || !docForm.name.trim()) {
      setError('Name and file are required.')
      return
    }

    const extension = file.name.includes('.') ? file.name.slice(file.name.lastIndexOf('.')).toLowerCase() : ''
    if (!DOCUMENT_EXTENSIONS.has(extension)) {
      setError('Choose a supported document: PDF, Word, Excel, PowerPoint, text, CSV, or OpenDocument.')
      return
    }
    if (file.size <= 0 || file.size > 100 * 1024 * 1024) {
      setError('Documents must be between 1 byte and 100 MB.')
      return
    }

    setError('')
    setUploadingDoc(true)

    try {
      const prepareResponse = await fetch(`/api/admin/projects/${project.id}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'presign',
          filename: file.name,
          contentType: file.type,
        }),
      })
      const prepared = await parseApiResponse<{ success?: boolean; uploadUrl?: string; storageKey?: string; contentType?: string; error?: string }>(prepareResponse, 'The document upload could not be prepared.')
      if (!prepareResponse.ok || !prepared.success || !prepared.uploadUrl || !prepared.storageKey) {
        throw new Error(prepared.error || 'The document upload could not be prepared.')
      }

      const uploadResponse = await uploadToStorage(prepared.uploadUrl, file, prepared.contentType || file.type || 'application/octet-stream')
      if (!uploadResponse.ok) {
        throw new Error(`The file could not be sent to storage (HTTP ${uploadResponse.status}). Check the R2 bucket CORS settings and try again.`)
      }

      const completeResponse = await fetch(`/api/admin/projects/${project.id}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'complete',
          name: docForm.name,
          category: docForm.category,
          visibility: docForm.visibility,
          signatureStatus: docForm.signatureStatus,
          filename: file.name,
          contentType: file.type,
          storageKey: prepared.storageKey,
        }),
      })
      const data = await parseApiResponse<{ success?: boolean; document?: Document; error?: string }>(completeResponse, 'The document was uploaded but could not be added to the project.')
      const document = data.document
      if (!completeResponse.ok || !data.success || !document) {
        throw new Error(data.error || 'The document was uploaded but could not be added to the project.')
      }

      setProject((p) => ({ ...p, documents: [document, ...p.documents] }))
      setDocForm({ name: '', category: 'general', visibility: 'client', signatureStatus: 'n/a' })
      if (docFileRef.current) docFileRef.current.value = ''
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload document.')
    } finally {
      setUploadingDoc(false)
    }
  }

  async function handleUpdateSignatureStatus(documentId: string, signatureStatus: string) {
    const res = await fetch(`/api/admin/projects/${project.id}/documents`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ documentId, signatureStatus }),
    })
    if (res.ok) {
      setProject((p) => ({
        ...p,
        documents: p.documents.map((d) => (d.id === documentId ? { ...d, signatureStatus } : d)),
      }))
    }
  }

  function handleCreateTask() {
    if (!taskForm.title.trim()) return

    startTransition(async () => {
      const res = await createTask({
        projectId: project.id,
        title: taskForm.title,
        description: taskForm.description,
        assignedTo: taskForm.assignedTo as 'client' | 'admin',
        dueDate: taskForm.dueDate || null,
      })
      if (res.success && res.task) {
        const task: Task = {
          id: res.task.id,
          title: res.task.title,
          description: res.task.description,
          assignedTo: res.task.assignedTo,
          status: res.task.status,
          dueDate: res.task.dueDate ? new Date(res.task.dueDate).toISOString() : null,
          createdAt: new Date(res.task.createdAt).toISOString(),
        }
        setProject((p) => ({ ...p, tasks: [task, ...p.tasks] }))
        setTaskForm({ title: '', description: '', assignedTo: 'client', dueDate: '' })
        setShowTaskForm(false)
      }
    })
  }

  function handleToggleTask(task: Task) {
    const newStatus = task.status === 'done' ? 'pending' : 'done'
    startTransition(async () => {
      const res = await updateTaskStatus(task.id, newStatus)
      if (res.success) {
        setProject((p) => ({
          ...p,
          tasks: p.tasks.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t)),
        }))
      }
    })
  }

  function handleDeleteTask(taskId: string) {
    if (!confirm('Delete this task?')) return
    startTransition(async () => {
      const res = await deleteTask(taskId)
      if (res.success) {
        setProject((p) => ({ ...p, tasks: p.tasks.filter((t) => t.id !== taskId) }))
      }
    })
  }

  async function handleDeleteAsset(assetId: string) {
    if (!confirm('Delete this asset?')) return
    const res = await fetch(`/api/admin/projects/${project.id}/assets?assetId=${assetId}`, {
      method: 'DELETE',
    })
    if (res.ok) {
      setProject((p) => ({ ...p, assets: p.assets.filter((a) => a.id !== assetId) }))
    }
  }

  async function handleDeleteDocument(documentId: string) {
    if (!confirm('Delete this document?')) return
    const res = await fetch(`/api/admin/projects/${project.id}/documents?documentId=${documentId}`, {
      method: 'DELETE',
    })
    if (res.ok) {
      setProject((p) => ({ ...p, documents: p.documents.filter((d) => d.id !== documentId) }))
    }
  }

  return (
    <div className="space-y-8 p-5 sm:p-8">
      <Link
        href="/admin/client-projects"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Client Projects
      </Link>

      <div>
        <h1 className="font-serif text-4xl font-light text-foreground">{project.title}</h1>
        {project.client && (
          <p className="text-muted-foreground mt-1">
            {project.client.name} · {project.client.email}
          </p>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div>
      )}

      {/* Phase + progress controls */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-medium text-foreground">Project Phase</p>
          <select
            value={project.currentPhase}
            onChange={(e) => handlePhaseChange(e.target.value)}
            disabled={isPending}
            className="rounded border border-muted bg-transparent px-3 py-1.5 text-sm"
          >
            {PHASE_STEPS.map((phase) => (
              <option key={phase} value={phase}>
                {PHASE_LABELS[phase] ?? phase.replace('_', ' ')}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3">
          <p className="text-sm text-muted-foreground w-20">Progress</p>
          <input
            type="range"
            min={0}
            max={100}
            value={project.progress}
            onChange={(e) => handleProgressChange(Number(e.target.value))}
            className="flex-1"
          />
          <span className="text-sm text-foreground w-12 text-right">{project.progress}%</span>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Assets */}
          <Card className="p-6">
            <h2 className="font-serif text-xl font-light text-foreground mb-4">3D Plans & Assets</h2>

            <div className="grid gap-4 sm:grid-cols-2 mb-6">
              {project.assets.map((asset) => (
                <div key={asset.id} className="rounded-lg border border-border/20 overflow-hidden">
                  <Image
                    src={asset.thumbnailUrl || asset.fileUrl}
                    alt={asset.title}
                    width={640}
                    height={360}
                    unoptimized
                    className="h-32 w-full object-cover bg-muted"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                  <div className="p-3">
                    <div className="flex items-start justify-between">
                      <p className="text-sm font-medium text-foreground">
                        {asset.title} <span className="text-xs text-muted-foreground">v{asset.version}</span>
                      </p>
                      <button onClick={() => handleDeleteAsset(asset.id)}>
                        <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                    </div>
                    <div className="mt-1.5 flex items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${APPROVAL_BADGE[asset.approvalStatus]}`}>
                        {asset.approvalStatus.replace('_', ' ')}
                      </span>
                      <span className="text-[10px] text-muted-foreground">{asset.visibility}</span>
                    </div>
                  </div>
                </div>
              ))}

              {project.assets.length === 0 && (
                <p className="sm:col-span-2 text-sm text-muted-foreground">No assets uploaded yet.</p>
              )}
            </div>

            <div className="rounded-lg border border-dashed border-border/40 p-4 space-y-3">
              <p className="text-sm font-medium text-foreground">Upload asset</p>
              <div className="grid gap-3 sm:grid-cols-3">
                <Input
                  placeholder="Title (e.g. Living Room V3)"
                  value={assetForm.title}
                  onChange={(e) => setAssetForm((f) => ({ ...f, title: e.target.value }))}
                />
                <select
                  value={assetForm.assetType}
                  onChange={(e) => setAssetForm((f) => ({ ...f, assetType: e.target.value }))}
                  className="rounded border border-muted bg-transparent px-3 py-2 text-sm"
                >
                  {ASSET_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t.replace('_', ' ')}
                    </option>
                  ))}
                </select>
                <select
                  value={assetForm.visibility}
                  onChange={(e) => setAssetForm((f) => ({ ...f, visibility: e.target.value }))}
                  className="rounded border border-muted bg-transparent px-3 py-2 text-sm"
                >
                  <option value="client">Visible to client</option>
                  <option value="internal">Internal only</option>
                </select>
              </div>
                            <input ref={assetFileRef} type="file" accept={['3d_model', 'glb', 'gltf'].includes(assetForm.assetType) ? '.glb,.gltf,model/gltf-binary,model/gltf+json' : undefined} className="text-sm" />

              <p className="text-xs leading-5 text-muted-foreground">3D models must be GLB or GLTF. Maximum file size: 100 MB.</p>
              <Button type="button" size="sm" disabled={uploadingAsset} onClick={handleUploadAsset} className="rounded-none">
                {uploadingAsset ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" /> : <Upload className="h-3.5 w-3.5 mr-2" />}
                Upload Asset
              </Button>
            </div>
          </Card>

          <ProjectNotesPanel projectId={project.id} initialNotes={project.notes} available={project.notesAvailable} />

          {/* Documents */}
          <Card className="p-6">
            <h2 className="font-serif text-xl font-light text-foreground mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Documents
            </h2>

            <div className="space-y-2 mb-6">
              {project.documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between rounded border border-border/20 p-3">
                  <div>
                    <p className="text-sm text-foreground">{doc.name}</p>
                    <p className="text-xs text-muted-foreground">{doc.category} · {doc.visibility}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {(doc.category === 'contract' || (doc.signatureStatus && doc.signatureStatus !== 'n/a')) && (
                      <select
                        value={doc.signatureStatus ?? 'n/a'}
                        onChange={(e) => handleUpdateSignatureStatus(doc.id, e.target.value)}
                        className="rounded-full border-0 bg-muted px-2 py-1 text-[11px] font-medium text-foreground"
                      >
                        <option value="n/a">No signature needed</option>
                        <option value="draft">Draft</option>
                        <option value="sent">Sent for signature</option>
                        <option value="signed">Signed</option>
                        <option value="countersigned">Countersigned</option>
                      </select>
                    )}
                    <button onClick={() => handleDeleteDocument(doc.id)}>
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </div>
                </div>
              ))}

              {project.documents.length === 0 && (
                <p className="text-sm text-muted-foreground">No documents uploaded yet.</p>
              )}
            </div>

            <div className="rounded-lg border border-dashed border-border/40 p-4 space-y-3">
              <p className="text-sm font-medium text-foreground">Upload document</p>
              <div className="grid gap-3 sm:grid-cols-3">
                <Input
                  placeholder="Document name"
                  value={docForm.name}
                  onChange={(e) => setDocForm((f) => ({ ...f, name: e.target.value }))}
                />
                <select
                  value={docForm.category}
                  onChange={(e) =>
                    setDocForm((f) => ({
                      ...f,
                      category: e.target.value,
                      signatureStatus: e.target.value === 'contract' ? 'draft' : 'n/a',
                    }))
                  }
                  className="rounded border border-muted bg-transparent px-3 py-2 text-sm"
                >
                  <option value="general">General</option>
                  <option value="contract">Contract</option>
                  <option value="quotation">Quotation</option>
                  <option value="brief">Brief</option>
                  <option value="invoice">Invoice</option>
                </select>
                <select
                  value={docForm.visibility}
                  onChange={(e) => setDocForm((f) => ({ ...f, visibility: e.target.value }))}
                  className="rounded border border-muted bg-transparent px-3 py-2 text-sm"
                >
                  <option value="client">Visible to client</option>
                  <option value="internal">Internal only</option>
                </select>
              </div>
              <input
                ref={docFileRef}
                type="file"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.rtf,.odt,.ods,.odp"
                className="text-sm"
              />
              <Button type="button" size="sm" disabled={uploadingDoc} onClick={handleUploadDocument} className="rounded-none">
                {uploadingDoc ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" /> : <Upload className="h-3.5 w-3.5 mr-2" />}
                Upload Document
              </Button>
            </div>
          </Card>

          {/* Tasks */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-xl font-light text-foreground flex items-center gap-2">
                <CheckSquare className="w-5 h-5" />
                Tasks
              </h2>
              <Button size="sm" variant="outline" className="rounded-none" onClick={() => setShowTaskForm((v) => !v)}>
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add Task
              </Button>
            </div>

            {showTaskForm && (
              <div className="mb-4 rounded-lg border border-dashed border-border/40 p-4 space-y-3">
                <Input
                  placeholder="Task title (e.g. Approve floor plan)"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm((f) => ({ ...f, title: e.target.value }))}
                />
                <Input
                  placeholder="Description (optional)"
                  value={taskForm.description}
                  onChange={(e) => setTaskForm((f) => ({ ...f, description: e.target.value }))}
                />
                <div className="grid grid-cols-2 gap-3">
                  <select
                    value={taskForm.assignedTo}
                    onChange={(e) => setTaskForm((f) => ({ ...f, assignedTo: e.target.value }))}
                    className="rounded border border-muted bg-transparent px-3 py-2 text-sm"
                  >
                    <option value="client">Assigned to client</option>
                    <option value="admin">Assigned to admin</option>
                  </select>
                  <Input
                    type="date"
                    value={taskForm.dueDate}
                    onChange={(e) => setTaskForm((f) => ({ ...f, dueDate: e.target.value }))}
                  />
                </div>
                <Button size="sm" disabled={isPending} onClick={handleCreateTask} className="rounded-none">
                  Create Task
                </Button>
              </div>
            )}

            <div className="space-y-2">
              {project.tasks.map((task) => (
                <div key={task.id} className="flex items-start justify-between rounded border border-border/20 p-3">
                  <button onClick={() => handleToggleTask(task)} className="flex items-start gap-2.5 text-left flex-1">
                    {task.status === 'done' ? (
                      <CheckSquare className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                    ) : (
                      <Square className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    )}
                    <div>
                      <p className={`text-sm ${task.status === 'done' ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                        {task.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {task.assignedTo} {task.dueDate && `· Due ${new Date(task.dueDate).toLocaleDateString()}`}
                      </p>
                    </div>
                  </button>
                  <button onClick={() => handleDeleteTask(task.id)}>
                    <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                </div>
              ))}

              {project.tasks.length === 0 && (
                <p className="text-sm text-muted-foreground">No tasks yet.</p>
              )}
            </div>
          </Card>
        </div>

        {/* Activity sidebar */}
        <Card className="p-6 h-fit">
          <h3 className="text-sm font-medium text-foreground mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Activity
          </h3>
          <div className="space-y-3">
            {project.activity.map((item) => (
              <div key={item.id} className="text-xs border-b border-border/10 pb-2 last:border-0">
                <p className="text-foreground">{item.summary}</p>
                <p className="text-muted-foreground mt-0.5">
                  {item.actorType} · {new Date(item.createdAt).toLocaleString()}
                </p>
              </div>
            ))}

            {project.activity.length === 0 && (
              <p className="text-sm text-muted-foreground">No activity yet.</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}