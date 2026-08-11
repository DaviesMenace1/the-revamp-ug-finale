'use client'

import { FormEvent, useState } from 'react'
import { useSignIn, useSignUp } from '@clerk/nextjs'
import { ArrowRight, Check, Globe2, Link2, Loader2, ShieldCheck } from 'lucide-react'
import Link from 'next/link'

type OAuthStrategy = 'oauth_google' | 'oauth_linkedin_oidc'

/**
 * Maps Clerk API error codes to clear, user-safe messages.
 * Falls back to Clerk's own message, then a generic one.
 * Never leaks whether an account exists (enumeration-safe wording).
 */
function clerkErrorMessage(err: unknown, fallback: string): string {
  const anyErr = err as { errors?: Array<{ code?: string; message?: string; longMessage?: string }>; message?: string }
  const first = anyErr?.errors?.[0]
  switch (first?.code) {
    case 'form_code_incorrect':
      return 'That verification code is incorrect. Check the latest email and try again.'
    case 'verification_expired':
      return 'That verification code has expired. Request a new code and try again.'
    case 'verification_failed':
      return 'Too many incorrect attempts. Request a new code and try again.'
    case 'form_password_incorrect':
    case 'form_identifier_not_found':
      return 'The email or password is incorrect. Check your details and try again.'
    case 'user_locked':
      return 'Too many attempts. Your account is temporarily locked — try again in a few minutes.'
    case 'too_many_requests':
      return 'Too many requests. Wait a moment and try again.'
    case 'session_exists':
      return 'You are already signed in. Refresh the page to continue.'
    case 'form_password_pwned':
      return 'This password has appeared in a data breach. Choose a different, stronger password.'
    case 'form_password_length_too_short':
      return 'That password is too short. Use at least 8 characters.'
    default:
      return first?.longMessage || first?.message || anyErr?.message || fallback
  }
}

const clerkTimeout = (message = 'The authentication service is taking too long to respond. Check your connection and try again.') =>
  new Promise<never>((_, reject) => window.setTimeout(() => reject(new Error(message)), 15000))

function AuthButton({ children, disabled = false, onClick }: { children: React.ReactNode; disabled?: boolean; onClick?: () => void }) {
  return (
    <button
      type={onClick ? 'button' : 'submit'}
      onClick={onClick}
      disabled={disabled}
      className="flex h-12 w-full items-center justify-center gap-2 bg-primary px-5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {disabled ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : children}
    </button>
  )
}

function ErrorText({ message }: { message: string | null }) {
  return message ? (
    <p role="alert" className="border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
      {message}
    </p>
  ) : null
}

function InfoText({ message }: { message: string | null }) {
  return message ? (
    <p role="status" className="border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
      {message}
    </p>
  ) : null
}

function OAuthButtons({ onOAuth, loading }: { onOAuth: (strategy: OAuthStrategy) => void; loading: string | null }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <button
        type="button"
        onClick={() => onOAuth('oauth_google')}
        disabled={!!loading}
        className="flex h-11 items-center justify-center gap-2 border border-border text-sm transition-colors hover:bg-muted disabled:opacity-50"
      >
        <Globe2 className="size-4" aria-hidden="true" />
        {loading === 'oauth_google' ? 'Connecting…' : 'Google'}
      </button>
      <button
        type="button"
        onClick={() => onOAuth('oauth_linkedin_oidc')}
        disabled={!!loading}
        className="flex h-11 items-center justify-center gap-2 border border-border text-sm transition-colors hover:bg-muted disabled:opacity-50"
      >
        <Link2 className="size-4" aria-hidden="true" />
        {loading === 'oauth_linkedin_oidc' ? 'Connecting…' : 'LinkedIn'}
      </button>
    </div>
  )
}

