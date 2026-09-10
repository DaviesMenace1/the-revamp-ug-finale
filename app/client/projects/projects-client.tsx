'use client'

import Image from 'next/image'
import { PortalLayout } from '@/components/portals/portal-layout'

import { Card } from '@/components/ui/card'
import Link from 'next/link'
import { FolderOpen } from '@/components/ui/luxury-icons'

const clientNavItems = [
  { label: 'Dashboard', href: '/client' },
  { label: 'Projects', href: '/client/projects' },
  { label: 'Consultations', href: '/client/consultations' },
  { label: 'Orders', href: '/client/orders' },
  { label: 'Messages', href: '/client/messages' },
  { label: 'Support', href: '/client/tickets' },
  { label: 'Documents', href: '/client/documents' },
]

const PROJECT_STATUS_LABELS: Record<string, string> = {
  consultation_scheduled: 'Briefing & discovery',
  design_phase: 'Design development',
  procurement_phase: 'Procurement',
  installation_phase: 'Installation',
  completed: 'Completed',
  on_hold: 'On hold',
}

type Project = {

  id: string
  slug: string
  title: string
  status: string | null
  progress: number
  thumbnailImage: string | null
  budget: string | null
  designer: string | null
  dueDate: string | null
}

export default function ProjectsClient({ projects = [], loadError = null }: { projects: Project[]; loadError?: string | null }) {

  return (
    <PortalLayout portalName="Client Portal" portalSlug="client" navItems={clientNavItems}>
      <div className="space-y-8">
                <div className="space-y-2">
          <h1 className="font-serif text-4xl md:text-5xl font-light text-foreground">Your Projects</h1>
          <p className="text-muted-foreground">Follow along as your project comes to life.</p>
        </div>

        {loadError && (
          <div role="status" className="flex flex-wrap items-center justify-between gap-4 rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
            <span>{loadError}</span>
            <button type="button" onClick={() => window.location.reload()} className="min-h-11 shrink-0 font-medium underline underline-offset-4">
              Retry
            </button>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2">

          {projects.map((project) => (
            <Link key={project.id} href={`/client/projects/${project.slug}`}>
              <Card className="overflow-hidden hover:border-primary/40 transition-colors">
                {project.thumbnailImage && (
                  <Image src={project.thumbnailImage} alt="" width={960} height={540} unoptimized className="h-48 w-full object-cover" />
                )}
                <div className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-foreground">{project.title}</p>
                                        <span className="text-right text-xs text-muted-foreground">{PROJECT_STATUS_LABELS[project.status ?? ''] ?? 'Project in progress'}</span>

                  </div>

                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                      <span>Progress</span>
                      <span>{project.progress}%</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </div>

                  {project.designer && (
                    <p className="mt-3 text-xs text-muted-foreground">Designer: {project.designer}</p>
                  )}
                </div>
              </Card>
            </Link>
          ))}

          {projects.length === 0 && (
            <div className="md:col-span-2 flex flex-col items-center rounded-lg border border-dashed border-border/40 p-12 text-center">
              <FolderOpen className="mb-3 h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                No active projects yet. Once your project kicks off, you'll see it here.
              </p>
            </div>
          )}
        </div>
      </div>
    </PortalLayout>
  )
}