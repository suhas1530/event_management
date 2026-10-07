'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { buttonClass, type ButtonSize, type ButtonVariant } from '@/lib/button-styles'

// Re-exported so server components can import button styling without pulling in
// this client module.
export { buttonClass } from '@/lib/button-styles'
export type { ButtonSize, ButtonVariant } from '@/lib/button-styles'

/* ------------------------------------------------------------------ */
/* Page header                                                         */
/* ------------------------------------------------------------------ */

interface PageHeaderProps {
  eyebrow?: string
  title: string
  description?: string
  actions?: ReactNode
  align?: 'left' | 'center'
  className?: string
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  align = 'left',
  className,
}: PageHeaderProps) {
  const reduceMotion = useReducedMotion()

  return (
    <motion.header
      initial={reduceMotion ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reduceMotion ? { duration: 0 } : { duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'flex flex-col gap-5',
        align === 'center' && 'items-center text-center',
        className
      )}
    >
      {eyebrow && (
        <span className="inline-flex items-center gap-2 text-label text-primary">
          <span className="h-px w-6 bg-primary/50" aria-hidden="true" />
          {eyebrow}
        </span>
      )}
      <h1 className="text-balance font-serif text-[clamp(2rem,5vw,3.25rem)] leading-[1.05] tracking-tight text-white">
        {title}
      </h1>
      {description && (
        <p className="max-w-2xl text-pretty text-base leading-7 text-white/50">{description}</p>
      )}
      {actions && <div className="mt-1 flex flex-wrap items-center gap-3">{actions}</div>}
    </motion.header>
  )
}

/* ------------------------------------------------------------------ */
/* Section                                                             */
/* ------------------------------------------------------------------ */

interface SectionProps {
  id?: string
  eyebrow?: string
  /** Optional — a section may be purely presentational (e.g. a card grid). */
  title?: string
  description?: string
  align?: 'left' | 'center'
  children: ReactNode
  className?: string
  /** Vertical rhythm. */
  spacing?: 'sm' | 'md' | 'lg'
}

const SPACING = {
  sm: 'py-14 sm:py-16',
  md: 'py-16 sm:py-20 lg:py-24',
  lg: 'py-20 sm:py-24 lg:py-32',
} as const

export function Section({
  id,
  eyebrow,
  title,
  description,
  align = 'center',
  children,
  className,
  spacing = 'md',
}: SectionProps) {
  const reduceMotion = useReducedMotion()

  return (
    <section id={id} className={cn(SPACING[spacing], className)}>
      <div className="mx-auto w-full max-w-[1380px] px-5 sm:px-8 lg:px-10">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={reduceMotion ? { duration: 0 } : { duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className={cn(
            'flex flex-col gap-4',
            align === 'center' ? 'mx-auto max-w-2xl items-center text-center' : 'max-w-2xl'
          )}
        >
          {eyebrow && <span className="text-label text-primary">{eyebrow}</span>}
          {title && (
            <h2 className="text-balance font-serif text-[clamp(1.75rem,4vw,2.75rem)] leading-[1.1] tracking-tight text-white">
              {title}
            </h2>
          )}
          {description && (
            <p className="text-pretty text-base leading-7 text-white/45">{description}</p>
          )}
        </motion.div>

        <div className="mt-12 sm:mt-16">{children}</div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* Buttons                                                             */
/* ------------------------------------------------------------------ */

interface ActionLinkProps {
  href: string
  children: ReactNode
  variant?: ButtonVariant
  size?: ButtonSize
  className?: string
  external?: boolean
  'aria-label'?: string
}

export function ActionLink({
  href,
  children,
  variant = 'primary',
  size = 'md',
  className,
  external,
  'aria-label': ariaLabel,
}: ActionLinkProps) {
  const classes = buttonClass(variant, size, className)

  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={ariaLabel}
        className={classes}
      >
        {children}
      </a>
    )
  }

  return (
    <Link href={href} aria-label={ariaLabel} className={classes}>
      {children}
    </Link>
  )
}