function Field({
  label,
  type = 'text',
  value,
  onChange,
  autoComplete,
  placeholder,
  inputMode,
}: {
  label: string
  type?: string
  value: string
  onChange: (value: string) => void
  autoComplete?: string
  placeholder?: string
  inputMode?: 'text' | 'numeric' | 'email'
}) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      <span>{label}</span>
      <input
        required
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete={autoComplete}
        inputMode={inputMode}
        placeholder={placeholder}
        className="h-12 border border-border bg-background px-3 outline-none ring-primary/30 transition focus:ring-2"
      />
    </label>
  )
}

export function CustomSignIn({ redirectUrl }: { redirectUrl: string }) {
  const { isLoaded, signIn, setActive } = useSignIn()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState<'password' | 'verify-email' | 'verify-2fa'>('password')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState<string | null>(null)

  const destination = redirectUrl || '/account'

  /**
   * Task-aware session activation: never redirects while Clerk reports a
   * pending session task, which prevents redirect loops / stuck loading.
   */
  const activate = async (sessionId: string | null) => {
    if (!sessionId || !setActive) {
      setError('Your session could not be activated. Try signing in again.')
      return
    }
    await setActive({
      session: sessionId,
      navigate: async ({ session }) => {
        if (session?.currentTask) {
          console.error('[v0] Pending Clerk session task after sign-in:', session.currentTask)
          setError('Your account requires an additional setup step. Contact support if this persists.')
          return
        }
        window.location.assign(destination)
      },
    })
  }

  /**
   * Both Device Trust (needs_client_trust) and MFA (needs_second_factor)
   * are resolved by completing an email-code second factor.
   */
  const startEmailSecondFactor = async (nextStep: 'verify-email' | 'verify-2fa') => {
    if (!signIn) return
    const factor = signIn.supportedSecondFactors?.find((item) => item.strategy === 'email_code')
    if (!factor || !('emailAddressId' in factor) || !factor.emailAddressId) {
      console.error('[v0] No email_code second factor available. Factors:', signIn.supportedSecondFactors)
      throw new Error('Verification by email is required but unavailable for this account. Contact support.')
    }
    await Promise.race([
      signIn.prepareSecondFactor({ strategy: 'email_code', emailAddressId: factor.emailAddressId }),
      clerkTimeout(),
    ])
    setCode('')
    setStep(nextStep)
    setInfo(null)
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!isLoaded || !signIn) {
      setError('Authentication is still loading. Refresh the page and try again.')
      return
    }
    setLoading(true)
    setError(null)
    setInfo(null)
    try {
      const result = await Promise.race([signIn.create({ identifier: email, password }), clerkTimeout()])
      switch (result.status) {
        case 'complete':
          await activate(result.createdSessionId)
          break
        case 'needs_client_trust':
          // New/untrusted device: Clerk requires verification to establish device trust.
          await startEmailSecondFactor('verify-email')
          break
        case 'needs_second_factor':
          await startEmailSecondFactor('verify-2fa')
          break
        case 'needs_first_factor': {
          // Defensive: password strategy should complete the first factor,
          // but if Clerk requires an email code, honor it.
          const factor = result.supportedFirstFactors?.find((item) => item.strategy === 'email_code')
          if (factor && 'emailAddressId' in factor && factor.emailAddressId) {
            await Promise.race([
              signIn.prepareFirstFactor({ strategy: 'email_code', emailAddressId: factor.emailAddressId }),
              clerkTimeout(),
            ])
            setCode('')
            setStep('verify-email')
          } else {
            console.error('[v0] Unexpected needs_first_factor without email_code. Factors:', result.supportedFirstFactors)
            setError('This account cannot sign in with a password. Use the method you originally signed up with.')
          }
          break
        }
        case 'needs_new_password':
          window.location.assign('/reset-password')
          break
        default:
          console.error('[v0] Unhandled sign-in status:', result.status)
          setError('Sign-in could not be completed. Try again, or contact support if this persists.')
      }
    } catch (err) {
      console.error('[v0] Sign-in error:', err)
      setError(clerkErrorMessage(err, 'Unable to sign in. Check your details and try again.'))
    } finally {
      setLoading(false)
    }
  }

  const verify = async (event: FormEvent) => {
    event.preventDefault()
    if (!isLoaded || !signIn) return
    setLoading(true)
    setError(null)
    setInfo(null)
    try {
      const attempt =
        signIn.firstFactorVerification?.strategy === 'email_code' && signIn.status === 'needs_first_factor'
          ? signIn.attemptFirstFactor({ strategy: 'email_code', code })
          : signIn.attemptSecondFactor({ strategy: 'email_code', code })
      const result = await Promise.race([attempt, clerkTimeout()])
      if (result.status === 'complete') {
        await activate(result.createdSessionId)
      } else if (result.status === 'needs_second_factor' || result.status === 'needs_client_trust') {
        await startEmailSecondFactor('verify-2fa')
      } else {
        console.error('[v0] Unhandled post-verification status:', result.status)
        setError('Verification did not complete. Request a new code and try again.')
      }
    } catch (err) {
      console.error('[v0] Verification error:', err)
      setError(clerkErrorMessage(err, 'That verification code was not accepted. Try again.'))
    } finally {
      setLoading(false)
    }
  }

  const resend = async () => {
    if (!isLoaded || !signIn || loading) return
    setLoading(true)
    setError(null)
    try {
      await startEmailSecondFactor(step === 'verify-2fa' ? 'verify-2fa' : 'verify-email')
      setInfo('A new verification code has been sent to your email.')
    } catch (err) {
      console.error('[v0] Resend error:', err)
      setError(clerkErrorMessage(err, 'Unable to resend the code. Wait a moment and try again.'))
    } finally {
      setLoading(false)
    }
  }

  const startOver = () => {
    setStep('password')
    setCode('')
    setPassword('')
    setError(null)
    setInfo(null)
  }

  const oauth = async (strategy: OAuthStrategy) => {
    if (!isLoaded || !signIn) return
    setOauthLoading(strategy)
    setError(null)
    try {
      await signIn.authenticateWithRedirect({
        strategy,
        redirectUrl: `/sign-in/sso-callback?redirect_url=${encodeURIComponent(destination)}`,
        redirectUrlComplete: destination,
      })
    } catch (err) {
      console.error('[v0] OAuth start error:', err)
      setError(clerkErrorMessage(err, 'Unable to connect to the provider. Try again.'))
      setOauthLoading(null)
    }
  }

  const verifying = step === 'verify-email' || step === 'verify-2fa'

  return (
    <AuthCard
      eyebrow={verifying ? 'Verify your sign-in' : 'Welcome back'}
      title={verifying ? 'Enter your verification code' : 'Sign in to your account'}
      description={
        verifying
          ? `We've sent a verification code to ${email}. Enter it below to finish signing in on this device.`
          : 'Continue your considered design journey.'
      }
    >
      {verifying ? (
        <form onSubmit={verify} className="grid gap-5">
          <Field
            label="Verification code"
            value={code}
            onChange={setCode}
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="123456"
          />
          <InfoText message={info} />
          <ErrorText message={error} />
          <AuthButton disabled={!isLoaded || loading}>
            {loading ? 'Verifying…' : (
              <>
                Verify and continue <Check className="size-4" />
              </>
            )}
          </AuthButton>
          <div className="flex items-center justify-between text-sm">
            <button
              type="button"
              onClick={resend}
              disabled={loading}
              className="text-muted-foreground underline underline-offset-4 hover:text-foreground disabled:opacity-50"
            >
              Resend code
            </button>
            <button
              type="button"
              onClick={startOver}
              className="text-muted-foreground underline underline-offset-4 hover:text-foreground"
            >
              Use a different account
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={submit} className="grid gap-5">
          <OAuthButtons onOAuth={oauth} loading={oauthLoading} />
          <Divider />
          <Field label="Email address" type="email" value={email} onChange={setEmail} autoComplete="email" />
          <Field label="Password" type="password" value={password} onChange={setPassword} autoComplete="current-password" />
          <div className="flex justify-end">
            <Link href="/reset-password" className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground">
              Forgot password?
            </Link>
          </div>
          <ErrorText message={error} />
          <AuthButton disabled={!isLoaded || loading}>
            {loading ? 'Signing in…' : (
              <>
                Sign in <ArrowRight className="size-4" />
              </>
            )}
          </AuthButton>
          <p className="text-center text-sm text-muted-foreground">
            New here?{' '}
            <Link
              href={`/sign-up?redirect_url=${encodeURIComponent(destination)}`}
              className="font-medium text-foreground underline underline-offset-4"
            >
              Create an account
            </Link>
          </p>
        </form>
      )}
    </AuthCard>
  )
}

