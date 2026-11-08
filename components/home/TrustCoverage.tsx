import Link from 'next/link'
import { ArrowRight, CalendarCheck, Check, Home, MapPin, ShieldCheck } from 'lucide-react'
import { SERVICE_AREA_NAMES, SUPPORTED_CITY } from '@/lib/service-area'
import { siteConfig } from '@/lib/site-config'

/**
 * The only trust section on the homepage.
 *
 * Every statement here is a description of how the product actually works:
 * event enquiries are reviewed before anything is confirmed, doorstep visits
 * are limited to the published Bengaluru pincode table, and payment happens
 * after the work. There are no counters, ratings or testimonials because the
 * platform has no verified public data to support them.
 */
export default function TrustCoverage() {
  const promises = [
    {
      icon: CalendarCheck,
      title: 'Events are planned, not auto-booked',
      body:
        'Every event brief is reviewed by a planner. You discuss the requirements, receive a proposal, and nothing is confirmed or charged until you approve it.',
      href: '/event-management',
      linkLabel: 'How event planning works',
    },
    {
      icon: Home,
      title: 'Home visits start with a real slot',
      body:
        'Choose a service, check your pincode and pick a two-hour window. The estimate is shown before you send the request, and you pay after the work is completed.',
      href: '/home-services',
      linkLabel: 'Check doorstep coverage',
    },
    {
      icon: ShieldCheck,
      title: 'One account tracks both',
      body:
        'Event proposals and home-service requests live in the same dashboard, with the current status and the next step visible in one place.',
      href: '/dashboard',
      linkLabel: 'Open your dashboard',
    },
  ]

  return (
    <section
      id="how-heptome-works"
      aria-labelledby="trust-heading"
      className="border-b border-border bg-surface-muted/60 px-5 py-16 sm:px-8 lg:py-20"
    >
      <div className="mx-auto max-w-[1380px]">
        <div className="max-w-2xl">
          <p className="mb-4 text-[10px] uppercase tracking-[0.3em] text-gold-text">
            How Heptome works
          </p>
          <h2
            id="trust-heading"
            className="font-display text-[clamp(1.85rem,4vw,2.9rem)] font-semibold tracking-[-0.02em] text-foreground"
          >
            Clear next steps, no invented promises.
          </h2>
          <p className="mt-4 text-sm leading-7 text-muted-foreground sm:text-base">
            Two different journeys, one rule: you always know what is confirmed, what is still a request,
            and what happens next.
          </p>
        </div>

        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {promises.map(item => {
            const Icon = item.icon
            return (
              <article
                key={item.title}
               
                className="flex flex-col rounded-2xl border border-border bg-card p-6"
              >
                <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                <h3 className="mt-5 font-display text-xl font-semibold text-foreground">{item.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-6 text-muted-foreground">{item.body}</p>
                <Link
                  href={item.href}
                  className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-primary transition-colors hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {item.linkLabel}
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </article>
            )
          })}
        </div>

        <div
         
          className="mt-6 flex flex-col gap-5 rounded-2xl border border-border bg-card p-6 sm:flex-row sm:items-start sm:justify-between"
        >
          <div className="max-w-2xl">
            <p className="flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] text-gold-text">
              <MapPin className="size-3.5" aria-hidden="true" /> Doorstep coverage
            </p>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Home services currently run in {SUPPORTED_CITY}. Your pincode is checked before a slot can be
              requested. Event planning is available across India.
            </p>
            <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
              {SERVICE_AREA_NAMES.map(area => (
                <li key={area} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Check className="size-3 text-primary" aria-hidden="true" />
                  {area}
                </li>
              ))}
            </ul>
          </div>
          <div className="shrink-0 text-sm leading-6 text-muted-foreground sm:text-right">
            <p className="text-[10px] uppercase tracking-[0.25em] text-gold-text">Questions</p>
            <a
              href={`mailto:${siteConfig.contact.email}`}
              className="mt-3 block text-primary hover:underline"
            >
              {siteConfig.contact.email}
            </a>
            <a href={siteConfig.contact.phoneHref} className="mt-1 block hover:text-foreground">
              {siteConfig.contact.phone}
            </a>
            <p className="mt-2 text-xs text-muted-foreground">{siteConfig.contact.supportHours}</p>
            <Link
              href="/contact"
              className="mt-3 inline-flex items-center gap-1.5 text-xs text-foreground hover:text-primary"
            >
              Contact the team <ArrowRight className="size-3.5" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
