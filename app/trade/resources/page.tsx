'use client'

import { PortalLayout } from '@/components/portals/portal-layout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Download, FileText, Video } from 'lucide-react'

export default function TradeResources() {
  const resources = [
    {
      id: 1,
      title: 'Wholesale Catalog 2024',
      description: 'Complete digital catalog with all available wholesale products, specifications, and pricing.',
      type: 'catalog',
      icon: FileText,
      date: 'July 2024',
      size: '2.4 MB',
    },
    {
      id: 2,
      title: 'Material Sourcing Guide',
      description: 'Learn about our material sourcing practices, certifications, and sustainability commitments.',
      type: 'guide',
      icon: FileText,
      date: 'June 2024',
      size: '1.1 MB',
    },
    {
      id: 3,
      title: 'Marketing Assets Package',
      description: 'High-resolution product images, graphics, and copy for your marketing materials.',
      type: 'assets',
      icon: FileText,
      date: 'July 2024',
      size: '156 MB',
    },
    {
      id: 4,
      title: 'Product Video Tour',
      description: 'Visual walkthrough of our newest collections and design philosophy.',
      type: 'video',
      icon: Video,
      date: 'May 2024',
      size: '–',
    },
    {
      id: 5,
      title: 'Installation Best Practices',
      description: 'Expert tips on proper handling, installation, and care of our products.',
      type: 'guide',
      icon: FileText,
      date: 'April 2024',
      size: '0.8 MB',
    },
    {
      id: 6,
      title: 'Trade Terms & Conditions',
      description: 'Updated wholesale agreement, payment terms, and policies.',
      type: 'legal',
      icon: FileText,
      date: 'July 2024',
      size: '0.3 MB',
    },
  ]

  return (
    <PortalLayout
      portalName="Wholesale Partner"
      portalSlug="trade"
      navItems={[
        { label: 'Dashboard', href: '/trade' },
        { label: 'Collections', href: '/trade/collections' },
        { label: 'Orders', href: '/trade/orders' },
        { label: 'Pricing', href: '/trade/pricing' },
        { label: 'Resources', href: '/trade/resources' },
      ]}
    >
      <div className="space-y-12">
        <div>
          <h1 className="font-serif text-4xl font-light text-foreground mb-2">Trade Resources</h1>
          <p className="text-lg text-muted-foreground">Access marketing materials, guides, videos, and product documentation.</p>
        </div>
        {/* Resources Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {resources.map(resource => {
            const Icon = resource.icon
            return (
              <div
                key={resource.id}
                className="border border-border/20 rounded-lg p-6 hover:border-primary/20 transition-colors"
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex gap-3">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-serif text-lg font-light text-foreground">
                        {resource.title}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">{resource.date}</p>
                    </div>
                  </div>
                </div>

                <p className="text-muted-foreground font-light text-sm mb-4">
                  {resource.description}
                </p>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{resource.size}</span>
                  <Button size="sm" variant="outline" className="gap-2">
                    <Download className="w-4 h-4" />
                    Download
                  </Button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Request Custom Resources */}
        <div className="bg-muted/40 border border-border/20 rounded-lg p-8">
          <h3 className="font-serif text-2xl font-light text-foreground mb-3">
            Need Custom Marketing Materials?
          </h3>
          <p className="text-muted-foreground font-light mb-6">
            Our team can create tailored product photography, branding assets, or promotional materials for your market.
          </p>
          <Button variant="outline" size="lg">
            Request Custom Assets
          </Button>
        </div>

        {/* Resource Guide */}
        <div className="space-y-6">
          <h3 className="font-serif text-2xl font-light text-foreground">How to Use These Resources</h3>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                title: 'Catalogs & Pricing',
                description: 'Use our catalogs to familiarize yourself with our full range. Pricing updates happen quarterly.',
              },
              {
                title: 'Marketing Assets',
                description: 'Download high-res images and copy for your website, print, and social media marketing.',
              },
              {
                title: 'Educational Content',
                description: 'Videos and guides help you understand our products, sourcing, and installation best practices.',
              },
              {
                title: 'Compliance Documents',
                description: 'Review terms, certifications, and sustainability reports to stay informed and compliant.',
              },
            ].map((item, idx) => (
              <div key={idx} className="space-y-2">
                <p className="font-medium text-foreground">{item.title}</p>
                <p className="text-sm text-muted-foreground font-light">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PortalLayout>
  )
}
