'use client'

import { forwardRef, type HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'
import { Star } from 'lucide-react'

interface RatingProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
  value: number
  max?: number
  size?: 'sm' | 'md' | 'lg'
  interactive?: boolean
  onChange?: (value: number) => void
  showLabel?: boolean
  label?: string
}

export const Rating = forwardRef<HTMLDivElement, RatingProps>(
  ({ className, value, max = 5, size = 'md', interactive = false, onChange, showLabel = false, label, ...props }, ref) => {
    const starSizes = {
      sm: 'size-3.5',
      md: 'size-4.5',
      lg: 'size-6',
    }

    const stars = Array.from({ length: max }, (_, i) => i + 1)

    const handleClick = (starValue: number) => {
      if (interactive && onChange) {
        onChange(starValue)
      }
    }

    const handleKeyDown = (e: React.KeyboardEvent, starValue: number) => {
      if (!interactive) return
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        onChange?.(starValue)
      } else if (e.key === 'ArrowRight' && starValue < max) {
        e.preventDefault()
        onChange?.(starValue + 1)
      } else if (e.key === 'ArrowLeft' && starValue > 1) {
        e.preventDefault()
        onChange?.(starValue - 1)
      }
    }

    return (
      <div ref={ref} className={cn('flex items-center gap-1', className)} {...props}>
        {stars.map(star => (
          <button
            key={star}
            type="button"
            role={interactive ? 'radio' : 'img'}
            aria-label={`${star} out of ${max} stars`}
            aria-checked={interactive && star <= Math.round(value)}
            disabled={!interactive}
            onClick={() => handleClick(star)}
            onKeyDown={e => handleKeyDown(e, star)}
            className={cn(
              'flex items-center justify-center transition-transform',
              starSizes[size],
              interactive && 'hover:scale-110 cursor-pointer focus-ring rounded',
              star <= Math.floor(value) ? 'text-primary fill-primary' : 'text-muted fill-transparent stroke-current'
            )}
            aria-hidden={!interactive}
          >
            <Star className={cn(starSizes[size], 'stroke-1.5')} />
          </button>
        ))}
        {showLabel && (
          <span className="ml-2 text-sm text-muted-foreground">
            {label || value.toFixed(1)}
          </span>
        )}
      </div>
    )
  }
)

Rating.displayName = 'Rating'