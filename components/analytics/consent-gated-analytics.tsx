'use client'

import Script from 'next/script'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'
import posthog from 'posthog-js'
import { useCookieConsent } from '@/components/privacy/cookie-consent-provider'

type TrackerFunction = (...args: unknown[]) => void

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: TrackerFunction
    fbq?: TrackerFunction
    ttq?: {
      load: (pixelId: string) => void
      page: () => void
    }
  }
}

const GOOGLE_ANALYTICS_ID = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID?.trim()
const GOOGLE_TAG_MANAGER_ID = process.env.NEXT_PUBLIC_GTM_ID?.trim()
const VALID_GTM_ID = GOOGLE_TAG_MANAGER_ID && /^GTM-[A-Z0-9]+$/i.test(GOOGLE_TAG_MANAGER_ID) ? GOOGLE_TAG_MANAGER_ID : undefined
const DIRECT_GOOGLE_ANALYTICS_ID = GOOGLE_ANALYTICS_ID && !VALID_GTM_ID ? GOOGLE_ANALYTICS_ID : undefined
const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID
const TIKTOK_PIXEL_ID = process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID
const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com'

let posthogInitialized = false

function ensureGtagQueue() {
  if (typeof window === 'undefined') return
  window.dataLayer = window.dataLayer || []
  window.gtag = window.gtag || ((...args: unknown[]) => window.dataLayer?.push(args))
}

export default function ConsentGatedAnalytics() {
  const { consent, ready } = useCookieConsent()
  const pathname = usePathname()
  const analyticsEnabled = ready && consent.analytics
  const marketingEnabled = ready && consent.marketing
  const tagManagerEnabled = ready && Boolean(VALID_GTM_ID) && (analyticsEnabled || marketingEnabled)

  useEffect(() => {
    ensureGtagQueue()
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined' || !window.gtag) return

    window.gtag('consent', 'default', {
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      analytics_storage: 'denied',
      wait_for_update: 500,
    })

    if (!ready) return

    const granted = {
      ad_storage: marketingEnabled ? 'granted' : 'denied',
      ad_user_data: marketingEnabled ? 'granted' : 'denied',
      ad_personalization: marketingEnabled ? 'granted' : 'denied',
      analytics_storage: analyticsEnabled ? 'granted' : 'denied',
    }
    window.gtag('consent', 'update', granted)

    if (analyticsEnabled && DIRECT_GOOGLE_ANALYTICS_ID) {
      window.gtag('config', DIRECT_GOOGLE_ANALYTICS_ID, { page_path: pathname })
    }
  }, [analyticsEnabled, marketingEnabled, pathname, ready])

  useEffect(() => {
    if (!tagManagerEnabled || !VALID_GTM_ID) return
    ensureGtagQueue()
    window.dataLayer?.push({
      event: 'revamp_consent_update',
      revampConsent: {
        analytics: analyticsEnabled,
        marketing: marketingEnabled,
        analytics_storage: analyticsEnabled ? 'granted' : 'denied',
        ad_storage: marketingEnabled ? 'granted' : 'denied',
        ad_user_data: marketingEnabled ? 'granted' : 'denied',
        ad_personalization: marketingEnabled ? 'granted' : 'denied',
      },
    })
  }, [analyticsEnabled, marketingEnabled, tagManagerEnabled])

  useEffect(() => {
    if (!ready || !POSTHOG_KEY) return

    if (!analyticsEnabled) {
      if (posthogInitialized) posthog.opt_out_capturing()
      return
    }

    if (!posthogInitialized) {
      posthog.init(POSTHOG_KEY, {
        api_host: POSTHOG_HOST,
        capture_pageview: false,
        autocapture: false,
        capture_pageleave: false,
      })
      posthogInitialized = true
    }

    posthog.opt_in_capturing()
    posthog.capture('$pageview', { path: pathname })
  }, [analyticsEnabled, pathname, ready])

  useEffect(() => {
    if (!ready || !marketingEnabled) return
    window.fbq?.('track', 'PageView')
    window.ttq?.page()
  }, [marketingEnabled, pathname, ready])

  return (
    <>
      {tagManagerEnabled && VALID_GTM_ID && (
        <>
          <Script id="google-tag-manager" strategy="afterInteractive">
            {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer',${JSON.stringify(VALID_GTM_ID)});`}
          </Script>
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${encodeURIComponent(VALID_GTM_ID)}`}
              height="0"
              width="0"
              style={{ display: 'none', visibility: 'hidden' }}
              title="Google Tag Manager"
            />
          </noscript>
        </>
      )}

      {analyticsEnabled && DIRECT_GOOGLE_ANALYTICS_ID && (
        <Script
          id="google-analytics"
          src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(DIRECT_GOOGLE_ANALYTICS_ID)}`}
          strategy="afterInteractive"
        />
      )}

      {marketingEnabled && META_PIXEL_ID && (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
          n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window, document,
          'script','https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', ${JSON.stringify(META_PIXEL_ID)});fbq('track', 'PageView');`}
        </Script>
      )}

      {marketingEnabled && TIKTOK_PIXEL_ID && (
        <Script id="tiktok-pixel" strategy="afterInteractive">
          {`!function (w, d, t) {
            w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",i=n&&n.partner;ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=r+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};ttq.load(${JSON.stringify(TIKTOK_PIXEL_ID)});ttq.page();}(window, document, 'ttq');`}
        </Script>
      )}
    </>
  )
}