export function CustomSignUp({ redirectUrl }: { redirectUrl: string }) {
  const { isLoaded, signUp, setActive } = useSignUp()
  const [step, setStep] = useState<'form' | 'verify'>('form')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState<string | null>(null)

  const destination = redirectUrl || '/account'

  const activate = async (sessionId: string | null) => {
    if (!sessionId || !setActive) {
      setError('Your session could not be activated. Try signing in.')
      return
    }
    await setActive({
      session: sessionId,
      navigate: async ({ session }) => {
        if (session?.currentTask) {
          console.error('[v0] Pending Clerk session task after sign-up:', session.currentTask)
          setError('Your account requires an additional setup step. Contact support if this persists.')
          return
        }
        window.location.assign(destination)
      },
    })
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!isLoaded || !signUp) {
      setError('Authentication is still loading. Refresh the page and try again.')
      return
    }
    setLoading(true)
    setError(null)
    setInfo(null)
    try {
      const result = await Promise.race([
        signUp.create({ firstName, lastName, emailAddress: email, password }),
        clerkTimeout(),
      ])
      if (result.status === 'complete') {
        await activate(result.createdSessionId)
      } else {
        // Email verification (or other requirements) outstanding.
        await Promise.race([signUp.prepareEmailAddressVerification({ strategy: 'email_code' }), clerkTimeout()])
        setCode('')
        setStep('verify')
      }
    } catch (err) {
      console.error('[v0] Sign-up error:', err)
      setError(clerkErrorMessage(err, 'Unable to create your account. Check your details and try again.'))
    } finally {
      setLoading(false)
    }
  }

  const verify = async (event: FormEvent) => {
    event.preventDefault()
    if (!isLoaded || !signUp) return
    setLoading(true)
    setError(null)
    setInfo(null)
    try {
      const result = await Promise.race([signUp.attemptEmailAddressVerification({ code }), clerkTimeout()])
      if (result.status === 'complete') {
        await activate(result.createdSessionId)
      } else if (result.status === 'missing_requirements') {
        console.error('[v0] Sign-up missing requirements:', result.missingFields, result.unverifiedFields)
        setError('Your account still needs more information. Check the form and try again, or contact support.')
      } else {
        console.error('[v0] Unhandled sign-up status after verification:', result.status)
        setError('Verification did not complete. Request a new code and try again.')
      }
    } catch (err) {
      console.error('[v0] Sign-up verification error:', err)
      setError(clerkErrorMessage(err, 'That code was not accepted. Try again.'))
    } finally {
      setLoading(false)
    }
  }

  const resend = async () => {
    if (!isLoaded || !signUp || loading) return
    setLoading(true)
    setError(null)
    try {
      await Promise.race([signUp.prepareEmailAddressVerification({ strategy: 'email_code' }), clerkTimeout()])
      setInfo('A new verification code has been sent to your email.')
    } catch (err) {
      console.error('[v0] Sign-up resend error:', err)
      setError(clerkErrorMessage(err, 'Unable to resend the code. Wait a moment and try again.'))
    } finally {
      setLoading(false)
    }
  }

  const oauth = async (strategy: OAuthStrategy) => {
    if (!isLoaded || !signUp) return
    setOauthLoading(strategy)
    setError(null)
    try {
      await signUp.authenticateWithRedirect({
        strategy,
        redirectUrl: `/sign-up/sso-callback?redirect_url=${encodeURIComponent(destination)}`,
        redirectUrlComplete: destination,
      })
    } catch (err) {
      console.error('[v0] Sign-up OAuth start error:', err)
      setError(clerkErrorMessage(err, 'Unable to connect to the provider. Try again.'))
      setOauthLoading(null)
    }
  }

  return (
    <AuthCard
      eyebrow={step === 'verify' ? 'Verify your email' : 'Start here'}
      title={step === 'verify' ? 'Check your inbox' : 'Create your account'}
      description={
        step === 'verify'
          ? `We sent a six-digit code to ${email}.`
          : 'A personal space for pieces, projects, and possibilities.'
      }
    >
      {step === 'verify' ? (
        <form onSubmit={verify} className="grid gap-5">
          <Field label="Verification code" value={code} onChange={setCode} inputMode="numeric" autoComplete="one-time-code" />
          <InfoText message={info} />
          <ErrorText message={error} />
          <AuthButton disabled={!isLoaded || loading}>
            {loading ? 'Verifying…' : (
              <>
                Verify email <Check className="size-4" />
              </>
            )}
          </AuthButton>
          <button
            type="button"
            onClick={resend}
            disabled={loading}
            className="text-center text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground disabled:opacity-50"
          >
            Resend code
          </button>
        </form>
      ) : (
        <form onSubmit={submit} className="grid gap-5">
          <OAuthButtons onOAuth={oauth} loading={oauthLoading} />
          <Divider />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="First name" value={firstName} onChange={setFirstName} autoComplete="given-name" />
            <Field label="Last name" value={lastName} onChange={setLastName} autoComplete="family-name" />
          </div>
          <Field label="Email address" type="email" value={email} onChange={setEmail} autoComplete="email" />
          <Field label="Password" type="password" value={password} onChange={setPassword} autoComplete="new-password" />
          <ErrorText message={error} />
          <AuthButton disabled={!isLoaded || loading}>
            {loading ? 'Creating account…' : (
              <>
                Create account <ArrowRight className="size-4" />
              </>
            )}
          </AuthButton>
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link
              href={`/sign-in?redirect_url=${encodeURIComponent(destination)}`}
              className="font-medium text-foreground underline underline-offset-4"
            >
              Sign in
            </Link>
          </p>
        </form>
      )}
    </AuthCard>
  )
}

