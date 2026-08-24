import AuthPageClient from '@/components/auth/auth-page-client'
import { safeRedirect } from '@/lib/auth/safe-redirect'

export const dynamic = 'force-dynamic'

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect_url?: string }>
}) {
  const { redirect_url: rawRedirect } = await searchParams
  const redirectUrl = rawRedirect ? safeRedirect(rawRedirect) : '/account'

  return <AuthPageClient mode="sign-in" redirectUrl={redirectUrl} />
}
