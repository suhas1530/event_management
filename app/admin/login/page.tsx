'use client'

import { useState, FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { tokenStore } from '@/lib/api'
import { authApi } from '@/lib/api'
import Logo from '@/components/brand/Logo'
import ThemeToggle from '@/components/ui/ThemeToggle'
import { Eye, EyeOff, ArrowRight, Shield } from 'lucide-react'

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (loading) return
    setError('')
    setLoading(true)
    try {
      const res = await authApi.adminLogin({ email, password })
      tokenStore.setAdmin(res.accessToken)
      tokenStore.setAdminRefresh(res.refreshToken)
      router.push('/admin/dashboard')
    } catch (err: unknown) {
      setError((err as { error?: string })?.error ?? 'Invalid credentials')
      setLoading(false)
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-background px-6">
      <div className="absolute right-4 top-4 sm:right-6 sm:top-6">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-[380px]">
        <Logo size="md" tone="dark" className="mb-10" />

        <div className="mb-6 flex items-center gap-3">
          <div className="flex size-10 items-center justify-center border border-primary/30 bg-primary/10">
            <Shield className="size-5 text-primary" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-gold-text">Admin portal</p>
            <h1 className="font-serif text-3xl text-foreground">Sign in</h1>
          </div>
        </div>

        {error && (
          <div className="mb-5 border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-500 dark:text-red-400" role="alert">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label htmlFor="admin-email" className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Email</label>
            <input id="admin-email" type="email" value={email} onChange={e => setEmail(e.target.value)} required
              placeholder="admin@avan.events" autoComplete="email"
              className="border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/70 focus:border-ring focus:outline-none" />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="admin-password" className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Password</label>
            <div className="relative">
              <input id="admin-password" type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required
                placeholder="Admin password" autoComplete="current-password"
                className="w-full border border-border bg-card px-4 py-3 pr-11 text-sm text-foreground placeholder:text-muted-foreground/70 focus:border-ring focus:outline-none" />
              <button type="button" onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={showPw ? 'Hide password' : 'Show password'}
                aria-pressed={showPw}
                aria-controls="admin-password">
                {showPw ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
              </button>
            </div>
          </div>
          <button type="submit" disabled={loading}
            className="group flex items-center justify-center gap-3 bg-[#d5ae79] py-3.5 text-[10px] uppercase tracking-[0.2em] text-[#17151d] transition hover:bg-[#e8cfa9] disabled:opacity-50">
            {loading ? 'Signing in…' : <><span>Access admin panel</span><ArrowRight className="size-4 transition group-hover:translate-x-1" /></>}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link href="/" className="text-xs text-muted-foreground hover:text-foreground">← Back to site</Link>
        </div>
      </div>
    </main>
  )
}
