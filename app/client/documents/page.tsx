'use client'

import { PortalLayout } from '@/components/portals/portal-layout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, Download, Eye, Lock } from 'lucide-react'

const clientNavItems = [
  { label: 'Dashboard', href: '/client' },
  { label: 'Projects', href: '/client/projects' },
  { label: 'Consultations', href: '/client/consultations' },
  { label: 'Orders', href: '/client/orders' },
  { label: 'Messages', href: '/client/messages' },
  { label: 'Documents', href: '/client/documents' },
]

export default function ClientDocuments() {
  return (
    <PortalLayout
      portalName="Client Portal"
      portalSlug="client"
      navItems={clientNavItems}
    >
      <div className="space-y-8">
        <div className="space-y-2">
          <h1 className="font-serif text-4xl md:text-5xl font-light text-foreground">
            Documents
          </h1>
          <p className="text-muted-foreground">
            Access contracts, quotes, invoices, and project documentation.
          </p>
        </div>

        <div className="space-y-6">
          {/* Quotes */}
          <div className="space-y-4">
            <h2 className="font-medium text-foreground flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Quotations
            </h2>
            <div className="grid gap-3">
              {[
                { name: 'Nakasero Residence Quote', date: 'March 5, 2024', amount: '$45,000' },
                { name: 'Kololo Villa Quote', date: 'February 28, 2024', amount: '$32,500' },
              ].map(doc => (
                <Card key={doc.name} className="p-4 border-border/20 hover:border-primary/20 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="font-medium text-foreground text-sm">{doc.name}</p>
                      <p className="text-xs text-muted-foreground">{doc.date} • {doc.amount}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Contracts */}
          <div className="space-y-4">
            <h2 className="font-medium text-foreground flex items-center gap-2">
              <Lock className="w-5 h-5 text-primary" />
              Contracts & Agreements
            </h2>
            <div className="grid gap-3">
              {[
                { name: 'Interior Design Services Agreement', date: 'March 1, 2024', status: 'signed' },
                { name: 'Installation & Delivery Terms', date: 'March 10, 2024', status: 'signed' },
              ].map(doc => (
                <Card key={doc.name} className="p-4 border-border/20 hover:border-primary/20 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="font-medium text-foreground text-sm">{doc.name}</p>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-muted-foreground">{doc.date}</p>
                        <span className="inline-block px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded">
                          {doc.status === 'signed' ? 'Signed' : 'Pending'}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Invoices */}
          <div className="space-y-4">
            <h2 className="font-medium text-foreground flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Invoices
            </h2>
            <div className="grid gap-3">
              {[
                { name: 'Invoice INV-2024-001', date: 'March 1, 2024', amount: '$10,000', status: 'paid' },
                { name: 'Invoice INV-2024-002', date: 'March 15, 2024', amount: '$15,000', status: 'due' },
                { name: 'Invoice INV-2024-003', date: 'March 20, 2024', amount: '$12,500', status: 'paid' },
              ].map(doc => (
                <Card key={doc.name} className="p-4 border-border/20 hover:border-primary/20 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="font-medium text-foreground text-sm">{doc.name}</p>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-muted-foreground">{doc.date}</p>
                        <span className="inline-block px-2 py-0.5 text-xs rounded" style={{
                          backgroundColor: doc.status === 'paid' ? '#dcfce7' : '#fef3c7',
                          color: doc.status === 'paid' ? '#166534' : '#92400e'
                        }}>
                          {doc.status === 'paid' ? 'Paid' : 'Due'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="font-medium text-primary">{doc.amount}</p>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PortalLayout>
  )
}
