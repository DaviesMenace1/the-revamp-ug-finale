'use client'

import { FormEvent, useRef, useState } from 'react'
import { useSignIn, useSignUp } from '@clerk/nextjs'
import { ArrowRight, Check, Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react'
import { SiGoogle, SiLinkedin } from 'react-icons/si'
import Link from 'next/link'
import { AUTH_NAME_MAX_LENGTH, AUTH_USERNAME_MAX_LENGTH, isBoundedAuthText, isValidAuthEmail, isValidAuthPassword, isValidVerificationCode, normalizeAuthEmail } from '@/lib/auth/input-validation'

type OAuthStrategy = 'oauth_google' | 'oauth_linkedin_oidc'

async function authorizeAuthAttempt(identifier?: string) {
  let response: Response
  try {
    response = await fetch('/api/auth/attempt', {
      method: 'POST',
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(identifier ? { identifier: normalizeAuthEmail(identifier) } : {}),
    })
  } catch (error) {
    console.error('[auth] rate-limit request failed:', error)
    throw new Error('Authentication protection is temporarily unavailable. Refresh the page and try again.')
  }

  const result = (await response.json().catch(() => null)) as { allowed?: boolean; error?: string } | null
  if (!response.ok || !result?.allowed) {
    const retryAfter = Number(response.headers.get('Retry-After'))
    const retryMessage = Number.isFinite(retryAfter) && retryAfter > 0 ? ` Try again in about ${retryAfter} seconds.` : ''
    throw new Error(`${result?.error || 'Authentication attempts are temporarily limited.'}${retryMessage}`)
  }
}

/**
 * Maps Clerk error codes to clear, user-safe messages.
 * Handles both the flat ClerkError shape ({ code, message, longMessage })
 * returned by the current SDK and the legacy { errors: [...] } shape.
 * Never leaks whether an account exists (enumeration-safe wording).
 */
function clerkErrorMessage(err: unknown, fallback: string): string {
  const anyErr = err as {
    code?: string
    message?: string
    longMessage?: string
    errors?: Array<{ code?: string; message?: string; longMessage?: string }>
  }
  const first = anyErr?.errors?.[0]
  const code = anyErr?.code ?? first?.code
  switch (code) {
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
      return 'Too many attempts. Your account is temporarily locked , try again in a few minutes.'
    case 'too_many_requests':
      return 'Too many requests. Wait a moment and try again.'
    case 'session_exists':
      return 'You are already signed in.Refresh the page to continue.'
    case 'form_password_pwned':
      return 'This password has appeared in a data breach. Choose a different, stronger password.'
    case 'form_password_length_too_short':
      return 'That password is too short. Use at least 8 characters.'
    default:
      return anyErr?.longMessage || first?.longMessage || first?.message || anyErr?.message || fallback
  }
}

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
        <SiGoogle color="default" size={18} aria-hidden="true" />
        {loading === 'oauth_google' ? 'Connecting…' : 'Continue with Google'}
      </button>
      <button
        type="button"
        onClick={() => onOAuth('oauth_linkedin_oidc')}
        disabled={!!loading}
        className="flex h-11 items-center justify-center gap-2 border border-border text-sm transition-colors hover:bg-muted disabled:opacity-50"
      >
        <SiLinkedin color="default" size={18} aria-hidden="true" />
        {loading === 'oauth_linkedin_oidc' ? 'Connecting…' : 'Continue with LinkedIn'}
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
  required = true,
}: {
  label: string
  type?: string
  value: string
  onChange: (value: string) => void
  autoComplete?: string
  placeholder?: string
  inputMode?: 'text' | 'numeric' | 'email'
  required?: boolean
}) {
  const [passwordVisible, setPasswordVisible] = useState(false)
  return (
    <label className="grid gap-2 text-sm font-medium">
      <span>{label}</span>
      <div className="relative">
        <input
          required={required}
          type={type === 'password' && passwordVisible ? 'text' : type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={autoComplete}
          inputMode={inputMode}
          placeholder={placeholder}
          className="h-12 w-full border border-border bg-background/75 px-3 pr-12 outline-none ring-primary/30 transition focus:ring-2"
        />
        {type === 'password' && (
          <button type="button" onClick={() => setPasswordVisible((visible) => !visible)} className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted-foreground transition-colors hover:text-foreground" aria-label={passwordVisible ? 'Hide password' : 'Show password'}>
            {passwordVisible ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
          </button>
        )}
      </div>
    </label>
  )
}

function VerificationCodeBoxes({ value, onChange, onComplete, disabled = false }: { value: string; onChange: (value: string) => void; onComplete?: (value: string) => void; disabled?: boolean }) {
  const refs = useRef<Array<HTMLInputElement | null>>([])
  const digits = value.replace(/\D/g, '').slice(0, 6).split('')
  const update = (index: number, raw: string) => {
    const incoming = raw.replace(/\D/g, '')
    if (!incoming) {
      const next = digits.slice()
      next[index] = ''
      onChange(next.join(''))
      return
    }
    const next = digits.slice()
    incoming.split('').forEach((digit, offset) => { if (index + offset < 6) next[index + offset] = digit })
    const nextValue = next.join('').slice(0, 6)
    onChange(nextValue)
    refs.current[Math.min(index + incoming.length, 5)]?.focus()
    if (nextValue.length === 6) onComplete?.(nextValue)
  }
  return (
    <div className="grid gap-2">
      <span className="text-xs font-medium text-foreground">Verification code</span>
      <div className="grid grid-cols-6 gap-2" role="group" aria-label="Six digit verification code">
        {Array.from({ length: 6 }, (_, index) => (
          <input key={index} ref={(element) => { refs.current[index] = element }} value={digits[index] || ''} onChange={(event) => update(index, event.target.value)} onKeyDown={(event) => { if (event.key === 'Backspace' && !digits[index] && index > 0) refs.current[index - 1]?.focus(); if (event.key === 'ArrowLeft' && index > 0) refs.current[index - 1]?.focus(); if (event.key === 'ArrowRight' && index < 5) refs.current[index + 1]?.focus() }} onPaste={(event) => { event.preventDefault(); update(index, event.clipboardData.getData('text')) }} inputMode="numeric" pattern="[0-9]*" maxLength={6} autoComplete={index === 0 ? 'one-time-code' : 'off'} aria-label={`Verification digit ${index + 1}`} disabled={disabled} className="h-12 w-full rounded-md border border-border bg-background/70 text-center font-serif text-xl text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60 sm:h-14" />
        ))}
      </div>
    </div>
  )
}

export function CustomSignIn({ redirectUrl }: { redirectUrl: string }) {
  const { signIn } = useSignIn()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState<'password' | 'verify-device' | 'verify-2fa' | 'verify-email'>('password')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState<string | null>(null)
  const verifyFormRef = useRef<HTMLFormElement>(null)

  const isLoaded = !!signIn
  const destination = redirectUrl || '/account'

  /**
   * Task-aware finalization: sets the session active and only navigates when
   * Clerk reports no pending session task, preventing redirect loops.
   */
  const finalize = async () => {
    if (!signIn) return
    const { error: finalizeError } = await signIn.finalize({
      navigate: async ({ session, decorateUrl }) => {
        if (session?.currentTask) {
          console.error(' Pending Clerk session task after sign-in:', session.currentTask)
          setError('Your account requires an additional setup step. Contact support if this persists.')
          return
        }
        window.location.href = decorateUrl(destination)
      },
    })
    if (finalizeError) {
      console.error(' Session finalize error:', finalizeError)
      setError(clerkErrorMessage(finalizeError, 'Your session could not be activated. Try signing in again.'))
    }
  }

  /**
   * Routes the sign-in to the correct next step based on Clerk's status.
   * Device Trust (needs_client_trust) and MFA (needs_second_factor) are both
   * resolved with an emailed second-factor code; needs_first_factor falls
   * back to a first-factor email code.
   */
  const advance = async (): Promise<void> => {
    if (!signIn) return
    switch (signIn.status) {
      case 'complete':
        await finalize()
        break
      case 'needs_client_trust': {
        // New/untrusted device: verify by email code to establish device trust.
        const { error: sendError } = await signIn.mfa.sendEmailCode()
        if (sendError) throw sendError
        setCode('')
        setStep('verify-device')
        break
      }
      case 'needs_second_factor': {
        const { error: sendError } = await signIn.mfa.sendEmailCode()
        if (sendError) throw sendError
        setCode('')
        setStep('verify-2fa')
        break
      }
      case 'needs_first_factor': {
        const { error: sendError } = await signIn.emailCode.sendCode()
        if (sendError) throw sendError
        setCode('')
        setStep('verify-email')
        break
      }
      case 'needs_new_password':
        window.location.assign('/reset-password')
        break
      default:
        console.error('[v0] Unhandled sign-in status:', signIn.status)
        setError('Sign-in could not be completed. Try again, or contact support if this persists.')
    }
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!signIn) {
      setError('Authentication is still loading. Refresh the page and try again.')
      return
    }
    const normalizedEmail = normalizeAuthEmail(email)
    if (!isValidAuthEmail(normalizedEmail)) {
      setError('Enter a valid email address.')
      return
    }
    if (!isValidAuthPassword(password)) {
      setError('Use a password between 8 and 128 characters without control characters.')
      return
    }

    setLoading(true)
    setError(null)
    setInfo(null)
    try {
      await authorizeAuthAttempt(normalizedEmail)
      const { error: passwordError } = await signIn.password({ identifier: normalizedEmail, password })
      if (passwordError) throw passwordError
      await advance()
    } catch (err) {
      console.error(' Sign-in error:', err)
      setError(clerkErrorMessage(err, 'Unable to sign in. Check your details and try again.'))
    } finally {
      setLoading(false)
    }
  }

  const verify = async (event: FormEvent) => {
    event.preventDefault()
    if (!signIn) return
    setLoading(true)
    setError(null)
    setInfo(null)
    try {
      if (!isValidVerificationCode(code)) {
        setError('Enter the verification code exactly as provided.')
        return
      }
      await authorizeAuthAttempt(normalizeAuthEmail(email))
      const { error: verifyError } =
        step === 'verify-email'
          ? await signIn.emailCode.verifyCode({ code: code.trim() })
          : await signIn.mfa.verifyEmailCode({ code: code.trim() })
      if (verifyError) throw verifyError
      await advance()
    } catch (err) {
      console.error(' Verification error:', err)
      setError(clerkErrorMessage(err, 'That verification code was not accepted. Try again.'))
    } finally {
      setLoading(false)
    }
  }

  const resend = async () => {
    if (!signIn || loading) return
    setLoading(true)
    setError(null)
    try {
      const normalizedEmail = normalizeAuthEmail(email)
      if (!isValidAuthEmail(normalizedEmail)) throw new Error('Enter a valid email address.')
      await authorizeAuthAttempt(normalizedEmail)
      const { error: sendError } =
        step === 'verify-email' ? await signIn.emailCode.sendCode() : await signIn.mfa.sendEmailCode()
      if (sendError) throw sendError
      setInfo('A new verification code has been sent to your email.')
    } catch (err) {
      console.error('Resend error:', err)
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
    if (!signIn) return

    setOauthLoading(strategy)
    setError(null)
    try {
      await authorizeAuthAttempt()
      // Redirects the browser to the provider; only returns here on error.
      const { error: ssoError } = await signIn.sso({
        strategy,
        redirectUrl: destination,
        redirectCallbackUrl: `/sign-in/sso-callback?redirect_url=${encodeURIComponent(destination)}`,
      })
      if (ssoError) throw ssoError
    } catch (err) {
      console.error('[v0] OAuth start error:', err)
      setError(clerkErrorMessage(err, 'Unable to connect to the provider. Try again.'))
      setOauthLoading(null)
    }
  }

  const verifying = step !== 'password'

  return (
    <AuthCard
      eyebrow={step === 'verify-device' ? 'New device detected' : verifying ? 'Email verification' : 'Sign in'}
      title={verifying ? 'Enter your verification code' : 'Sign in to your account'}
      description={
        verifying
          ? `We've sent a verification code to ${email}. Enter it below to finish signing in on this device.`
          : 'Enter your details to continue.'
      }
    >
      {verifying ? (
          <form ref={verifyFormRef} onSubmit={verify} className="grid gap-5">
          <VerificationCodeBoxes value={code} onChange={setCode} disabled={loading} onComplete={() => window.setTimeout(() => verifyFormRef.current?.requestSubmit(), 0)} />
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
          <Field label="Email address" type="email" value={email} onChange={setEmail} autoComplete="email" />
          <Field label="Password" type="password" value={password} onChange={setPassword} autoComplete="current-password" />
          <div className="flex justify-end">
            <Link href="/reset-password" className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground">
              Forgot password?
            </Link>
          </div>
          <ErrorText message={error} />
          <div className="grid gap-3 pt-2"><p className="text-center text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Continue with</p><OAuthButtons onOAuth={oauth} loading={oauthLoading} /></div>
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
  const { signUp } = useSignUp()
  const [step, setStep] = useState<'form' | 'verify'>('form')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState<string | null>(null)
  const verifyFormRef = useRef<HTMLFormElement>(null)

  const isLoaded = !!signUp
  const destination = redirectUrl || '/account'

  const finalize = async () => {
    if (!signUp) return
    const { error: finalizeError } = await signUp.finalize({
      navigate: async ({ session, decorateUrl }) => {
        if (session?.currentTask) {
          console.error('[v0] Pending Clerk session task after sign-up:', session.currentTask)
          setError('Your account requires an additional setup step. Contact support if this persists.')
          return
        }
        window.location.href = decorateUrl(destination)
      },
    })
    if (finalizeError) {
      console.error('[v0] Sign-up finalize error:', finalizeError)
      setError(clerkErrorMessage(finalizeError, 'Your session could not be activated. Try signing in.'))
    }
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!signUp) {
      setError('Authentication is still loading. Refresh the page and try again.')
      return
    }

    if (!agreedToTerms) {
      setError('You must accept the Terms of Use and Privacy Policy to continue.')
      return
    }

    setLoading(true)
    setError(null)
    setInfo(null)
    try {
      const normalizedEmail = normalizeAuthEmail(email)
      if (!isValidAuthEmail(normalizedEmail)) throw new Error('Enter a valid email address.')
      if (!isValidAuthPassword(password)) throw new Error('Use a password between 8 and 128 characters without control characters.')
      if (!isBoundedAuthText(firstName, AUTH_NAME_MAX_LENGTH, true) || !isBoundedAuthText(lastName, AUTH_NAME_MAX_LENGTH)) throw new Error('Check the name fields and try again.')
      if (username && !isBoundedAuthText(username, AUTH_USERNAME_MAX_LENGTH)) throw new Error('Check the username and try again.')
      await authorizeAuthAttempt(normalizedEmail)
      const { error: createError } = await signUp.password({
        emailAddress: normalizedEmail,
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        username: username.trim() || undefined,
      })

      if (createError) throw createError

      if (signUp.status === 'complete') {
        await finalize()
      } else if (signUp.unverifiedFields.includes('email_address')) {
        const { error: sendError } = await signUp.verifications.sendEmailCode()
        if (sendError) throw sendError
        setCode('')
        setStep('verify')
      } else {
        console.error('[v0] Sign-up missing requirements:', signUp.missingFields, signUp.unverifiedFields)
        setError(`Additional information required: ${signUp.missingFields.join(', ')}`)
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
    if (!signUp) return
    setLoading(true)
    setError(null)
    setInfo(null)
    try {
      if (!isValidVerificationCode(code)) {
        setError('Enter the verification code exactly as provided.')
        return
      }
      await authorizeAuthAttempt(normalizeAuthEmail(email))
      const { error: verifyError } = await signUp.verifications.verifyEmailCode({ code: code.trim() })
      if (verifyError) throw verifyError

      if (signUp.status === 'complete') {
        await finalize()
      } else {
        console.error('[v0] Sign-up incomplete after verification:', signUp.status, signUp.missingFields)
        setError(`Your account is missing required fields: ${signUp.missingFields.join(', ')}`)
      }
    } catch (err) {
      console.error('[v0] Sign-up verification error:', err)
      setError(clerkErrorMessage(err, 'That code was not accepted. Try again.'))
    } finally {
      setLoading(false)
    }
  }

  const resend = async () => {
    if (!signUp || loading) return
    setLoading(true)
    setError(null)
    try {
      const normalizedEmail = normalizeAuthEmail(email)
      if (!isValidAuthEmail(normalizedEmail)) throw new Error('Enter a valid email address.')
      await authorizeAuthAttempt(normalizedEmail)
      const { error: sendError } = await signUp.verifications.sendEmailCode()
      if (sendError) throw sendError
      setInfo('A new verification code has been sent to your email.')
    } catch (err) {
      console.error('[v0] Sign-up resend error:', err)
      setError(clerkErrorMessage(err, 'Unable to resend the code. Wait a moment and try again.'))
    } finally {
      setLoading(false)
    }
  }

  const oauth = async (strategy: OAuthStrategy) => {
    if (!signUp) return
    setOauthLoading(strategy)
    setError(null)
    try {
      await authorizeAuthAttempt()
      const { error: ssoError } = await signUp.sso({
        strategy,
        redirectUrl: destination,
        redirectCallbackUrl: `/sign-up/sso-callback?redirect_url=${encodeURIComponent(destination)}`,
      })
      if (ssoError) throw ssoError
    } catch (err) {
      console.error('[v0] Sign-up OAuth start error:', err)
      setError(clerkErrorMessage(err, 'Unable to connect to the provider. Try again.'))
      setOauthLoading(null)
    }
  }

  return (
    <AuthCard
      eyebrow={step === 'verify' ? 'Email verification' : 'Create account'}
      title={step === 'verify' ? 'Check your inbox' : 'Create your account'}
      description={
        step === 'verify'
          ? `We sent a six-digit code to ${email}.`
          : 'Enter your details to get started.'
      }
    >
      {step === 'verify' ? (
        <form ref={verifyFormRef} onSubmit={verify} className="grid gap-5">
          <VerificationCodeBoxes value={code} onChange={setCode} disabled={loading} onComplete={() => window.setTimeout(() => verifyFormRef.current?.requestSubmit(), 0)} />
          <InfoText message={info} />
          <ErrorText message={error} />
          <AuthButton disabled={!isLoaded || loading}>
            {loading ? (
              'Verifying…'
            ) : (
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
          <div className="grid gap-3"><p className="text-center text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Continue with</p><OAuthButtons onOAuth={oauth} loading={oauthLoading} /></div>
          <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.18em] text-muted-foreground"><span className="h-px flex-1 bg-border" />Or<span className="h-px flex-1 bg-border" /></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="First name" value={firstName} onChange={setFirstName} autoComplete="given-name" required />
            <Field label="Last name" value={lastName} onChange={setLastName} autoComplete="family-name" required />
          </div>
          <Field label="Username" value={username} onChange={setUsername} autoComplete="username" required />
          <Field label="Email address" type="email" value={email} onChange={setEmail} autoComplete="email" required />
          <Field label="Password" type="password" value={password} onChange={setPassword} autoComplete="new-password" required />
          <p className="-mt-2 text-xs leading-5 text-muted-foreground">Use 8–128 characters. Choose a unique password with a mix of letters, numbers, and symbols.</p>

          {/* Terms & Privacy Policy Checkbox */}
          <div className="flex items-start gap-3 text-xs text-muted-foreground">
            <input
              type="checkbox"
              id="terms"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="mt-0.5 size-4 rounded border-gray-300 text-foreground focus:ring-foreground"
              required
            />
            <label htmlFor="terms" className="leading-snug">
              I agree to the{' '}
              <Link href="/legal/terms" className="underline underline-offset-2 hover:text-foreground">
                Terms of Use
              </Link>{' '}
              and{' '}
              <Link href="/legal/privacy" className="underline underline-offset-2 hover:text-foreground">
                Privacy Policy
              </Link>
              .
            </label>
          </div>

          <ErrorText message={error} />
          <AuthButton disabled={!isLoaded || loading || !agreedToTerms}>
            {loading ? (
              'Creating account…'
            ) : (
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
  const { signIn } = useSignIn()
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [step, setStep] = useState<'email' | 'code' | 'new-password'>('email')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const verifyFormRef = useRef<HTMLFormElement>(null)

  const isLoaded = !!signIn

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!signIn) {
      setError('Authentication is still loading. Refresh the page and try again.')
      return
    }
    setLoading(true)
    setError(null)
    setInfo(null)
    try {
      if (step === 'email') {
          const normalizedEmail = normalizeAuthEmail(email)
        if (!isValidAuthEmail(normalizedEmail)) throw new Error('Enter a valid email address.')
        await authorizeAuthAttempt(normalizedEmail)
        const { error: createError } = await signIn.create({ identifier: normalizedEmail })
        if (!createError) {
          const { error: sendError } = await signIn.resetPasswordEmailCode.sendCode()
          if (sendError) console.error('[v0] Reset-code send error:', sendError)
        } else {
          console.error('[v0] Reset-password create error:', createError)
        }
        // Enumeration-safe: identical outcome whether or not the email exists.
        setInfo('If an account exists for that email, a reset code has been sent. Check your inbox.')
        setStep('code')
      } else {
        if (!isValidVerificationCode(code)) {
          setError('Enter the verification code exactly as provided.')
          return
        }
        await authorizeAuthAttempt(normalizeAuthEmail(email))
        const { error: verifyError } = await signIn.resetPasswordEmailCode.verifyCode({ code: code.trim() })
        if (verifyError) throw verifyError
        if (signIn.status === 'needs_new_password') {
          setStep('new-password')
        } else if (signIn.status === 'complete') {
          window.location.assign('/sign-in?reset=success')
        } else {
          console.error('[v0] Unhandled reset-password status:', signIn.status)
          setError('Verification did not complete. Request a new code and try again.')
        }
      }
    } catch (err) {
      console.error('[v0] Reset-password error:', err)
      setError(clerkErrorMessage(err, 'That code was not accepted. Try again.'))
    } finally {
      setLoading(false)
    }
  }

  const resend = async () => {
    if (!signIn || loading) return
    setLoading(true)
    setError(null)
    try {
      const normalizedEmail = normalizeAuthEmail(email)
      if (!isValidAuthEmail(normalizedEmail)) throw new Error('Enter a valid email address.')
      await authorizeAuthAttempt(normalizedEmail)
      const { error: createError } = await signIn.create({ identifier: normalizedEmail })
      if (!createError) await signIn.resetPasswordEmailCode.sendCode()
    } catch (err) {
      console.error('[v0] Reset-password resend error:', err)
    } finally {
      // Enumeration-safe messaging regardless of outcome.
      setInfo('A new reset code has been sent if an account exists for that email.')
      setLoading(false)
    }
  }

  const finish = async (event: FormEvent) => {
    event.preventDefault()
    if (!signIn) {
      setError('Authentication is still loading. Refresh the page and try again.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    if (!isValidAuthPassword(password)) {
      setError('Use a password between 8 and 128 characters without control characters.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      await authorizeAuthAttempt(normalizeAuthEmail(email))
      const { error: submitError } = await signIn.resetPasswordEmailCode.submitPassword({
        password,
        signOutOfOtherSessions: true,
      })
      if (submitError) throw submitError
      if (signIn.status === 'complete') {
        // Password reset creates a session; activate it and go to the account.
        const { error: finalizeError } = await signIn.finalize({
          navigate: async ({ session, decorateUrl }) => {
            if (session?.currentTask) {
              console.error('[v0] Pending session task after password reset:', session.currentTask)
              window.location.assign('/sign-in?reset=success')
              return
            }
            window.location.href = decorateUrl('/account')
          },
        })
        if (finalizeError) window.location.assign('/sign-in?reset=success')
      } else {
        window.location.assign('/sign-in?reset=success')
      }
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
      title={step === 'new-password' ? 'Choose a new password' : 'Reset your password'}
      description={
        step === 'email'
          ? 'We will send a secure reset code to your email.'
          : step === 'code'
            ? `Enter the code sent to ${email}.`
            : 'Use a strong password you have not used elsewhere.'
      }
    >
      {step === 'new-password' ? (
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
        <form ref={step === 'code' ? verifyFormRef : undefined} onSubmit={submit} className="grid gap-5">
          {step === 'email' ? <Field label="Email address" type="email" value={email} onChange={setEmail} autoComplete="email" /> : <VerificationCodeBoxes value={code} onChange={setCode} disabled={loading} onComplete={() => window.setTimeout(() => verifyFormRef.current?.requestSubmit(), 0)} />}
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
    <div className="w-full max-w-[calc(100vw-2rem)] overflow-hidden animate-in fade-in slide-in-from-bottom-2 rounded-2xl border border-white/45 bg-[#f5eee4]/30 p-5 text-foreground shadow-[0_28px_90px_rgba(18,13,9,0.34)] backdrop-blur-xl duration-300 sm:p-8">
      <div className="mb-7">
        <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.24em] text-primary">{eyebrow}</p>
        <h2 className="font-serif text-3xl leading-tight text-foreground">{title}</h2>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
      {children}
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
