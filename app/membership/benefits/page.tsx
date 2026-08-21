import { requirePortalUser } from '@/lib/auth/portal-auth'
import { db } from '@/lib/db/client'
import { memberships } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import MembershipBenefitsClient from './membership-benefits-client'

export const dynamic = 'force-dynamic'

export default async function MembershipBenefits() {
  const user = await requirePortalUser(
    ['customer', 'admin', 'designer', 'trade_member', 'architect', 'interior_designer'],
    '/membership/benefits',
  )

  const membership = await db.query.memberships.findFirst({ where: eq(memberships.userId, user.id) })

  return <MembershipBenefitsClient currentTier={membership?.membershipType ?? null} />
}