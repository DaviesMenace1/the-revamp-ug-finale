'use client'

import { PortalLayout } from '@/components/portals/portal-layout'
import { Card } from '@/components/ui/card'

const clientNavItems = [
  { label: 'Dashboard', href: '/client' },
  { label: 'Projects', href: '/client/projects' },
  { label: 'Consultations', href: '/client/consultations' },
  { label: 'Orders', href: '/client/orders' },
  { label: 'Messages', href: '/client/messages' },
  { label: 'Documents', href: '/client/documents' },
]

export default function ClientProjects() {
  return (
    <PortalLayout
      portalName="Client Portal"
      portalSlug="client"
      navItems={clientNavItems}
    >
      <div className="space-y-8">
        <div className="space-y-2">
          <h1 className="font-serif text-4xl md:text-5xl font-light text-foreground">
            Your Projects
          </h1>
          <p className="text-muted-foreground">
            Track the progress of all your active design and construction projects.
          </p>
        </div>

        <div className="grid gap-6">
          {[
            { name: 'Nakasero Residence', status: 'Design Phase', progress: 60, deadline: 'April 30, 2024' },
            { name: 'Kololo Villa Renovation', status: 'Procurement', progress: 45, deadline: 'May 15, 2024' },
            { name: 'Penthouse Suite', status: 'Installation', progress: 85, deadline: 'March 25, 2024' },
          ].map(project => (
            <Card key={project.name} className="p-6 border-border/20 hover:border-primary/20 transition-colors">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-serif text-xl font-light text-foreground mb-1">{project.name}</h3>
                    <p className="text-sm text-muted-foreground">{project.status}</p>
                  </div>
                  <span className="text-2xl font-light text-primary">{project.progress}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full"
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
                <p className="text-sm text-muted-foreground">Target Completion: {project.deadline}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </PortalLayout>
  )
}
