'use client'

import { PortalLayout } from '@/components/portals/portal-layout'
import { Card } from '@/components/ui/card'
import { Calendar } from 'lucide-react'

const clientNavItems = [
  { label: 'Dashboard', href: '/client' },
  { label: 'Projects', href: '/client/projects' },
  { label: 'Consultations', href: '/client/consultations' },
  { label: 'Orders', href: '/client/orders' },
  { label: 'Messages', href: '/client/messages' },
  { label: 'Support', href: '/client/tickets' },
  { label: 'Documents', href: '/client/documents' },
]

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  scheduled: 'bg-blue-100 text-blue-800',
  completed: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-muted text-muted-foreground',
}

type Consultation = {
  id: string
  title: string
  description: string | null
  serviceType: string | null
  status: string | null
  preferredDate: string | null
  createdAt: string
}

export default function ConsultationsClient({ consultations = [] }: { consultations: Consultation[] }) {
  return (
    <PortalLayout portalName="Client Portal" portalSlug="client" navItems={clientNavItems}>
      <div className="space-y-8">
        <div className="space-y-2">
          <h1 className="font-serif text-4xl md:text-5xl font-light text-foreground">Consultations</h1>
          <p className="text-muted-foreground">Your booked and past design consultations.</p>
        </div>

        <div className="grid gap-4">
          {consultations.map((c) => (
            <Card key={c.id} className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-foreground">{c.title}</p>
                  {c.serviceType && <p className="text-sm text-muted-foreground">{c.serviceType}</p>}
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_COLORS[c.status ?? 'pending']}`}>
                  {c.status ?? 'pending'}
                </span>
              </div>

              {c.description && <p className="mt-3 text-sm text-muted-foreground">{c.description}</p>}

              {c.preferredDate && (
                <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  {new Date(c.preferredDate).toLocaleString()}
                </div>
              )}
            </Card>
          ))}

          {consultations.length === 0 && (
            <div className="flex flex-col items-center rounded-lg border border-dashed border-border/40 p-12 text-center">
              <Calendar className="mb-3 h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No consultations booked yet.</p>
            </div>
          )}
        </div>
      </div>
    </PortalLayout>
  )
}
