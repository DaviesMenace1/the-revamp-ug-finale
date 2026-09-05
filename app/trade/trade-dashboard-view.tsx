'use client'

import { PortalLayout } from '@/components/portals/portal-layout'
import { Card } from '@/components/ui/card'
import Link from 'next/link'
import { DollarSign, Package, Download } from '@/components/ui/luxury-icons'

const tradeNavItems = [
  { label: 'Dashboard', href: '/trade' },
  { label: 'Collections', href: '/trade/collections' },
    { label: 'Wholesale Pricing', href: '/trade/pricing' },
  { label: 'Events', href: '/trade/events' },
  { label: 'Orders', href: '/trade/orders' },

  { label: 'Resources', href: '/trade/resources' },
]

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-UG', {
    style: 'currency',
    currency: 'UGX',
    maximumFractionDigits: 0,
  }).format(value || 0)
}

type Member = {
  businessName: string
  tier: string
  status: string
} | null

type Stats = {
  totalOrders: number
  pendingOrders: number
  ytdSpend: number
}

export default function TradeDashboardView({ member, stats }: { member: Member; stats: Stats }) {
  return (
    <PortalLayout portalName="Trade Portal" portalSlug="trade" navItems={tradeNavItems}>
      <div className="space-y-12">
        <div className="space-y-2">
          <h1 className="font-serif text-3xl font-light text-foreground sm:text-4xl md:text-5xl">Trade Portal</h1>
          <p className="text-muted-foreground">
            Access wholesale collections, pricing, and exclusive resources for design professionals.
          </p>
        </div>

        {member?.status === 'pending' && (
<Card className="border-amber-300/70 bg-amber-50 p-6 dark:border-amber-400/40 dark:bg-amber-950/40">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              Your trade application for <strong>{member.businessName}</strong> is pending review. Trade collections remain locked until the studio completes its review.
            </p>
          </Card>
        )}

        {!member && (
          <Card className="p-6 border-border/20 border-dashed">
            <p className="text-sm text-muted-foreground">
              You have not submitted a trade application yet. Contact us to get set up with a trade account.
            </p>
          </Card>
        )}

        <div className="grid md:grid-cols-4 gap-6">
          <Card className="p-6 border-border/20">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Orders</p>
              <p className="font-serif text-4xl font-light text-primary">{stats.totalOrders}</p>
            </div>
          </Card>
          <Card className="p-6 border-border/20">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">YTD Spend</p>
              <p className="font-serif text-4xl font-light text-primary">{formatCurrency(stats.ytdSpend)}</p>
            </div>
          </Card>
          <Card className="p-6 border-border/20">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Pending Orders</p>
              <p className="font-serif text-4xl font-light text-primary">{stats.pendingOrders}</p>
            </div>
          </Card>
          <Card className="p-6 border-border/20">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Your Tier</p>
              <p className="font-serif text-2xl font-light text-primary capitalize">
                {member?.tier ?? 'N/A'}
              </p>
              {member && <p className="text-xs text-muted-foreground">Product-specific pricing applies in Collections</p>}
            </div>
          </Card>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Link
            href="/trade/collections"
            className="p-6 border border-border/20 rounded-lg hover:border-primary/20 hover:bg-primary/5 transition-all"
          >
            <Package className="w-8 h-8 text-primary mb-3" />
            <h3 className="font-medium text-foreground mb-1">Browse Collections</h3>
            <p className="text-sm text-muted-foreground">View all wholesale products and exclusive lines</p>
          </Link>
          <Link
            href="/trade/pricing"
            className="p-6 border border-border/20 rounded-lg hover:border-primary/20 hover:bg-primary/5 transition-all"
          >
            <DollarSign className="w-8 h-8 text-primary mb-3" />
            <h3 className="font-medium text-foreground mb-1">Pricing & Discounts</h3>
            <p className="text-sm text-muted-foreground">Check tiered pricing and volume discounts</p>
          </Link>
          <Link
            href="/trade/resources"
            className="p-6 border border-border/20 rounded-lg hover:border-primary/20 hover:bg-primary/5 transition-all"
          >
            <Download className="w-8 h-8 text-primary mb-3" />
            <h3 className="font-medium text-foreground mb-1">Resources</h3>
            <p className="text-sm text-muted-foreground">Download spec sheets, catalogs, and guides</p>
          </Link>
        </div>
      </div>
    </PortalLayout>
  )
}
