import type { LucideIcon } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  /** Primary call to action — a link, e.g. { label: 'Book now', href: '/book/technician' }. */
  action?: { label: string; href: string }
  /** Secondary call to action. */
  secondaryAction?: { label: string; href: string }
  /** Optional inline action (button) instead of a link. */
  onAction?: () => void
  className?: string
}

/**
 * Empty state (Part 33).
 *
 * Every list in the product renders this instead of a blank area, so a user
 * always gets an explanation and a next step.
 */
export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center px-6 py-16 text-center sm:py-20', className)}>
      {Icon && (
        <span className="mb-5 grid size-14 place-items-center rounded-2xl border border-border-subtle bg-muted/50">
          <Icon className="size-6 text-primary/60" aria-hidden="true" />
        </span>
      )}
      <h3 className="text-balance text-base font-medium text-foreground/90">{title}</h3>
      {description && (
        <p className="mt-2 max-w-sm text-pretty text-sm leading-6 text-muted-foreground">{description}</p>
      )}

      {(action || secondaryAction || onAction) && (
        <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row">
          {action && (
            <Link
              href={action.href}
              className="inline-flex items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-all duration-200 ease-out hover:-translate-y-px hover:bg-primary-hover hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0b0d]"
            >
              {action.label}
            </Link>
          )}
          {!action && onAction && (
            <button
              type="button"
              onClick={onAction}
              className="inline-flex items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-all duration-200 ease-out hover:-translate-y-px hover:bg-primary-hover hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0b0d]"
            >
              Continue
            </button>
          )}
          {secondaryAction && (
            <Link
              href={secondaryAction.href}
              className="inline-flex items-center justify-center rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-foreground/90 transition-colors duration-200 h hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {secondaryAction.label}
            </Link>
          )}
        </div>
      )}
    </div>
  )
}