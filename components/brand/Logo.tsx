import Link from 'next/link'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { brand } from '@/lib/brand'

/**
 * Heptome brand lockup.
 *
 * The mark is the official Heptome emblem (`public/brand/heptome-emblem.png`,
 * the transparent cut of `public/logo.jpeg` — the copper hexagon inlay) paired
 * with the wordmark in the display face. The emblem is used as provided: no
 * recolouring, no distortion, `object-contain` at every size. It sits happily
 * on light surfaces, dark chrome and photography, so the only thing `tone`
 * changes is the wordmark colour.
 */

export const BRAND_EMBLEM_SRC = '/brand/heptome-emblem.png'

const SIZES = {
  sm: { mark: 32, word: 'text-xl' },
  md: { mark: 40, word: 'text-2xl' },
  lg: { mark: 48, word: 'text-3xl' },
} as const

interface LogoProps {
  /** Wrap the mark in a link to the homepage. */
  linked?: boolean
  size?: keyof typeof SIZES
  /** `auto` follows the theme; `dark` = light wordmark over photography/dark chrome. */
  tone?: 'auto' | 'dark' | 'light'
  /** Hide the mark and render the wordmark alone (used in tight spaces). */
  markOnly?: boolean
  className?: string
}

export default function Logo({
  linked = true,
  size = 'sm',
  tone = 'auto',
  markOnly = false,
  className,
}: LogoProps) {
  const s = SIZES[size]

  const content = (
    <>
      {!markOnly && (
        <span
          className="relative shrink-0 transition-transform duration-300 ease-out group-hover:scale-105"
          style={{ width: s.mark, height: s.mark }}
        >
          <Image
            src={BRAND_EMBLEM_SRC}
            alt={`${brand.name} emblem`}
            width={480}
            height={480}
            priority
            className="object-contain"
            sizes={`${s.mark}px`}
          />
        </span>
      )}
      <span
        className={cn(
          'font-display leading-none tracking-tight',
          s.word,
          tone === 'dark' ? 'text-white' : 'text-foreground'
        )}
      >
        {brand.wordmark}
        <span className={tone === 'dark' ? 'text-gold' : 'text-primary'} aria-hidden="true">
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
        'group flex shrink-0 items-center gap-2.5 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        className
      )}
    >
      {content}
    </Link>
  )
}
