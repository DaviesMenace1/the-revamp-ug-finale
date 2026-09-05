'use client'

import { useClerk, useAuth } from '@clerk/nextjs'
import { useEffect, useRef } from 'react'

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (options: { client_id: string; callback: (response: { credential: string }) => void; auto_select?: boolean; cancel_on_tap_outside?: boolean }) => void
          prompt: () => void
          cancel: () => void
        }
      }
    }
  }
}

const GOOGLE_CLIENT_ID = '962381014529-3ooe8e1q6au6h5e73jmm9ilvjee8vvtu.apps.googleusercontent.com'
const GOOGLE_SCRIPT_SRC = 'https://accounts.google.com/gsi/client'

type GoogleIdentity = { email?: string; given_name?: string; family_name?: string; name?: string }

function decodeGoogleIdentity(credential: string): GoogleIdentity {
  try {
    const payload = credential.split('.')[1]
    if (!payload) return {}
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
    const decoded = decodeURIComponent(atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=').split('').map((character) => `%${character.charCodeAt(0).toString(16).padStart(2, '0')}`).join('')))
    return JSON.parse(decoded) as GoogleIdentity
  } catch {
    return {}
  }
}

function usernameFromIdentity(identity: GoogleIdentity) {
  const localPart = identity.email?.split('@')[0]?.toLowerCase().replace(/[^a-z0-9_]/g, '') || ''
  return `${localPart || 'revamp'}${Math.random().toString(36).slice(2, 7)}`.slice(0, 32)
}

export default function GoogleOneTapPrompt() {
  const clerk = useClerk()
  const { isLoaded, isSignedIn } = useAuth()
  const initialized = useRef(false)
  const handling = useRef(false)

  useEffect(() => {
    if (!isLoaded || isSignedIn || initialized.current) return
    initialized.current = true

    const completeGoogleAuth = async (credential: string) => {
      if (handling.current) return
      handling.current = true
      const identity = decodeGoogleIdentity(credential)
      try {
        const result = await clerk.authenticateWithGoogleOneTap({ token: credential, legalAccepted: true })
        if ('missingFields' in result && Array.isArray(result.missingFields) && result.missingFields.length > 0 && 'update' in result) {
          const firstName = identity.given_name || identity.name?.split(' ')[0] || undefined
          const lastName = identity.family_name || identity.name?.split(' ').slice(1).join(' ') || undefined
          const username = result.missingFields.includes('username') ? usernameFromIdentity(identity) : undefined
          const updatePayload = {
            ...(result.missingFields.includes('first_name') && firstName ? { firstName } : {}),
            ...(result.missingFields.includes('last_name') && lastName ? { lastName } : {}),
            ...(username ? { username } : {}),
            ...(result.missingFields.includes('legal_accepted') ? { legalAccepted: true } : {}),
          }
          if (Object.keys(updatePayload).length > 0) await result.update(updatePayload)
        }
        await clerk.handleGoogleOneTapCallback(result, { signInForceRedirectUrl: '/account', signUpForceRedirectUrl: '/account' })
      } catch (error) {
        console.error('[auth] Google One Tap completion failed:', error)
        handling.current = false
      }
    }

    const initialize = () => {
      const googleId = window.google?.accounts?.id
      if (!googleId) return false
      googleId.initialize({ client_id: GOOGLE_CLIENT_ID, callback: (response) => { void completeGoogleAuth(response.credential) }, auto_select: false, cancel_on_tap_outside: true })
      googleId.prompt()
      return true
    }

    if (initialize()) return () => window.google?.accounts?.id?.cancel()

    const script = document.createElement('script')
    script.src = GOOGLE_SCRIPT_SRC
    script.async = true
    script.defer = true
    script.onload = initialize
    document.head.appendChild(script)
    return () => {
      window.google?.accounts?.id?.cancel()
      script.onload = null
    }
  }, [clerk, isLoaded, isSignedIn])

  return null
}
