import type { Metadata } from 'next'
import Link from 'next/link'
import {
  ArrowRight,
  CalendarHeart,
  Compass,
  Gem,
  Handshake,
  Heart,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  Wrench,
} from 'lucide-react'
import SiteShell from '@/components/layout/SiteShell'
import { Section } from '@/components/shared/Primitives'
import { buttonClass } from '@/lib/button-styles'

export const metadata: Metadata = {
  title: 'About Us',
  description:
    'avān. is a service platform for the things that matter at home and at your biggest moments — verified technicians and thoughtful event planning.',
}

const PILLARS = [
  {
    icon: ShieldCheck,
    title: 'Verified professionals',
    body: 'Every technician on the platform is identity-checked, skill-assessed and rated on completed jobs — not on promises.',
  },
  {
    icon: Gem,
    title: 'Transparent pricing',
    body: 'You see the price before the work begins. No surge pricing, no surprise line items added on the doorstep.',
  },
  {
    icon: CalendarHeart,
    title: 'Real event planning',
    body: 'Events start with a conversation about your requirements, not a package catalogue. A manager designs a proposal around you.',
  },
  {
    icon: Handshake,
    title: 'Accountable delivery',
    body: 'Bookings carry a full status timeline, so you always know what is happening and who owns the next step.',
  },
]

const VALUES = [
  { icon: Compass, title: 'Clarity over cleverness', body: 'Plain language, honest prices, and a single place to see what happens next.' },
  { icon: Heart, title: 'Care over throughput', body: 'We would rather under-promise and over-deliver on the day that matters.' },
  { icon: Sparkles, title: 'Craft in the details', body: 'From a clean doorstep arrival to a perfectly lit room — details are the product.' },
]

const TIMELINE = [
  {
    year: 'The beginning',
    title: 'One problem, two halves of a day',
    body: 'A leaking tap and a wedding reception have something in common: both need someone competent, on time, and trustworthy. avān. started by solving both.',
  },
  {
    year: 'Home services',
    title: 'Booking a technician became ten minutes',
    body: 'We built a booking flow that asks only what it needs, shows the price upfront, and keeps you updated the entire way through.',
  },
  {
    year: 'Event planning',
    title: 'From requirements to a real proposal',
    body: 'Rather than selling packages, we started asking questions — guests, dates, venue, budget — and let our planners design the answer.',
  },
  {
    year: 'Today',
    title: 'One platform, one standard',
    body: 'Home services and event planning now run on the same promise: verified people, transparent money, and visible progress.',
  },
]

