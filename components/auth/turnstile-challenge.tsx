'use client'

import Script from 'next/script'
import { useEffect, useRef } from 'react'

type TurnstileWidget = {
  ready: (callback: () => void) => void
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

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

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

  useEffect(() => {
    onTokenRef.current = onToken
  }, [onToken])

  useEffect(() => {
    if (!SITE_KEY || !containerRef.current) return

    const renderWidget = () => {
      if (!window.turnstile || !containerRef.current || widgetIdRef.current) return
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: SITE_KEY,
        action: 'auth',
        theme: 'auto',
        callback: (token) => onTokenRef.current(token),
        'expired-callback': () => onTokenRef.current(null),
        'error-callback': () => onTokenRef.current(null),
      })
    }

    if (window.turnstile) window.turnstile.ready(renderWidget)

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current)
      }
      widgetIdRef.current = null
      onTokenRef.current(null)
    }
  }, [resetKey])

  if (!SITE_KEY) return null

  return (
    <>
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" strategy="afterInteractive" />
      <div ref={containerRef} className="min-h-[65px]" aria-label="Security verification" />
    </>
  )
}
