'use client'

import { useState, type FormEvent } from 'react'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { contactApi } from '@/lib/api'
import { cn } from '@/lib/utils'

export type PartnerTheme = 'dark' | 'ivory'

interface PartnerApplicationFormProps {
  /** What we're asking for, e.g. "Which services do you offer?" */
  roleLabel: string
  roles: string[]
  /** Free-text prompt for coverage, portfolio or availability. */
  detailLabel: string
  detailPlaceholder: string
  theme?: PartnerTheme
}

/**
 * Partner application form.
 *
 * There is no dedicated partner-application endpoint yet, so this posts to the
 * contact API with `topic: 'partnership'` and packs the structured answers into
 * the message body. That is a documented gap: the team receives these as
 * enquiries today, and a first-class partner pipeline is a backend follow-up.
 *
 * It never claims a submission is approved, verified or onboarded — only that
 * it was received, which is all the backend can truthfully guarantee.
 */
export default function PartnerApplicationForm({
  roleLabel,
  roles,
  detailLabel,
  detailPlaceholder,
  theme = 'dark',
}: PartnerApplicationFormProps) {
  const ivory = theme === 'ivory'
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    city: '',
    role: '',
    experience: '',
    detail: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  const fieldClass = ivory
    ? 'w-full border border-hept-line bg-card px-4 py-3 text-sm text-hept-charcoal placeholder:text-[#9a95a5] outline-none transition focus:border-hept-purple'
    : 'w-full border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/80 outline-none transition focus:border-champagne'
  const labelClass = ivory ? 'mb-2 block text-xs font-medium text-hept-charcoal' : 'mb-2 block text-xs font-medium text-foreground/90'
  const headingClass = ivory ? 'font-display text-xl font-semibold text-hept-charcoal' : 'font-display text-xl font-semibold text-slate-50'

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm(current => ({ ...current, [key]: value }))
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    if (!form.name.trim() || !form.role || !form.city.trim()) {
      setError('Add your name, the work you do and your city so the team can route your application.')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setError('Enter a valid email address.')
      return
    }
    if (form.phone.replace(/\D/g, '').length < 10) {
      setError('Enter a phone number with at least 10 digits.')
      return
    }

    const message = [
      `Role: ${form.role}`,
      `City: ${form.city.trim()}`,
      form.experience.trim() ? `Experience: ${form.experience.trim()}` : '',
      form.detail.trim() ? `Details: ${form.detail.trim()}` : '',
    ]
      .filter(Boolean)
      .join('\n')

    setSubmitting(true)
    try {
      await contactApi.send({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        topic: 'partnership',
        message,
      })
      setSent(true)
    } catch (err) {
      setError(
        (err as { error?: string })?.error ??
          'We could not send your application just now. Please try again, or call the team directly.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  if (sent) {
    return (
      <div className={cn('p-8', ivory ? 'panel-ivory' : 'border border-white/10 bg-ink-900/60')}>
        <CheckCircle2 className={cn('size-8', ivory ? 'text-accent' : 'text-champagne')} aria-hidden="true" />
        <h2 className={cn('mt-4', headingClass)}>Application received</h2>
        <p className={cn('mt-3 text-sm leading-6', ivory ? 'surface-ivory-muted' : 'text-fg-dim')}>
          Thank you, {form.name.split(' ')[0] || 'there'}. Your details are with the Heptome team, who review
          every application before contacting anyone — we reply to {form.email.trim()} within one business
          day. Nothing has been approved yet, so keep an eye on that inbox.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className={cn('p-6 sm:p-8', ivory ? 'panel-ivory' : 'border border-white/10 bg-ink-900/60')}>
      <h2 className={headingClass}>Apply to join</h2>
      <p className={cn('mt-2 text-sm leading-6', ivory ? 'surface-ivory-muted' : 'text-fg-dim')}>
        Ten fields, two minutes. The team reviews every application — this is not an instant sign-up.
      </p>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <label className="block">
          <span className={labelClass}>Full name</span>
          <input className={fieldClass} value={form.name} onChange={event => set('name', event.target.value)} placeholder="Your name" required />
        </label>
        <label className="block">
          <span className={labelClass}>Phone</span>
          <input className={fieldClass} value={form.phone} onChange={event => set('phone', event.target.value)} inputMode="tel" placeholder="10-digit mobile number" required />
        </label>
        <label className="block">
          <span className={labelClass}>Email</span>
          <input className={fieldClass} type="email" value={form.email} onChange={event => set('email', event.target.value)} placeholder="you@example.com" required />
        </label>
        <label className="block">
          <span className={labelClass}>City you work in</span>
          <input className={fieldClass} value={form.city} onChange={event => set('city', event.target.value)} placeholder="For example, Bengaluru" required />
        </label>
        <label className="block">
          <span className={labelClass}>{roleLabel}</span>
          <select className={fieldClass} value={form.role} onChange={event => set('role', event.target.value)} required>
            <option value="">Choose one</option>
            {roles.map(role => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className={labelClass}>Experience</span>
          <input className={fieldClass} value={form.experience} onChange={event => set('experience', event.target.value)} placeholder="For example, 6 years" />
        </label>
        <label className="block sm:col-span-2">
          <span className={labelClass}>{detailLabel}</span>
          <textarea
            className={cn(fieldClass, 'min-h-32 resize-y')}
            value={form.detail}
            onChange={event => set('detail', event.target.value)}
            placeholder={detailPlaceholder}
          />
        </label>
      </div>

      {error && (
        <p role="alert" className={cn('mt-5 border px-4 py-3 text-sm', ivory ? 'border-[#a4341f]/25 bg-[#a4341f]/5 text-[#a4341f]' : 'border-red-400/20 bg-red-400/5 text-red-300')}>
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className={cn(
          'mt-6 inline-flex min-h-12 items-center gap-2.5 px-6 py-3.5 text-sm font-semibold disabled:opacity-60',
          ivory
            ? 'btn-heptome text-foreground focus-ring-ivory'
            : 'border border-champagne/45 bg-champagne/15 text-champagne-light transition-colors hover:bg-champagne hover:text-ink-950',
        )}
      >
        {submitting && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
        Send application
      </button>

      <p className={cn('mt-4 text-xs leading-5', ivory ? 'surface-ivory-muted' : 'text-fg-mute')}>
        Your number and email are used to reach you about this application only.
      </p>
    </form>
  )
}