export default function AboutPage() {
  return (
    <SiteShell>
      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-white/8">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(70% 55% at 50% 0%, rgba(215,185,139,0.10), transparent 65%)',
          }}
          aria-hidden="true"
        />
        <div className="relative mx-auto w-full max-w-[1380px] px-5 pb-20 pt-16 sm:pb-24 sm:pt-20 lg:px-10">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 text-label text-primary">
              <span className="h-px w-6 bg-primary/50" aria-hidden="true" />
              About us
            </span>
            <h1 className="mt-6 text-balance font-serif text-[clamp(2.25rem,6vw,4rem)] leading-[1.03] tracking-tight text-white">
              Two very different days.{' '}
              <span className="text-primary">One standard of care.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg leading-8 text-white/50">
              A dripping tap and a thousand-guest wedding are not the same business — but they share the
              same requirement: someone you can rely on, at the moment you need them.
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/book/technician" className={buttonClass('primary', 'lg')}>
                <Wrench className="size-4" aria-hidden="true" />
                Book a technician
              </Link>
              <Link href="/plan-event" className={buttonClass('secondary', 'lg')}>
                Plan an event
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pillars ───────────────────────────────────────────────────── */}
      <Section
        eyebrow="What we stand on"
        title="Four commitments we do not negotiate"
        description="These are not slogans on a wall — they are the rules our operations team is measured against."
      >
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {PILLARS.map(({ icon: Icon, title, body }) => (
            <article
              key={title}
              className="group rounded-2xl border border-white/8 bg-white/[0.02] p-6 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-primary/30 hover:bg-white/[0.04]"
            >
              <span className="mb-5 grid size-11 place-items-center rounded-xl border border-primary/20 bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-105">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <h3 className="text-[0.9375rem] font-semibold text-white/90">{title}</h3>
              <p className="mt-2.5 text-sm leading-6 text-white/45">{body}</p>
            </article>
          ))}
        </div>
      </Section>

      {/* ── Story timeline ────────────────────────────────────────────── */}
      <Section
        eyebrow="Our story"
        title="How avān. grew"
        description="From a single booking flow to a platform covering both sides of the household."
        spacing="lg"
        className="border-t border-white/8 bg-white/[0.01]"
      >
        <ol className="relative mx-auto max-w-3xl">
          <span className="absolute left-[15px] top-2 bottom-2 w-px bg-gradient-to-b from-primary/40 via-white/10 to-transparent" aria-hidden="true" />
          {TIMELINE.map(entry => (
            <li key={entry.title} className="relative pl-12 pb-10 last:pb-0">
              <span className="absolute left-0 top-1 grid size-8 place-items-center rounded-full border border-primary/30 bg-[#0b0b0d]">
                <Star className="size-3.5 text-primary" aria-hidden="true" />
              </span>
              <p className="text-label text-primary">{entry.year}</p>
              <h3 className="mt-2 text-lg font-medium text-white/90">{entry.title}</h3>
              <p className="mt-2 max-w-xl text-[0.9375rem] leading-7 text-white/45">{entry.body}</p>
            </li>
          ))}
        </ol>
      </Section>

      {/* ── Values ────────────────────────────────────────────────────── */}
      <Section
        eyebrow="How we work"
        title="The rules we hold ourselves to"
        align="left"
        spacing="lg"
      >
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div className="lg:sticky lg:top-28">
            <h3 className="text-balance font-serif text-[clamp(1.5rem,3vw,2.25rem)] leading-tight text-white">
              Software is easy to ship.
              <br />
              <span className="text-primary">Trust is not.</span>
            </h3>
            <p className="mt-5 max-w-md text-pretty text-[0.9375rem] leading-7 text-white/45">
              Anyone can build a booking screen. The harder work is making sure the person who shows up is
              real, the price does not move, and the status you see is the truth.
            </p>
            <Link href="/help" className={buttonClass('secondary', 'md', 'mt-7')}>
              Visit the help center
            </Link>
          </div>

          <ul className="space-y-4">
            {VALUES.map(({ icon: Icon, title, body }) => (
              <li
                key={title}
                className="flex gap-5 rounded-2xl border border-white/8 bg-white/[0.02] p-6 transition-colors duration-300 hover:border-white/14"
              >
                <span className="grid size-11 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-primary">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <h4 className="text-[0.9375rem] font-semibold text-white/90">{title}</h4>
                  <p className="mt-2 text-sm leading-6 text-white/45">{body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      {/* ── Who we serve ──────────────────────────────────────────────── */}
      <Section
        eyebrow="Who we serve"
        title="Built for households and organisers alike"
        spacing="lg"
        className="border-t border-white/8 bg-white/[0.01]"
      >
        <div className="grid gap-5 md:grid-cols-3">
          {[
            { icon: Users, title: 'Homeowners & renters', body: 'Book a verified professional for a repair, an installation, or a deep clean — with the price agreed before anyone knocks.' },
            { icon: CalendarHeart, title: 'Event organisers', body: 'Submit your requirements once and receive a customised proposal built around your guest count, venue and budget.' },
            { icon: Wrench, title: 'Technicians & planners', body: 'Join the platform to receive matched jobs, manage your schedule, and build a reputation customers can see.' },
          ].map(({ icon: Icon, title, body }) => (
            <article key={title} className="rounded-2xl border border-white/8 bg-white/[0.02] p-7">
              <Icon className="mb-5 size-6 text-primary" aria-hidden="true" />
              <h3 className="text-base font-semibold text-white/90">{title}</h3>
              <p className="mt-2.5 text-sm leading-6 text-white/45">{body}</p>
            </article>
          ))}
        </div>
      </Section>

      {/* ── CTA ───────────────────────────────────────────────────────── */}
      <Section spacing="lg">
        <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/[0.10] via-transparent to-transparent px-6 py-14 text-center sm:px-12">
          <div
            className="pointer-events-none absolute inset-0"
            style={{ background: 'radial-gradient(50% 100% at 50% 100%, rgba(215,185,139,0.14), transparent 70%)' }}
            aria-hidden="true"
          />
          <div className="relative">
            <h2 className="text-balance font-serif text-[clamp(1.75rem,4vw,2.75rem)] leading-tight text-white">
              Whatever you need, we&rsquo;re here to help.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-pretty text-[0.9375rem] leading-7 text-white/50">
              Book a professional for your home, or start planning the next event on your calendar.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/book/technician" className={buttonClass('primary', 'lg')}>
                <Wrench className="size-4" aria-hidden="true" />
                Book a technician
              </Link>
              <Link href="/plan-event" className={buttonClass('secondary', 'lg')}>
                <Sparkles className="size-4" aria-hidden="true" />
                Plan an event
              </Link>
            </div>
          </div>
        </div>
      </Section>
    </SiteShell>
  )
}