'use client'

import { useState, FormEvent } from 'react'
import Link from 'next/link'
import { authApi } from '@/lib/api'
import AuthPoweredBy from '@/components/brand/AuthPoweredBy'
import Logo from '@/components/brand/Logo'
import { ArrowRight, ArrowLeft, Check } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await authApi.forgotPassword(email)
      setSent(true)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-[380px]">
        <Logo size="md" tone="dark" className="mb-10" />

        {sent ? (
          <div className="text-center">
            <div className="mx-auto mb-6 flex size-14 items-center justify-center rounded-full border border-primary/40 bg-primary/10">
              <Check className="size-6 text-primary" />
            </div>
            <h1 className="mb-3 font-serif text-3xl text-foreground">Check your inbox</h1>
            <p className="text-sm leading-6 text-muted-foreground">
              If an account exists for <span className="text-foreground/90">{email}</span>, we've sent a password reset link.
            </p>
            <Link href="/login" className="mt-8 flex items-center justify-center gap-2 text-xs uppercase tracking-[0.2em] text-primary hover:underline">
              <ArrowLeft className="size-3" /> Back to sign in
            </Link>
          </div>
        ) : (
          <>
            <p className="mb-2 text-[10px] uppercase tracking-[0.3em] text-gold-text">Account recovery</p>
            <h1 className="mb-3 font-serif text-4xl text-foreground">Forgot password?</h1>
            <p className="mb-8 text-sm leading-6 text-muted-foreground">
              Enter your email and we'll send you a reset link.
            </p>

            {error && <div className="mb-4 border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>}

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label htmlFor="reset-email" className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Email address</label>
                <input id="reset-email" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com"
                  className="border border-border bg-muted/60 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/80 focus:border-ring focus:outline-none" />
              </div>
              <button type="submit" disabled={loading}
                className="group flex items-center justify-center gap-3 bg-primary py-3.5 text-[10px] uppercase tracking-[0.2em] text-primary-foreground transition hover:bg-primary-hover disabled:opacity-50">
                {loading ? 'Sending…' : <><span>Send reset link</span><ArrowRight className="size-4 transition group-hover:translate-x-1" /></>}
              </button>
            </form>

            <div className="mt-6 text-center">
              <Link href="/login" className="flex items-center justify-center gap-2 text-xs text-muted-foreground hover:text-gold-text">
                <ArrowLeft className="size-3" /> Back to sign in
              </Link>
            </div>
          </>
        )}

        <AuthPoweredBy />
      </div>
    </main>
  )
}
