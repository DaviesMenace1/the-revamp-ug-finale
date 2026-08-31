'use client'

import { useState, useTransition } from 'react'
import { Check, ClipboardCheck, Gift, RefreshCw, Save, SlidersHorizontal, Users } from '@/components/ui/luxury-icons'
import { adjustPointsAsAdmin, updateLoyaltyRules } from '@/lib/actions/loyalty'

 type AdminData = {
  rules: {
    enabled: boolean
    pointsPerUgx: number
    pointsPerUgxDescription: string
    welcomePoints: number
    dailyLoginPoints: number
    reviewPoints: number
    profileCompletionPoints: number
    consultationPoints: number
    referralSignupPoints: number
    referralRewardPoints: number
    referralMinimumOrderUgx: number
    redemptionUgxPerPoint: number
    redemptionCapPercent: number
    pointsValidityDays: number
    tiers: ReadonlyArray<{ key: string; label: string; lifetimePoints: number }>
  }
  accounts: Array<{
    userId: string
    email: string
    firstName: string | null
    lastName: string | null
    balancePoints: number
  }>
  summary: {
    accountCount: number
    availablePoints: number
    lifetimeEarned: number
    lifetimeRedeemed: number
    pendingReferrals: number
  }
  recentTransactions: Array<{
    id: string
    email: string
    points: number
    type: string
    description: string
    createdAt: Date
  }>
}

