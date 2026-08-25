'use client'

import Script from 'next/script'
import { useEffect, useRef, useState } from 'react'

type TurnstileWidget = {
  render: (container: HTMLElement, options: {
    sitekey: string
    action?: string
    theme?: 'auto' | 'light' | 'dark'
    callback?: (token: string) => void
    'expired-callback'?: () => void
    'error-callback'?: (errorCode?: string) => void
  }) => string
  remove: (widgetId: string) => void
}

declare global {
  interface Window {
    turnstile?: TurnstileWidget
  }
}

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim()
const WIDGET_LOAD_TIMEOUT_MS = 12_000

export function turnstileConfigured() {
  return Boolean(SITE_KEY)
}

export default function TurnstileChallenge({
  onToken,
  resetKey = 0,
}: {
  onToken: (token: string | null) => void
  resetKey?: number
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<string | null>(null)
  const onTokenRef = useRef(onToken)
  const [scriptReady, setScriptReady] = useState(() => typeof window !== 'undefined' && Boolean(window.turnstile))
  const [widgetError, setWidgetError] = useState(false)

  useEffect(() => {
    onTokenRef.current = onToken
  }, [onToken])

  useEffect(() => {
    if (!SITE_KEY || scriptReady) return
    const timeout = window.setTimeout(() => setWidgetError(true), WIDGET_LOAD_TIMEOUT_MS)
    return () => window.clearTimeout(timeout)
  }, [scriptReady])

  useEffect(() => {
    if (!SITE_KEY || !scriptReady || !containerRef.current || widgetIdRef.current) return

    const turnstile = window.turnstile
    if (!turnstile) return

    if (!containerRef.current || widgetIdRef.current) return
    try {
      widgetIdRef.current = turnstile.render(containerRef.current, {
        sitekey: SITE_KEY,
        action: 'auth',
        theme: 'auto',
        callback: (token) => {
          setWidgetError(false)
          onTokenRef.current(token)
        },
        'expired-callback': () => onTokenRef.current(null),
        'error-callback': () => {
          setWidgetError(true)
          onTokenRef.current(null)
        },
      })
    } catch (error) {
      console.error('[turnstile] widget render failed:', error)
      window.setTimeout(() => setWidgetError(true), 0)
      onTokenRef.current(null)
    }

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current)
      }
      widgetIdRef.current = null
      onTokenRef.current(null)
    }
  }, [resetKey, scriptReady])

  if (!SITE_KEY) return null

  return (
    <div className="grid gap-2">
      <Script
        id="cloudflare-turnstile-script"
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onLoad={() => setScriptReady(true)}
        onError={() => setWidgetError(true)}
      />
      <div ref={containerRef} className="min-h-[65px]" aria-label="Security verification" />
      {widgetError && (
        <p role="alert" className="border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs leading-5 text-destructive">
          Security verification could not load. Check your connection or browser privacy settings, then refresh and try again.
        </p>
      )}
    </div>
  )
}
