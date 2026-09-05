'use client'

import { GoogleOneTap } from '@clerk/nextjs'

export default function GoogleOneTapPrompt() {
  return (
    <GoogleOneTap
      signInForceRedirectUrl="/account"
      signUpForceRedirectUrl="/account"
      cancelOnTapOutside
    />
  )
}
