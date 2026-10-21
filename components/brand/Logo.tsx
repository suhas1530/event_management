import Link from 'next/link'
import { cn } from '@/lib/utils'
import { brand } from '@/lib/brand'

/**
 * Heptome wordmark.
 *
 * The mark is a heptagon (seven sides — the "many moments" of a customer's
 * life) holding a house glyph, so one symbol covers both verticals: events on
 * the outside, home care at the centre. Drawn inline in SVG so it stays crisp
 * at every size, needs no asset pipeline and can be tinted per surface.
 */

const SIZES = {
  sm: { mark: 'size-8 rounded-lg', glyph: 'size-4', word: 'text-xl' },
  md: { mark: 'size-10 rounded-xl', glyph: 'size-5', word: 'text-2xl' },
  lg: { mark: 'size-12 rounded-2xl', glyph: 'size-7', word: 'text-3xl' },
} as const

export function HeptomeMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {/* Heptagon — seven sides, one per facet of a customer's life */}
      <polygon
        points="12,3.4 18.72,6.64 20.38,13.91 15.73,19.75 8.27,19.75 3.62,13.91 5.28,6.64"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
        opacity="0.75"
      />
      {/* House — the home-care vertical at the centre of the mark */}
      <path
        d="M8.2 12.2 12 9.4l3.8 2.8"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.5 12.4h5v4.1h-5z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  )
}

interface LogoProps {
  /** Wrap the mark in a link to the homepage. */
  linked?: boolean
  size?: keyof typeof SIZES
  /** `dark` = light wordmark for dark chrome, `light` = charcoal for ivory. */
  tone?: 'dark' | 'light'
  /** Hide the mark and render the wordmark alone (used in tight spaces). */
  markOnly?: boolean
  className?: string
}

export default function Logo({
  linked = true,
  size = 'sm',
  tone = 'dark',
  markOnly = false,
  className,
}: LogoProps) {
  const s = SIZES[size]

  const content = (
    <>
      {!markOnly && (
        <span className={cn('flex items-center justify-center bg-primary text-primary-foreground transition-transform duration-300 ease-out group-hover:scale-105', s.mark)}>
          <HeptomeMark className={s.glyph} />
        </span>
      )}
      <span
        className={cn(
          'font-display leading-none tracking-tight',
          s.word,
          tone === 'dark' ? 'text-foreground' : 'text-hept-charcoal'
        )}
      >
        {brand.wordmark}
        <span className="text-accent" aria-hidden="true">
          .
        </span>
      </span>
    </>
  )

  if (!linked) {
    return <span className={cn('flex items-center gap-2.5', className)}>{content}</span>
  }

  return (
    <Link
      href="/"
      aria-label={`${brand.name} — home`}
      className={cn(
        'group flex shrink-0 items-center gap-2.5 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        tone === 'dark' ? 'focus-visible:ring-offset-[#0b0b0d]' : 'focus-visible:ring-offset-hept-ivory',
        className
      )}
    >
      {content}
    </Link>
  )
}
