import Link from 'next/link'
import {
  ArrowUp,
  ArrowUpRight,
  ChevronDown,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  siteConfig,
  footerColumns,
  legalLinks,
  SOCIAL_LABELS,
  SOCIAL_ORDER,
  type SocialKey,
} from '@/lib/site-config'
import Logo from '@/components/brand/Logo'
import { SOCIAL_ICONS } from '@/components/brand/SocialIcons'
import { Separator } from '@/components/ui/Separator'
import FooterNewsletter from './FooterNewsletter'

/* ------------------------------------------------------------------ */
/* Social row                                                          */
/* ------------------------------------------------------------------ */

function SocialRow({ className }: { className?: string }) {
  return (
    <ul className={cn('flex flex-wrap items-center gap-2.5', className)} role="list">
      {SOCIAL_ORDER.map((key: SocialKey) => {
        const Icon = SOCIAL_ICONS[key]
        const label = SOCIAL_LABELS[key]
        const href = siteConfig.social[key]

        // Not configured yet → render a non-navigating chip rather than a dead link.
        if (!href) {
          return (
            <li key={key}>
              <span
                role="img"
                aria-label={`${label} (coming soon)`}
                className="flex size-10 cursor-default items-center justify-center rounded-xl border border-footer-border bg-white/[0.02] text-footer-subtle"
                title={`${label} — coming soon`}
              >
                <Icon className="size-[18px]" aria-hidden="true" />
              </span>
            </li>
          )
        }

        return (
          <li key={key}>
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${label} (opens in a new tab)`}
              className="flex size-10 items-center justify-center rounded-xl border border-footer-border bg-white/[0.04] text-footer-muted transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-footer-accent/50 hover:bg-footer-accent/15 hover:text-footer-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-footer-accent focus-visible:ring-offset-2 focus-visible:ring-offset-footer"
            >
              <Icon className="size-[18px]" />
            </a>
          </li>
        )
      })}
    </ul>
  )
}

/* ------------------------------------------------------------------ */
/* Contact row                                                         */
/* ------------------------------------------------------------------ */

const contactLinkClass =
  'group flex items-start gap-3 rounded-xl p-2 transition-colors duration-200 hover:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-footer-accent focus-visible:ring-offset-2 focus-visible:ring-offset-footer'

const contactIconClass =
  'mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg border border-footer-border bg-white/[0.04] text-footer-accent transition-colors duration-200 group-hover:border-footer-accent/40'

function ContactLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="block text-[10px] font-medium uppercase tracking-[0.18em] text-footer-subtle">
      {children}
    </span>
  )
}

/* ------------------------------------------------------------------ */
/* Footer                                                              */
/* ------------------------------------------------------------------ */

export default function Footer() {
  return (
    <footer className="relative mt-auto overflow-hidden bg-footer text-footer-foreground" role="contentinfo">
      {/* Copper hairline + a restrained evergreen/copper atmosphere. */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-footer-accent/70 to-transparent"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            'radial-gradient(50% 70% at 12% 0%, color-mix(in srgb, var(--footer-accent) 20%, transparent), transparent 70%), radial-gradient(45% 60% at 86% 8%, color-mix(in srgb, var(--primary) 22%, transparent), transparent 72%)',
        }}
        aria-hidden="true"
      />

      <div className="relative">
        {/* ── Newsletter band ────────────────────────────────────────────── */}
        <div className="border-b border-footer-border">
          <div className="mx-auto grid w-full max-w-[1380px] gap-8 px-5 py-12 sm:px-8 lg:grid-cols-[minmax(0,1fr)_32rem] lg:items-end lg:gap-16 lg:px-10 lg:py-14">
            <div>
              <p className="flex items-center gap-2.5 text-[10px] font-medium uppercase tracking-[0.28em] text-footer-accent">
                <Sparkles className="size-3.5" aria-hidden="true" />
                The Heptome Edit
              </p>
              <h2 className="mt-4 max-w-xl text-balance font-serif text-[clamp(1.75rem,3.4vw,2.6rem)] leading-[1.08] tracking-tight text-footer-foreground">
                Good things, worth the occasional inbox.
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-footer-muted">
                New venues, seasonal table ideas and practical home-care notes from the team.
                Considered, never noisy.
              </p>
            </div>

            <FooterNewsletter />
          </div>
        </div>

        {/* ── Brand + navigation ─────────────────────────────────────────── */}
        <div className="mx-auto grid w-full max-w-[1380px] gap-12 px-5 py-14 sm:px-8 lg:grid-cols-12 lg:gap-10 lg:px-10 lg:py-16">
          {/* Brand area */}
          <div className="lg:col-span-4">
            <Logo size="md" tone="dark" />

            <p className="mt-6 max-w-sm text-[0.9375rem] leading-7 text-footer-muted">
              {siteConfig.description}
            </p>

            <ul className="mt-7 space-y-1.5" role="list">
              <li>
                <a href={`mailto:${siteConfig.contact.email}`} className={contactLinkClass}>
                  <span className={contactIconClass} aria-hidden="true">
                    <Mail className="size-4" />
                  </span>
                  <span className="min-w-0">
                    <ContactLabel>Email</ContactLabel>
                    <span className="block break-all text-sm text-footer-foreground transition-colors group-hover:text-footer-accent">
                      {siteConfig.contact.email}
                    </span>
                  </span>
                </a>
              </li>
              <li>
                <a href={siteConfig.contact.phoneHref} className={contactLinkClass}>
                  <span className={contactIconClass} aria-hidden="true">
                    <Phone className="size-4" />
                  </span>
                  <span>
                    <ContactLabel>Call</ContactLabel>
                    <span className="block text-sm text-footer-foreground transition-colors group-hover:text-footer-accent">
                      {siteConfig.contact.phone}
                    </span>
                  </span>
                </a>
              </li>
              <li>
                <a
                  href={siteConfig.contact.whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={contactLinkClass}
                >
                  <span className={contactIconClass} aria-hidden="true">
                    <MessageCircle className="size-4" />
                  </span>
                  <span>
                    <ContactLabel>WhatsApp</ContactLabel>
                    <span className="block text-sm text-footer-foreground transition-colors group-hover:text-footer-accent">
                      Chat with the team
                    </span>
                  </span>
                </a>
              </li>
              <li>
                <div className="flex items-start gap-3 p-2">
                  <span className={cn(contactIconClass, 'group-hover:border-footer-border')} aria-hidden="true">
                    <MapPin className="size-4" />
                  </span>
                  <span>
                    <ContactLabel>Where we work</ContactLabel>
                    <span className="block text-sm leading-6 text-footer-muted">
                      Doorstep home services in {siteConfig.coverage.city}
                      <br />
                      Event partners across India
                    </span>
                  </span>
                </div>
              </li>
            </ul>

            <div className="mt-8">
              <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-footer-subtle">
                Follow along
              </p>
              <SocialRow className="mt-3" />
            </div>
          </div>

          {/* Desktop navigation columns */}
          <div className="hidden lg:col-span-8 lg:grid lg:grid-cols-4 lg:gap-8">
            {footerColumns.map(column => (
              <nav key={column.title} aria-label={column.title}>
                <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-footer-foreground">
                  {column.title}
                </h2>
                <ul className="mt-5 space-y-3" role="list">
                  {column.links.map(link => (
                    <li key={link.href + link.label}>
                      <Link
                        href={link.href}
                        className="group inline-flex items-start gap-1.5 rounded text-sm leading-6 text-footer-muted transition-colors duration-200 ease-out hover:text-footer-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-footer-accent focus-visible:ring-offset-2 focus-visible:ring-offset-footer"
                      >
                        {link.label}
                        <ArrowUpRight
                          className="mt-0.5 size-3.5 shrink-0 -translate-x-1 text-footer-accent opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100"
                          aria-hidden="true"
                        />
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>

          {/* Mobile: accordion navigation */}
          <div className="lg:hidden">
            <div className="border-t border-footer-border">
              {footerColumns.map(column => (
                <details key={column.title} className="group border-b border-footer-border">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-sm font-medium text-footer-foreground transition-colors hover:text-footer-accent [&::-webkit-details-marker]:hidden">
                    {column.title}
                    <ChevronDown
                      className="size-4 shrink-0 text-footer-subtle transition-transform duration-300 group-open:rotate-180 group-open:text-footer-accent"
                      aria-hidden="true"
                    />
                  </summary>
                  <ul className="space-y-1 pb-4" role="list">
                    {column.links.map(link => (
                      <li key={link.href + link.label}>
                        <Link
                          href={link.href}
                          className="block rounded py-2 text-sm text-footer-muted transition-colors duration-200 hover:text-footer-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-footer-accent"
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </details>
              ))}
            </div>
          </div>
        </div>

        {/* ── Bottom bar ─────────────────────────────────────────────────── */}
        <div className="border-t border-footer-border">
          <div className="mx-auto flex w-full max-w-[1380px] flex-col gap-6 px-5 py-8 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:px-10">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-5">
              <p className="text-xs text-footer-subtle">
                © {new Date().getFullYear()} {siteConfig.legalName}. All rights reserved.
              </p>
              <Separator
                orientation="vertical"
                className="hidden h-4 bg-footer-border sm:block"
              />
              <ul className="flex flex-wrap items-center gap-x-5 gap-y-2" role="list">
                {legalLinks.map(link => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="rounded text-xs text-footer-subtle transition-colors duration-200 hover:text-footer-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-footer-accent"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-3 text-xs text-footer-subtle">
              <p>
                Designed &amp; built by{' '}
                {siteConfig.developer.url ? (
                  <a
                    href={siteConfig.developer.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded text-footer-muted transition-colors hover:text-footer-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-footer-accent"
                  >
                    {siteConfig.developer.name}
                  </a>
                ) : (
                  <span className="text-footer-muted">{siteConfig.developer.name}</span>
                )}
              </p>
              <a
                href="#main"
                className="inline-flex items-center gap-1.5 rounded text-footer-muted transition-colors hover:text-footer-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-footer-accent"
              >
                Back to top
                <ArrowUp className="size-3.5" aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
