'use client'

import Script from 'next/script'
import { useCallback, useEffect, useRef } from 'react'
import { useUser } from '@clerk/nextjs'
import { usePathname } from 'next/navigation'
import { useCookieConsent } from '@/components/privacy/cookie-consent-provider'

type OneSignalClient = {
  init: (options: Record<string, unknown>) => Promise<void>
  login: (externalId: string) => Promise<void>
  logout?: () => Promise<void>
  Notifications?: {
    requestPermission?: () => Promise<void>
  }
  User?: {
    PushSubscription?: {
      optIn?: () => Promise<void>
    }
  }
}

type NotificationPermissionResult = NotificationPermission | 'unavailable'
type RequestNotificationPermission = () => Promise<NotificationPermissionResult>

declare global {
  interface Window {
    OneSignalDeferred?: Array<(client: OneSignalClient) => Promise<void> | void>
    __revampOneSignalInitialized?: boolean
    __revampOneSignalClient?: OneSignalClient
    __revampRequestNotificationPermission?: RequestNotificationPermission
  }
}

function isAuthRoute(pathname: string | null) {
  if (!pathname) return false
  return pathname === '/sign-in' || pathname.startsWith('/sign-in/') || pathname === '/sign-up' || pathname.startsWith('/sign-up/') || pathname === '/reset-password' || pathname === '/login' || pathname === '/signup'
}

function browserPermission(): NotificationPermissionResult {
  return typeof Notification === 'undefined' ? 'unavailable' : Notification.permission
}

export default function OneSignalBootstrap() {
  const pathname = usePathname()
  if (isAuthRoute(pathname)) return null
  return <OneSignalClientBootstrap />
}

function OneSignalClientBootstrap() {
  const { ready } = useCookieConsent()
  const { isLoaded: userLoaded, user } = useUser()
  const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID
  const enabled = Boolean(ready && appId)
  const linkedUserId = useRef<string | null>(null)
  const initializationPromise = useRef<Promise<OneSignalClient> | null>(null)
  const userId = user?.id ?? null

  const ensureInitialized = useCallback((): Promise<OneSignalClient> => {
    if (!enabled || !appId) return Promise.reject(new Error('Notification setup is not ready.'))
    if (window.__revampOneSignalInitialized && window.__revampOneSignalClient) {
      return Promise.resolve(window.__revampOneSignalClient)
    }
    if (initializationPromise.current) return initializationPromise.current

    initializationPromise.current = new Promise<OneSignalClient>((resolve, reject) => {
      window.OneSignalDeferred = window.OneSignalDeferred || []
      window.OneSignalDeferred.push(async (OneSignal) => {
        try {
          if (!window.__revampOneSignalInitialized) {
            await OneSignal.init({
              appId,
              serviceWorkerPath: 'OneSignalSDKWorker.js',
              serviceWorkerParam: { scope: '/' },
              autoResubscribe: true,
              welcomeNotification: { disable: true },
            })
            window.__revampOneSignalInitialized = true
            window.__revampOneSignalClient = OneSignal
          }
          if (userId && linkedUserId.current !== userId) {
            await OneSignal.login(userId)
            linkedUserId.current = userId
          }
          resolve(OneSignal)
        } catch (error) {
          initializationPromise.current = null
          console.warn('[notifications] OneSignal initialization failed; core site features continue normally.', error)
          reject(error)
        }
      })
    })

    return initializationPromise.current
  }, [appId, enabled, userId])

  useEffect(() => {
    if (!enabled) return

    const requestPermission: RequestNotificationPermission = async () => {
      const OneSignal = await ensureInitialized()
      await OneSignal.Notifications?.requestPermission?.()
      if (browserPermission() === 'granted') {
        await OneSignal.User?.PushSubscription?.optIn?.()
      }
      return browserPermission()
    }

    window.__revampRequestNotificationPermission = requestPermission
    return () => {
      if (window.__revampRequestNotificationPermission === requestPermission) {
        delete window.__revampRequestNotificationPermission
      }
    }
  }, [enabled, ensureInitialized])

  useEffect(() => {
    if (!enabled || !window.__revampOneSignalInitialized || !user?.id) return
    window.OneSignalDeferred = window.OneSignalDeferred || []
    window.OneSignalDeferred.push(async (OneSignal) => {
      try {
        if (linkedUserId.current !== user.id) {
          await OneSignal.login(user.id)
          linkedUserId.current = user.id
        }
      } catch (error) {
        console.warn('[notifications] OneSignal identity sync failed; core site features continue normally.', error)
      }
    })
  }, [enabled, user?.id])

  useEffect(() => {
    // Only unlink on a confirmed signed-out state. Do not call logout merely
    // because Clerk is still loading during a navigation or component remount.
    if (!enabled || !userLoaded || user || !linkedUserId.current || !window.__revampOneSignalInitialized) return
    window.OneSignalDeferred = window.OneSignalDeferred || []
    window.OneSignalDeferred.push(async (OneSignal) => {
      try {
        await OneSignal.logout?.()
        linkedUserId.current = null
      } catch (error) {
        console.warn('[notifications] OneSignal logout failed; core site features continue normally.', error)
      }
    })
  }, [enabled, user, userLoaded])

  if (!enabled) return null
  return <Script src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js" strategy="afterInteractive" />
}
