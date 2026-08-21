'use client'

import { PortalLayout } from '@/components/portals/portal-layout'
import { Card } from '@/components/ui/card'
import Link from 'next/link'
import { FolderOpen } from 'lucide-react'

const clientNavItems = [
  { label: 'Dashboard', href: '/client' },
  { label: 'Projects', href: '/client/projects' },
  { label: 'Consultations', href: '/client/consultations' },
  { label: 'Orders', href: '/client/orders' },
  { label: 'Messages', href: '/client/messages' },
  { label: 'Support', href: '/client/tickets' },
  { label: 'Documents', href: '/client/documents' },
]

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

export default function ProjectsClient({ projects = [] }: { projects: Project[] }) {
  return (
    <PortalLayout portalName="Client Portal" portalSlug="client" navItems={clientNavItems}>
      <div className="space-y-8">
        <div className="space-y-2">
          <h1 className="font-serif text-4xl md:text-5xl font-light text-foreground">Your Projects</h1>
          <p className="text-muted-foreground">Follow along as your project comes to life.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {projects.map((project) => (
            <Link key={project.id} href={`/client/projects/${project.slug}`}>
              <Card className="overflow-hidden hover:border-primary/40 transition-colors">
                {project.thumbnailImage && (
                  <img src={project.thumbnailImage} alt="" className="h-48 w-full object-cover" />
                )}
                <div className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-foreground">{project.title}</p>
                    <span className="text-xs text-muted-foreground">{project.status}</span>
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