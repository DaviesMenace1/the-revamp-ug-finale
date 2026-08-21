'use client'

import { PortalLayout } from '@/components/portals/portal-layout'
import { FileText, Video, Download } from 'lucide-react'

const tradeNavItems = [
  { label: 'Dashboard', href: '/trade' },
  { label: 'Collections', href: '/trade/collections' },
  { label: 'Wholesale Pricing', href: '/trade/pricing' },
  { label: 'Orders', href: '/trade/orders' },
  { label: 'Resources', href: '/trade/resources' },
]

type Resource = {
  id: string
  title: string
  description: string | null
  type: string
  fileUrl: string
  fileSize: string | null
  createdAt: string
}

export default function TradeResourcesClient({ resources = [] }: { resources: Resource[] }) {
  return (
    <PortalLayout portalName="Trade Portal" portalSlug="trade" navItems={tradeNavItems}>
      <div className="space-y-8">
        <div className="space-y-2">
          <h1 className="font-serif text-4xl md:text-5xl font-light text-foreground">Resources</h1>
          <p className="text-muted-foreground">Catalogs, guides, and assets for trade partners.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {resources.map((resource) => {
            const Icon = resource.type === 'video' ? Video : FileText

            return (
              <a
                key={resource.id}
                href={resource.fileUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-start gap-4 rounded-lg border border-border/20 p-5 hover:border-primary/30 hover:bg-primary/5 transition-all"
              >
                <Icon className="w-6 h-6 text-primary shrink-0 mt-1" />
                <div className="flex-1">
                  <p className="font-medium text-foreground">{resource.title}</p>
                  {resource.description && (
                    <p className="text-sm text-muted-foreground mt-1">{resource.description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                    <span>{new Date(resource.createdAt).toLocaleDateString()}</span>
                    {resource.fileSize && (
                      <>
                        <span>·</span>
                        <span>{resource.fileSize}</span>
                      </>
                    )}
                  </div>
                </div>
                <Download className="w-4 h-4 text-muted-foreground shrink-0" />
              </a>
            )
          })}

          {resources.length === 0 && (
            <div className="sm:col-span-2 flex flex-col items-center rounded-lg border border-dashed border-border/40 p-12 text-center">
              <FileText className="mb-3 h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No resources published yet.</p>
            </div>
          )}
        </div>
      </div>
    </PortalLayout>
  )
}
