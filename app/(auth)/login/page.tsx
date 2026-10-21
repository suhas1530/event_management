'use client'

import { useEffect, useState, FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { useToast } from '@/app/providers'
import { tokenStore } from '@/lib/api'
import { readRedirectParam } from '@/lib/redirect'
import { brand, verticals } from '@/lib/brand'
import Logo from '@/components/brand/Logo'
import AuthPoweredBy from '@/components/brand/AuthPoweredBy'
import { Eye, EyeOff, ArrowRight } from 'lucide-react'

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
  /**
   * Read from the live query string rather than `useSearchParams()` so the page
   * keeps prerendering; it is only needed once the customer submits.
   */
  const [redirectTo, setRedirectTo] = useState<string | null>(null)

  useEffect(() => {
    setRedirectTo(readRedirectParam(window.location.search))
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      toast('Welcome back!', 'success')
      // A pending booking wins over the role's default landing page.
      const target = readRedirectParam(window.location.search)
      if (target) {
        router.push(target)
        return
      }
      // Otherwise send each role to the area it actually works in.
      const token = tokenStore.get()
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
    <main className="flex min-h-screen bg-background">
      {/* Left decorative panel */}
      <div className="relative hidden w-1/2 overflow-hidden lg:block">
        <img
          src="https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1400&q=85"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0b0b0d]/90 via-[#0b0b0d]/50 to-transparent" />
        <div className="absolute inset-0 flex flex-col justify-between p-14">
          <Logo size="md" tone="dark" />
          <div>
            <p className="font-serif text-5xl leading-tight text-[#f7f5fa]">
              Celebrate every<br />moment.<br />
              <em className="font-light text-champagne">Care for every corner.</em>
            </p>
            <p className="mt-4 text-sm leading-6 text-white/70">{brand.heroSupport}</p>
            <div className="mt-8 flex flex-col gap-2.5">
              {[
                verticals.events.description,
                verticals.home.description,
                'One account for both — no second sign-up',
              ].map(f => (
                <div key={f} className="flex items-start gap-2.5 text-sm text-white/65">
                  <div className="mt-2 size-1.5 shrink-0 rounded-full bg-champagne" />
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
          <Logo size="sm" tone="dark" className="mb-10 lg:hidden" />

          <p className="mb-2 text-[10px] uppercase tracking-[0.3em] text-gold-text">
            {redirectTo ? 'Almost there' : 'Welcome back'}
          </p>
          <h1 className="mb-2 font-serif text-4xl text-foreground">Sign in</h1>

          {redirectTo && (
            <p className="mb-6 border border-primary/30 bg-primary/10 px-4 py-3 text-sm leading-6 text-white/70">
              Sign in to finish what you started — we'll take you straight back.
            </p>
          )}

          <p className="mb-8 text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link
              href={redirectTo ? `/register?redirect=${encodeURIComponent(redirectTo)}` : '/register'}
              className="text-gold-text hover:underline"
            >
              Create one
            </Link>
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground/90"
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                  aria-pressed={showPw}
                  aria-controls="login-password"
                >
                  {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </Field>

            <div className="flex justify-end">
              <Link href="/forgot-password" className="text-xs text-muted-foreground hover:text-gold-text">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group flex items-center justify-center gap-3 bg-primary py-3.5 text-[11px] uppercase tracking-[0.2em] text-primary-foreground transition hover:bg-primary-hover disabled:opacity-50"
            >
              {loading ? 'Signing in…' : (
                <>Sign in <ArrowRight className="size-4 transition group-hover:translate-x-1" /></>
              )}
            </button>
          </form>

          {/* Dividers */}
          <div className="my-6 flex items-center gap-4">
            <div className="flex-1 border-t border-border" />
            <span className="text-xs text-muted-foreground/80">or continue as</span>
            <div className="flex-1 border-t border-border" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Link href="/register?role=customer"
              className="flex items-center justify-center gap-2 border border-border py-3 text-[10px] uppercase tracking-[0.15em] text-muted-foreground transition hover:border-primary/50 hover:text-primary">
              Customer
            </Link>
            <Link href="/admin/login"
              className="flex items-center justify-center gap-2 border border-border py-3 text-[10px] uppercase tracking-[0.15em] text-muted-foreground transition hover:border-primary/50 hover:text-primary">
              Admin
            </Link>
          </div>
        </div>

        <AuthPoweredBy />
      </div>

      <style>{`
        .input-field {
          width: 100%;
          border: 1px solid var(--border);
          background: var(--card);
          padding: .75rem 1rem;
          font-size: .875rem;
          color: var(--foreground);
        }
        .input-field::placeholder { color: var(--muted-foreground); }
        .input-field:focus { outline: none; border-color: var(--ring); }
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
      <label htmlFor={htmlFor} className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  )
}
