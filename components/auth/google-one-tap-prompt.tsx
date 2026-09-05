'use client'

import { GoogleOneTap } from '@clerk/nextjs'

export default function GoogleOneTapPrompt() {
  return (
    <GoogleOneTap
      signInForceRedirectUrl="/account"
      signUpForceRedirectUrl="/account"
      // Keep the legacy credential callback available for browsers where FedCM
      // shows the account picker but does not return the credential to Clerk.
      fedCmSupport={false}
      itpSupport
      cancelOnTapOutside
    />
  )
}
