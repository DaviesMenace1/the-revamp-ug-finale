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
  reset?: (widgetId: string) => void
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
  const [errorCode, setErrorCode] = useState<string | null>(null)
  const [renderAttempt, setRenderAttempt] = useState(0)
  const [scriptAttempt, setScriptAttempt] = useState(0)

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

    try {
      widgetIdRef.current = turnstile.render(containerRef.current, {
        sitekey: SITE_KEY,
        action: 'auth',
        theme: 'auto',
        callback: (token) => {
          setWidgetError(false)
          setErrorCode(null)
          onTokenRef.current(token)
        },
        'expired-callback': () => onTokenRef.current(null),
        'error-callback': (code) => {
          console.error('[turnstile] widget error:', code || 'unknown')
          setErrorCode(code || null)
          setWidgetError(true)
          onTokenRef.current(null)
        },
      })
    } catch (error) {
      console.error('[turnstile] widget render failed:', error)
      window.setTimeout(() => {
        setWidgetError(true)
        setErrorCode('render_failed')
      }, 0)
      onTokenRef.current(null)
    }

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current)
      }
      widgetIdRef.current = null
      onTokenRef.current(null)
    }
  }, [resetKey, renderAttempt, scriptReady])

  function retry() {
    setWidgetError(false)
    setErrorCode(null)
    onTokenRef.current(null)
    if (!window.turnstile && !scriptReady) {
      setScriptAttempt((attempt) => attempt + 1)
      return
    }
    if (widgetIdRef.current && window.turnstile) {
      const widgetId = widgetIdRef.current
      if (window.turnstile.reset) {
        try {
          window.turnstile.reset(widgetId)
          return
        } catch (error) {
          console.warn('[turnstile] reset failed; rebuilding widget:', error)
        }
      }
      try {
        window.turnstile.remove(widgetId)
      } catch (error) {
        console.warn('[turnstile] remove failed during retry:', error)
      }
      widgetIdRef.current = null
    }
    setScriptReady(Boolean(window.turnstile))
    setRenderAttempt((attempt) => attempt + 1)
  }

  if (!SITE_KEY) return null

  return (
    <div className="grid gap-2">
      <Script
        id={`cloudflare-turnstile-script-${scriptAttempt}`}
        src={`https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&attempt=${scriptAttempt}`}
        strategy="afterInteractive"
        onLoad={() => {
          setScriptReady(true)
          setWidgetError(false)
          setErrorCode(null)
        }}
        onError={() => {
          console.error('[turnstile] challenge script failed to load')
          setScriptReady(false)
          setWidgetError(true)
          setErrorCode('script_load_failed')
        }}
      />
      <div ref={containerRef} className="min-h-[65px]" aria-label="Security verification" />
      {widgetError && (
        <div className="grid gap-2 border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs leading-5 text-destructive">
          <p role="alert">Security verification could not complete. Your browser may be blocking Cloudflare’s challenge resources.</p>
          <button type="button" onClick={retry} className="min-h-10 w-fit font-medium underline underline-offset-4 hover:no-underline">Retry security verification</button>
          {errorCode && <span className="sr-only">Verification diagnostic: {errorCode}</span>}
        </div>
      )}
    </div>
  )
}
