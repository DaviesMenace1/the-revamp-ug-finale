'use client'

import { useState, useTransition } from 'react'
import { PortalLayout } from '@/components/portals/portal-layout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, FileText, Download, Check, MessageSquare, Clock, CheckSquare, Square } from 'lucide-react'
import Link from 'next/link'
import { approveAsset, requestAssetChanges } from '@/lib/actions/project-assets'
import { toggleClientTask } from '@/lib/actions/tasks'

const clientNavItems = [
  { label: 'Dashboard', href: '/client' },
  { label: 'Projects', href: '/client/projects' },
  { label: 'Consultations', href: '/client/consultations' },
  { label: 'Orders', href: '/client/orders' },
  { label: 'Messages', href: '/client/messages' },
  { label: 'Support', href: '/client/tickets' },
  { label: 'Documents', href: '/client/documents' },
]

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
  category: string | null
    fileUrl: string
  viewerUrl: string | null
  thumbnailUrl: string | null

  version: number
  approvalStatus: string
  createdAt: string
}

type ActivityItem = {
  id: string
  action: string
  summary: string
  actorType: string
  createdAt: string
}

type Task = {
  id: string
  title: string
  description: string | null
  assignedTo: string
  status: string
  dueDate: string | null
}

type ProjectDetail = {
  id: string
  slug: string
  title: string
  status: string | null
  currentPhase: string
  progress: number
  description: string | null
  longDescription: string | null
  budget: string | null
  dueDate: string | null
  designer: string | null
  location: string | null
  features: string[]
  documents: { id: string; name: string; category: string | null; fileUrl: string; createdAt: string }[]
  assets: Asset[]
  activity: ActivityItem[]
  tasks: Task[]
}

function formatCurrency(value: string | number | null) {
  if (!value) return null
  return new Intl.NumberFormat('en-UG', {
    style: 'currency',
    currency: 'UGX',
    maximumFractionDigits: 0,
  }).format(Number(value))
}

