'use client'

import { Check, Copy, Gift, Sparkles, Users } from '@/components/ui/luxury-icons'
import { useState } from 'react'

export type LoyaltyCardData = {
  balancePoints: number
  lifetimeEarned: number
  lifetimeRedeemed: number
  referralCode: string
  referralLinkPath: string
  tier: string
  nextTier: string | null
  pointsToNextTier: number
  dailyClaimedToday: boolean
  recentTransactions: Array<{
    id: string
    points: number
    type: string
    description: string
    createdAt: Date
    expiresAt: Date | null
  }>
  referrals: Array<{
    id: string
    status: string
    rewardPoints: number
    createdAt: Date
    qualifiedAt: Date | null
  }>
  rules: {
    pointsPerUgxDescription: string
    dailyLoginPoints: number
    welcomePoints: number
    reviewPoints: number
    consultationPoints: number
    referralRewardPoints: number
    redemptionUgxPerPoint: number
    redemptionCapPercent: number
  }
}

export function LoyaltyCard({ data }: { data: LoyaltyCardData }) {
  const [copied, setCopied] = useState(false)
  const format = new Intl.NumberFormat('en-UG')

  async function copyReferralLink() {
    const link = `${window.location.origin}${data.referralLinkPath}`
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2200)
    } catch {
      setCopied(false)
    }
  }

  return (
    <section id="loyalty" className="overflow-hidden border border-border bg-card" aria-labelledby="loyalty-heading">
      <div className="border-b border-border/70 bg-gradient-to-br from-primary via-primary to-primary/80 p-4 text-primary-foreground sm:p-6">
        <div className="relative min-h-52 overflow-hidden rounded-2xl border border-white/20 bg-black/10 p-5 shadow-2xl sm:min-h-60 sm:p-7">
          <div className="pointer-events-none absolute -right-16 -top-20 size-56 rounded-full border border-white/15" />
          <div className="pointer-events-none absolute -bottom-24 -left-12 size-64 rounded-full border border-white/10" />
          <div className="relative flex h-full flex-col justify-between gap-8">
            <div className="flex items-start justify-between gap-4"><div><p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.24em] text-primary-foreground/70"><Sparkles className="size-3.5" aria-hidden="true" /> Revamp Rewards</p><h2 id="loyalty-heading" className="mt-3 font-serif text-3xl leading-tight sm:text-4xl">A little more in return.</h2></div><span className="rounded-full border border-white/20 px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-primary-foreground/80">{data.tier} tier</span></div>
            <div className="flex items-end justify-between gap-5"><div><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary-foreground/70">Member points</p><p className="mt-2 font-serif text-4xl leading-none sm:text-5xl">{format.format(data.balancePoints)}</p></div><div className="text-right text-xs text-primary-foreground/65"><p>REVAMP / {new Date().getFullYear()}</p><p className="mt-1 tracking-[0.18em]">•••• {String(data.balancePoints).slice(-4).padStart(4, '0')}</p></div></div>
          </div>
        </div>
        <p className="mx-auto mt-4 max-w-xl px-1 text-sm leading-6 text-primary-foreground/75">Earn points as you shop, show up, and share considered living with someone new.</p>
      </div>

      <div className="grid gap-px border-b border-border bg-border sm:grid-cols-3">
        <Metric label="Lifetime earned" value={format.format(data.lifetimeEarned)} />
        <Metric label="Lifetime redeemed" value={format.format(data.lifetimeRedeemed)} />
        <Metric label="Next reward value" value={`UGX ${format.format(data.balancePoints * data.rules.redemptionUgxPerPoint)}`} />
      </div>

      <div className="grid gap-6 p-5 sm:p-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
        <div className="min-w-0 space-y-5">
          <div className="flex items-start gap-3 rounded border border-border/70 bg-background p-4">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"><Gift className="size-5" aria-hidden="true" /></span>
            <div className="min-w-0">
              <p className="text-sm font-medium">Daily check-in</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">{data.dailyClaimedToday ? `You have claimed today’s ${data.rules.dailyLoginPoints} points.` : `Open your account daily to claim ${data.rules.dailyLoginPoints} points.`}</p>
            </div>
            <span className="ml-auto shrink-0 text-xs font-medium text-primary">{data.dailyClaimedToday ? 'Claimed' : `+${data.rules.dailyLoginPoints}`}</span>
          </div>

          <div>
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div><p className="text-sm font-medium">{data.nextTier ? `${data.pointsToNextTier} points to ${data.nextTier}` : 'Highest tier reached'}</p><p className="mt-1 text-xs text-muted-foreground">Lifetime points unlock studio privileges.</p></div>
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-primary">{data.tier}</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted" aria-hidden="true"><div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${data.nextTier ? Math.min(100, (data.lifetimeEarned / Math.max(1, data.lifetimeEarned + data.pointsToNextTier)) * 100) : 100}%` }} /></div>
          </div>

          <div className="rounded border border-border/70 p-4">
            <div className="flex items-start gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"><Users className="size-5" aria-hidden="true" /></span><div className="min-w-0"><p className="text-sm font-medium">Invite someone to Revamp</p><p className="mt-1 text-xs leading-5 text-muted-foreground">They receive a welcome bonus, and you receive {format.format(data.rules.referralRewardPoints)} points after their qualifying order.</p></div></div>
            <div className="mt-4 flex min-w-0 flex-col gap-3 sm:flex-row"><code className="min-w-0 flex-1 truncate border border-border bg-background px-3 py-3 text-xs text-muted-foreground">{data.referralCode}</code><button type="button" onClick={copyReferralLink} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 bg-primary px-4 text-xs font-semibold uppercase tracking-[0.12em] text-primary-foreground transition-opacity hover:opacity-90">{copied ? <Check className="size-4" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}{copied ? 'Copied' : 'Copy link'}</button></div>
            {data.referrals.length > 0 && <p className="mt-3 text-xs text-muted-foreground">{data.referrals.filter((referral) => referral.status === 'qualified').length} qualifying referral{data.referrals.filter((referral) => referral.status === 'qualified').length === 1 ? '' : 's'} so far.</p>}
          </div>
        </div>

        <div className="min-w-0">
          <div className="flex items-end justify-between gap-3"><div><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">Points activity</p><p className="mt-2 font-serif text-2xl">Your latest rewards</p></div><span className="text-xs text-muted-foreground">{data.rules.pointsPerUgxDescription}</span></div>
          <div className="mt-4 divide-y divide-border/70 border-y border-border/70">
            {data.recentTransactions.length > 0 ? data.recentTransactions.slice(0, 6).map((transaction) => <div key={transaction.id} className="flex items-start justify-between gap-4 py-3"><div className="min-w-0"><p className="truncate text-sm">{transaction.description}</p><p className="mt-1 text-xs text-muted-foreground">{transaction.createdAt.toLocaleDateString('en-UG', { day: 'numeric', month: 'short', year: 'numeric' })}</p></div><span className={`shrink-0 text-sm font-medium ${transaction.points > 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'}`}>{transaction.points > 0 ? '+' : ''}{format.format(transaction.points)}</span></div>) : <p className="py-5 text-sm text-muted-foreground">Your points activity will appear here.</p>}
          </div>
          <p className="mt-4 text-xs leading-5 text-muted-foreground">Points can cover up to {data.rules.redemptionCapPercent}% of eligible product spend at UGX {format.format(data.rules.redemptionUgxPerPoint)} per point. They expire according to the rewards terms shown at checkout.</p>
        </div>
      </div>
    </section>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="bg-background p-4 sm:p-5"><p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{label}</p><p className="mt-2 font-serif text-2xl text-foreground">{value}</p></div>
}
