'use client'

import Script from 'next/script'
import { useEffect, useRef } from 'react'
import { useUser } from '@clerk/nextjs'
import { useCookieConsent } from '@/components/privacy/cookie-consent-provider'

type OneSignalClient = {
  init: (options: Record<string, unknown>) => Promise<void>
  login: (externalId: string) => Promise<void>
}

declare global {
  interface Window {
    OneSignalDeferred?: Array<(client: OneSignalClient) => Promise<void> | void>
    __revampOneSignalInitialized?: boolean
  }
}

export default function OneSignalBootstrap() {
  const { consent, ready } = useCookieConsent()
  const { user } = useUser()
  const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID
  const initialized = useRef(false)
  const enabled = Boolean(ready && consent.marketing && appId)

  useEffect(() => {
    if (!enabled || initialized.current || window.__revampOneSignalInitialized) return
    initialized.current = true
    window.OneSignalDeferred = window.OneSignalDeferred || []
    window.OneSignalDeferred.push(async (OneSignal) => {
      try {
        await OneSignal.init({
          appId,
          serviceWorkerPath: 'OneSignalSDKWorker.js',
          serviceWorkerParam: { scope: '/' },
          requiresUserPrivacyConsent: false,
          welcomeNotification: { disable: true },
        })
        if (user?.id) await OneSignal.login(user.id)
        window.__revampOneSignalInitialized = true
      } catch (error) {
        initialized.current = false
        console.warn('[notifications] OneSignal is unavailable; core site features continue normally.', error)
      }
    })
  }, [appId, enabled, user?.id])

  if (!enabled) return null
  return <Script src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js" strategy="afterInteractive" />
}
