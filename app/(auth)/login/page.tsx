'use client'

import { useState, FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { useToast } from '@/app/providers'
import AuthPoweredBy from '@/components/brand/AuthPoweredBy'
import { Eye, EyeOff, ArrowRight, Wrench } from 'lucide-react'

function roleRedirect(role: string): string {
  if (role === 'ADMIN' || role === 'SUPER_ADMIN') return '/admin/dashboard'
  if (role === 'TECHNICIAN') return '/technician/dashboard'
  if (role === 'EVENT_MANAGER') return '/admin/dashboard'
  return '/dashboard'
}

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const { toast } = useToast()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      toast('Welcome back!', 'success')
      // Get role from token to redirect correctly
      const token = localStorage.getItem('avan_access_token')
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]))
          router.push(roleRedirect(payload.role))
          return
        } catch {}
      }
      router.push('/dashboard')
    } catch (err: unknown) {
      const msg = (err as { error?: string })?.error ?? 'Login failed. Please check your credentials.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen bg-[#0b0b0d]">
      {/* Left decorative panel */}
      <div className="relative hidden w-1/2 overflow-hidden lg:block">
        <img
          src="https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1400&q=85"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0b0b0d]/85 via-[#0b0b0d]/40 to-transparent" />
        <div className="absolute inset-0 flex flex-col justify-between p-14">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center bg-[#d7b98b]">
              <Wrench className="size-4 text-[#0b0b0d]" />
            </div>
            <span className="font-serif text-2xl text-white">avān<span className="text-[#d7b98b]">.</span></span>
          </Link>
          <div>
            <p className="font-serif text-5xl leading-tight text-white">
              Book trusted<br />professionals &<br />
              <em className="font-light text-[#d7b98b]">plan events.</em>
            </p>
            <p className="mt-4 text-sm leading-6 text-white/50">
              Everything from a leaking tap to your dream wedding — on one platform.
            </p>
            <div className="mt-8 flex flex-col gap-2.5">
              {['Verified professionals', 'Real-time tracking', 'Secure payments', 'AI event designer'].map(f => (
                <div key={f} className="flex items-center gap-2.5 text-sm text-white/60">
                  <div className="size-1.5 rounded-full bg-[#d7b98b]" />
                  {f}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right — form */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-16">
        <div className="w-full max-w-[400px]">
          {/* Mobile logo */}
          <Link href="/" className="mb-10 flex items-center gap-2 lg:hidden">
            <div className="flex size-7 items-center justify-center bg-[#d7b98b]">
              <Wrench className="size-3.5 text-[#0b0b0d]" />
            </div>
            <span className="font-serif text-xl text-white">avān<span className="text-[#d7b98b]">.</span></span>
          </Link>

          <p className="mb-2 text-[10px] uppercase tracking-[0.3em] text-[#d7b98b]">Welcome back</p>
          <h1 className="mb-2 font-serif text-4xl text-white">Sign in</h1>
          <p className="mb-8 text-sm text-white/40">
            Don't have an account?{' '}
            <Link href="/register" className="text-[#d7b98b] hover:underline">Create one</Link>
          </p>

          {error && (
            <div className="mb-5 border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <Field label="Email address" htmlFor="login-email">
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@example.com"
                className="input-field"
              />
            </Field>

            <Field label="Password" htmlFor="login-password">
              <div className="relative">
                <input
                  id="login-password"
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="Your password"
                  className="input-field pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70"
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                  aria-pressed={showPw}
                  aria-controls="login-password"
                >
                  {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </Field>

            <div className="flex justify-end">
              <Link href="/forgot-password" className="text-xs text-white/40 hover:text-[#d7b98b]">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group flex items-center justify-center gap-3 bg-[#d7b98b] py-3.5 text-[11px] uppercase tracking-[0.2em] text-[#1c1915] transition hover:bg-[#e8cfa0] disabled:opacity-50"
            >
              {loading ? 'Signing in…' : (
                <>Sign in <ArrowRight className="size-4 transition group-hover:translate-x-1" /></>
              )}
            </button>
          </form>

          {/* Dividers */}
          <div className="my-6 flex items-center gap-4">
            <div className="flex-1 border-t border-white/10" />
            <span className="text-xs text-white/30">or continue as</span>
            <div className="flex-1 border-t border-white/10" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Link href="/register?role=customer"
              className="flex items-center justify-center gap-2 border border-white/15 py-3 text-[10px] uppercase tracking-[0.15em] text-white/50 transition hover:border-[#d7b98b]/50 hover:text-[#d7b98b]">
              Customer
            </Link>
            <Link href="/admin/login"
              className="flex items-center justify-center gap-2 border border-white/15 py-3 text-[10px] uppercase tracking-[0.15em] text-white/50 transition hover:border-[#d7b98b]/50 hover:text-[#d7b98b]">
              Admin
            </Link>
          </div>
        </div>

        <AuthPoweredBy />
      </div>

      <style>{`
        .input-field {
          width: 100%;
          border: 1px solid rgba(255,255,255,.15);
          background: rgba(255,255,255,.05);
          padding: .75rem 1rem;
          font-size: .875rem;
          color: #fff;
        }
        .input-field::placeholder { color: rgba(255,255,255,.3); }
        .input-field:focus { outline: none; border-color: #d7b98b; }
      `}</style>
    </main>
  )
}

/**
 * `htmlFor` is required, not optional: a `<label>` that merely sits above its
 * input is not associated with it, so screen readers announce an unlabelled
 * field. Pairing the label with an explicit `id` is the only reliable fix.
 */
function Field({
  label,
  htmlFor,
  children,
}: {
  label: string
  htmlFor: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={htmlFor} className="text-[10px] uppercase tracking-[0.2em] text-white/50">
        {label}
      </label>
      {children}
    </div>
  )
}
