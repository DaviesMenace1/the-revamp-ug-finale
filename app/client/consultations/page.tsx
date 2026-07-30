'use client'

import { PortalLayout } from '@/components/portals/portal-layout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, MapPin, Clock, Plus } from 'lucide-react'

const clientNavItems = [
  { label: 'Dashboard', href: '/client' },
  { label: 'Projects', href: '/client/projects' },
  { label: 'Consultations', href: '/client/consultations' },
  { label: 'Orders', href: '/client/orders' },
  { label: 'Messages', href: '/client/messages' },
  { label: 'Documents', href: '/client/documents' },
]

export default function ClientConsultations() {
  return (
    <PortalLayout
      portalName="Client Portal"
      portalSlug="client"
      navItems={clientNavItems}
    >
      <div className="space-y-8">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <h1 className="font-serif text-4xl md:text-5xl font-light text-foreground">
              Consultations
            </h1>
            <p className="text-muted-foreground">
              Schedule and manage consultations with our design team.
            </p>
          </div>
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-none font-light">
            <Plus className="w-4 h-4 mr-2" />
            New Consultation
          </Button>
        </div>

        <div className="space-y-4">
          {[
            {
              id: 1,
              title: 'Initial Design Consultation',
              date: 'March 15, 2024',
              time: '10:00 AM - 11:30 AM',
              type: 'Virtual',
              status: 'confirmed',
            },
            {
              id: 2,
              title: 'Space Planning Review',
              date: 'March 22, 2024',
              time: '2:00 PM - 3:00 PM',
              type: 'In-Person',
              status: 'pending',
            },
            {
              id: 3,
              title: 'Material Selection Session',
              date: 'March 29, 2024',
              time: '11:00 AM - 12:30 PM',
              type: 'In-Person',
              status: 'pending',
            },
          ].map(consultation => (
            <Card key={consultation.id} className="p-6 border-border/20 hover:border-primary/20 transition-colors">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-3">
                  <h3 className="font-medium text-foreground text-lg">{consultation.title}</h3>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{consultation.date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>{consultation.time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span>{consultation.type}</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-start md:items-end gap-3">
                  <span className={`text-xs font-medium px-3 py-1 rounded-full ${
                    consultation.status === 'confirmed'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {consultation.status === 'confirmed' ? 'Confirmed' : 'Pending'}
                  </span>
                  {consultation.status === 'confirmed' && (
                    <Button variant="outline" size="sm" className="rounded-none">
                      Join Call
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </PortalLayout>
  )
}