export default function LoyaltyAdminClient({ initialData, loadError, migrationRequired = false }: { initialData: AdminData | null; loadError: string | null; migrationRequired?: boolean }) {
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedUser, setSelectedUser] = useState('')
  const [adjustmentPoints, setAdjustmentPoints] = useState('')
  const [adjustmentReason, setAdjustmentReason] = useState('')
  const [rules, setRules] = useState(() => initialData?.rules)
  const format = new Intl.NumberFormat('en-UG')

  if (!initialData || !rules) {
    if (migrationRequired) {
      return (
        <main className="min-w-0 p-5 sm:p-8">
          <section className="mx-auto w-full max-w-3xl border border-amber-300/60 bg-amber-50 p-6 text-amber-950 shadow-sm dark:border-amber-400/30 dark:bg-amber-950/30 dark:text-amber-50 sm:p-8" role="status">
            <div className="flex items-start gap-4">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-amber-200/70 text-amber-900 dark:bg-amber-400/20 dark:text-amber-100"><ClipboardCheck className="size-5" aria-hidden="true" /></span>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-amber-800 dark:text-amber-200">Revamp Rewards setup</p>
                <h1 className="mt-2 font-serif text-3xl leading-tight sm:text-4xl">One database step is still pending.</h1>
                <p className="mt-4 max-w-2xl text-sm leading-6 text-amber-900/80 dark:text-amber-50/80">The loyalty code is in this branch, but the live database does not yet have its ledger tables. Nothing is broken or lost; rewards controls will appear after the owner-approved migration is applied.</p>
              </div>
            </div>
            <div className="mt-7 border-t border-amber-900/15 pt-6 dark:border-amber-100/15">
              <p className="text-sm font-semibold">Apply this file through your normal database migration process:</p>
              <code className="mt-3 block overflow-x-auto rounded bg-amber-950 px-3 py-3 text-xs text-amber-50">drizzle/0007_loyalty_points.sql</code>
              <ol className="mt-5 grid gap-3 pl-5 text-sm leading-6 marker:font-semibold">
                <li>Review the SQL in the `fixes` branch.</li>
                <li>Apply it once to the intended production Supabase project.</li>
                <li>Return here and refresh this page to load the rewards controls.</li>
              </ol>
              <p className="mt-5 text-xs leading-5 text-amber-900/75 dark:text-amber-50/75">Do not use an ad-hoc schema push for this step. The migration is intentionally not run by the application and no database changes were made automatically.</p>
            </div>
            <button type="button" onClick={() => window.location.reload()} className="mt-7 inline-flex min-h-11 items-center justify-center gap-2 bg-amber-950 px-5 text-xs font-semibold uppercase tracking-[0.14em] text-amber-50 dark:bg-amber-200 dark:text-amber-950"><RefreshCw className="size-4" aria-hidden="true" /> Check again</button>
          </section>
        </main>
      )
    }

    return <div className="p-5 sm:p-8"><div className="border border-destructive/30 bg-destructive/5 p-5 text-sm text-destructive" role="alert">{loadError || 'The loyalty workspace is not available yet.'}<button type="button" onClick={() => window.location.reload()} className="ml-3 min-h-11 font-medium underline underline-offset-4">Retry</button></div></div>
  }

  function saveRules() {
    if (!rules) return
    setMessage(null)
    setError(null)
    startTransition(async () => {
      const result = await updateLoyaltyRules({
        ...rules,
        pointsPerUgx: Number(rules.pointsPerUgx),
        welcomePoints: Number(rules.welcomePoints),
        dailyLoginPoints: Number(rules.dailyLoginPoints),
        reviewPoints: Number(rules.reviewPoints),
        profileCompletionPoints: Number(rules.profileCompletionPoints),
        consultationPoints: Number(rules.consultationPoints),
        referralSignupPoints: Number(rules.referralSignupPoints),
        referralRewardPoints: Number(rules.referralRewardPoints),
        referralMinimumOrderUgx: Number(rules.referralMinimumOrderUgx),
        redemptionUgxPerPoint: Number(rules.redemptionUgxPerPoint),
        redemptionCapPercent: Number(rules.redemptionCapPercent),
        pointsValidityDays: Number(rules.pointsValidityDays),
      })
      if (!result.success) {
        setError('error' in result ? result.error || 'Rules could not be saved.' : 'Rules could not be saved.')
        return
      }
      setMessage('Loyalty rules saved.')
    })
  }

  function adjustBalance() {
    setMessage(null)
    setError(null)
    const points = Number(adjustmentPoints)
    if (!selectedUser || !Number.isInteger(points) || points === 0 || adjustmentReason.trim().length < 3) {
      setError('Choose a customer, enter a non-zero points amount, and provide a reason.')
      return
    }
    startTransition(async () => {
      const result = await adjustPointsAsAdmin(selectedUser, points, adjustmentReason)
      if (!result.success) {
        setError(result.error || 'The adjustment could not be applied.')
        return
      }
      setMessage(`${points > 0 ? 'Added' : 'Removed'} ${format.format(Math.abs(points))} points.`)
      setAdjustmentPoints('')
      setAdjustmentReason('')
      window.setTimeout(() => window.location.reload(), 700)
    })
  }

  return (
    <div className="min-w-0 space-y-8 p-5 sm:p-8">
      <header className="flex flex-col gap-4 border-b border-border/70 pb-7 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-[10px] uppercase tracking-[0.24em] text-primary">Retention engine</p><h1 className="mt-2 font-serif text-4xl font-light text-foreground sm:text-5xl">Loyalty rewards</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Control Revamp Rewards, review point movement, and keep customer goodwill visible without changing balances outside the ledger.</p></div><div className="flex items-center gap-2 text-xs text-muted-foreground"><Gift className="size-4 text-primary" aria-hidden="true" /> {rules.enabled ? 'Program live' : 'Program paused'}</div></header>

      {(message || error) && <div role={error ? 'alert' : 'status'} className={`flex flex-wrap items-center gap-3 border px-4 py-3 text-sm ${error ? 'border-destructive/30 bg-destructive/5 text-destructive' : 'border-emerald-300/40 bg-emerald-50 text-emerald-900 dark:border-emerald-400/30 dark:bg-emerald-950/30 dark:text-emerald-100'}`}>{error ? <RefreshCw className="size-4" aria-hidden="true" /> : <Check className="size-4" aria-hidden="true" />}{error || message}</div>}
      {loadError && <div role="status" className="border border-amber-300/50 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-400/30 dark:bg-amber-950/30 dark:text-amber-100">Some loyalty reports are temporarily unavailable. The controls below remain usable.</div>}

      <section className="grid gap-px border border-border bg-border sm:grid-cols-2 xl:grid-cols-5">
        <Metric label="Accounts" value={format.format(initialData.summary.accountCount)} />
        <Metric label="Available points" value={format.format(initialData.summary.availablePoints)} />
        <Metric label="Lifetime issued" value={format.format(initialData.summary.lifetimeEarned)} />
        <Metric label="Redeemed" value={format.format(initialData.summary.lifetimeRedeemed)} />
        <Metric label="Pending referrals" value={format.format(initialData.summary.pendingReferrals)} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div className="border border-border bg-card p-5 sm:p-7"><div className="flex items-start gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"><SlidersHorizontal className="size-5" aria-hidden="true" /></span><div><h2 className="font-serif text-2xl">Program rules</h2><p className="mt-1 text-sm text-muted-foreground">Adjust values without editing application code.</p></div></div><div className="mt-6 grid gap-4 sm:grid-cols-2"> <RuleField label="Welcome points" value={rules.welcomePoints} onChange={(value) => setRules({ ...rules, welcomePoints: Number(value) })} /><RuleField label="Daily check-in points" value={rules.dailyLoginPoints} onChange={(value) => setRules({ ...rules, dailyLoginPoints: Number(value) })} /><RuleField label="Review points" value={rules.reviewPoints} onChange={(value) => setRules({ ...rules, reviewPoints: Number(value) })} /><RuleField label="Consultation points" value={rules.consultationPoints} onChange={(value) => setRules({ ...rules, consultationPoints: Number(value) })} /><RuleField label="Referral signup points" value={rules.referralSignupPoints} onChange={(value) => setRules({ ...rules, referralSignupPoints: Number(value) })} /><RuleField label="Referral reward points" value={rules.referralRewardPoints} onChange={(value) => setRules({ ...rules, referralRewardPoints: Number(value) })} /><RuleField label="Minimum referral order (UGX)" value={rules.referralMinimumOrderUgx} onChange={(value) => setRules({ ...rules, referralMinimumOrderUgx: Number(value) })} /><RuleField label="UGX per point" value={rules.redemptionUgxPerPoint} onChange={(value) => setRules({ ...rules, redemptionUgxPerPoint: Number(value) })} /><RuleField label="Redemption cap (%)" value={rules.redemptionCapPercent} onChange={(value) => setRules({ ...rules, redemptionCapPercent: Number(value) })} /><RuleField label="Validity (days)" value={rules.pointsValidityDays} onChange={(value) => setRules({ ...rules, pointsValidityDays: Number(value) })} /></div><label className="mt-5 flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" checked={rules.enabled} onChange={(event) => setRules({ ...rules, enabled: event.target.checked })} className="size-4 accent-primary" /> Program is active</label><p className="mt-4 text-xs leading-5 text-muted-foreground">Order rewards use {rules.pointsPerUgxDescription}. Tier thresholds remain code-defined until the program has enough history to tune them responsibly.</p><button type="button" onClick={saveRules} disabled={isPending} className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 bg-primary px-5 text-xs font-semibold uppercase tracking-[0.14em] text-primary-foreground disabled:opacity-50"><Save className="size-4" aria-hidden="true" />{isPending ? 'Saving…' : 'Save rules'}</button></div>

        <div className="border border-border bg-card p-5 sm:p-7"><div className="flex items-start gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"><Users className="size-5" aria-hidden="true" /></span><div><h2 className="font-serif text-2xl">Manual adjustment</h2><p className="mt-1 text-sm text-muted-foreground">Use only for documented service recovery or corrections.</p></div></div><div className="mt-6 space-y-4"><label className="grid gap-2 text-sm font-medium"><span>Customer</span><select value={selectedUser} onChange={(event) => setSelectedUser(event.target.value)} className="min-h-11 w-full border border-input bg-background px-3 text-sm text-foreground"><option value="">Choose a customer</option>{initialData.accounts.map((account) => <option key={account.userId} value={account.userId}>{[account.firstName, account.lastName].filter(Boolean).join(' ') || account.email} · {format.format(account.balancePoints)} pts</option>)}</select></label><label className="grid gap-2 text-sm font-medium"><span>Points adjustment</span><input type="number" step="1" value={adjustmentPoints} onChange={(event) => setAdjustmentPoints(event.target.value)} placeholder="e.g. 250 or -100" className="min-h-11 w-full border border-input bg-background px-3 text-sm text-foreground" /></label><label className="grid gap-2 text-sm font-medium"><span>Reason</span><textarea value={adjustmentReason} onChange={(event) => setAdjustmentReason(event.target.value)} rows={4} placeholder="Why is this adjustment being made?" className="w-full resize-y border border-input bg-background px-3 py-3 text-sm text-foreground" /></label><button type="button" onClick={adjustBalance} disabled={isPending} className="inline-flex min-h-11 w-full items-center justify-center gap-2 border border-border px-5 text-xs font-semibold uppercase tracking-[0.14em] text-foreground disabled:opacity-50 sm:w-auto">{isPending ? 'Applying…' : 'Apply adjustment'}</button></div></div>
      </section>

      <section className="border border-border bg-card"><div className="border-b border-border/70 p-5 sm:p-7"><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">Audit trail</p><h2 className="mt-2 font-serif text-2xl">Latest point movement</h2></div><div className="overflow-x-auto"><table className="w-full min-w-[680px] text-left"><thead className="border-b border-border/70 text-[10px] uppercase tracking-[0.14em] text-muted-foreground"><tr><th className="px-5 py-3 font-medium">Customer</th><th className="px-5 py-3 font-medium">Event</th><th className="px-5 py-3 font-medium">Points</th><th className="px-5 py-3 font-medium">Date</th></tr></thead><tbody>{initialData.recentTransactions.map((transaction) => <tr key={transaction.id} className="border-b border-border/50 last:border-0"><td className="px-5 py-4 text-sm text-foreground">{transaction.email}</td><td className="px-5 py-4"><p className="text-sm text-foreground">{transaction.description}</p><p className="mt-1 text-xs text-muted-foreground">{transaction.type.replaceAll('_', ' ')}</p></td><td className={`px-5 py-4 text-sm font-medium ${transaction.points >= 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'}`}>{transaction.points >= 0 ? '+' : ''}{format.format(transaction.points)}</td><td className="px-5 py-4 text-xs text-muted-foreground">{new Date(transaction.createdAt).toLocaleString('en-UG')}</td></tr>)}{initialData.recentTransactions.length === 0 && <tr><td colSpan={4} className="px-5 py-10 text-center text-sm text-muted-foreground">No point activity yet.</td></tr>}</tbody></table></div></section>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) { return <div className="bg-background p-4 sm:p-5"><p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">{label}</p><p className="mt-2 font-serif text-2xl text-foreground">{value}</p></div> }
function RuleField({ label, value, onChange }: { label: string; value: number; onChange: (value: string) => void }) { return <label className="grid gap-2 text-sm font-medium"><span>{label}</span><input type="number" value={value} onChange={(event) => onChange(event.target.value)} className="min-h-11 w-full border border-input bg-background px-3 text-sm text-foreground" /></label> }
