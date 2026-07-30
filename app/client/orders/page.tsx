'use client'

import { PortalLayout } from '@/components/portals/portal-layout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Package, DollarSign, Truck } from 'lucide-react'

const clientNavItems = [
  { label: 'Dashboard', href: '/client' },
  { label: 'Projects', href: '/client/projects' },
  { label: 'Consultations', href: '/client/consultations' },
  { label: 'Orders', href: '/client/orders' },
  { label: 'Messages', href: '/client/messages' },
  { label: 'Documents', href: '/client/documents' },
]

export default function ClientOrders() {
  return (
    <PortalLayout
      portalName="Client Portal"
      portalSlug="client"
      navItems={clientNavItems}
    >
      <div className="space-y-8">
        <div className="space-y-2">
          <h1 className="font-serif text-4xl md:text-5xl font-light text-foreground">
            Orders
          </h1>
          <p className="text-muted-foreground">
            Track and manage all your furniture and décor orders.
          </p>
        </div>

        <div className="grid gap-4">
          {[
            {
              id: 'ORD-2024-001',
              date: 'March 1, 2024',
              total: '$18,500',
              status: 'delivered',
              items: [
                'Savannah Modular Sofa (3-Seater)',
                'Ebony Coffee Table',
                'Floor Lamp - Brass Finish',
              ],
            },
            {
              id: 'ORD-2024-002',
              date: 'March 10, 2024',
              total: '$12,300',
              status: 'in-transit',
              items: [
                'Heritage Dining Table',
                'Set of 6 Dining Chairs',
                'Pendant Lights (set of 3)',
              ],
            },
            {
              id: 'ORD-2024-003',
              date: 'March 18, 2024',
              total: '$8,750',
              status: 'processing',
              items: [
                'Bedroom Set - Platform Bed',
                'Nightstands (pair)',
                'Bedside Lighting',
              ],
            },
          ].map(order => (
            <Card key={order.id} className="p-6 border-border/20">
              <div className="grid md:grid-cols-3 gap-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Order Number</p>
                    <p className="font-medium text-foreground">{order.id}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Order Date</p>
                    <p className="text-sm text-foreground">{order.date}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Total</p>
                    <p className="font-serif text-2xl font-light text-primary">{order.total}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Items</p>
                  <ul className="space-y-2">
                    {order.items.map(item => (
                      <li key={item} className="text-sm text-foreground">• {item}</li>
                    ))}
                  </ul>
                </div>

                <div className="flex flex-col justify-between items-start md:items-end">
                  <span className={`text-xs font-medium px-3 py-1 rounded-full whitespace-nowrap ${
                    order.status === 'delivered'
                      ? 'bg-green-100 text-green-800'
                      : order.status === 'in-transit'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {order.status === 'delivered'
                      ? 'Delivered'
                      : order.status === 'in-transit'
                      ? 'In Transit'
                      : 'Processing'}
                  </span>
                  <div className="flex gap-2 mt-auto">
                    <Button variant="outline" size="sm" className="rounded-none text-xs">
                      View Details
                    </Button>
                    <Button variant="outline" size="sm" className="rounded-none text-xs">
                      Track
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </PortalLayout>
  )
}
