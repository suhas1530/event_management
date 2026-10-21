import type { Metadata } from 'next'
import Link from 'next/link'
import { Building2, CalendarHeart, IndianRupee, Share2 } from 'lucide-react'
import SiteShell from '@/components/layout/SiteShell'
import PartnerApplicationForm from '@/components/partner/PartnerApplicationForm'
import { EVENT_SERVICE_CATEGORIES } from '@/lib/catalog'

export const metadata: Metadata = {
  title: 'Become an Event Partner',
  description:
    'Partner with Heptome as a venue, caterer, decorator, photographer, planner or production team — enquiries are reviewed by our event planners before a proposal is sent.',
}

const ROLES: string[] = [
  'Venue / banquet hall',
  'Resort or outdoor property',
  'Caterer',
  'Decorator / floral designer',
  'Photographer / videographer',
  'Event planner',
  'DJ, band or entertainer',
  'Anchor / host',
  'Stage, lighting or sound production',
  'Equipment rental',
  'Makeup / styling artist',
  'Invitation or guest-management service',
  'Other event service',
]

const PROMISES = [
  {
    icon: CalendarHeart,
    title: 'Qualified enquiries only',
    body: 'Enquiries reach you after a planner has captured the date, guest count, budget band and services.',
  },
  {
    icon: IndianRupee,
    title: 'Proposals, not surprises',
    body: 'Pricing is presented to the customer in a proposal they approve — nothing is sold on your behalf without agreement.',
  },
  {
    icon: Share2,
    title: 'One brief, every partner',
    body: 'Venues, décor and production work from the same brief, so the plan does not fracture between vendors.',
  },
  {
    icon: Building2,
    title: 'Reviewed before listing',
    body: 'Our team reviews every application before a partner is shown to customers.',
  },
]

/**
 * Event-partner recruitment page.
 *
 * Dark with champagne, matching the event vertical. Applications are submitted
 * through the contact API with `topic: 'partnership'` — the platform has no
 * dedicated partner pipeline yet — and the page says exactly that, so nobody is
 * promised an onboarding flow that does not exist.
 */
export default function BecomeAnEventPartnerPage() {
  return (
    <SiteShell>
      <section className="immersive bg-ink-950 px-5 py-14 sm:px-10 lg:py-20">
        <div className="mx-auto grid max-w-[1380px] gap-12 lg:grid-cols-[minmax(0,1fr)_560px]">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-champagne">For event partners</p>
            <h1 className="mt-4 font-display text-[clamp(2.25rem,4.8vw,3.5rem)] font-semibold leading-[1.06] tracking-[-0.02em] text-slate-50">
              Supply the moments people remember.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-fg-dim">
              Venues, caterers, decorators, photographers, planners and production teams work with Heptome on
              real briefs — captured by a planner, costed into a proposal, and confirmed with the customer
              before the date is locked.
            </p>

            <ul className="mt-9 grid gap-4 sm:grid-cols-2">
              {PROMISES.map(item => {
                const Icon = item.icon
                return (
                  <li key={item.title} className="border border-white/8 bg-ink-900/60 p-5">
                    <Icon className="size-5 text-champagne" aria-hidden="true" />
                    <h2 className="mt-3 text-sm font-semibold text-slate-50">{item.title}</h2>
                    <p className="mt-1.5 text-sm leading-6 text-fg-dim">{item.body}</p>
                  </li>
                )
              })}
            </ul>

            <div className="mt-10 border-t border-hairline/60 pt-8">
              <h2 className="text-sm font-semibold text-slate-50">Service lines we plan around</h2>
              <ul className="mt-4 flex flex-wrap gap-2">
                {EVENT_SERVICE_CATEGORIES.map(service => (
                  <li key={service.id} className="border border-border bg-muted/50 px-3 py-1.5 text-xs text-fg-dim">
                    {service.name}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-8 border border-champagne/25 bg-champagne/[0.06] p-5">
              <h2 className="text-sm font-semibold text-champagne-light">How applications are handled today</h2>
              <p className="mt-2 text-sm leading-6 text-foreground/90">
                Applications arrive as partnership enquiries in the Heptome inbox and are reviewed by the
                planning team, who contact you directly to collect portfolios, rates and availability. A
                dedicated partner portal with listings and dashboards is on the roadmap, not live yet — we
                would rather tell you that than imply an instant listing.
              </p>
            </div>

            <p className="mt-8 text-sm leading-6 text-fg-dim">
              Prefer to talk first?{' '}
              <Link href="/contact" className="font-medium text-champagne underline underline-offset-2">
                Contact the team
              </Link>{' '}
              or browse{' '}
              <Link href="/events" className="font-medium text-champagne underline underline-offset-2">
                the event catalogue
              </Link>
              .
            </p>
          </div>

          <PartnerApplicationForm
            roleLabel="What do you provide?"
            roles={ROLES}
            detailLabel="Portfolio, rates and coverage"
            detailPlaceholder="Cities you operate in, the services you provide in-house, typical rates or packages, and links to past work."
          />
        </div>
      </section>
    </SiteShell>
  )
}
