import type { ReactNode } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import SiteShell from '@/components/layout/SiteShell'
import { buttonClass } from '@/lib/button-styles'
import { siteConfig } from '@/lib/site-config'

export interface LegalSection {
  heading: string
  paragraphs: string[]
  bullets?: string[]
}

interface LegalPageProps {
  eyebrow: string
  title: string
  /** ISO date of the last revision. */
  updated: string
  intro: string
  sections: LegalSection[]
}

/**
 * Shared shell for /terms and /privacy so both legal documents render with the
 * same typography, navigation and last-updated treatment.
 */
export default function LegalPage({ eyebrow, title, updated, intro, sections }: LegalPageProps) {
  const lastUpdated = new Date(updated).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <SiteShell>
      <div className="mx-auto w-full max-w-3xl px-5 py-16 sm:py-20 lg:px-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[0.8125rem] font-medium text-muted-foreground transition-colors duration-200 hover:text-primary focus-visible:outline-none focus-visible:text-primary"
        >
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          Back to home
        </Link>

        <header className="mt-8">
          <span className="text-label text-primary">{eyebrow}</span>
          <h1 className="mt-4 text-balance font-serif text-[clamp(2rem,5vw,3rem)] leading-[1.05] tracking-tight text-foreground">
            {title}
          </h1>
          <p className="mt-3 text-sm text-muted-foreground/80">Last updated {lastUpdated}</p>
          <p className="mt-6 text-pretty text-[0.9375rem] leading-7 text-muted-foreground">{intro}</p>
        </header>

        <nav aria-label="On this page" className="mt-10 rounded-2xl border border-border-subtle bg-muted/50 p-6">
          <p className="text-label text-muted-foreground">On this page</p>
          <ol className="mt-4 space-y-2.5">
            {sections.map((section, i) => (
              <li key={section.heading} className="flex gap-3 text-sm">
                <span className="text-muted-foreground/80 tabular-nums">{String(i + 1).padStart(2, '0')}</span>
                <a
                  href={`#section-${i + 1}`}
                  className="text-muted-foreground transition-colors duration-200 hover:text-primary focus-visible:outline-none focus-visible:text-primary"
                >
                  {section.heading}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="mt-12 space-y-12">
          {sections.map((section, i) => (
            <LegalSectionBlock key={section.heading} section={section} index={i + 1} />
          ))}
        </div>

        <div className="mt-16 rounded-2xl border border-border-subtle bg-muted/50 p-6 sm:p-7">
          <h2 className="text-base font-medium text-foreground/90">Questions about this document?</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Reach us at{' '}
            <a
              href={`mailto:${siteConfig.contact.email}`}
              className="text-primary underline-offset-4 hover:underline"
            >
              {siteConfig.contact.email}
            </a>{' '}
            or through the contact form. We will clarify anything that is unclear.
          </p>
          <Link href="/contact" className={buttonClass('secondary', 'md', 'mt-5')}>
            Contact support
          </Link>
        </div>
      </div>
    </SiteShell>
  )
}

function LegalSectionBlock({ section, index }: { section: LegalSection; index: number }) {
  return (
    <section id={`section-${index}`} className="scroll-mt-28">
      <h2 className="flex items-baseline gap-3 text-lg font-medium text-foreground/90">
        <span className="text-sm text-primary/70 tabular-nums">{String(index).padStart(2, '0')}</span>
        {section.heading}
      </h2>
      <div className="mt-4 space-y-4">
        {section.paragraphs.map(paragraph => (
          <p key={paragraph.slice(0, 40)} className="text-pretty text-[0.9375rem] leading-7 text-muted-foreground">
            {paragraph}
          </p>
        ))}
      </div>
      {section.bullets && section.bullets.length > 0 && (
        <ul className="mt-4 space-y-2.5">
          {section.bullets.map(item => (
            <li key={item} className="flex gap-3 text-[0.9375rem] leading-7 text-muted-foreground">
              <span className="mt-3 size-1 shrink-0 rounded-full bg-primary/60" aria-hidden="true" />
              <span className="text-pretty">{item}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}