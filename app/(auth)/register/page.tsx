'use client'

import { useState, FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { useToast } from '@/app/providers'
import { readRedirectParam } from '@/lib/redirect'
import AuthPoweredBy from '@/components/brand/AuthPoweredBy'
import Logo from '@/components/brand/Logo'
import { Eye, EyeOff, ArrowRight, Check } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  const { register } = useAuth()
  const { toast } = useToast()
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }))

  const pw = form.password
  const pwRules = [
    { ok: pw.length >= 8, label: 'At least 8 characters' },
    { ok: /[A-Z]/.test(pw), label: 'One uppercase letter' },
    { ok: /[a-z]/.test(pw), label: 'One lowercase letter' },
    { ok: /[0-9]/.test(pw), label: 'One number' },
  ]

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirmPassword) { setError('Passwords do not match'); return }
    if (pwRules.some(r => !r.ok)) { setError('Password does not meet requirements'); return }
    setLoading(true)
    try {
      await register({ name: form.name, email: form.email, phone: form.phone || undefined, password: form.password })
      toast('Account created — welcome to Heptome.', 'success')
      // Return to whatever the customer was doing before they were asked to sign up.
      router.push(readRedirectParam(window.location.search) ?? '/dashboard')
    } catch (err: unknown) {
      setError((err as { error?: string })?.error ?? 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen bg-background">
      {/* Left panel */}
      <div className="relative hidden w-1/2 overflow-hidden lg:block">
        <img
          src="https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1400&q=85"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0b0b0d]/85 via-[#0b0b0d]/40 to-transparent" />
        <div className="absolute inset-0 flex flex-col justify-between p-14">
          <Logo size="md" tone="dark" />
          <div>
            <p className="font-serif text-5xl leading-tight text-[#f7f5fa]">
              One account for<br />
              <em className="font-light text-champagne">every moment and corner.</em>
            </p>
            <div className="mt-8 flex flex-col gap-3">
              {[
                'Plan events — venues, décor, catering and photographers',
                'Book slot-based home services in Bengaluru',
                'Track every request and booking in one dashboard',
                'Nothing is charged until you confirm',
              ].map(f => (
                <div key={f} className="flex items-center gap-3 text-sm text-white/65">
                  <div className="flex size-5 flex-shrink-0 items-center justify-center border border-champagne/50 text-champagne">
                    <Check className="size-3" />
                  </div>
                  {f}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right — form */}
      <div className="flex flex-1 flex-col items-center justify-center overflow-y-auto px-6 py-12">
        <div className="w-full max-w-[420px]">
          <Logo size="sm" tone="dark" className="mb-8 lg:hidden" />

          <p className="mb-2 text-[10px] uppercase tracking-[0.3em] text-gold-text">Get started free</p>
          <h1 className="mb-2 font-serif text-4xl text-foreground">Create account</h1>
          <p className="mb-7 text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="text-gold-text hover:underline">Sign in</Link>
          </p>

          {error && (
            <div className="mb-5 border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <Field label="Full name" htmlFor="reg-name">
              <input id="reg-name" type="text" value={form.name} onChange={set('name')} required
                placeholder="Suhas Reddy" autoComplete="name" className="input-field" />
            </Field>

            <Field label="Email address" htmlFor="reg-email">
              <input id="reg-email" type="email" value={form.email} onChange={set('email')} required
                placeholder="you@example.com" autoComplete="email" className="input-field" />
            </Field>

            <Field label="Phone number (optional)" htmlFor="reg-phone">
              <input id="reg-phone" type="tel" value={form.phone} onChange={set('phone')}
                placeholder="+91 98765 43210" autoComplete="tel" className="input-field" />
            </Field>

            <Field label="Password" htmlFor="reg-password">
              <div className="relative">
                <input id="reg-password" type={showPw ? 'text' : 'password'} value={form.password} onChange={set('password')}
                  required placeholder="Create a strong password" autoComplete="new-password"
                  className="input-field pr-11" />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground/90"
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                  aria-pressed={showPw}
                  aria-controls="reg-password">
                  {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {pw.length > 0 && (
                <div className="mt-2 grid grid-cols-2 gap-1.5">
                  {pwRules.map(r => (
                    <div key={r.label} className={`flex items-center gap-1.5 text-[10px] ${r.ok ? 'text-[#4ade80]' : 'text-muted-foreground/80'}`}>
                      <div className={`size-1.5 rounded-full ${r.ok ? 'bg-[#4ade80]' : ''}`} />
                      {r.label}
                    </div>
                  ))}
                </div>
              )}
            </Field>

            <Field label="Confirm password" htmlFor="reg-confirm">
              <input id="reg-confirm" type="password" value={form.confirmPassword} onChange={set('confirmPassword')}
                required placeholder="Repeat your password" autoComplete="new-password" className="input-field" />
            </Field>

            <button type="submit" disabled={loading}
              className="group mt-1 flex items-center justify-center gap-3 bg-primary py-3.5 text-[11px] uppercase tracking-[0.2em] text-primary-foreground transition hover:bg-primary-hover disabled:opacity-50">
              {loading ? 'Creating account…' : (
                <>Create account <ArrowRight className="size-4 transition group-hover:translate-x-1" /></>
              )}
            </button>
          </form>

          <p className="mt-5 text-center text-xs text-muted-foreground/80">
            By registering you agree to our{' '}
            <Link href="/terms" className="text-muted-foreground hover:text-gold-text">Terms</Link>
            {' '}and{' '}
            <Link href="/privacy" className="text-muted-foreground hover:text-gold-text">Privacy Policy</Link>.
          </p>
        </div>

        <AuthPoweredBy />
      </div>

      <style>{`
        .input-field { width:100%; border:1px solid var(--border); background:var(--card); padding:.75rem 1rem; font-size:.875rem; color:var(--foreground); }
        .input-field::placeholder { color: var(--muted-foreground); }
        .input-field:focus { outline: none; border-color: var(--ring); }
      `}</style>
    </main>
  )
}

/** `htmlFor` is required — see the note in the matching `Field` on /login. */
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
