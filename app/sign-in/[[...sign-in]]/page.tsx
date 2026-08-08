import { SignIn } from '@clerk/nextjs'

interface SignInPageProps {
  searchParams: Promise<{ redirect_url?: string }>
}

function getSafeRedirectUrl(value?: string) {
  if (!value) return '/account'

  try {
    const parsed = new URL(value, 'https://therevampug.com')
    if (parsed.origin !== 'https://therevampug.com' && parsed.origin !== 'https://www.therevampug.com') {
      return '/account'
    }
    return `${parsed.pathname}${parsed.search}${parsed.hash}`
  } catch {
    return '/account'
  }
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const { redirect_url: redirectUrl } = await searchParams
  const safeRedirectUrl = getSafeRedirectUrl(redirectUrl)

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-16">
      <div className="flex w-full max-w-6xl flex-col items-center gap-10 lg:flex-row lg:justify-between lg:gap-20">
        <section className="max-w-xl text-center lg:text-left">
          <p className="font-sans text-xs font-medium uppercase tracking-[0.28em] text-muted-foreground">
            The Revamp UG
          </p>
          <h1 className="mt-5 font-serif text-5xl leading-[0.95] text-foreground sm:text-6xl">
            Welcome back to your world of considered living.
          </h1>
          <p className="mt-6 max-w-md font-sans text-base leading-7 text-muted-foreground">
            Sign in to manage your saved pieces, orders, consultations, membership, and design journey.
          </p>
        </section>
        <div className="w-full max-w-md rounded-sm border border-border bg-card p-2 shadow-sm sm:p-4">
          <SignIn
            path="/sign-in"
            routing="path"
            fallbackRedirectUrl={safeRedirectUrl}
            signInUrl="/sign-in"
            signUpUrl="/sign-up"
            appearance={{
              elements: {
                rootBox: 'w-full',
                card: 'w-full border-0 bg-transparent shadow-none',
                headerTitle: 'font-serif text-3xl font-normal text-foreground',
                headerSubtitle: 'font-sans text-muted-foreground',
                formFieldLabel: 'font-sans text-foreground',
                formFieldInput: 'font-sans border-border bg-background',
                formButtonPrimary: 'bg-primary font-sans text-primary-foreground hover:bg-primary/90',
                footerActionLink: 'font-sans text-primary hover:text-primary/80',
              },
            }}
          />
        </div>
      </div>
    </main>
  )
}
