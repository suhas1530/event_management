'use client'

import { ArrowLeft, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ScrollRailButtonsProps {
  /** DOM id of the scroll-snap rail these buttons control. */
  targetId: string
  leftLabel: string
  rightLabel: string
  /** Maximum distance of one click, in CSS pixels. */
  step?: number
  className?: string
  buttonClassName?: string
}

/**
 * Two small client-side buttons for a server-rendered scroll rail.
 *
 * Keeping the rail itself in a server component means the whole card list is
 * HTML, not hydration work. Only these two controls need JavaScript; touch,
 * trackpad, keyboard and no-JS visitors still scroll the native overflow list.
 */
export default function ScrollRailButtons({
  targetId,
  leftLabel,
  rightLabel,
  step = 720,
  className,
  buttonClassName,
}: ScrollRailButtonsProps) {
  function scroll(direction: 1 | -1) {
    const rail = document.getElementById(targetId)
    if (!rail) return
    rail.scrollBy({
      left: direction * Math.min(rail.clientWidth * 0.8, step),
      behavior: 'smooth',
    })
  }

  const classes = cn(
    'flex size-10 items-center justify-center rounded-full border border-border bg-background text-foreground transition-colors hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
    buttonClassName,
  )

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <button type="button" onClick={() => scroll(-1)} aria-label={leftLabel} className={classes}>
        <ArrowLeft className="size-4" aria-hidden="true" />
      </button>
      <button type="button" onClick={() => scroll(1)} aria-label={rightLabel} className={classes}>
        <ArrowRight className="size-4" aria-hidden="true" />
      </button>
    </div>
  )
}
