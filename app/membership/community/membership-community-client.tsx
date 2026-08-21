'use client'

import { PortalLayout } from '@/components/portals/portal-layout'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users } from 'lucide-react'

const membershipNavItems = [
  { label: 'Dashboard', href: '/membership' },
  { label: 'Collections', href: '/membership/collections' },
  { label: 'Events', href: '/membership/events' },
  { label: 'Community', href: '/membership/community' },
  { label: 'Benefits', href: '/membership/benefits' },
]

type Member = {
  id: string
  name: string
  tier: string
  company: string | null
  city: string | null
  memberSince: string
}

export default function MembershipCommunityClient({ members = [] }: { members: Member[] }) {
  return (
    <PortalLayout portalName="VIP Membership" portalSlug="membership" navItems={membershipNavItems}>
      <div className="space-y-8">
        <div className="space-y-2">
          <h1 className="font-serif text-4xl md:text-5xl font-light text-foreground">Community</h1>
          <p className="text-muted-foreground">Connect with fellow members of The Revamp UG.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {members.map((member) => (
            <Card key={member.id} className="p-5">
              <div className="flex items-center justify-between mb-2">
                <p className="font-medium text-foreground">{member.name}</p>
                <Badge className="capitalize">{member.tier}</Badge>
              </div>
              {member.company && <p className="text-sm text-muted-foreground">{member.company}</p>}
              {member.city && <p className="text-sm text-muted-foreground">{member.city}</p>}
              <p className="text-xs text-muted-foreground mt-2">
                Member since {new Date(member.memberSince).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              </p>
            </Card>
          ))}

          {members.length === 0 && (
            <div className="sm:col-span-2 lg:col-span-3 flex flex-col items-center rounded-lg border border-dashed border-border/40 p-12 text-center">
              <Users className="mb-3 h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No community members yet — be the first to join!</p>
            </div>
          )}
        </div>
      </div>
    </PortalLayout>
  )
}