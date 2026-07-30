'use client'

import { PortalLayout } from '@/components/portals/portal-layout'
import { Card } from '@/components/ui/card'
import Link from 'next/link'
import { FileText, MessageSquare, ShoppingBag, Calendar } from 'lucide-react'

const clientNavItems = [
  { label: 'Dashboard', href: '/client' },
  { label: 'Projects', href: '/client/projects' },
  { label: 'Consultations', href: '/client/consultations' },
  { label: 'Orders', href: '/client/orders' },
  { label: 'Messages', href: '/client/messages' },
  { label: 'Documents', href: '/client/documents' },
]

export default function ClientDashboard() {
  return (
    <PortalLayout
      portalName="Client Portal"
      portalSlug="client"
      navItems={clientNavItems}
    >
      <div className="space-y-12">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="font-serif text-4xl md:text-5xl font-light text-foreground">
            Welcome Back
          </h1>
          <p className="text-muted-foreground">
            Track your projects, consultations, and orders all in one place.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-4 gap-6">
          <Card className="p-6 border-border/20 hover:border-primary/20 transition-colors">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Active Projects</p>
              <p className="font-serif text-4xl font-light text-primary">3</p>
            </div>
          </Card>
          <Card className="p-6 border-border/20 hover:border-primary/20 transition-colors">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Pending Consultations</p>
              <p className="font-serif text-4xl font-light text-primary">1</p>
            </div>
          </Card>
          <Card className="p-6 border-border/20 hover:border-primary/20 transition-colors">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Recent Orders</p>
              <p className="font-serif text-4xl font-light text-primary">5</p>
            </div>
          </Card>
          <Card className="p-6 border-border/20 hover:border-primary/20 transition-colors">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Unread Messages</p>
              <p className="font-serif text-4xl font-light text-primary">2</p>
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Projects Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <ShoppingBag className="w-6 h-6 text-primary" />
              <h2 className="font-serif text-2xl font-light text-foreground">Your Projects</h2>
            </div>
            <div className="space-y-3">
              {[
                { name: 'Nakasero Residence', status: 'Design Phase', progress: 60 },
                { name: 'Kololo Villa', status: 'Procurement', progress: 45 },
                { name: 'Penthouse Suite', status: 'Installation', progress: 85 },
              ].map(project => (
                <Card key={project.name} className="p-4 border-border/20">
                  <div className="space-y-2">
                    <p className="font-medium text-foreground">{project.name}</p>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{project.status}</span>
                      <span className="text-primary font-medium">{project.progress}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
            <Link
              href="/client/projects"
              className="inline-flex text-sm font-medium text-primary hover:text-primary/80 transition-colors"
            >
              View All Projects →
            </Link>
          </div>

          {/* Recent Activity */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-6 h-6 text-primary" />
              <h2 className="font-serif text-2xl font-light text-foreground">Recent Activity</h2>
            </div>
            <div className="space-y-3">
              {[
                { action: 'Project update: Design concepts approved', date: '2 days ago' },
                { action: 'New message from design team', date: '1 day ago' },
                { action: 'Quotation received for procurement', date: '5 hours ago' },
                { action: 'Installation scheduled for March 15', date: '2 hours ago' },
              ].map((item, i) => (
                <Card key={i} className="p-4 border-border/20">
                  <div className="flex gap-3">
                    <MessageSquare className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.action}</p>
                      <p className="text-xs text-muted-foreground">{item.date}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid md:grid-cols-3 gap-6">
          <Link
            href="/client/consultations"
            className="p-6 border border-border/20 rounded-lg hover:border-primary/20 hover:bg-primary/5 transition-all"
          >
            <Calendar className="w-8 h-8 text-primary mb-3" />
            <h3 className="font-medium text-foreground mb-1">Book Consultation</h3>
            <p className="text-sm text-muted-foreground">Schedule a call with our design team</p>
          </Link>
          <Link
            href="/client/messages"
            className="p-6 border border-border/20 rounded-lg hover:border-primary/20 hover:bg-primary/5 transition-all"
          >
            <MessageSquare className="w-8 h-8 text-primary mb-3" />
            <h3 className="font-medium text-foreground mb-1">Send a Message</h3>
            <p className="text-sm text-muted-foreground">Communicate directly with your team</p>
          </Link>
          <Link
            href="/client/documents"
            className="p-6 border border-border/20 rounded-lg hover:border-primary/20 hover:bg-primary/5 transition-all"
          >
            <FileText className="w-8 h-8 text-primary mb-3" />
            <h3 className="font-medium text-foreground mb-1">Access Documents</h3>
            <p className="text-sm text-muted-foreground">Quotes, contracts, and invoices</p>
          </Link>
        </div>
      </div>
    </PortalLayout>
  )
}
