'use client'

import { useState, useTransition } from 'react'
import { Check, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { saveSetting } from '@/lib/actions/settings'

export type SubscriptionPlan = {
  key: string
  name: string
  description: string
  monthlyAmount: string
  annualAmount: string
  benefits: string[]
  discountRate?: number
  enabled: boolean
}

export type SubscriptionPricing = {
  membership: SubscriptionPlan[]
  trade: SubscriptionPlan[]
}

function annualSavings(plan: SubscriptionPlan) {
  const monthly = Number(plan.monthlyAmount)
  const annual = Number(plan.annualAmount)
  if (!Number.isFinite(monthly) || !Number.isFinite(annual) || monthly <= 0 || annual <= 0) return 0
  return Math.max(0, monthly * 12 - annual)
}

function formatUgx(amount: number) {
  return `${Math.round(amount).toLocaleString('en-UG')} UGX`
}

export default function SubscriptionPricingClient({ initialPricing }: { initialPricing: SubscriptionPricing }) {
  const [pricing, setPricing] = useState(initialPricing)
  const [saved, setSaved] = useState(false)
  const [isPending, startTransition] = useTransition()

  function updatePlan(program: 'membership' | 'trade', index: number, patch: Partial<SubscriptionPlan>) {
    setPricing((current) => ({
      ...current,
      [program]: current[program].map((plan, planIndex) => planIndex === index ? { ...plan, ...patch } : plan),
    }))
    setSaved(false)
  }

  function save() {
    startTransition(async () => {
      const result = await saveSetting('subscription_pricing', pricing as unknown as Record<string, unknown>)
      if (result.success) {
        setSaved(true)
        setTimeout(() => setSaved(false), 2500)
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Trade & Membership subscriptions</CardTitle>
        <CardDescription>
          Edit monthly and annual prices, benefits, and availability. Annual plans show the saving against twelve monthly payments.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {(['membership', 'trade'] as const).map((program) => (
          <section key={program} className="space-y-4">
            <div>
              <h3 className="text-lg font-medium capitalize">{program} plans</h3>
              <p className="text-sm text-muted-foreground">Successful payment activates access immediately for the selected term.</p>
            </div>
            <div className="space-y-5">
              {pricing[program].map((plan, index) => {
                const savings = annualSavings(plan)
                return (
                  <div key={plan.key} className="rounded-lg border border-border/70 p-4 sm:p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.24em] text-primary">{plan.key}</p>
                        <h4 className="mt-1 text-base font-medium">{plan.name}</h4>
                      </div>
                      <label className="flex min-h-11 items-center gap-2 text-sm">
                        <input type="checkbox" checked={plan.enabled} onChange={(event) => updatePlan(program, index, { enabled: event.target.checked })} className="size-4" />
                        Available for purchase
                      </label>
                    </div>
                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <label className="space-y-2 text-sm">
                        <span className="font-medium">Display name</span>
                        <Input value={plan.name} onChange={(event) => updatePlan(program, index, { name: event.target.value })} className="min-h-11" />
                      </label>
                      <label className="space-y-2 text-sm">
                        <span className="font-medium">Discount rate (%)</span>
                        <Input type="number" min="0" max="100" value={plan.discountRate ?? ''} onChange={(event) => updatePlan(program, index, { discountRate: event.target.value === '' ? undefined : Number(event.target.value) })} className="min-h-11" />
                      </label>
                      <label className="space-y-2 text-sm md:col-span-2">
                        <span className="font-medium">Description</span>
                        <Input value={plan.description} onChange={(event) => updatePlan(program, index, { description: event.target.value })} className="min-h-11" />
                      </label>
                      <label className="space-y-2 text-sm">
                        <span className="font-medium">Monthly price (UGX)</span>
                        <Input inputMode="numeric" value={plan.monthlyAmount} onChange={(event) => updatePlan(program, index, { monthlyAmount: event.target.value.replace(/[^0-9]/g, '') })} className="min-h-11" />
                      </label>
                      <label className="space-y-2 text-sm">
                        <span className="font-medium">Annual price (UGX)</span>
                        <Input inputMode="numeric" value={plan.annualAmount} onChange={(event) => updatePlan(program, index, { annualAmount: event.target.value.replace(/[^0-9]/g, '') })} className="min-h-11" />
                      </label>
                    </div>
                    <div className="mt-4">
                      <label className="space-y-2 text-sm">
                        <span className="font-medium">Benefits, one per line</span>
                        <Textarea value={plan.benefits.join('\n')} onChange={(event) => updatePlan(program, index, { benefits: event.target.value.split('\n').map((benefit) => benefit.trim()).filter(Boolean) })} rows={4} />
                      </label>
                    </div>
                    <p className="mt-3 text-xs text-muted-foreground">
                      {savings > 0 ? `Annual saving: ${formatUgx(savings)} compared with twelve monthly payments.` : 'Enter both prices to show the annual saving.'}
                    </p>
                  </div>
                )
              })}
            </div>
          </section>
        ))}
        <Button type="button" disabled={isPending} onClick={save} className="min-h-11 rounded-none bg-primary text-primary-foreground hover:bg-primary/90">
          {saved ? <Check className="mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
          {saved ? 'Saved' : 'Save subscription pricing'}
        </Button>
      </CardContent>
    </Card>
  )
}
