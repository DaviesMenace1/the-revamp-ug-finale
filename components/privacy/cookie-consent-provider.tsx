'use client'

import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Analytics } from '@vercel/analytics/react'
import { Cookie, X } from 'lucide-react'

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
      {ready && hasDecision && <button type="button" onClick={value.openPreferences} aria-label="Open cookie preferences" title="Cookie preferences" className="fixed bottom-3 left-3 z-[60] inline-flex size-11 items-center justify-center rounded-full border border-border bg-foreground text-background shadow-lg transition-colors hover:bg-primary hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 sm:h-11 sm:w-auto sm:px-4"><Cookie className="size-5 sm:mr-2" aria-hidden="true" /><span className="hidden text-xs font-medium sm:inline">Cookie preferences</span></button>}
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
  return <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 p-3 sm:p-6" role="presentation"><aside className="max-h-[calc(100dvh-1.5rem)] w-full max-w-2xl overflow-y-auto border border-white/35 bg-black p-5 text-white shadow-2xl sm:max-h-[calc(100dvh-3rem)] sm:p-9" role="dialog" aria-modal="true" aria-labelledby="cookie-consent-title"><p id="cookie-consent-title" className="font-serif text-2xl font-light sm:text-3xl">Before you continue</p><p className="mt-5 text-sm leading-7 text-white/80 sm:text-base">We use essential cookies to keep The Revamp UG working. Optional cookies help us understand site use, remember preferences, and measure relevant communications. You can choose only the required cookies without losing core features.</p><a href="/legal/cookies" className="mt-6 inline-flex min-h-11 items-center text-sm text-white underline underline-offset-4 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">Cookie and data sharing notice</a><div className="mt-7 grid gap-3"><button type="button" onClick={onAccept} className="min-h-12 border-2 border-white bg-white px-4 text-sm font-medium uppercase tracking-[0.12em] text-black transition-colors hover:bg-primary hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-black">Accept all</button><button type="button" onClick={onReject} className="min-h-12 border border-white/90 bg-white px-4 text-sm font-medium uppercase tracking-[0.12em] text-black transition-colors hover:bg-primary hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-black">Only required cookies</button><button type="button" onClick={onManage} className="min-h-12 border border-white/80 px-4 text-sm font-medium uppercase tracking-[0.12em] text-white transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-black">Cookies and services settings</button></div></aside></div>
}

function PreferencesDialog({ consent, onSave, onClose }: { consent: ConsentState; onSave: ConsentContextValue['savePreferences']; onClose: () => void }) {
  const [preferences, setPreferences] = useState(consent.preferences)
  const [analytics, setAnalytics] = useState(consent.analytics)
  const [marketing, setMarketing] = useState(consent.marketing)
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    closeRef.current?.focus()
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 p-3 sm:p-6" role="presentation"><div className="max-h-[calc(100dvh-1.5rem)] w-full max-w-2xl overflow-y-auto border border-white/35 bg-black p-5 text-white shadow-2xl sm:max-h-[calc(100dvh-3rem)] sm:p-9" role="dialog" aria-modal="true" aria-labelledby="cookie-preferences-title"><div className="flex items-start justify-between gap-4"><div><p id="cookie-preferences-title" className="font-serif text-2xl font-light sm:text-3xl">Cookies and services settings</p><p className="mt-3 text-sm leading-6 text-white/70">Essential storage is always active. Choose which optional categories may run on this device.</p></div><button ref={closeRef} type="button" onClick={onClose} aria-label="Close cookie preferences" className="flex size-11 shrink-0 items-center justify-center text-white/75 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"><X className="size-5" aria-hidden="true" /></button></div><div className="mt-7 space-y-3"><PreferenceRow label="Essential" description="Authentication, security, cart, checkout, and core site functionality." checked disabled onChange={() => undefined} /><PreferenceRow label="Preferences" description="Remember theme and saved experience choices." checked={preferences} onChange={setPreferences} /><PreferenceRow label="Analytics" description="Help us understand how visitors use the website." checked={analytics} onChange={setAnalytics} /><PreferenceRow label="Marketing" description="Measure campaigns and support relevant communications." checked={marketing} onChange={setMarketing} /></div><div className="mt-7 grid gap-3 sm:grid-cols-2"><button type="button" onClick={onClose} className="min-h-12 border border-white/70 px-4 text-sm font-medium uppercase tracking-[0.12em] text-white transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">Cancel</button><button type="button" onClick={() => onSave({ preferences, analytics, marketing })} className="min-h-12 bg-white px-4 text-sm font-medium uppercase tracking-[0.12em] text-black transition-colors hover:bg-primary hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">Save preferences</button></div></div></div>
}

function PreferenceRow({ label, description, checked, disabled = false, onChange }: { label: string; description: string; checked: boolean; disabled?: boolean; onChange: (value: boolean) => void }) {
  return <label className="flex min-h-16 items-start justify-between gap-4 border border-white/20 p-4 transition-colors has-[:focus-visible]:border-primary"><span><span className="block text-sm font-medium text-white">{label}{disabled && <span className="ml-2 text-xs text-white/55">Always active</span>}</span><span className="mt-1 block text-xs leading-5 text-white/65">{description}</span></span><input type="checkbox" checked={checked} disabled={disabled} onChange={(event) => onChange(event.target.checked)} className="mt-1 size-5 accent-[hsl(var(--primary))]" /></label>
}
