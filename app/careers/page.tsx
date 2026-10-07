import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, CalendarHeart, GraduationCap, Heart, MapPin, Sparkles, Users, Wrench } from 'lucide-react'
import SiteShell from '@/components/layout/SiteShell'
import { Section, PageHeader } from '@/components/shared/Primitives'
import { buttonClass } from '@/lib/button-styles'
import EmptyState from '@/components/shared/EmptyState'
import { siteConfig } from '@/lib/site-config'

export const metadata: Metadata = {
  title: 'Careers',
  description:
    'Join avān. as a technician, event planner or platform engineer. Work on real problems with real customers.',
}

const ROLES = [
  {
    icon: Wrench,
    title: 'Field technicians',
    body: 'If you are skilled, punctual and take pride in a clean job, we route work to you based on your trade and area.',
    points: ['Choose your own availability', 'Paid per completed job', 'Grow into lead technician roles'],
  },
  {
    icon: CalendarHeart,
    title: 'Event managers',
    body: 'You own a client relationship from first requirements call through to the last guest leaving.',
    points: ['Own end-to-end client delivery', 'Design proposals and budgets', 'Run events of any scale'],
  },
  {
    icon: Sparkles,
    title: 'Platform engineers',
    body: 'You build the booking flows, the dispatch engine and the tooling that make both sides work better.',
    points: ['Next.js, Node, MongoDB, Prisma', 'Real production traffic', 'Small, senior team'],
  },
]

const VALUES = [
  { icon: Users, title: 'Small team, real ownership', body: 'You own outcomes end to end rather than one slice of a ticket queue.' },
  { icon: Heart, title: 'Customers before metrics', body: 'We optimise for whether the day went well, not for dashboards.' },
  { icon: GraduationCap, title: 'Learn in the open', body: 'Regular critique, honest retrospectives and no cargo-cult process.' },
]

export default function CareersPage() {
  return (
    <SiteShell>
      <div className="mx-auto w-full max-w-[1380px] px-5 py-16 sm:py-20 lg:px-10">
        <PageHeader
          align="center"
          eyebrow="Careers"
          title="Do work people actually rely on"
          description="Whether you are fixing a tap or planning a reception, someone is depending on you doing it well. That is the whole job."
        />
      </div>

      {/* Roles */}
      <Section eyebrow="Open paths" title="Where you fit" align="left">
        <div className="grid gap-5 lg:grid-cols-3">
          {ROLES.map(({ icon: Icon, title, body, points }) => (
            <article
              key={title}
              className="flex flex-col rounded-2xl border border-white/8 bg-white/[0.02] p-7 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-primary/30"
            >
              <span className="mb-5 grid size-11 place-items-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <h3 className="text-base font-semibold text-white/90">{title}</h3>
              <p className="mt-2.5 text-sm leading-6 text-white/45">{body}</p>
              <ul className="mt-5 flex-1 space-y-2">
                {points.map(point => (
                  <li key={point} className="flex gap-2.5 text-sm text-white/50">
                    <span className="mt-2 size-1 shrink-0 rounded-full bg-primary/60" aria-hidden="true" />
                    {point}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </Section>

      {/* Values */}
      <Section
        eyebrow="How we work"
        title="What we expect from each other"
        spacing="lg"
        className="border-t border-white/8 bg-white/[0.01]"
      >
        <div className="grid gap-5 md:grid-cols-3">
          {VALUES.map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-2xl border border-white/8 bg-white/[0.02] p-6">
              <Icon className="mb-4 size-5 text-primary" aria-hidden="true" />
              <h3 className="text-[0.9375rem] font-semibold text-white/90">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-white/45">{body}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* No open roles → honest empty state, with a way in. */}
      <Section spacing="lg">
        <div className="rounded-2xl border border-white/8 bg-white/[0.02]">
          <EmptyState
            icon={MapPin}
            title="No open roles posted right now"
            description="We hire in small batches as demand grows. If you think you fit one of the paths above, introduce yourself and we will keep you in mind."
            action={{ label: 'Send an introduction', href: '/contact' }}
            secondaryAction={{ label: 'Explore the platform', href: '/services' }}
          />
        </div>
        <p className="mt-8 text-center text-sm text-white/35">
          Prefer email?{' '}
          <a
            href={`mailto:${siteConfig.contact.email}`}
            className="text-primary underline-offset-4 hover:underline"
          >
            {siteConfig.contact.email}
          </a>
        </p>
        <div className="mt-10 text-center">
          <Link href="/about" className={buttonClass('secondary', 'md')}>
            Read about us
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </Section>
    </SiteShell>
  )
}