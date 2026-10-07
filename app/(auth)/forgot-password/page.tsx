'use client'

import { useState, FormEvent } from 'react'
import Link from 'next/link'
import { authApi } from '@/lib/api'
import AuthPoweredBy from '@/components/brand/AuthPoweredBy'
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
    <main className="flex min-h-screen items-center justify-center bg-[#0b0b0d] px-6">
      <div className="w-full max-w-[380px]">
        <Link href="/" className="mb-10 block font-serif text-2xl text-white">
          avān<span className="text-[#d7b98b]">.</span>
        </Link>

        {sent ? (
          <div className="text-center">
            <div className="mx-auto mb-6 flex size-14 items-center justify-center border border-[#d7b98b]/40 bg-[#d7b98b]/10">
              <Check className="size-6 text-[#d7b98b]" />
            </div>
            <h1 className="mb-3 font-serif text-3xl text-white">Check your inbox</h1>
            <p className="text-sm leading-6 text-white/50">
              If an account exists for <span className="text-white/80">{email}</span>, we've sent a password reset link.
            </p>
            <Link href="/login" className="mt-8 flex items-center justify-center gap-2 text-xs uppercase tracking-[0.2em] text-[#d7b98b] hover:underline">
              <ArrowLeft className="size-3" /> Back to sign in
            </Link>
          </div>
        ) : (
          <>
            <p className="mb-2 text-[10px] uppercase tracking-[0.3em] text-[#d7b98b]">Account recovery</p>
            <h1 className="mb-3 font-serif text-4xl text-white">Forgot password?</h1>
            <p className="mb-8 text-sm leading-6 text-white/50">
              Enter your email and we'll send you a reset link.
            </p>

            {error && <div className="mb-4 border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>}

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label htmlFor="reset-email" className="text-[10px] uppercase tracking-[0.2em] text-white/50">Email address</label>
                <input id="reset-email" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com"
                  className="border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-[#d7b98b] focus:outline-none" />
              </div>
              <button type="submit" disabled={loading}
                className="group flex items-center justify-center gap-3 bg-[#d7b98b] py-3.5 text-[10px] uppercase tracking-[0.2em] text-[#1c1915] transition hover:bg-[#e8cfa0] disabled:opacity-50">
                {loading ? 'Sending…' : <><span>Send reset link</span><ArrowRight className="size-4 transition group-hover:translate-x-1" /></>}
              </button>
            </form>

            <div className="mt-6 text-center">
              <Link href="/login" className="flex items-center justify-center gap-2 text-xs text-white/40 hover:text-[#d7b98b]">
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
