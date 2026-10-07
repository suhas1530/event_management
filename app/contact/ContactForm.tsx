'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  MessageSquare,
  Phone,
  Send,
  Sparkles,
  Wrench,
} from 'lucide-react'
import { PageHeader, buttonClass } from '@/components/shared/Primitives'
import { contactApi } from '@/lib/api'
import { siteConfig } from '@/lib/site-config'
import { useToast } from '@/components/ui/Toast'
import { cn } from '@/lib/utils'

const TOPICS = [
  { value: 'technician', label: 'Home services', icon: Wrench },
  { value: 'event', label: 'Event planning', icon: Sparkles },
  { value: 'billing', label: 'Billing or payment', icon: MessageSquare },
  { value: 'partnership', label: 'Partnership', icon: CheckCircle2 },
  { value: 'other', label: 'Something else', icon: MessageSquare },
] as const

interface FormState {
  name: string
  email: string
  phone: string
  topic: (typeof TOPICS)[number]['value']
  message: string
}

const EMPTY: FormState = { name: '', email: '', phone: '', topic: 'technician', message: '' }

type Errors = Partial<Record<keyof FormState, string>>

function validate(form: FormState): Errors {
  const errors: Errors = {}
  if (form.name.trim().length < 2) errors.name = 'Please enter your name.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim())) errors.email = 'Enter a valid email address.'
  if (form.phone.trim() && form.phone.trim().replace(/\D/g, '').length < 7) errors.phone = 'Enter a valid phone number.'
  if (form.message.trim().length < 10) errors.message = 'Tell us a little more — at least 10 characters.'
  return errors
}

