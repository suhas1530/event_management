import type { Metadata } from 'next'
import Link from 'next/link'
import { BadgeCheck, CalendarCheck, IndianRupee, MapPin, Wrench } from 'lucide-react'
import SiteShell from '@/components/layout/SiteShell'
import PartnerApplicationForm from '@/components/partner/PartnerApplicationForm'
import { HOME_CATALOG } from '@/lib/catalog'
import { SERVICE_AREA_NAMES, SUPPORTED_CITY } from '@/lib/service-area'

export const metadata: Metadata = {
  title: 'Become a Professional',
  description:
    'Join Heptome as a home-services professional in Bengaluru — cleaning crews, electricians, plumbers, carpenters, appliance technicians, CCTV and computer technicians.',
}

const ROLES: string[] = [
  'Cleaning crew / deep-clean team',
  'Electrician',
  'Plumber',
  'Carpenter',
  'AC technician',
  'Appliance repair technician',
  'Painting contractor',
  'Pest control technician',
  'CCTV / security installer',
  'Computer & network technician',
  'Salon & spa professional',
  'Grooming & massage professional',
  'Other home service',
]

const PROMISES = [
  {
    icon: CalendarCheck,
    title: 'Slots you accept',
    body: 'Bookings arrive with the service, address and two-hour window. You accept the ones that fit your day.',
  },
  {
    icon: IndianRupee,
    title: 'Pricing agreed up front',
    body: 'The visit charge, service price and tax are shown to the customer before the job — no on-site haggling.',
  },
  {
    icon: MapPin,
    title: `Work across ${SUPPORTED_CITY}`,
    body: 'Jobs are matched to the localities you choose, so you are not sent across the city by default.',
  },
  {
    icon: BadgeCheck,
    title: 'Reviewed before listing',
    body: 'Our team reviews every application and profile before a professional appears in the catalogue.',
  },
]

/**
 * Home-services recruitment page.
 *
 * Ivory and purple, matching the home-services vertical. It states what the
 * platform actually does for a professional today (slots, up-front pricing,
 * locality matching, profile review) and submits the application through the
 * contact API — the only real channel the backend offers — rather than
 * pretending there is a full onboarding product behind the button.
 */
export default function BecomeAProfessionalPage() {
  return (
    <SiteShell>
      <section className="surface-ivory px-5 py-14 sm:px-10 lg:py-20">
        <div className="mx-auto grid max-w-[1380px] gap-12 lg:grid-cols-[minmax(0,1fr)_560px]">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-accent">For professionals</p>
            <h1 className="mt-4 font-display text-[clamp(2.25rem,4.8vw,3.5rem)] font-semibold leading-[1.06] tracking-[-0.02em] text-hept-charcoal">
              Work with Heptome.
            </h1>
            <p className="surface-ivory-muted mt-5 max-w-xl text-base leading-7">
              Heptome sends vetted, slot-based home-service jobs to professionals across {SUPPORTED_CITY}. If
              you take pride in careful work and clear pricing, we would like to hear from you.
            </p>

            <ul className="mt-9 grid gap-4 sm:grid-cols-2">
              {PROMISES.map(item => {
                const Icon = item.icon
                return (
                  <li key={item.title} className="panel-ivory p-5">
                    <Icon className="size-5 text-accent" aria-hidden="true" />
                    <h2 className="mt-3 text-sm font-semibold text-hept-charcoal">{item.title}</h2>
                    <p className="surface-ivory-muted mt-1.5 text-sm leading-6">{item.body}</p>
                  </li>
                )
              })}
            </ul>

            <div className="mt-10 border-t border-hept-line pt-8">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-hept-charcoal">
                <Wrench className="size-4 text-accent" aria-hidden="true" />
                Service lines we are recruiting for
              </h2>
              <ul className="mt-4 flex flex-wrap gap-2">
                {HOME_CATALOG.map(group => (
                  <li key={group.id} className="chip-lavender px-3 py-1.5 text-xs font-medium">
                    {group.shortName}
                  </li>
                ))}
              </ul>
              <p className="surface-ivory-muted mt-4 text-sm leading-6">
                We currently schedule doorstep work in {SERVICE_AREA_NAMES.length} localities across{' '}
                {SUPPORTED_CITY}. If you work outside them, say so in your application — expansion is driven by
                where our professionals are.
              </p>
            </div>

            <p className="surface-ivory-muted mt-8 text-sm leading-6">
              Questions first?{' '}
              <Link href="/contact" className="font-medium text-accent underline underline-offset-2">
                Contact the team
              </Link>{' '}
              or read{' '}
              <Link href="/help#faqs" className="font-medium text-accent underline underline-offset-2">
                how Heptome works
              </Link>
              .
            </p>
          </div>

          <PartnerApplicationForm
            theme="ivory"
            roleLabel="What work do you do?"
            roles={ROLES}
            detailLabel="Coverage, skills and availability"
            detailPlaceholder="Localities you serve, brands or equipment you specialise in, the days and hours you can take jobs."
          />
        </div>
      </section>
    </SiteShell>
  )
}
