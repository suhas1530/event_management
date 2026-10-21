'use client'

import { AlertTriangle, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ErrorStateProps {
  title?: string
  description?: string
  /** Re-runs the failed loader. Omit to hide the retry button. */
  onRetry?: () => void
  retryLabel?: string
  className?: string
}

/**
 * Error state (Part 35).
 *
 * Shown instead of an exception bubbling into the UI. Raw server messages are
 * never surfaced to the user — only calm, actionable copy.
 */
export default function ErrorState({
  title = 'Something went wrong.',
  description = "We couldn't load this right now. Please try again in a moment.",
  onRetry,
  retryLabel = 'Try again',
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border border-border-subtle bg-muted/50 px-6 py-14 text-center',
        className
      )}
    >
      <span className="mb-5 grid size-14 place-items-center rounded-2xl border border-red-500/20 bg-red-500/10">
        <AlertTriangle className="size-6 text-red-300" aria-hidden="true" />
      </span>
      <h3 className="text-balance text-base font-medium text-foreground/90">{title}</h3>
      <p className="mt-2 max-w-sm text-pretty text-sm leading-6 text-muted-foreground">{description}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-7 inline-flex items-center justify-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-foreground/90 transition-all duration-200 ease-out hover:-translate-y-px hover:border-primary/50 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0b0d]"
        >
          <RefreshCw className="size-4" aria-hidden="true" />
          {retryLabel}
        </button>
      )}
    </div>
  )
}