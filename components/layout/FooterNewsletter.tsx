'use client'

import { useId, useState, type FormEvent } from 'react'
import { AlertCircle, ArrowRight, Check, Loader2 } from 'lucide-react'
import { newsletterApi, type ApiError } from '@/lib/api'
import { cn } from '@/lib/utils'

type Status = 'idle' | 'loading' | 'success' | 'error'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

interface FooterNewsletterProps {
  className?: string
}

/**
 * Footer newsletter form.
 *
 * The high-contrast footer band is the one place a visitor can subscribe, so
 * the form has to be honest about every state: client validation before the
 * request, a real loading state, the server's success copy, and a recoverable
 * error that never invents a subscription.
 */
export default function FooterNewsletter({ className }: FooterNewsletterProps) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [message, setMessage] = useState('')
  const inputId = useId()
  const messageId = useId()

  function reset() {
    setEmail('')
    setStatus('idle')
    setMessage('')
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (status === 'loading') return

    const value = email.trim()
    if (!EMAIL_PATTERN.test(value)) {
      setStatus('error')
      setMessage('Enter a valid email address, like name@example.com.')
      return
    }

    setStatus('loading')
    setMessage('')

    try {
      const result = await newsletterApi.subscribe(value)
      setStatus('success')
      setMessage(result.message)
    } catch (error) {
      const apiError = error as ApiError
      setStatus('error')
      setMessage(
        apiError?.error ??
          "We couldn't subscribe you just now. Please check your connection and try again.",
      )
    }
  }

  if (status === 'success') {
    return (
      <div
        className={cn(
          'flex min-h-[9.5rem] flex-col justify-center rounded-2xl border border-footer-border bg-white/[0.04] p-6',
          className,
        )}
        role="status"
        aria-live="polite"
      >
        <span className="flex size-10 items-center justify-center rounded-full border border-footer-accent/30 bg-footer-accent/15 text-footer-accent">
          <Check className="size-5" aria-hidden="true" />
        </span>
        <p className="mt-4 text-base font-semibold text-footer-foreground">You&apos;re on the list.</p>
        <p className="mt-1.5 text-sm leading-6 text-footer-muted">{message}</p>
        <button
          type="button"
          onClick={reset}
          className="mt-4 w-fit rounded text-xs font-medium text-footer-accent underline-offset-4 transition-colors hover:text-footer-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-footer-accent focus-visible:ring-offset-2 focus-visible:ring-offset-footer"
        >
          Subscribe another email
        </button>
      </div>
    )
  }

  return (
    <div className={className}>
      <form onSubmit={onSubmit} noValidate aria-label="Newsletter signup">
        <label htmlFor={inputId} className="sr-only">
          Email address
        </label>
        <div className="flex flex-col gap-2 rounded-2xl border border-footer-border bg-white/[0.04] p-2 transition-colors duration-200 focus-within:border-footer-accent/60 sm:flex-row sm:items-center">
          <input
            id={inputId}
            type="email"
            name="email"
            value={email}
            onChange={event => {
              setEmail(event.target.value)
              if (status === 'error') {
                setStatus('idle')
                setMessage('')
              }
            }}
            autoComplete="email"
            inputMode="email"
            placeholder="you@example.com"
            aria-invalid={status === 'error'}
            aria-describedby={message ? messageId : undefined}
            disabled={status === 'loading'}
            className="min-h-11 w-full min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm text-footer-foreground placeholder:text-footer-subtle focus:outline-none disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={status === 'loading'}
            aria-busy={status === 'loading'}
            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-footer-accent px-5 py-2.5 text-sm font-semibold text-footer-accent-foreground transition-all duration-200 ease-out hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-footer-accent focus-visible:ring-offset-2 focus-visible:ring-offset-footer disabled:cursor-not-allowed disabled:opacity-70"
          >
            {status === 'loading' ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                Subscribing…
              </>
            ) : (
              <>
                Subscribe
                <ArrowRight className="size-4" aria-hidden="true" />
              </>
            )}
          </button>
        </div>

        {status === 'error' && message && (
          <p
            id={messageId}
            role="alert"
            className="mt-3 flex items-start gap-2 text-xs leading-5 text-footer-accent"
          >
            <AlertCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
            {message}
          </p>
        )}

        <p className="mt-3 text-[11px] leading-5 text-footer-subtle">
          Occasional notes on celebrations and home care. We only use your address for Heptome
          updates. Read our{' '}
          <a
            href="/privacy"
            className="rounded text-footer-muted underline-offset-4 transition-colors hover:text-footer-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-footer-accent"
          >
            privacy policy
          </a>
          .
        </p>
      </form>
    </div>
  )
}
