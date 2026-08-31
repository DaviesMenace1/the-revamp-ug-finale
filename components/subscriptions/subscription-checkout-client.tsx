'use client'

import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, CreditCard, Loader2, Smartphone } from '@/components/ui/luxury-icons'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatMoney } from '@/lib/utils'

export type SubscriptionPlanOption = {
  key: string
  name: string
  description: string
  monthlyAmount: string
  annualAmount: string
  benefits: string[]
  discountRate?: number
  enabled: boolean
}

type SubscriptionProgram = 'membership' | 'trade'
type BillingPeriod = 'monthly' | 'annual'
type AuthorizationChallenge = { subscriptionId: string; txRef: string; chargeId: string; authorizationType: 'pin' | 'otp' }

function savings(plan: SubscriptionPlanOption) {
  const monthly = Number(plan.monthlyAmount)
  const annual = Number(plan.annualAmount)
  if (!Number.isFinite(monthly) || !Number.isFinite(annual) || monthly <= 0 || annual <= 0) return 0
  return Math.max(0, monthly * 12 - annual)
}

function money(amount: string) {
  return formatMoney(Number(amount || 0), 'UGX')
}

function requestId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  return `00000000-0000-4000-8000-${Math.random().toString(16).slice(2).padEnd(12, '0').slice(0, 12)}`
}

