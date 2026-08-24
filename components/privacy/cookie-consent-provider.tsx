'use client'

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { Analytics } from '@vercel/analytics/react'

export type ConsentState = {
  necessary: true
  preferences: boolean
  analytics: boolean
  marketing: boolean
}

type ConsentContextValue = {
  consent: ConsentState
  ready: boolean
  hasDecision: boolean
  openPreferences: () => void
  savePreferences: (next: Pick<ConsentState, 'preferences' | 'analytics' | 'marketing'>) => void
  acceptAll: () => void
  rejectOptional: () => void
}

const STORAGE_KEY = 'revamp-cookie-consent-v1'
const COOKIE_NAME = 'revamp-cookie-consent'
const DEFAULT_CONSENT: ConsentState = { necessary: true, preferences: false, analytics: false, marketing: false }

const ConsentContext = createContext<ConsentContextValue | null>(null)

function persist(consent: ConsentState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(consent))
    document.cookie = `${COOKIE_NAME}=${encodeURIComponent(JSON.stringify(consent))}; Max-Age=31536000; Path=/; SameSite=Lax`
  } catch {
    // Consent remains in memory if browser storage is unavailable
  }
}

export function CookieConsentProvider({ children }: { children: ReactNode }) {
  const [consent, setConsent] = useState<ConsentState>(DEFAULT_CONSENT)
  const [ready, setReady] = useState(false)
  const [hasDecision, setHasDecision] = useState(false)
  const [showPreferences, setShowPreferences] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<ConsentState>
        // Hydrate the client-only preference from browser storage after SSR.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setConsent({ necessary: true, preferences: Boolean(parsed.preferences), analytics: Boolean(parsed.analytics), marketing: Boolean(parsed.marketing) })
        setHasDecision(true)
      }
    } catch {
      // Use the safe default and present the banner.
    } finally {
      setReady(true)
    }
  }, [])

  function savePreferences(next: Pick<ConsentState, 'preferences' | 'analytics' | 'marketing'>) {
    const updated: ConsentState = { necessary: true, ...next }
    setConsent(updated)
    setHasDecision(true)
    setShowPreferences(false)
    persist(updated)
  }

  const value = useMemo<ConsentContextValue>(() => ({
    consent,
    ready,
    hasDecision,
    openPreferences: () => setShowPreferences(true),
    savePreferences,
    acceptAll: () => savePreferences({ preferences: true, analytics: true, marketing: true }),
    rejectOptional: () => savePreferences({ preferences: false, analytics: false, marketing: false }),
  }), [consent, ready, hasDecision])

  return (
    <ConsentContext.Provider value={value}>
      {children}
      {consent.analytics && <Analytics />}
      {ready && !hasDecision && <ConsentBanner onAccept={value.acceptAll} onReject={value.rejectOptional} onManage={value.openPreferences} />}
      {ready && hasDecision && <button type="button" onClick={value.openPreferences} className="fixed bottom-4 left-4 z-[60] rounded-full border border-border bg-background px-3 py-2 text-xs font-medium text-foreground shadow-lg hover:bg-muted">Cookie preferences</button>}
      {showPreferences && <PreferencesDialog consent={consent} onSave={value.savePreferences} onClose={() => setShowPreferences(false)} />}
    </ConsentContext.Provider>
  )
}

export function useCookieConsent() {
  const context = useContext(ConsentContext)
  if (!context) throw new Error('useCookieConsent must be used within CookieConsentProvider')
  return context
}

export function CookiePreferencesTrigger({ className = '' }: { className?: string }) {
  const { openPreferences } = useCookieConsent()
  return <button type="button" onClick={openPreferences} className={className}>Cookie Preferences</button>
}

function ConsentBanner({ onAccept, onReject, onManage }: { onAccept: () => void; onReject: () => void; onManage: () => void }) {
  return <aside className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-3xl rounded-lg border border-border bg-background p-5 shadow-2xl" role="dialog" aria-label="Cookie consent"><p className="font-serif text-xl text-foreground">We value your privacy</p><p className="mt-2 text-sm leading-relaxed text-muted-foreground">We use essential cookies to keep The Revamp Ug working, and optional cookies to understand site use and improve your experience. You can reject optional cookies without affecting core features.</p><div className="mt-4 flex flex-wrap gap-2"><button type="button" onClick={onAccept} className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Accept all</button><button type="button" onClick={onReject} className="rounded border border-border px-4 py-2 text-sm font-medium text-foreground">Reject optional</button><button type="button" onClick={onManage} className="rounded px-4 py-2 text-sm font-medium text-muted-foreground underline underline-offset-4">Manage preferences</button></div></aside>
}

function PreferencesDialog({ consent, onSave, onClose }: { consent: ConsentState; onSave: ConsentContextValue['savePreferences']; onClose: () => void }) {
  const [preferences, setPreferences] = useState(consent.preferences)
  const [analytics, setAnalytics] = useState(consent.analytics)
  const [marketing, setMarketing] = useState(consent.marketing)
  return <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-label="Cookie preferences"><div className="w-full max-w-lg rounded-lg bg-background p-6 shadow-2xl"><div className="flex items-start justify-between gap-4"><div><p className="font-serif text-2xl text-foreground">Cookie preferences</p><p className="mt-2 text-sm text-muted-foreground">Essential storage is always active. Optional categories remain off until you choose them.</p></div><button type="button" onClick={onClose} aria-label="Close cookie preferences" className="text-2xl text-muted-foreground">×</button></div><div className="mt-6 space-y-4"><PreferenceRow label="Essential" description="Authentication, security, cart, checkout, and core site functionality." checked disabled onChange={() => undefined} /><PreferenceRow label="Preferences" description="Remember theme, language, and saved experience choices." checked={preferences} onChange={setPreferences} /><PreferenceRow label="Analytics" description="Help us understand how visitors use the website." checked={analytics} onChange={setAnalytics} /><PreferenceRow label="Marketing" description="Measure campaigns and support relevant communications." checked={marketing} onChange={setMarketing} /></div><div className="mt-6 flex justify-end gap-2"><button type="button" onClick={onClose} className="rounded border border-border px-4 py-2 text-sm text-foreground">Cancel</button><button type="button" onClick={() => onSave({ preferences, analytics, marketing })} className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Save preferences</button></div></div></div>
}

function PreferenceRow({ label, description, checked, disabled = false, onChange }: { label: string; description: string; checked: boolean; disabled?: boolean; onChange: (value: boolean) => void }) {
  return <label className="flex items-start justify-between gap-4 rounded border border-border/40 p-4"><span><span className="block text-sm font-medium text-foreground">{label}{disabled && <span className="ml-2 text-xs text-muted-foreground">Always active</span>}</span><span className="mt-1 block text-xs leading-relaxed text-muted-foreground">{description}</span></span><input type="checkbox" checked={checked} disabled={disabled} onChange={(event) => onChange(event.target.checked)} className="mt-1 h-4 w-4" /></label>
}
