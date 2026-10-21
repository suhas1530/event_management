'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Check, Circle, Loader2, Sparkles } from 'lucide-react'
import SiteShell from '@/components/layout/SiteShell'
import StatusBadge from '@/components/shared/StatusBadge'
import { eventRequestsApi, type EventRequest } from '@/lib/api'

const NEXT_STEPS = [
  'Requirements received',
  'Event team reviewing',
  'Event manager assigned',
  'Customized proposal',
  'Your approval',
  'Advance payment',
  'Event confirmed',
]

export default function EventRequestSubmittedPage() {
  const [request, setRequest] = useState<EventRequest | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('id')
    if (id) eventRequestsApi.byId(id).then(setRequest).catch(() => {}).finally(() => setLoading(false))
    else setLoading(false)
  }, [])

  return (
    <SiteShell>
      <div className="mx-auto w-full max-w-2xl px-5 py-12 lg:py-16">
        <section className="border-y border-border py-10">
          <div className="flex size-14 items-center justify-center border border-green-400/30 bg-green-400/10">
            <Check className="size-7 text-green-300" aria-hidden="true" />
          </div>
          <p className="mt-7 text-[10px] uppercase tracking-[0.25em] text-gold-text">Request received</p>
          <h1 className="mt-2 font-serif text-4xl text-foreground">Event request submitted</h1>
          <p className="mt-4 max-w-xl text-pretty text-sm leading-7 text-muted-foreground">
            Thank you. Our event planning team will review your requirements and contact you with a
            customized proposal. This is a request, not a confirmed booking.
          </p>

          {loading ? (
            <div className="mt-8 flex items-center gap-3" role="status">
              <span className="sr-only">Loading your request…</span>
              <Loader2 className="size-5 animate-spin text-gold-text" aria-hidden="true" />
            </div>
          ) : request ? (
            <div className="mt-8 border border-border bg-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground/80">Request ID</p>
                  <p className="mt-1 font-mono text-lg text-gold-text">{request.requestNumber}</p>
                </div>
                <StatusBadge status={request.status} size="sm" />
              </div>
              <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm text-foreground/90">
                <span>{request.eventType.replaceAll('_', ' ')}</span>
                {request.eventDate && (
                  <span>
                    {new Date(request.eventDate).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                )}
                {request.guestCount && <span>{request.guestCount} guests</span>}
                {request.city && <span>{request.city}</span>}
              </div>
            </div>
          ) : (
            <p className="mt-8 border border-border bg-muted/50 p-5 text-sm text-muted-foreground">
              We could not load the details of this request just now. Your submission went through —
              you will find it in your requests list.
            </p>
          )}

          <div className="mt-9">
            <h2 className="text-sm font-medium text-foreground">What happens next</h2>
            <ol className="mt-4 space-y-3">
              {NEXT_STEPS.map((item, index) => (
                <li key={item} className="flex items-center gap-3 text-sm">
                  {index === 0 ? (
                    <Check className="size-4 shrink-0 text-green-300" aria-hidden="true" />
                  ) : (
                    <Circle className="size-4 shrink-0 text-muted-foreground/80" aria-hidden="true" />
                  )}
                  <span className={index === 0 ? 'text-foreground/90' : 'text-muted-foreground/80'}>{item}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="mt-9 flex flex-wrap gap-3">
            <Link
              href="/event-requests"
              className="inline-flex min-h-12 items-center gap-2 bg-[#d5ae79] px-5 text-sm font-medium text-[#17151d] transition-colors duration-200 hover:bg-[#e8cfa9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              View my event requests <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
            <Link
              href="/"
              className="inline-flex min-h-12 items-center border border-border px-5 text-sm text-foreground/90 transition-colors duration-200 h focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Back to home
            </Link>
          </div>
        </section>
      </div>
    </SiteShell>
  )
}
