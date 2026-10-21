import Link from 'next/link'
import { useId } from 'react'
import { cn } from '@/lib/utils'
import { siteConfig } from '@/lib/site-config'

/**
 * SoftixTech brand lockup.
 *
 * This keeps the developer credit readable while matching the provided brand
 * direction: a stronger geometric monogram and a polished gradient wordmark.
 * The asset can still be replaced later with the official logo without altering
 * the layout or calling code.
 */

interface SoftixTechMarkProps {
  /** Visual weight. `sm` fits inline next to "Designed & Developed by". */
  size?: 'sm' | 'md' | 'lg'
  /** Render as a link when an official URL is configured. */
  asLink?: boolean
  className?: string
}

const SIZES = {
  sm: { word: 'text-[0.95rem]', tag: 'text-[0.48rem]', gap: 'gap-1.5' },
  md: { word: 'text-base', tag: 'text-[0.56rem]', gap: 'gap-2' },
  lg: { word: 'text-[2.5rem] sm:text-[3rem] lg:text-[5rem]', tag: 'text-[0.62rem] sm:text-[0.72rem]', gap: 'gap-2.5' },
} as const

function Monogram({ className }: { className?: string }) {
  const gradientId = useId().replace(/:/g, '')

  return (
    <span
      className={cn(
        'relative grid place-items-center overflow-hidden rounded-lg bg-muted ring-1 ring-inset ring-white/15 shadow-[0_10px_24px_rgba(12,32,76,0.18)]',
        className
      )}
      aria-hidden="true"
    >
      <svg viewBox="0 0 120 120" className="h-full w-full" fill="none" aria-hidden="true">
        <defs>
          <linearGradient id={`softix-gradient-${gradientId}`} x1="12" y1="12" x2="104" y2="104" gradientUnits="userSpaceOnUse">
            <stop stopColor="#ff2a7d" />
            <stop offset="0.45" stopColor="#8a5bff" />
            <stop offset="1" stopColor="#1cc7ff" />
          </linearGradient>
        </defs>

        <path d="M23 19h44.5L58 46H18L23 19Z" fill={`url(#softix-gradient-${gradientId})`} opacity="0.96" />
        <path d="M43 44h36L68 72H32L43 44Z" fill={`url(#softix-gradient-${gradientId})`} opacity="0.9" />
        <path d="M58 68h31L82 100H49L58 68Z" fill={`url(#softix-gradient-${gradientId})`} opacity="0.9" />
        <path d="M20 89h59l-8 12H30L20 89Z" fill="#0f0f2a" opacity="0.12" />
        <path d="M75 24L90 24L64 58L48 58L75 24Z" fill="#ffffff" opacity="0.18" />
      </svg>
    </span>
  )
}

export function SoftixTechMark({ size = 'md', asLink = true, className }: SoftixTechMarkProps) {
  const { name, tagline, url } = siteConfig.developer
  const s = SIZES[size]

  const inner = (
    <>
      <Monogram className={cn(size === 'sm' ? 'size-8' : size === 'lg' ? 'size-16 sm:size-20 lg:size-28' : 'size-10')} />
      <span className={cn('flex flex-col justify-center leading-none', s.gap)}>
        <span className={cn('relative inline-flex items-start font-black tracking-[-0.08em] text-transparent bg-linear-to-r from-[#0f2fe8] via-[#2b68ff] to-[#ff2a7d] bg-clip-text drop-shadow-[0_2px_10px_rgba(18,45,184,0.18)]', s.word)}>
          {name}
          <sup className={cn('ml-1 align-top font-semibold text-[#111827] opacity-90', size === 'sm' ? 'text-[0.42rem]' : size === 'lg' ? 'text-[0.7rem] sm:text-[0.9rem]' : 'text-[0.54rem]')}>
            TM
          </sup>
        </span>
        <span className={cn('uppercase tracking-[0.18em] text-[#3f4b77]/75', s.tag)}>
          {tagline}
        </span>
      </span>
      <svg
        viewBox="0 0 24 24"
        className="size-3.5 -translate-x-1 text-primary opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M7 17 17 7M9 7h8v8" />
      </svg>
    </>
  )

  const classes = cn(
    'group inline-flex items-center rounded-xl outline-none transition-[transform,opacity] duration-200 ease-out focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
    className
  )

  if (!asLink || !url) {
    return (
      <span className={cn(classes, 'cursor-default')} aria-label={`${name} — ${tagline}`}>
        {inner}
      </span>
    )
  }

  return (
    <Link
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={classes}
      aria-label={`${name} — ${tagline} (opens in a new tab)`}
    >
      {inner}
    </Link>
  )
}

export default SoftixTechMark