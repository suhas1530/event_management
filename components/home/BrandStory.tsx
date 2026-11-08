import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, CalendarCheck, LayoutDashboard, ReceiptText, ShieldCheck } from 'lucide-react'

const PILLARS = [
  {
    icon: CalendarCheck,
    title: 'A planner reviews every event',
    body: 'Nothing is auto-confirmed. Your brief becomes a proposal you can question, change or approve.',
  },
  {
    icon: ShieldCheck,
    title: 'Home visits start with coverage',
    body: 'We check your pincode before a slot is reserved, so a professional is never sent somewhere we cannot serve.',
  },
  {
    icon: ReceiptText,
    title: 'Prices before the work',
    body: 'Service estimates are itemised before you confirm. Event pricing arrives with the proposal — never after the fact.',
  },
  {
    icon: LayoutDashboard,
    title: 'One account, two timelines',
    body: 'Event proposals and home-service requests sit in the same dashboard, each with a visible next step.',
  },
]

/**
 * Brand story — why the two verticals belong together.
 *
 * Every line describes a product behaviour rather than a marketing superlative.
 * The section is intentionally editorial: one photograph, one promise, four
 * verifiable reasons.
 */
export default function BrandStory() {
  return (
    <section
      id="why-heptome"
      aria-labelledby="why-heading"
      className="scroll-mt-20 border-b border-border bg-surface-muted/50 px-5 py-20 sm:px-8 lg:py-24"
    >
      <div className="mx-auto grid max-w-[1380px] items-center gap-12 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-20">
        <div className="relative">
          <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-border bg-neutral-950 sm:aspect-[5/4] lg:aspect-[4/5]">
            <Image
              src="/images/story/studio-florals.webp"
              alt="A considered floral arrangement in warm, natural light"
              fill
              sizes="(min-width: 1024px) 45vw, 100vw"
              className="object-cover"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-[linear-gradient(180deg,transparent_45%,rgba(8,7,11,0.65)_100%)]"
            />
            <p className="absolute inset-x-0 bottom-0 p-6 font-serif text-xl italic leading-7 text-white sm:p-8 sm:text-2xl">
              “The details are the difference between a booking and a memory.”
            </p>
          </div>

          <div className="absolute -bottom-6 left-5 right-5 rounded-xl border border-border bg-card p-4 shadow-[var(--card-shadow)] sm:left-8 sm:right-auto sm:max-w-xs">
            <p className="text-[10px] uppercase tracking-[0.24em] text-gold-text">One standard</p>
            <p className="mt-1.5 text-sm leading-6 text-foreground">
              Verified people. Clear pricing. Visible progress.
            </p>
          </div>
        </div>

        <div>
          <p className="mb-4 text-[10px] uppercase tracking-[0.3em] text-gold-text">Why Heptome</p>
          <h2
            id="why-heading"
            className="font-display text-[clamp(2rem,4.5vw,3.25rem)] font-semibold tracking-[-0.02em] text-foreground"
          >
            Two kinds of care.
            <span className="mt-1 block font-serif font-light italic text-gold-text">One standard.</span>
          </h2>
          <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground">
            A wedding and a leaking tap ask for different skills, but the same things: someone competent,
            a clear price, and a way to know what happens next. Heptome is built around that overlap.
          </p>

          <ul className="mt-8 space-y-5" role="list">
            {PILLARS.map(item => {
              const Icon = item.icon
              return (
                <li key={item.title} className="flex gap-4">
                  <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-foreground">{item.title}</span>
                    <span className="mt-1 block text-sm leading-6 text-muted-foreground">{item.body}</span>
                  </span>
                </li>
              )
            })}
          </ul>

          <Link
            href="/about"
            className="group mt-8 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-primary transition-colors hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Read the Heptome standard
            <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  )
}
