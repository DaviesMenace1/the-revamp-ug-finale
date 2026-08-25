'use client'

import Script from 'next/script'
import { useEffect, useRef } from 'react'
import { useUser } from '@clerk/nextjs'
import { usePathname } from 'next/navigation'
import { useCookieConsent } from '@/components/privacy/cookie-consent-provider'

type OneSignalClient = {
  init: (options: Record<string, unknown>) => Promise<void>
  login: (externalId: string) => Promise<void>
  logout?: () => Promise<void>
}

declare global {
  interface Window {
    OneSignalDeferred?: Array<(client: OneSignalClient) => Promise<void> | void>
    __revampOneSignalInitialized?: boolean
  }
}

function isAuthRoute(pathname: string | null) {
  if (!pathname) return false
  return pathname === '/sign-in' || pathname.startsWith('/sign-in/') || pathname === '/sign-up' || pathname.startsWith('/sign-up/') || pathname === '/reset-password' || pathname === '/login' || pathname === '/signup'
}

export default function OneSignalBootstrap() {
  const pathname = usePathname()
  if (isAuthRoute(pathname)) return null
  return <OneSignalClientBootstrap />
}

function OneSignalClientBootstrap() {
  const { consent, ready } = useCookieConsent()
  const { user } = useUser()
  const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID
  const initialized = useRef(false)
  const linkedUserId = useRef<string | null>(null)
  const enabled = Boolean(ready && consent.marketing && appId)

  useEffect(() => {
    if (!enabled || initialized.current || window.__revampOneSignalInitialized || !appId) return
    initialized.current = true
    window.OneSignalDeferred = window.OneSignalDeferred || []
    window.OneSignalDeferred.push(async (OneSignal) => {
      try {
        if (!window.__revampOneSignalInitialized) {
          await OneSignal.init({
            appId,
            serviceWorkerPath: 'OneSignalSDKWorker.js',
            serviceWorkerParam: { scope: '/' },
            requiresUserPrivacyConsent: false,
            welcomeNotification: { disable: true },
          })
          window.__revampOneSignalInitialized = true
        }
        if (user?.id) {
          await OneSignal.login(user.id)
          linkedUserId.current = user.id
        }
      } catch (error) {
        initialized.current = false
        console.warn('[notifications] OneSignal is unavailable; core site features continue normally.', error)
      }
    })
  }, [appId, enabled, user?.id])

  useEffect(() => {
    if (!enabled || !window.__revampOneSignalInitialized) return
    window.OneSignalDeferred = window.OneSignalDeferred || []
    window.OneSignalDeferred.push(async (OneSignal) => {
      try {
        if (user?.id && linkedUserId.current !== user.id) {
          await OneSignal.login(user.id)
          linkedUserId.current = user.id
        } else if (!user?.id && linkedUserId.current) {
          await OneSignal.logout?.()
          linkedUserId.current = null
        }
      } catch (error) {
        console.warn('[notifications] OneSignal identity sync failed; core site features continue normally.', error)
      }
    })
  }, [enabled, user?.id])

  if (!enabled) return null
  return <Script src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js" strategy="afterInteractive" />
}
