'use client'

import { PortalLayout } from '@/components/portals/portal-layout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, User, FileText, MessageSquare } from 'lucide-react'
import Link from 'next/link'

const clientNavItems = [
  { label: 'Dashboard', href: '/client' },
  { label: 'Projects', href: '/client/projects' },
  { label: 'Consultations', href: '/client/consultations' },
  { label: 'Orders', href: '/client/orders' },
  { label: 'Messages', href: '/client/messages' },
  { label: 'Documents', href: '/client/documents' },
]

const projectData = {
  'nakasero-residence': {
    name: 'Nakasero Residence',
    status: 'Design Phase',
    progress: 60,
    startDate: 'January 15, 2024',
    targetCompletion: 'April 30, 2024',
    budget: '$45,000',
    spent: '$27,000',
    designer: 'Sarah Nakambi',
    description: 'Luxury residential project featuring contemporary interior design with refined furnishings and custom installations.',
    scope: [
      'Living Room & Dining Area Design',
      'Master Bedroom Suite',
      'Home Office',
      'Guest Bathroom Renovation',
    ],
  },
}

export default function ProjectDetailPage({
  params,
}: {
  params: { slug: string }
}) {
  const project = projectData['nakasero-residence' as keyof typeof projectData]

  if (!project) {
    return (
      <PortalLayout
        portalName="Client Portal"
        portalSlug="client"
        navItems={clientNavItems}
      >
        <div className="py-16 text-center">
          <p className="text-muted-foreground">Project not found</p>
          <Link href="/client/projects" className="text-primary hover:text-primary/80 text-sm mt-4 inline-block">
            ← Back to Projects
          </Link>
        </div>
      </PortalLayout>
    )
  }

  return (
    <PortalLayout
      portalName="Client Portal"
      portalSlug="client"
      navItems={clientNavItems}
    >
      <div className="space-y-8">
        <Link
          href="/client/projects"
          className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back to Projects</span>
        </Link>

        <div className="space-y-2">
          <h1 className="font-serif text-4xl md:text-5xl font-light text-foreground">
            {project.name}
          </h1>
          <p className="text-muted-foreground">{project.description}</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Project Overview */}
          <div className="md:col-span-2 space-y-6">
            {/* Status & Progress */}
            <Card className="p-6 border-border/20">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">Current Status</p>
                    <p className="font-medium text-foreground">{project.status}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1 text-right">Overall Progress</p>
                    <p className="font-serif text-3xl font-light text-primary text-right">{project.progress}%</p>
                  </div>
                </div>
                <div className="w-full bg-muted rounded-full h-3">
                  <div
                    className="bg-primary h-3 rounded-full"
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
              </div>
            </Card>

            {/* Timeline */}
            <Card className="p-6 border-border/20">
              <h3 className="font-medium text-foreground mb-4">Timeline</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Start Date</p>
                  <p className="text-foreground">{project.startDate}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Target Completion</p>
                  <p className="text-foreground">{project.targetCompletion}</p>
                </div>
              </div>
            </Card>

            {/* Budget */}
            <Card className="p-6 border-border/20">
              <h3 className="font-medium text-foreground mb-4">Budget & Spending</h3>
              <div className="space-y-4">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Total Budget</p>
                    <p className="font-serif text-2xl font-light text-foreground">{project.budget}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Amount Spent</p>
                    <p className="font-serif text-2xl font-light text-primary">{project.spent}</p>
                  </div>
                </div>
                <div className="w-full bg-muted rounded-full h-3">
                  <div
                    className="bg-primary h-3 rounded-full"
                    style={{ width: '60%' }}
                  />
                </div>
                <p className="text-xs text-muted-foreground text-right">60% of budget spent</p>
              </div>
            </Card>

            {/* Project Scope */}
            <Card className="p-6 border-border/20">
              <h3 className="font-medium text-foreground mb-4">Project Scope</h3>
              <ul className="space-y-3">
                {project.scope.map(item => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="text-primary mt-1">✓</span>
                    <span className="text-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Designer Info */}
            <Card className="p-6 border-border/20">
              <div className="flex items-center gap-3 mb-4">
                <User className="w-8 h-8 text-primary" />
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Lead Designer</p>
                  <p className="font-medium text-foreground">{project.designer}</p>
                </div>
              </div>
              <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-none font-light text-sm">
                Contact Designer
              </Button>
            </Card>

            {/* Quick Actions */}
            <Card className="p-6 border-border/20 space-y-3">
              <Button variant="outline" className="w-full rounded-none justify-start" asChild>
                <Link href="/client/messages">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Send Message
                </Link>
              </Button>
              <Button variant="outline" className="w-full rounded-none justify-start" asChild>
                <Link href="/client/documents">
                  <FileText className="w-4 h-4 mr-2" />
                  View Documents
                </Link>
              </Button>
            </Card>

            {/* Project Files */}
            <Card className="p-6 border-border/20">
              <h4 className="font-medium text-foreground mb-3">Recent Files</h4>
              <div className="space-y-2">
                {[
                  'Design_Concepts_v3.pdf',
                  'Floor_Plan_Final.dwg',
                  'Material_Board.png',
                ].map(file => (
                  <a
                    key={file}
                    href="#"
                    className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 group"
                  >
                    <FileText className="w-4 h-4" />
                    <span className="truncate group-hover:underline">{file}</span>
                  </a>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </PortalLayout>
  )
}
