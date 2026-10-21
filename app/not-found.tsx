import Link from 'next/link'
import { Compass, Home, Search } from 'lucide-react'
import SiteShell from '@/components/layout/SiteShell'
import { buttonClass } from '@/lib/button-styles'

/**
 * Branded 404 (Part 34).
 *
 * Next.js renders this for any unmatched route. Without it the default
 * document appears with none of the product's chrome, which is jarring on a
 * site this heavily branded — so we keep the shell and offer a way forward
 * instead of a dead end.
 */
export default function NotFound() {
  return (
    <SiteShell>
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center px-5 py-24 text-center lg:py-32">
        <span className="grid size-14 place-items-center rounded-2xl border border-primary/25 bg-primary/10">
          <Compass className="size-6 text-primary" aria-hidden="true" />
        </span>

        <p className="mt-8 text-label text-primary">Error 404</p>
        <h1 className="mt-3 text-balance font-serif text-[clamp(2rem,5vw,3.25rem)] leading-[1.05] tracking-tight text-foreground">
          This page has moved on.
        </h1>
        <p className="mt-5 max-w-md text-pretty text-base leading-7 text-muted-foreground">
          The link you followed is broken or the page no longer exists. Try a search, or head
          back to something you know.
        </p>

        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <Link href="/" className={buttonClass('primary', 'lg')}>
            <Home className="size-4" aria-hidden="true" />
            Back to home
          </Link>
          <Link href="/services" className={buttonClass('secondary', 'lg')}>
            <Search className="size-4" aria-hidden="true" />
            Browse services
          </Link>
        </div>

        {/* Real destinations rather than dead anchors — every one of these routes
            exists in the app. */}
        <nav className="mt-12 flex flex-wrap justify-center gap-x-6 gap-y-2" aria-label="Popular pages">
          {[
            { label: 'Book a technician', href: '/book/technician' },
            { label: 'Plan an event', href: '/plan-event' },
            { label: 'Help centre', href: '/help' },
            { label: 'Contact us', href: '/contact' },
          ].map(link => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-muted-foreground transition-colors duration-200 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </SiteShell>
  )
}