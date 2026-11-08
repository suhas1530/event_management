import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowRight,
  CalendarCheck,
  Check,
  ClipboardList,
  MapPin,
  MessageSquare,
  Sparkles,
} from 'lucide-react'
import SiteShell from '@/components/layout/SiteShell'
import { EVENT_SERVICE_CATEGORIES } from '@/lib/catalog'
import { absoluteUrl, breadcrumbJsonLd, jsonLdString, serviceJsonLd } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Event Planning & Management',
  description:
    'Plan a wedding, birthday, corporate event or celebration with Heptome. Share your brief, review a custom proposal and approve it before anything is confirmed.',
  alternates: { canonical: '/event-management' },
  openGraph: {
    type: 'website',
    url: absoluteUrl('/event-management'),
    title: 'Event Planning & Management | Heptome',
    description:
      'Share your event brief, review a custom proposal and approve it before anything is confirmed.',
  },
}

const STEPS = [
  {
    icon: ClipboardList,
    title: 'Share the brief',
    body:
      'Tell us the event type, date, guest count, city and the services you are considering. A venue is optional — you can ask us to help find one.',
  },
  {
    icon: MessageSquare,
    title: 'Talk it through',
    body:
      'An event planner reviews the requirements and discusses the practical details with you: timing, format, priorities and constraints.',
  },
  {
    icon: Sparkles,
    title: 'Review the proposal',
    body:
      'You receive a customized proposal for the scope you discussed. You can ask for changes before deciding.',
  },
  {
    icon: CalendarCheck,
    title: 'Approve and plan',
    body:
      'Nothing is confirmed and no payment is due until you approve the proposal. After that, planning moves into delivery.',
  },
]

const FAQS = [
  {
    question: 'Is submitting the event form a confirmed booking?',
    answer:
      'No. It is an event inquiry. The planning team reviews your requirements and prepares a proposal. The event is confirmed only after you approve that proposal.',
  },
  {
    question: 'How much does event planning cost?',
    answer:
      'The cost depends on the event type, guest count, venue, services and scope. Heptome does not publish a fixed package price because a proposal is prepared after reviewing your brief.',
  },
  {
    question: 'Which cities do you cover for events?',
    answer:
      'Event planning is available across India. Doorstep home services are currently limited to Bengaluru and are checked separately by pincode.',
  },
  {
    question: 'Do I need an account to plan an event?',
    answer:
      'You can browse events, venues and services without an account. An account is required to submit and track an event request.',
  },
]

