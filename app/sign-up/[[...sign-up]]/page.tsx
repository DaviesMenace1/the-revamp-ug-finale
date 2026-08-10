'use client'

import { useSearchParams } from 'next/navigation'
import { CustomSignUp, AuthIntro } from '@/components/auth/custom-auth-forms'
import { safeRedirect } from '@/lib/auth/safe-redirect'

export default function SignUpPage() {
  const searchParams = useSearchParams()
  const rawRedirect = searchParams.get('redirect_url')
  const redirectUrl = rawRedirect ? safeRedirect(rawRedirect) : '/account'

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-16">
      <div className="flex w-full max-w-6xl flex-col items-center gap-10 lg:flex-row lg:justify-between lg:gap-20">
        <AuthIntro
          title="Begin a more considered way of living."
          description="Create your account to save pieces, follow orders, book consultations, and continue your design journey."
        />
        <CustomSignUp redirectUrl={redirectUrl} />
      </div>
    </main>
  )
}
