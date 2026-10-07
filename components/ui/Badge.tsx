'use client'

import { forwardRef, type HTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'success' | 'warning' | 'destructive' | 'info' | 'neutral' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  dot?: boolean
  dotColor?: string
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'neutral', size = 'md', dot, dotColor, children, ...props }, ref) => {
    const variantClasses = {
      primary: 'badge-primary',
      success: 'badge-success',
      warning: 'badge-warning',
      destructive: 'badge-destructive',
      info: 'badge-info',
      neutral: 'badge-neutral',
      outline: 'badge-outline',
    }

    const sizeClasses = {
      sm: 'px-2 py-0.5 text-[10px]',
      md: 'px-2.5 py-1 text-caption',
      lg: 'px-3 py-1.5 text-sm',
    }

    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center gap-1.5 font-medium uppercase tracking-[0.12em]',
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {dot && <span className="size-1.5 rounded-full" style={{ backgroundColor: dotColor || 'currentColor' }} aria-hidden="true" />}
        {children}
      </span>
    )
  }
)

Badge.displayName = 'Badge'