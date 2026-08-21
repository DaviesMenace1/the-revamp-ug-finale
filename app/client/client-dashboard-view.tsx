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
  { label: 'Support', href: '/client/tickets' },
  { label: 'Documents', href: '/client/documents' },
]

type Stats = {
  orders: number
  activeProjects: number
  consultations: number
  unreadMessages: number
}

export default function ClientDashboardView({
  firstName,
  stats,
}: {
  firstName: string | null
  stats: Stats
}) {
  const cards = [
    { label: 'Active Projects', value: stats.activeProjects, icon: FileText, href: '/client/projects' },
    { label: 'Orders', value: stats.orders, icon: ShoppingBag, href: '/client/orders' },
    { label: 'Consultations', value: stats.consultations, icon: Calendar, href: '/client/consultations' },
    { label: 'Unread Messages', value: stats.unreadMessages, icon: MessageSquare, href: '/client/messages' },
  ]

  return (
    <PortalLayout portalName="Client Portal" portalSlug="client" navItems={clientNavItems}>
      <div className="space-y-12">
        <div className="space-y-2">
          <h1 className="font-serif text-4xl md:text-5xl font-light text-foreground">
            Welcome back{firstName ? `, ${firstName}` : ''}
          </h1>
          <p className="text-muted-foreground">Here's what's happening with your account.</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((card) => (
            <Link key={card.label} href={card.href}>
              <Card className="p-6 hover:border-primary/40 transition-colors">
                <card.icon className="w-6 h-6 text-primary mb-3" />
                <p className="text-3xl font-light text-foreground">{card.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{card.label}</p>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </PortalLayout>
  )
}