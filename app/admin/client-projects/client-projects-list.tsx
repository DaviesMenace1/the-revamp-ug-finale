'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Plus, X, FolderKanban } from 'lucide-react'
import Link from 'next/link'
import { createClientProject } from '@/lib/actions/client-projects'

type ProjectRow = {
  id: string
  title: string
  status: string | null
  currentPhase: string | null
  progress: number | null
  createdAt: string
  clientFirstName: string | null
  clientLastName: string | null
  clientEmail: string
}

type ClientOption = {
  id: string
  firstName: string | null
  lastName: string | null
  email: string
}

const PHASE_LABELS: Record<string, string> = {
  consultation: 'Consultation',
  concept: 'Concept',
  design: 'Design',
  visualization: '3D Visualization',
  approval: 'Client Approval',
  procurement: 'Procurement',
  installation: 'Installation',
  handover: 'Handover',
}

export default function ClientProjectsListClient({
  projects = [],
  clients = [],
}: {
  projects: ProjectRow[]
  clients: ClientOption[]
}) {
  const [list, setList] = useState(projects)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', userId: '', description: '', location: '' })
  const [isPending, startTransition] = useTransition()

  function handleCreate() {
    if (!form.title.trim() || !form.userId) return

    startTransition(async () => {
      const res = await createClientProject(form)
      if (res.success && res.project) {
        setList((prev) => [
          {
            id: res.project.id,
            title: res.project.title,
            status: res.project.status,
            currentPhase: res.project.currentPhase,
            progress: res.project.progress,
            createdAt: new Date().toISOString(),
            clientFirstName: clients.find((c) => c.id === form.userId)?.firstName ?? null,
            clientLastName: clients.find((c) => c.id === form.userId)?.lastName ?? null,
            clientEmail: clients.find((c) => c.id === form.userId)?.email ?? '',
          },
          ...prev,
        ])
        setForm({ title: '', userId: '', description: '', location: '' })
        setShowForm(false)
      } else if (res.error) {
        alert(res.error)
      }
    })
  }

  return (
    <div className="space-y-8 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-4xl font-light text-foreground">Client Projects</h1>
          <p className="text-muted-foreground mt-2">
            Private project workspaces — separate from your public portfolio. Each one belongs to a
            client account and includes their own assets, documents, and approvals.
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} className="rounded-none">
          <Plus className="w-4 h-4 mr-2" />
          New Client Project
        </Button>
      </div>

      <div className="grid gap-4">
        {list.map((project) => (
          <Link key={project.id} href={`/admin/client-projects/${project.id}`}>
            <Card className="p-5 hover:border-primary/40 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">{project.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {[project.clientFirstName, project.clientLastName].filter(Boolean).join(' ') ||
                      project.clientEmail}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">
                    {PHASE_LABELS[project.currentPhase ?? 'consultation']}
                  </p>
                  <p className="text-sm text-foreground mt-1">{project.progress ?? 0}%</p>
                </div>
              </div>
            </Card>
          </Link>
        ))}

        {list.length === 0 && (
          <div className="flex flex-col items-center rounded-lg border border-dashed border-border/40 p-12 text-center">
            <FolderKanban className="mb-3 h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No client projects yet.</p>
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg bg-background p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-foreground">New Client Project</h2>
              <button onClick={() => setShowForm(false)}>
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <Input
                placeholder="Project title"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />

              <select
                value={form.userId}
                onChange={(e) => setForm((f) => ({ ...f, userId: e.target.value }))}
                className="w-full rounded border border-muted bg-transparent p-2.5 text-sm"
              >
                <option value="">Select client...</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {[c.firstName, c.lastName].filter(Boolean).join(' ') || c.email} ({c.email})
                  </option>
                ))}
              </select>

              <Input
                placeholder="Location"
                value={form.location}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
              />

              <Button disabled={isPending} onClick={handleCreate} className="w-full rounded-none">
                Create Project
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
