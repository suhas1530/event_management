import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Phone } from 'lucide-react'
import { brand, verticals } from '@/lib/brand'
import { siteConfig } from '@/lib/site-config'

/**
 * Final CTA — one last photographic moment and an identical-weight choice
 * between an event enquiry and a home-service slot, plus a phone line for
 * anyone who would rather talk to a person.
 */
export default function FinalCTA() {
  return (
    <section id="start" className="relative scroll-mt-20 overflow-hidden bg-neutral-950 px-5 py-24 sm:px-8 lg:py-32">
      <Image
        src="/images/story/outdoor-dinner.webp"
        alt=""
        fill
        sizes="100vw"
        className="object-cover"
      />
      <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,7,11,0.78)_0%,rgba(8,7,11,0.68)_45%,rgba(8,7,11,0.9)_100%)]" />

      <div className="relative mx-auto max-w-3xl text-center text-white">
        <p className="mb-5 text-[10px] uppercase tracking-[0.3em] text-gold-soft">Get started today</p>
        <h2 className="font-display text-[clamp(2.25rem,5.5vw,4rem)] font-semibold tracking-[-0.02em]">
          Celebrate Every Moment.
          <br />
          <span className="font-serif font-light italic text-gold-soft">Care for Every Corner.</span>
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-white/75">{brand.heroSupport}</p>

        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <Link
            href={verticals.events.planHref}
            className="group inline-flex min-h-12 items-center gap-3 rounded-lg bg-primary px-7 py-4 text-sm font-semibold text-primary-foreground shadow-[0_10px_40px_-10px_rgba(0,0,0,0.6)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
          >
            {verticals.events.ctaLabel}
            <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
          </Link>

          <Link
            href={verticals.home.planHref}
            className="group inline-flex min-h-12 items-center gap-3 rounded-lg border border-white/30 bg-white/10 px-7 py-4 text-sm font-semibold text-white transition-colors duration-300 hover:border-white/60 hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            {verticals.home.ctaLabel}
            <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
          </Link>

          <a
            href={siteConfig.contact.phoneHref}
            className="inline-flex min-h-12 items-center gap-3 rounded-lg border border-white/15 bg-black/20 px-7 py-4 text-sm font-medium text-white/85 transition-colors duration-300 hover:border-white/40 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <Phone className="size-4" aria-hidden="true" />
            Talk to an expert
          </a>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-white/60">
          <Link href="/become-a-professional" className="transition-colors hover:text-white">
            Become a professional
          </Link>
          <span className="hidden size-1 rounded-full bg-white/30 sm:block" aria-hidden="true" />
          <Link href="/become-an-event-partner" className="transition-colors hover:text-white">
            Become an event partner
          </Link>
        </div>

        <p className="mt-6 text-xs leading-5 text-white/55">
          {siteConfig.contact.supportHours} · {siteConfig.contact.email}
        </p>
      </div>
    </section>
  )
}
