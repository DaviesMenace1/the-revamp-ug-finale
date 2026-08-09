'use client'

import { AuthenticateWithRedirectCallback } from '@clerk/nextjs'

export default function SignUpSsoCallback() { return <main className="flex min-h-screen items-center justify-center bg-background p-6"><p className="text-sm text-muted-foreground">Completing secure sign up…</p><AuthenticateWithRedirectCallback /></main> }