export default function ContactForm() {
  const { toast } = useToast()
  const [form, setForm] = useState<FormState>(EMPTY)
  const [errors, setErrors] = useState<Errors>({})
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState<string | null>(null)

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm(prev => ({ ...prev, [key]: value }))
    // Clear the field error as soon as the user starts fixing it.
    setErrors(prev => (prev[key] ? { ...prev, [key]: undefined } : prev))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const found = validate(form)
    setErrors(found)
    if (Object.keys(found).length > 0) {
      // Move focus to the first invalid field for keyboard/AT users.
      const first = document.querySelector<HTMLElement>('[aria-invalid="true"]')
      first?.focus()
      return
    }

    setSubmitting(true)
    try {
      const res = await contactApi.send({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        topic: form.topic,
        message: form.message.trim(),
      })
      setSent(res.id)
      setForm(EMPTY)
      toast('Message sent. We will be in touch shortly.', 'success')
    } catch (err) {
      toast(
        (err as { error?: string })?.error ?? 'We could not send your message. Please try again.',
        'error'
      )
    } finally {
      setSubmitting(false)
    }
  }

  const channels = [
    {
      icon: Mail,
      label: 'Email us',
      value: siteConfig.contact.email,
      href: `mailto:${siteConfig.contact.email}`,
    },
    {
      icon: Phone,
      label: 'Call us',
      value: siteConfig.contact.phone,
      href: siteConfig.contact.phoneHref,
    },
    {
      icon: MessageCircle,
      label: 'WhatsApp',
      value: siteConfig.contact.phone,
      href: siteConfig.contact.whatsappHref,
    },
    {
      icon: Clock,
      label: 'Support hours',
      value: siteConfig.contact.supportHours,
    },
    {
      icon: MapPin,
      label: 'Service area',
      value: 'Pan-India · On-site service',
    },
  ]

  return (
    <>
      <PageHeader
        eyebrow="Contact"
        title="Tell us what you need"
        description="Whether it is a technician for tomorrow morning or an event six months out, we will route your message to the right person."
      />

        <div className="mt-14 grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:gap-12">
          {/* ── Form ────────────────────────────────────────────────────── */}
          <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-6 sm:p-8">
            {sent ? (
              <div className="flex flex-col items-center py-10 text-center">
                <SuccessIcon />
                <h2 className="mt-6 text-balance font-serif text-2xl text-white">Message received.</h2>
                <p className="mt-3 max-w-sm text-pretty text-sm leading-6 text-white/50">
                  Your enquiry reference is{' '}
                  <span className="font-medium text-primary">{sent.slice(-8).toUpperCase()}</span>. Our team
                  will respond within one business day.
                </p>
                <button
                  type="button"
                  onClick={() => setSent(null)}
                  className={buttonClass('secondary', 'md', 'mt-8')}
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate>
                <h2 className="text-lg font-medium text-white/90">Send us a message</h2>
                <p className="mt-1.5 text-sm text-white/40">All fields marked * are required.</p>

                {/* Topic */}
                <fieldset className="mt-7">
                  <legend className="text-label text-white/45">What is this about?</legend>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {TOPICS.map(({ value, label, icon: Icon }) => (
                      <label
                        key={value}
                        className={cn(
                          'inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3.5 py-2 text-sm transition-all duration-200 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring',
                          form.topic === value
                            ? 'border-primary/60 bg-primary/10 text-primary'
                            : 'border-white/12 text-white/60 hover:border-white/25 hover:text-white'
                        )}
                      >
                        <input
                          type="radio"
                          name="topic"
                          value={value}
                          checked={form.topic === value}
                          onChange={() => update('topic', value)}
                          className="sr-only"
                        />
                        <Icon className="size-4" aria-hidden="true" />
                        {label}
                      </label>
                    ))}
                  </div>
                </fieldset>

                {/* Name + email */}
                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  <Field
                    id="name"
                    label="Full name"
                    required
                    error={errors.name}
                    value={form.name}
                    onChange={v => update('name', v)}
                    autoComplete="name"
                    placeholder="Priya Sharma"
                  />
                  <Field
                    id="email"
                    label="Email address"
                    type="email"
                    required
                    error={errors.email}
                    value={form.email}
                    onChange={v => update('email', v)}
                    autoComplete="email"
                    placeholder="you@example.com"
                  />
                </div>

                {/* Phone */}
                <div className="mt-5">
                  <Field
                    id="phone"
                    label="Phone number"
                    type="tel"
                    error={errors.phone}
                    value={form.phone}
                    onChange={v => update('phone', v)}
                    autoComplete="tel"
                    placeholder="+91 98765 43210"
                    hint="Optional — helps us reach you faster."
                  />
                </div>

                {/* Message */}
                <div className="mt-5">
                  <label htmlFor="message" className="text-label text-white/45">
                    Message<span className="ml-1 text-primary">*</span>
                  </label>
                  <textarea
                    id="message"
                    rows={5}
                    value={form.message}
                    onChange={e => update('message', e.target.value)}
                    aria-invalid={errors.message ? 'true' : undefined}
                    aria-describedby={errors.message ? 'message-error' : 'message-hint'}
                    placeholder="Tell us about your requirement, preferred dates, or anything else we should know."
                    className={cn(
                      'mt-2 w-full resize-y rounded-lg border bg-white/[0.03] px-4 py-3 text-sm leading-6 text-white placeholder:text-white/25 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/25',
                      errors.message
                        ? 'border-red-400/60 focus:border-red-400'
                        : 'border-white/12 focus:border-primary/60'
                    )}
                  />
                  {errors.message ? (
                    <p id="message-error" role="alert" className="mt-1.5 flex items-center gap-1.5 text-xs text-red-300">
                      <AlertCircle className="size-3.5" aria-hidden="true" />
                      {errors.message}
                    </p>
                  ) : (
                    <p id="message-hint" className="mt-1.5 text-xs text-white/30">
                      The more detail you share, the faster we can help.
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className={buttonClass('primary', 'lg', 'mt-7 w-full sm:w-auto')}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                      Sending…
                    </>
                  ) : (
                    <>
                      <Send className="size-4" aria-hidden="true" />
                      Send message
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* ── Channels ────────────────────────────────────────────────── */}
          <aside className="space-y-6">
            <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-6 sm:p-7">
              <h2 className="text-lg font-medium text-white/90">Reach us directly</h2>
              <p className="mt-1.5 text-sm leading-6 text-white/40">
                Prefer to skip the form? Our support desk is available during working hours.
              </p>
              <ul className="mt-6 space-y-5">
                {channels.map(({ icon: Icon, label, value, href }) => (
                  <li key={label} className="flex gap-4">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-primary">
                      <Icon className="size-[18px]" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-label text-white/35">{label}</p>
                      {href ? (
                        <a
                          href={href}
                          className="mt-1 block truncate text-[0.9375rem] text-white/80 transition-colors duration-200 hover:text-primary focus-visible:outline-none focus-visible:text-primary"
                        >
                          {value}
                        </a>
                      ) : (
                        <p className="mt-1 text-[0.9375rem] text-white/80">{value}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-primary/20 bg-primary/[0.06] p-6 sm:p-7">
              <h2 className="text-base font-medium text-white/90">Need something faster?</h2>
              <p className="mt-2 text-sm leading-6 text-white/45">
                If you already know what you need, you can skip the queue entirely and start the flow
                yourself.
              </p>
              <div className="mt-5 flex flex-col gap-2.5">
                <Link href="/book/technician" className={buttonClass('primary', 'md', 'w-full')}>
                  <Wrench className="size-4" aria-hidden="true" />
                  Book a technician
                </Link>
                <Link href="/plan-event" className={buttonClass('secondary', 'md', 'w-full')}>
                  <Sparkles className="size-4" aria-hidden="true" />
                  Start planning an event
                </Link>
              </div>
            </div>
          </aside>
        </div>
    </>
  )
}

/* ------------------------------------------------------------------ */
/* Local pieces                                                        */
/* ------------------------------------------------------------------ */

function SuccessIcon() {
  return (
    <span className="grid size-16 place-items-center rounded-full border border-emerald-400/25 bg-emerald-500/10">
      <CheckCircle2 className="size-8 text-emerald-300" aria-hidden="true" />
    </span>
  )
}

interface FieldProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  required?: boolean
  error?: string
  hint?: string
  autoComplete?: string
  placeholder?: string
}

function Field({
  id,
  label,
  value,
  onChange,
  type = 'text',
  required,
  error,
  hint,
  autoComplete,
  placeholder,
}: FieldProps) {
  return (
    <div>
      <label htmlFor={id} className="text-label text-white/45">
        {label}
        {required && <span className="ml-1 text-primary">*</span>}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        required={required}
        autoComplete={autoComplete}
        placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        className={cn(
          'mt-2 w-full rounded-lg border bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder:text-white/25 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/25',
          error ? 'border-red-400/60 focus:border-red-400' : 'border-white/12 focus:border-primary/60'
        )}
      />
      {error ? (
        <p id={`${id}-error`} role="alert" className="mt-1.5 flex items-center gap-1.5 text-xs text-red-300">
          <AlertCircle className="size-3.5" aria-hidden="true" />
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-white/30">
          {hint}
        </p>
      ) : null}
    </div>
  )
}