function AssetCard({ asset, onUpdate }: { asset: Asset; onUpdate: (asset: Asset) => void }) {
  const [showFeedback, setShowFeedback] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleApprove() {
    startTransition(async () => {
      const res = await approveAsset(asset.id)
      if (res.success) onUpdate({ ...asset, approvalStatus: 'approved' })
    })
  }

  function handleRequestChanges() {
    if (!feedback.trim()) return
    startTransition(async () => {
      const res = await requestAssetChanges(asset.id, feedback)
      if (res.success) {
        onUpdate({ ...asset, approvalStatus: 'changes_requested' })
        setShowFeedback(false)
        setFeedback('')
      }
    })
  }

  const isModel = ['3d_model', 'glb', 'gltf'].includes(asset.assetType)
  const isImage = ['image', '3d_render', 'floor_plan', 'elevation', 'section', 'moodboard'].includes(asset.assetType)

  return (
    <Card className="overflow-hidden">
      {isImage && (
        <a href={asset.fileUrl} target="_blank" rel="noreferrer">
          <img src={asset.thumbnailUrl || asset.fileUrl} alt={asset.title} className="h-48 w-full object-cover" />
        </a>
      )}
      {isModel && asset.viewerUrl && (
        <Link href={asset.viewerUrl} className="flex h-48 items-center justify-center bg-[#e8e6df] text-sm font-medium text-foreground hover:bg-[#dedbd1]">
          <span className="rounded border border-foreground/20 bg-background/80 px-4 py-2">Open 3D Viewer</span>
        </Link>
      )}

      <div className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">
              {asset.title} <span className="text-xs text-muted-foreground">v{asset.version}</span>
            </p>
            {asset.description && <p className="text-xs text-muted-foreground mt-1">{asset.description}</p>}
          </div>
          <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium ${APPROVAL_BADGE[asset.approvalStatus]}`}>
            {asset.approvalStatus.replace('_', ' ')}
          </span>
        </div>

        {asset.approvalStatus === 'pending' && (
          <div className="mt-3 flex gap-2">
            <Button size="sm" disabled={isPending} onClick={handleApprove} className="rounded-none gap-1.5">
              <Check className="h-3.5 w-3.5" />
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={isPending}
              onClick={() => setShowFeedback((v) => !v)}
              className="rounded-none gap-1.5"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              Request Changes
            </Button>
          </div>
        )}

        {showFeedback && (
          <div className="mt-3 space-y-2">
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="What would you like changed?"
              rows={3}
              className="w-full rounded border border-border/30 p-2 text-sm"
            />
            <div className="flex gap-2">
              <Button size="sm" disabled={isPending} onClick={handleRequestChanges} className="rounded-none">
                Submit Feedback
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowFeedback(false)} className="rounded-none">
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}

export default function ProjectDetailClient({ project }: { project: ProjectDetail }) {
  const [assets, setAssets] = useState(project.assets)
  const [tasks, setTasks] = useState(project.tasks)

  function updateAsset(updated: Asset) {
    setAssets((prev) => prev.map((a) => (a.id === updated.id ? updated : a)))
  }

  function handleToggleTask(task: Task) {
    const done = task.status !== 'done'
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: done ? 'done' : 'pending' } : t)))
    toggleClientTask(task.id, done)
  }

  const currentPhaseIdx = PHASE_STEPS.indexOf(project.currentPhase)

  return (
    <PortalLayout portalName="Client Portal" portalSlug="client" navItems={clientNavItems}>
      <div className="space-y-8">
        <Link
          href="/client/projects"
          className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back to Projects</span>
        </Link>

        <div className="space-y-2">
          <h1 className="font-serif text-4xl md:text-5xl font-light text-foreground">{project.title}</h1>
          {project.description && <p className="text-muted-foreground">{project.description}</p>}
        </div>

        <Card className="p-6 border-border/20 overflow-x-auto">
          <div className="flex items-center gap-1 min-w-max">
            {PHASE_STEPS.map((phase, idx) => (
              <div key={phase} className="flex items-center">
                <div className="flex flex-col items-center gap-1.5">
                  <div
                    className={`h-2.5 w-2.5 rounded-full ${
                      idx < currentPhaseIdx
                        ? 'bg-primary'
                        : idx === currentPhaseIdx
                        ? 'bg-primary ring-4 ring-primary/20'
                        : 'bg-muted'
                    }`}
                  />
                  <span
                    className={`text-[10px] uppercase tracking-wide whitespace-nowrap ${
                      idx === currentPhaseIdx ? 'text-foreground font-medium' : 'text-muted-foreground'
                    }`}
                  >
                    {phase.replace('_', ' ')}
                  </span>
                </div>
                {idx < PHASE_STEPS.length - 1 && (
                  <div className={`h-px w-8 mx-1 ${idx < currentPhaseIdx ? 'bg-primary' : 'bg-muted'}`} />
                )}
              </div>
            ))}
          </div>
        </Card>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <Card className="p-6 border-border/20">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-foreground">{project.status ?? 'In Progress'}</span>
                <span className="text-sm text-muted-foreground">{project.progress}% complete</span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full bg-primary" style={{ width: `${project.progress}%` }} />
              </div>
            </Card>

            {project.longDescription && (
              <Card className="p-6 border-border/20">
                <h2 className="font-serif text-xl font-light text-foreground mb-3">Project Story</h2>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                  {project.longDescription}
                </p>
              </Card>
            )}

            {tasks.length > 0 && (
              <Card className="p-6 border-border/20">
                <h2 className="font-serif text-xl font-light text-foreground mb-3 flex items-center gap-2">
                  <CheckSquare className="w-5 h-5" />
                  Your To-Dos
                </h2>
                <div className="space-y-2">
                  {tasks.map((task) => (
                    <div key={task.id} className="flex items-start justify-between rounded border border-border/20 p-3">
                      <button
                        onClick={() => task.assignedTo === 'client' && handleToggleTask(task)}
                        disabled={task.assignedTo !== 'client'}
                        className="flex items-start gap-2.5 text-left flex-1"
                      >
                        {task.status === 'done' ? (
                          <CheckSquare className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                        ) : (
                          <Square className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                        )}
                        <div>
                          <p className={`text-sm ${task.status === 'done' ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                            {task.title}
                          </p>
                          {task.description && <p className="text-xs text-muted-foreground mt-0.5">{task.description}</p>}
                          {task.dueDate && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Due {new Date(task.dueDate).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </button>
                      {task.assignedTo !== 'client' && (
                        <span className="text-[10px] text-muted-foreground shrink-0">Revamp team</span>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {assets.length > 0 && (
              <div className="space-y-3">
                <h2 className="font-serif text-xl font-light text-foreground">3D Plans & Renders</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {assets.map((asset) => (
                    <AssetCard key={asset.id} asset={asset} onUpdate={updateAsset} />
                  ))}
                </div>
              </div>
            )}

            <Card className="p-6 border-border/20">
              <h2 className="font-serif text-xl font-light text-foreground mb-3 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Documents
              </h2>

              {project.documents.length === 0 ? (
                <p className="text-sm text-muted-foreground">No documents shared for this project yet.</p>
              ) : (
                <div className="space-y-2">
                  {project.documents.map((doc) => (
                    <a
                      key={doc.id}
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between rounded border border-border/20 p-3 hover:bg-muted/50"
                    >
                      <span className="text-sm text-foreground">{doc.name}</span>
                      <Download className="w-4 h-4 text-muted-foreground" />
                    </a>
                  ))}
                </div>
              )}
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="p-6 border-border/20">
              <h3 className="text-sm font-medium text-foreground mb-4">Project Details</h3>
              <dl className="space-y-3 text-sm">
                {project.designer && (
                  <div>
                    <dt className="text-muted-foreground">Designer</dt>
                    <dd className="text-foreground">{project.designer}</dd>
                  </div>
                )}
                {project.location && (
                  <div>
                    <dt className="text-muted-foreground">Location</dt>
                    <dd className="text-foreground">{project.location}</dd>
                  </div>
                )}
                {project.budget && (
                  <div>
                    <dt className="text-muted-foreground">Budget</dt>
                    <dd className="text-foreground">{formatCurrency(project.budget)}</dd>
                  </div>
                )}
                {project.dueDate && (
                  <div>
                    <dt className="text-muted-foreground">Target Completion</dt>
                    <dd className="text-foreground">
                      {new Date(project.dueDate).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </dd>
                  </div>
                )}
              </dl>
            </Card>

            {project.activity.length > 0 && (
              <Card className="p-6 border-border/20">
                <h3 className="text-sm font-medium text-foreground mb-4 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Recent Activity
                </h3>
                <div className="space-y-3">
                  {project.activity.slice(0, 8).map((item) => (
                    <div key={item.id} className="text-xs">
                      <p className="text-foreground">{item.summary}</p>
                      <p className="text-muted-foreground mt-0.5">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </PortalLayout>
  )
}