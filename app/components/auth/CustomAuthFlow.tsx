'use client'

import { useEffect, useMemo, useState, type ButtonHTMLAttributes, type FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSignIn, useSignUp } from '@clerk/nextjs'
import { isClerkAPIResponseError } from '@clerk/nextjs/errors'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { FcGoogle } from 'react-icons/fc'

import { cn } from '@/lib/utils'

type AuthStep = 'email' | 'password' | 'verify'

function isValidEmail(value: string) {
  return /\S+@\S+\.\S+/.test(value)
}

function getPrimaryClerkError(error: unknown) {
  if (!isClerkAPIResponseError(error)) return null
  return error.errors?.[0] ?? null
}

function getErrorMessage(error: unknown, fallback: string) {
  const primary = getPrimaryClerkError(error)
  return primary?.longMessage || primary?.message || fallback
}

function hasErrorCode(error: unknown, codePart: string) {
  const primary = getPrimaryClerkError(error)
  return Boolean(primary?.code?.includes(codePart))
}

function buildAuthHref(step: AuthStep, email: string) {
  const params = new URLSearchParams()
  if (step !== 'email') params.set('step', step)
  if (email) params.set('email', email)

  const query = params.toString()
  return query ? `/sign-in?${query}` : '/sign-in'
}

interface AuthActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean
}

function AuthActionButton({
  children,
  className,
  loading = false,
  disabled,
  ...props
}: AuthActionButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex h-[3.35rem] w-full items-center justify-center rounded-[0.85rem] border text-[0.84rem] font-semibold transition-colors',
        disabled || loading
          ? 'cursor-not-allowed opacity-80'
          : '',
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : children}
    </button>
  )
}