export function CustomResetPassword() {
  const { isLoaded, signIn } = useSignIn()
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [step, setStep] = useState<'email' | 'code' | 'done'>('email')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!isLoaded || !signIn) {
      setError('Authentication is still loading. Refresh the page and try again.')
      return
    }
    setLoading(true)
    setError(null)
    setInfo(null)
    try {
      if (step === 'email') {
        await Promise.race([signIn.create({ strategy: 'reset_password_email_code', identifier: email }), clerkTimeout()])
        setStep('code')
      } else {
        const result = await Promise.race([
          signIn.attemptFirstFactor({ strategy: 'reset_password_email_code', code }),
          clerkTimeout(),
        ])
        if (result.status === 'needs_new_password') {
          setStep('done')
        } else if (result.status === 'complete') {
          window.location.assign('/sign-in?reset=success')
        } else {
          console.error('[v0] Unhandled reset-password status:', result.status)
          setError('Verification did not complete. Request a new code and try again.')
        }
      }
    } catch (err) {
      console.error('[v0] Reset-password error:', err)
      if (step === 'email') {
        // Enumeration-safe: identical outcome whether or not the email exists.
        setInfo('If an account exists for that email, a reset code has been sent. Check your inbox.')
        setStep('code')
      } else {
        setError(clerkErrorMessage(err, 'That code was not accepted. Try again.'))
      }
    } finally {
      setLoading(false)
    }
  }

  const resend = async () => {
    if (!isLoaded || !signIn || loading) return
    setLoading(true)
    setError(null)
    try {
      await Promise.race([signIn.create({ strategy: 'reset_password_email_code', identifier: email }), clerkTimeout()])
      setInfo('A new reset code has been sent if an account exists for that email.')
    } catch (err) {
      console.error('[v0] Reset-password resend error:', err)
      setInfo('A new reset code has been sent if an account exists for that email.')
    } finally {
      setLoading(false)
    }
  }

  const finish = async (event: FormEvent) => {
    event.preventDefault()
    if (!isLoaded || !signIn) {
      setError('Authentication is still loading. Refresh the page and try again.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      await Promise.race([signIn.resetPassword({ password }), clerkTimeout()])
      window.location.assign('/sign-in?reset=success')
    } catch (err) {
      console.error('[v0] Password update error:', err)
      setError(clerkErrorMessage(err, 'Unable to update your password. Try again.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthCard
      eyebrow="Account recovery"
      title={step === 'done' ? 'Choose a new password' : 'Reset your password'}
      description={
        step === 'email'
          ? 'We will send a secure reset code to your email.'
          : step === 'code'
            ? `Enter the code sent to ${email}.`
            : 'Use a strong password you have not used elsewhere.'
      }
    >
      {step === 'done' ? (
        <form onSubmit={finish} className="grid gap-5">
          <Field label="New password" type="password" value={password} onChange={setPassword} autoComplete="new-password" />
          <Field
            label="Confirm new password"
            type="password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            autoComplete="new-password"
          />
          <ErrorText message={error} />
          <AuthButton disabled={!isLoaded || loading}>{loading ? 'Updating…' : 'Update password'}</AuthButton>
        </form>
      ) : (
        <form onSubmit={submit} className="grid gap-5">
          <Field
            label={step === 'email' ? 'Email address' : 'Verification code'}
            type={step === 'email' ? 'email' : 'text'}
            value={step === 'email' ? email : code}
            onChange={step === 'email' ? setEmail : setCode}
            autoComplete={step === 'email' ? 'email' : 'one-time-code'}
            inputMode={step === 'email' ? 'email' : 'numeric'}
          />
          <InfoText message={info} />
          <ErrorText message={error} />
          <AuthButton disabled={!isLoaded || loading}>
            {loading ? 'Please wait…' : step === 'email' ? 'Send reset code' : 'Verify code'}
          </AuthButton>
          {step === 'code' ? (
            <button
              type="button"
              onClick={resend}
              disabled={loading}
              className="text-center text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground disabled:opacity-50"
            >
              Resend code
            </button>
          ) : null}
          <Link href="/sign-in" className="text-center text-sm text-muted-foreground underline underline-offset-4">
            Back to sign in
          </Link>
        </form>
      )}
    </AuthCard>
  )
}

function AuthCard({ eyebrow, title, description, children }: { eyebrow: string; title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="w-full max-w-md border border-border bg-card p-6 shadow-sm sm:p-8">
      <div className="mb-7">
        <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.24em] text-primary">{eyebrow}</p>
        <h2 className="font-serif text-3xl leading-tight text-foreground">{title}</h2>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
      {children}
    </div>
  )
}

function Divider() {
  return (
    <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
      <span className="h-px flex-1 bg-border" />or<span className="h-px flex-1 bg-border" />
    </div>
  )
}

export function AuthIntro({ title, description }: { title: string; description: string }) {
  return (
    <section className="max-w-xl text-center lg:text-left">
      <p className="font-serif text-xl font-light uppercase tracking-[0.22em]">
        The Revamp <span className="text-primary">UG</span>
      </p>
      <p className="mt-8 flex items-center justify-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground lg:justify-start">
        <ShieldCheck className="size-3" aria-hidden="true" /> Secure member access
      </p>
      <h1 className="mt-5 font-serif text-5xl leading-[0.95] text-foreground sm:text-6xl">{title}</h1>
      <p className="mt-6 max-w-md text-base leading-7 text-muted-foreground">{description}</p>
    </section>
  )
}
