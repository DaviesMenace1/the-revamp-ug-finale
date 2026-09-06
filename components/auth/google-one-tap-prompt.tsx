'use client'

import { GoogleOneTap } from '@clerk/nextjs'

export default function GoogleOneTapPrompt() {
  return <GoogleOneTap
    cancelOnTapOutside
    fedCmSupport={false}
    itpSupport
    signInForceRedirectUrl="/account"
    signUpForceRedirectUrl="/account"
  />
}
