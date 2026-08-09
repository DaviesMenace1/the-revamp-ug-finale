'use client'

import { CustomResetPassword, AuthIntro } from '@/components/auth/custom-auth-forms'

export default function ResetPasswordPage() { return <main className="flex min-h-screen items-center justify-center bg-background px-6 py-16"><div className="flex w-full max-w-6xl flex-col items-center gap-10 lg:flex-row lg:justify-between lg:gap-20"><AuthIntro title="A secure way back in." description="Reset your password with a private, time-limited code sent directly to your email." /><CustomResetPassword /></div></main> }
