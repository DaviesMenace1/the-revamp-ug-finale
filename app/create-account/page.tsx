import { redirect } from 'next/navigation'

export default async function CreateAccountRedirect({
  searchParams,
}: {
  searchParams: Promise<{ redirect_url?: string }>
}) {
  const { redirect_url: redirectUrl } = await searchParams
  redirect(`/sign-up${redirectUrl ? `?redirect_url=${encodeURIComponent(redirectUrl)}` : ''}`)
}