export default function CustomAuthFlow() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentEmail = searchParams.get('email') ?? ''
  const stepFromQuery = searchParams.get('step')
  const currentStep: AuthStep =
    stepFromQuery === 'password' || stepFromQuery === 'verify' ? stepFromQuery : 'email'

  const { isLoaded: signInLoaded, signIn, setActive } = useSignIn()
  const { isLoaded: signUpLoaded, signUp, setActive: setSignUpActive } = useSignUp()

  const [emailInput, setEmailInput] = useState(currentEmail)
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    setEmailInput(currentEmail)
  }, [currentEmail])

  const heading = useMemo(() => {
    if (currentStep === 'password') return 'Enter your password'
    if (currentStep === 'verify') return 'Check your email'
    return null
  }, [currentStep])

  const helper = useMemo(() => {
    if (currentStep === 'password' && currentEmail) {
      return `Continue with the password for ${currentEmail}.`
    }

    if (currentStep === 'verify' && currentEmail) {
      return `Enter the code we sent to ${currentEmail}.`
    }

    return null
  }, [currentEmail, currentStep])

  const authReady = signInLoaded && signUpLoaded && Boolean(signIn) && Boolean(signUp) && Boolean(setActive) && Boolean(setSignUpActive)

  const goToStep = (step: AuthStep, email = emailInput.trim()) => {
    router.replace(buildAuthHref(step, email))
  }

  const handleEmailContinue = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const normalized = emailInput.trim().toLowerCase()
    setError(null)
    setInfo(null)

    if (!isValidEmail(normalized)) {
      setError('Enter a valid email address.')
      return
    }

    setEmailInput(normalized)
    goToStep('password', normalized)
  }

  const handlePasswordContinue = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!signInLoaded || !signUpLoaded || !signIn || !signUp || !setActive || !setSignUpActive) return

    const normalized = currentEmail.trim().toLowerCase()

    setError(null)
    setInfo(null)
    setIsSubmitting(true)

    try {
      const result = await signIn.create({
        strategy: 'password',
        identifier: normalized,
        password,
      })

      if (result.status === 'complete' && result.createdSessionId) {
        await setActive({ session: result.createdSessionId, redirectUrl: '/' })
        return
      }

      if (result.status === 'needs_second_factor') {
        setError('This account requires an extra verification step that is not wired into this custom page yet.')
        return
      }

      if (result.status === 'needs_new_password') {
        setError('This account needs a password reset before you can continue.')
        return
      }

      setError('Unable to continue with that account.')
    } catch (authError) {
      if (hasErrorCode(authError, 'identifier_not_found')) {
        try {
          const signUpAttempt = await signUp.create({
            emailAddress: normalized,
            password,
          })

          if (signUpAttempt.status === 'complete' && signUpAttempt.createdSessionId) {
            await setSignUpActive({ session: signUpAttempt.createdSessionId, redirectUrl: '/' })
            return
          }

          await signUp.prepareEmailAddressVerification({ strategy: 'email_code' })
          setInfo(`We created your account shell and sent a verification code to ${normalized}.`)
          goToStep('verify', normalized)
          return
        } catch (signUpError) {
          setError(getErrorMessage(signUpError, 'Unable to create your account right now.'))
          return
        }
      }

      setError(getErrorMessage(authError, 'Unable to continue right now.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleVerify = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!signUpLoaded || !signUp || !setSignUpActive) return

    setError(null)
    setInfo(null)
    setIsSubmitting(true)

    try {
      const result = await signUp.attemptEmailAddressVerification({ code: code.trim() })

      if (result.status === 'complete' && result.createdSessionId) {
        await setSignUpActive({ session: result.createdSessionId, redirectUrl: '/' })
        return
      }

      setError('That code did not complete verification. Try again.')
    } catch (verifyError) {
      setError(getErrorMessage(verifyError, 'Unable to verify that code.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGoogle = async () => {
    if (!signInLoaded || !signIn) return

    setError(null)
    setInfo(null)
    setIsSubmitting(true)

    try {
      await signIn.authenticateWithRedirect({
        strategy: 'oauth_google',
        redirectUrl: '/sso-callback',
        redirectUrlComplete: '/',
        continueSignIn: true,
        continueSignUp: true,
      })
    } catch (oauthError) {
      setError(getErrorMessage(oauthError, 'Unable to start Google sign-in right now.'))
      setIsSubmitting(false)
    }
  }

  const renderTopContext = () => {
    if (!heading && !helper) return null

    return (
      <div className="mb-5 text-left">
        {heading ? (
          <h2 className="text-[0.88rem] font-semibold tracking-tight text-white">
            {heading}
          </h2>
        ) : null}
        {helper ? (
          <p className="mt-1.5 text-[0.78rem] leading-5 text-white/64">
            {helper}
          </p>
        ) : null}
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-[388px] text-white">
      {renderTopContext()}

      {currentStep === 'email' ? (
        <form className="space-y-3" onSubmit={handleEmailContinue}>
          <label className="sr-only" htmlFor="auth-email">
            Email
          </label>
          <input
            id="auth-email"
            type="email"
            autoComplete="email"
            inputMode="email"
            value={emailInput}
            onChange={(event) => setEmailInput(event.target.value)}
            className="h-[3.35rem] w-full rounded-[0.85rem] border border-white/78 bg-transparent px-4 text-[0.84rem] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)] outline-none transition-[border-color,box-shadow] placeholder:text-white/66 focus:border-white/90 focus:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.24)]"
            placeholder="Email"
          />

          <AuthActionButton
            type="submit"
            className="border-white bg-white text-[0.84rem] text-black hover:bg-zinc-100"
          >
            Continue
          </AuthActionButton>
        </form>
      ) : null}

      {currentStep === 'password' ? (
        <form className="space-y-3" onSubmit={handlePasswordContinue}>
          <button
            type="button"
            onClick={() => goToStep('email', currentEmail)}
            className="inline-flex items-center gap-2 text-[0.76rem] font-medium text-white/72 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          <div className="space-y-3 pt-1">
            <div className="flex h-[3.35rem] w-full items-center rounded-[0.85rem] border border-white/78 bg-transparent px-4 text-[0.84rem] text-white/92 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]">
              {currentEmail}
            </div>

            <label className="sr-only" htmlFor="auth-password">
              Password
            </label>
            <input
              id="auth-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="h-[3.35rem] w-full rounded-[0.85rem] border border-white/78 bg-transparent px-4 text-[0.84rem] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)] outline-none transition-[border-color,box-shadow] placeholder:text-white/66 focus:border-white/90 focus:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.24)]"
              placeholder="Password"
            />

            <AuthActionButton
              type="submit"
              loading={isSubmitting}
              disabled={!authReady}
              className="border-white bg-white text-[0.84rem] text-black hover:bg-zinc-100"
            >
              Continue
            </AuthActionButton>
          </div>
        </form>
      ) : null}

      {currentStep === 'verify' ? (
        <form className="space-y-3" onSubmit={handleVerify}>
          <button
            type="button"
            onClick={() => goToStep('password', currentEmail)}
            className="inline-flex items-center gap-2 text-[0.76rem] font-medium text-white/72 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          <label className="sr-only" htmlFor="auth-code">
            Verification code
          </label>
          <input
            id="auth-code"
            type="text"
            autoComplete="one-time-code"
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
            className="h-[3.35rem] w-full rounded-[0.85rem] border border-white/78 bg-transparent px-4 text-[0.84rem] tracking-[0.18em] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)] outline-none transition-[border-color,box-shadow] placeholder:text-white/66 focus:border-white/90 focus:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.24)]"
            placeholder="Code"
          />

          <AuthActionButton
            type="submit"
            loading={isSubmitting}
            disabled={!authReady}
            className="border-white bg-white text-[0.84rem] text-black hover:bg-zinc-100"
          >
            Verify email
          </AuthActionButton>
        </form>
      ) : null}

      {error ? (
        <p className="mt-3 text-[0.76rem] leading-5 text-red-300">{error}</p>
      ) : null}

      {info ? (
        <p className="mt-3 text-[0.76rem] leading-5 text-white/72">{info}</p>
      ) : null}

      {currentStep === 'email' ? (
        <>
          <div className="my-7 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/22" />
            <span className="text-[0.64rem] font-medium uppercase tracking-[0.18em] text-white/74">Or</span>
            <div className="h-px flex-1 bg-white/22" />
          </div>

          <AuthActionButton
            onClick={handleGoogle}
            loading={isSubmitting}
            disabled={!authReady}
            className="border-white/78 bg-transparent px-5 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)] hover:border-white/90 hover:bg-white/[0.04]"
          >
            <span className="grid w-full grid-cols-[20px_minmax(0,1fr)_20px] items-center gap-3">
              <span className="inline-flex items-center justify-center">
                <FcGoogle className="h-4.5 w-4.5" />
              </span>
              <span className="text-center text-[0.84rem] font-semibold text-white">
                Continue with Google
              </span>
              <span aria-hidden="true" />
            </span>
          </AuthActionButton>
        </>
      ) : null}
    </div>
  )
}