export default function SubscriptionCheckoutClient({
  program,
  plans,
  currentPlan,
  hasActiveSubscription = false,
}: {
  program: SubscriptionProgram
  plans: SubscriptionPlanOption[]
  currentPlan?: string | null
  hasActiveSubscription?: boolean
}) {
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('annual')
  const [selectedPlanKey, setSelectedPlanKey] = useState(plans[0]?.key || '')
  const [paymentMethod, setPaymentMethod] = useState<'mobile_money' | 'card'>('mobile_money')
  const [mobileMoneyNetwork, setMobileMoneyNetwork] = useState<'MTN' | 'AIRTEL'>('MTN')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [cardNumber, setCardNumber] = useState('')
  const [cardExpiryMonth, setCardExpiryMonth] = useState('')
  const [cardExpiryYear, setCardExpiryYear] = useState('')
  const [cardCvv, setCardCvv] = useState('')
  const [authorizationCode, setAuthorizationCode] = useState('')
  const [challenge, setChallenge] = useState<AuthorizationChallenge | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null
    const params = new URLSearchParams(window.location.search)
    const payment = params.get('payment')
    const callbackMessage = params.get('message')
    if (payment === 'success') return 'Payment verified. Your program access is now active.'
    if (payment === 'pending') return callbackMessage || 'Your payment is still being authorized. We are checking it again automatically.'
    return null
  })
  const [errorMessage, setErrorMessage] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null
    const params = new URLSearchParams(window.location.search)
    return params.get('payment') === 'failed' ? params.get('message') || 'The payment could not be verified. Please start again.' : null
  })

  const selectedPlan = useMemo(() => plans.find((plan) => plan.key === selectedPlanKey) || plans[0], [plans, selectedPlanKey])
  const amount = selectedPlan ? (billingPeriod === 'annual' ? selectedPlan.annualAmount : selectedPlan.monthlyAmount) : ''
  const annualSaving = selectedPlan ? savings(selectedPlan) : 0

  useEffect(() => {
    let cancelled = false
    const params = new URLSearchParams(window.location.search)
    const payment = params.get('payment')
    const txRef = params.get('tx_ref') || params.get('reference')

    async function reconcile() {
      if (!txRef || !['pending', 'failed'].includes(payment || '')) return
      for (let attempt = 0; attempt < 6 && !cancelled; attempt += 1) {
        try {
          const response = await fetch(`/api/subscriptions/status?tx_ref=${encodeURIComponent(txRef)}`, { cache: 'no-store' })
          const data = await response.json().catch(() => null)
          if (cancelled) return
          if (data?.status === 'active') {
            setErrorMessage(null)
            setMessage('Payment verified. Your program access is now active.')
            return
          }
          if (data?.status === 'verification_failed') {
            setErrorMessage(data.message || 'The subscription payment could not be verified.')
            return
          }
          if (data?.message) setMessage(data.message)
        } catch {
          // The page can still be used while the payment provider finishes asynchronously.
        }
        if (attempt < 5) await new Promise((resolve) => window.setTimeout(resolve, 2500))
      }
    }

    void reconcile()
    return () => { cancelled = true }
  }, [])

  function clearFeedback() {
    setMessage(null)
    setErrorMessage(null)
  }

  async function submitAuthorization() {
    if (!challenge || !/^\d{4,8}$/.test(authorizationCode.trim())) return
    clearFeedback()
    setLoading(true)
    try {
      const response = await fetch('/api/subscriptions/authorize', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ subscriptionId: challenge.subscriptionId, txRef: challenge.txRef, chargeId: challenge.chargeId, authorizationType: challenge.authorizationType, code: authorizationCode.trim() }) })
      const data = await response.json().catch(() => null)
      if (!response.ok) throw new Error(data?.error || 'The payment authorization was not accepted.')
      if (data?.status === 'paid') {
        setChallenge(null)
        setAuthorizationCode('')
        setMessage('Payment verified. Your program access is now active.')
      } else if (data?.authorizationType === 'pin' || data?.authorizationType === 'otp') {
        setChallenge((current) => current ? { ...current, authorizationType: data.authorizationType } : current)
        setAuthorizationCode('')
        setMessage(data.authorizationType === 'pin' ? 'Enter the Sandbox card PIN to continue.' : 'Enter the Sandbox OTP to complete payment.')
      } else {
        setMessage(data?.paymentInstruction || data?.message || 'The payment is still being authorized. Please wait and try again.')
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'We could not authorize the payment. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function startPayment(event: React.FormEvent) {
    event.preventDefault()
    if (!selectedPlan) return
    clearFeedback()
    setLoading(true)
    try {
      const response = await fetch('/api/subscriptions/payment-intent', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ program, planKey: selectedPlan.key, billingPeriod, idempotencyKey: requestId(), phoneNumber, paymentMethod, mobileMoneyNetwork, cardNumber, cardExpiryMonth, cardExpiryYear, cardCvv }) })
      const data = await response.json().catch(() => null)
      if (!response.ok) throw new Error(data?.error || 'We could not prepare the subscription payment.')
      if (typeof data?.paymentUrl === 'string' && data.paymentUrl) {
        window.location.assign(data.paymentUrl)
        return
      }
      if (data?.status === 'active' || data?.status === 'paid') {
        setMessage('Payment verified. Your program access is now active.')
        return
      }
      if (data?.chargeId && (data.authorizationType === 'pin' || data.authorizationType === 'otp')) {
        setChallenge({ subscriptionId: data.subscriptionId, txRef: data.txRef, chargeId: data.chargeId, authorizationType: data.authorizationType })
        setMessage(data.authorizationType === 'pin' ? 'Enter the Sandbox card PIN to continue.' : 'Enter the Sandbox OTP to complete payment.')
        return
      }
      if (typeof data?.paymentInstruction === 'string' && data.paymentInstruction) {
        setMessage(data.paymentInstruction)
        return
      }
      if (data?.status === 'pending') {
        setMessage(typeof data.message === 'string' ? data.message : 'Payment was received and is being finalized. Please check your portal shortly.')
        return
      }
      throw new Error('Flutterwave did not return a usable authorization step. Please try again.')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'We could not prepare the subscription payment. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (hasActiveSubscription) {
    return (
      <div className="rounded-xl border border-primary/30 bg-primary/5 p-6 sm:p-7" role="status">
        <div className="flex items-start gap-4">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
          <div>
            <p className="text-[10px] uppercase tracking-[0.24em] text-primary">Subscription active</p>
            <h2 className="mt-2 font-serif text-2xl text-foreground">Your access is already active.</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">You are already subscribed to this programme. Your benefits and account access are available without another payment.</p>
          </div>
        </div>
      </div>
    )
  }

  if (!plans.length) {
    return <div className="rounded-xl border border-border/70 bg-card p-6 text-sm text-muted-foreground">Subscription plans are not configured yet. Please check back soon.</div>
  }

  return (
    <div className="space-y-8">
      <div className="flex w-full max-w-sm rounded-full border border-border/70 p-1" role="group" aria-label="Billing period">
        {(['monthly', 'annual'] as const).map((period) => (
          <button key={period} type="button" onClick={() => { setBillingPeriod(period); clearFeedback() }} className={`min-h-11 flex-1 rounded-full px-4 text-xs font-medium uppercase tracking-[0.15em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${billingPeriod === period ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`} aria-pressed={billingPeriod === period}>
            {period}{period === 'annual' && ' · save'}
          </button>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {plans.map((plan) => {
          const active = plan.key === selectedPlan?.key
          const saving = savings(plan)
          return (
            <button key={plan.key} type="button" onClick={() => { setSelectedPlanKey(plan.key); clearFeedback() }} className={`min-h-48 rounded-xl border p-5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${active ? 'border-primary bg-primary/5' : 'border-border/70 bg-card hover:border-primary/50'}`} aria-pressed={active}>
              <div className="flex items-start justify-between gap-3"><span className="text-[10px] uppercase tracking-[0.24em] text-primary">{plan.key}</span>{currentPlan === plan.key && <span className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Current</span>}</div>
              <h2 className="mt-3 font-serif text-3xl tracking-tight">{plan.name}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{plan.description}</p>
              <p className="mt-5 text-xl font-medium">{money(billingPeriod === 'annual' ? plan.annualAmount : plan.monthlyAmount)} <span className="text-xs font-normal text-muted-foreground">/ {billingPeriod === 'annual' ? 'year' : 'month'}</span></p>
              {billingPeriod === 'annual' && saving > 0 && <p className="mt-2 text-xs font-medium text-primary">Save {formatMoney(saving, 'UGX')} a year</p>}
            </button>
          )
        })}
      </div>

      {selectedPlan && (
        <form onSubmit={startPayment} className="rounded-xl border border-border/70 bg-card p-5 shadow-lift sm:p-7">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border/70 pb-5"><div><p className="text-[10px] uppercase tracking-[0.24em] text-primary">Secure subscription payment</p><h2 className="mt-2 font-serif text-3xl">{selectedPlan.name} · {billingPeriod}</h2></div><p className="text-2xl font-medium">{money(amount)}</p></div>
          {annualSaving > 0 && billingPeriod === 'annual' && <p className="mt-4 text-sm text-primary">Annual plan saving: {formatMoney(annualSaving, 'UGX')} compared with twelve monthly payments.</p>}
          <div className="mt-6 grid gap-3 sm:grid-cols-2" role="group" aria-label="Payment method">
            <button type="button" onClick={() => { setPaymentMethod('mobile_money'); clearFeedback() }} className={`min-h-16 rounded-lg border px-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${paymentMethod === 'mobile_money' ? 'border-primary bg-primary/5' : 'border-border/70'}`} aria-pressed={paymentMethod === 'mobile_money'}><Smartphone className="mb-2 size-4" aria-hidden="true" /><span className="block text-sm font-medium">Mobile Money</span><span className="text-xs text-muted-foreground">MTN or Airtel</span></button>
            <button type="button" onClick={() => { setPaymentMethod('card'); clearFeedback() }} className={`min-h-16 rounded-lg border px-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${paymentMethod === 'card' ? 'border-primary bg-primary/5' : 'border-border/70'}`} aria-pressed={paymentMethod === 'card'}><CreditCard className="mb-2 size-4" aria-hidden="true" /><span className="block text-sm font-medium">Card</span><span className="text-xs text-muted-foreground">Visa or Mastercard</span></button>
          </div>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2"><Label htmlFor={`${program}-phone`}>Phone number</Label><Input id={`${program}-phone`} value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} placeholder="0772 000 000" inputMode="tel" className="min-h-12" required /></div>
            {paymentMethod === 'mobile_money' ? <div className="space-y-2 sm:col-span-2"><Label htmlFor={`${program}-network`}>Mobile-money network</Label><select id={`${program}-network`} value={mobileMoneyNetwork} onChange={(event) => setMobileMoneyNetwork(event.target.value as 'MTN' | 'AIRTEL')} className="min-h-12 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><option value="MTN">MTN Mobile Money</option><option value="AIRTEL">Airtel Money</option></select></div> : <>
              <div className="space-y-2 sm:col-span-2"><Label htmlFor={`${program}-card-number`}>Card number</Label><Input id={`${program}-card-number`} value={cardNumber} onChange={(event) => setCardNumber(event.target.value)} inputMode="numeric" autoComplete="cc-number" className="min-h-12" required /></div>
              <div className="space-y-2"><Label htmlFor={`${program}-expiry-month`}>Expiry month</Label><Input id={`${program}-expiry-month`} value={cardExpiryMonth} onChange={(event) => setCardExpiryMonth(event.target.value)} inputMode="numeric" placeholder="09" className="min-h-12" required /></div>
              <div className="space-y-2"><Label htmlFor={`${program}-expiry-year`}>Expiry year</Label><Input id={`${program}-expiry-year`} value={cardExpiryYear} onChange={(event) => setCardExpiryYear(event.target.value)} inputMode="numeric" placeholder="32" className="min-h-12" required /></div>
              <div className="space-y-2"><Label htmlFor={`${program}-cvv`}>CVV</Label><Input id={`${program}-cvv`} value={cardCvv} onChange={(event) => setCardCvv(event.target.value)} inputMode="numeric" autoComplete="cc-csc" className="min-h-12" required /></div>
            </>}
          </div>

          {message && <div role="status" className="mt-6 flex items-start gap-3 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm leading-6 text-foreground"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" /><span>{message}</span></div>}
          {errorMessage && <div role="alert" className="mt-6 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm leading-6 text-destructive">{errorMessage}</div>}

          {challenge && <div className="mt-6 space-y-3 rounded-lg border border-border/70 bg-background p-4"><Label htmlFor={`${program}-authorization-code`}>{challenge.authorizationType === 'pin' ? 'Sandbox card PIN' : 'Sandbox OTP'}</Label><Input id={`${program}-authorization-code`} value={authorizationCode} onChange={(event) => setAuthorizationCode(event.target.value)} inputMode="numeric" className="min-h-12" placeholder={challenge.authorizationType === 'pin' ? 'Enter PIN' : 'Enter OTP'} /><Button type="button" disabled={loading || !authorizationCode.trim()} onClick={submitAuthorization} className="min-h-11 w-full sm:w-auto">{loading ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}Authorise payment</Button></div>}

          {!challenge && <Button type="submit" disabled={loading} className="mt-6 min-h-12 w-full rounded-none bg-primary text-primary-foreground hover:bg-primary/90">{loading && <Loader2 className="mr-2 size-4 animate-spin" />}Pay {money(amount)} & activate access</Button>}
          <p className="mt-4 text-xs leading-5 text-muted-foreground">Your access activates only after Flutterwave confirms the payment. Subscription renewals are manual; no automatic charge is created by this flow.</p>
        </form>
      )}
    </div>
  )
}