export default function EventManagementPage() {
  const structuredData = [
    serviceJsonLd({
      name: 'Event planning and management',
      description:
        'Event planning for weddings, birthdays, corporate events and celebrations across India, with a reviewed proposal before confirmation.',
      path: '/event-management',
      areaServed: 'India',
    }),
    breadcrumbJsonLd([
      { name: 'Home', path: '/' },
      { name: 'Event Management', path: '/event-management' },
    ]),
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: FAQS.map(item => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: { '@type': 'Answer', text: item.answer },
      })),
    },
  ]

  return (
    <SiteShell transparentHeader>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdString(structuredData) }}
      />

      <section className="relative isolate overflow-hidden border-b border-border">
        <Image
          src="/images/hero/outdoor-celebration.webp"
          alt="Friends gathered around a long outdoor table beneath festoon lights"
          fill
          preload
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-black/20" />
        <div className="relative mx-auto max-w-[1200px] px-5 pb-20 pt-32 text-white sm:px-10 lg:pb-28 lg:pt-40">
          <p className="mb-4 flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-gold-soft">
            <Sparkles className="size-3.5" aria-hidden="true" /> Event planning
          </p>
          <h1 className="max-w-4xl font-display text-[clamp(2.4rem,5.5vw,4.25rem)] font-semibold leading-[1.05] tracking-[-0.02em]">
            A celebration planned around your brief — not a template.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-white/80">
            Share the date, guest count and what matters to you. Heptome&apos;s planning team reviews the
            requirements, discusses the practical details and prepares a custom proposal. You approve it before
            anything is confirmed.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              href="/plan-event"
              className="btn-heptome inline-flex min-h-12 items-center gap-2 px-7 py-3.5 text-sm font-semibold"
            >
              Plan an event <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
            <Link
              href="/events"
              className="inline-flex min-h-12 items-center gap-2 text-sm font-medium text-white/80 transition-colors hover:text-white"
            >
              Explore events
            </Link>
          </div>
        </div>
      </section>

      <section className="px-5 py-16 sm:px-10 lg:py-20" aria-labelledby="event-services-heading">
        <div className="mx-auto max-w-[1200px]">
          <div className="max-w-2xl">
            <p className="text-[10px] uppercase tracking-[0.3em] text-gold-text">What we coordinate</p>
            <h2 id="event-services-heading" className="mt-3 font-serif text-3xl text-foreground sm:text-4xl">
              The parts of the event you would otherwise chase separately.
            </h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              These are the service lines in the planning brief. Selecting one does not lock it in; it tells the
              planner what to include in the conversation.
            </p>
          </div>

          <div className="mt-9 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {EVENT_SERVICE_CATEGORIES.map(service => (
              <article key={service.id} className="border border-border bg-card p-5">
                <h3 className="text-sm font-medium text-foreground">{service.name}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{service.blurb}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-muted/30 px-5 py-16 sm:px-10 lg:py-20" aria-labelledby="event-process-heading">
        <div className="mx-auto max-w-[1200px]">
          <div className="max-w-2xl">
            <p className="text-[10px] uppercase tracking-[0.3em] text-gold-text">How it works</p>
            <h2 id="event-process-heading" className="mt-3 font-serif text-3xl text-foreground sm:text-4xl">
              Four steps, with your approval before the commitment.
            </h2>
          </div>
          <ol className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, index) => {
              const Icon = step.icon
              return (
                <li key={step.title} className="border border-border bg-background p-5">
                  <div className="flex items-center justify-between">
                    <span className="flex size-9 items-center justify-center border border-gold/30 bg-gold/10 text-gold-text">
                      <Icon className="size-4" aria-hidden="true" />
                    </span>
                    <span className="font-mono text-xs text-muted-foreground">0{index + 1}</span>
                  </div>
                  <h3 className="mt-4 text-sm font-medium text-foreground">{step.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.body}</p>
                </li>
              )
            })}
          </ol>
        </div>
      </section>

      <section className="px-5 py-16 sm:px-10 lg:py-20" aria-labelledby="event-types-heading">
        <div className="mx-auto grid max-w-[1200px] gap-10 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-gold-text">Occasions</p>
            <h2 id="event-types-heading" className="mt-3 font-serif text-3xl text-foreground sm:text-4xl">
              Start with the occasion.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
              Browse the live event catalogue for the type of celebration you are planning, or go straight to the
              planning brief.
            </p>
            <ul className="mt-6 flex flex-wrap gap-2">
              {[
                ['Weddings', 'WEDDING'],
                ['Birthdays', 'BIRTHDAY'],
                ['Anniversaries', 'ANNIVERSARY'],
                ['Engagements', 'ENGAGEMENT'],
                ['Corporate events', 'CORPORATE'],
                ['Conferences', 'CONFERENCE'],
                ['Baby showers', 'BABY_SHOWER'],
                ['Housewarmings', 'HOUSEWARMING'],
              ].map(([label, type]) => (
                <li key={type}>
                  <Link
                    href={`/events?type=${type}`}
                    className="inline-flex min-h-11 items-center border border-border bg-card px-4 text-sm text-foreground/90 transition-colors hover:border-gold/50 hover:text-gold-text"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="border border-border bg-card p-6">
            <p className="flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] text-gold-text">
              <MapPin className="size-3.5" aria-hidden="true" /> Good to know
            </p>
            <ul className="mt-4 flex flex-col gap-3 text-sm leading-6 text-muted-foreground">
              <li className="flex gap-2">
                <Check className="mt-1 size-4 flex-shrink-0 text-gold-text" aria-hidden="true" />
                Event planning is available across India.
              </li>
              <li className="flex gap-2">
                <Check className="mt-1 size-4 flex-shrink-0 text-gold-text" aria-hidden="true" />
                A submitted brief is an inquiry, not a confirmed booking.
              </li>
              <li className="flex gap-2">
                <Check className="mt-1 size-4 flex-shrink-0 text-gold-text" aria-hidden="true" />
                No payment is due until you approve a proposal.
              </li>
              <li className="flex gap-2">
                <Check className="mt-1 size-4 flex-shrink-0 text-gold-text" aria-hidden="true" />
                Doorstep home services are separate and currently run in Bengaluru only.
              </li>
            </ul>
            <Link
              href="/plan-event"
              className="mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 bg-gold px-5 text-sm font-medium text-gold-foreground transition hover:bg-gold-soft"
            >
              Start your event brief <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t border-border px-5 py-16 sm:px-10 lg:py-20" aria-labelledby="event-faq-heading">
        <div className="mx-auto max-w-[900px]">
          <p className="text-[10px] uppercase tracking-[0.3em] text-gold-text">Questions</p>
          <h2 id="event-faq-heading" className="mt-3 font-serif text-3xl text-foreground sm:text-4xl">
            Before you send a brief.
          </h2>
          <div className="mt-7 divide-y divide-border border-y border-border">
            {FAQS.map(item => (
              <details key={item.question} className="group py-4">
                <summary className="cursor-pointer list-none text-sm font-medium text-foreground marker:hidden">
                  <span className="flex items-center justify-between gap-4">
                    {item.question}
                    <span className="text-gold-text transition-transform group-open:rotate-45" aria-hidden="true">
                      +
                    </span>
                  </span>
                </summary>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </SiteShell>
  )
}
