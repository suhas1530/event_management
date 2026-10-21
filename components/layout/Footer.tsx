'use client'

import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'
import { Mail, Phone, MessageCircle, MapPin, ArrowUpRight } from 'lucide-react'
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
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/Accordion'
import { Separator } from '@/components/ui/Separator'

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
                className="flex size-10 cursor-default items-center justify-center rounded-lg border border-border-subtle bg-muted/50 text-muted-foreground/80"
                title={`${label} — coming soon`}
                aria-label={`${label} (coming soon)`}
              >
                <Icon className="size-[18px]" />
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
              className="flex size-10 items-center justify-center rounded-lg border border-border-subtle bg-muted/50 text-muted-foreground transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary/10 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
/* Footer                                                              */
/* ------------------------------------------------------------------ */

export default function Footer() {
  const reduceMotion = useReducedMotion()

  const reveal = (delay = 0) => ({
    initial: reduceMotion ? false : { opacity: 0, y: 18 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-60px' },
    transition: reduceMotion ? { duration: 0 } : { duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] as const },
  })

  return (
    <footer className="relative mt-auto overflow-hidden border-t border-border bg-card" role="contentinfo">
      {/* Ambient brand glow — purple (brand) meeting champagne (celebrations) */}
      <div
        className="pointer-events-none absolute inset-x-0 -top-40 h-80 opacity-60"
        style={{
          background:
            'radial-gradient(50% 100% at 35% 100%, rgba(109,54,216,0.16), transparent 70%), radial-gradient(45% 100% at 70% 100%, rgba(213,174,121,0.10), transparent 70%)',
        }}
        aria-hidden="true"
      />

      <div className="relative mx-auto w-full max-w-[1380px] px-5 sm:px-8 lg:px-10">
        {/* ── Brand + navigation ─────────────────────────────────────────── */}
        <div className="grid gap-12 py-16 sm:py-20 lg:grid-cols-12 lg:gap-10">
          {/* Brand area */}
          <motion.div className="lg:col-span-4" {...reveal()}>
            <Logo size="md" tone="dark" />

            <p className="mt-6 max-w-sm text-[0.9375rem] leading-7 text-muted-foreground">
              {siteConfig.description}
            </p>

            <ul className="mt-7 space-y-3 text-sm text-muted-foreground" role="list">
              <li className="flex items-center gap-3">
                <Mail className="size-4 shrink-0 text-primary/70" aria-hidden="true" />
                <a
                  href={`mailto:${siteConfig.contact.email}`}
                  className="rounded transition-colors duration-200 hover:text-primary focus-visible:outline-none focus-visible:text-primary"
                >
                  {siteConfig.contact.email}
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="size-4 shrink-0 text-primary/70" aria-hidden="true" />
                <a
                  href={siteConfig.contact.phoneHref}
                  className="rounded transition-colors duration-200 hover:text-primary focus-visible:outline-none focus-visible:text-primary"
                >
                  {siteConfig.contact.phone}
                </a>
              </li>
              <li className="flex items-center gap-3">
                <MessageCircle className="size-4 shrink-0 text-primary/70" aria-hidden="true" />
                <a
                  href={siteConfig.contact.whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded transition-colors duration-200 hover:text-primary focus-visible:outline-none focus-visible:text-primary"
                >
                  WhatsApp
                </a>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="mt-0.5 size-4 shrink-0 text-primary/70" aria-hidden="true" />
                <span>
                  Doorstep home services in {siteConfig.coverage.city}
                  <br />
                  Event partners across India
                </span>
              </li>
            </ul>
          </motion.div>

          {/* Desktop navigation columns */}
          <div className="hidden lg:col-span-8 lg:grid lg:grid-cols-4 lg:gap-10">
            {footerColumns.map((column, i) => (
              <motion.nav key={column.title} aria-label={column.title} {...reveal(0.08 * (i + 1))}>
                <h2 className="text-label text-foreground/90">{column.title}</h2>
                <ul className="mt-5 space-y-3.5" role="list">
                  {column.links.map(link => (
                    <li key={link.href + link.label}>
                      <Link
                        href={link.href}
                        className="group inline-flex items-center gap-1 rounded text-[0.9375rem] text-muted-foreground transition-colors duration-200 ease-out hover:text-primary focus-visible:outline-none focus-visible:text-primary"
                      >
                        {link.label}
                        <ArrowUpRight
                          className="size-3.5 -translate-x-1 opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100"
                          aria-hidden="true"
                        />
                      </Link>
                    </li>
                  ))}
                </ul>
              </motion.nav>
            ))}

            {/* Follow Us */}
            <motion.nav aria-label="Follow Us" {...reveal(0.08 * (footerColumns.length + 1))}>
              <h2 className="text-label text-foreground/90">Follow Us</h2>
              <p className="mt-5 max-w-[15rem] text-[0.9375rem] leading-6 text-muted-foreground">
                Occasional updates on new services, design ideas and offers.
              </p>
              <SocialRow className="mt-5" />
            </motion.nav>
          </div>

          {/* Mobile: accordion navigation */}
          <div className="lg:hidden">
            <Accordion className="border-t border-border-subtle">
              {footerColumns.map(column => (
                <AccordionItem key={column.title} value={column.title}>
                  <AccordionTrigger>{column.title}</AccordionTrigger>
                  <AccordionContent>
                    <ul className="space-y-1" role="list">
                      {column.links.map(link => (
                        <li key={link.href + link.label}>
                          <Link
                            href={link.href}
                            className="block rounded py-2 text-[0.9375rem] text-muted-foreground transition-colors duration-200 hover:text-primary focus-visible:outline-none focus-visible:text-primary"
                          >
                            {link.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              ))}

              {/* Follow Us */}
              <AccordionItem value="Follow Us">
                <AccordionTrigger>Follow Us</AccordionTrigger>
                <AccordionContent>
                  <p className="text-[0.9375rem] leading-6 text-muted-foreground">
                    Occasional updates on new services, design ideas and offers.
                  </p>
                  <SocialRow className="mt-4" />
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>

        {/* ── Divider ────────────────────────────────────────────────────── */}
        <motion.div
          className="h-px w-full origin-left bg-gradient-to-r from-transparent via-border to-transparent"
          initial={reduceMotion ? false : { scaleX: 0, opacity: 0 }}
          whileInView={{ scaleX: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={reduceMotion ? { duration: 0 } : { duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          aria-hidden="true"
        />

        {/* ── Bottom bar ─────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-8 py-9 lg:flex-row lg:items-center lg:justify-between">
          {/* Copyright + legal */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
            <p className="text-[0.8125rem] text-muted-foreground/80">
              © {new Date().getFullYear()} {siteConfig.legalName}. All rights reserved.
            </p>
            <Separator orientation="vertical" className="hidden h-4 bg-muted sm:block" />
            <ul className="flex flex-wrap items-center gap-x-5 gap-y-2" role="list">
              {legalLinks.map(link => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="rounded text-[0.8125rem] text-muted-foreground/80 transition-colors duration-200 hover:text-primary focus-visible:outline-none focus-visible:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Developer credit */}
          <motion.div
            className="text-[0.8125rem] text-muted-foreground"
            initial={reduceMotion ? false : { opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={reduceMotion ? { duration: 0 } : { duration: 0.5, delay: 0.15 }}
          >
            Designed by{' '}
            <a
              href="https://softixtech.in"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground/90 transition-colors hover:text-primary focus-visible:outline-none focus-visible:text-primary"
            >
              softixtech.in
            </a>
          </motion.div>
        </div>
      </div>
    </footer>
  )
}