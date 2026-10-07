'use client'

import { forwardRef, type HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'
import { ChevronRight } from 'lucide-react'

interface TimelineItem {
  title: string
  description?: string
  time?: string
  status: 'completed' | 'current' | 'pending'
  icon?: React.ReactNode
  color?: string
}

interface TimelineProps extends HTMLAttributes<HTMLDivElement> {
  items: TimelineItem[]
  variant?: 'default' | 'compact' | 'alternating'
}

export const Timeline = forwardRef<HTMLDivElement, TimelineProps>(
  ({ className, items, variant = 'default', ...props }, ref) => {
    return (
      <div ref={ref} className={cn('relative', className)} {...props}>
        {/* Vertical line */}
        <div className="absolute left-[14px] top-0 bottom-0 w-0.5 bg-border" aria-hidden="true" />

        <div className="space-y-6">
          {items.map((item, index) => (
            <div key={index} className={cn('relative pl-10', variant === 'compact' ? 'pl-8' : '')}>
              {/* Dot indicator */}
              <div className={cn(
                'absolute left-0 top-0 flex size-7 items-center justify-center z-10 transition-all duration-300',
                item.status === 'completed' && 'bg-success text-success-foreground',
                item.status === 'current' && 'bg-primary text-primary-foreground ring-4 ring-primary/20 animate-pulse',
                item.status === 'pending' && 'bg-muted text-muted-foreground border-2 border-border'
              )}>
                {item.icon || (
                  item.status === 'completed' ? (
                    <svg className="size-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                    </svg>
                  ) : item.status === 'current' ? (
                    <div className="size-2 rounded-full bg-current animate-pulse" aria-hidden="true" />
                  ) : (
                    <div className="size-2 rounded-full bg-current" aria-hidden="true" />
                  )
                )}
              </div>

              {/* Content */}
              <div className={cn(
                'bg-card border border-card-border rounded-xl p-5 transition-slow hover:border-primary/30',
                item.status === 'current' && 'border-primary/30 bg-primary/5',
                variant === 'compact' && 'p-4'
              )}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h4 className={cn(
                      'font-medium transition-colors',
                      item.status === 'completed' ? 'text-foreground' : 'text-foreground',
                      item.status === 'current' ? 'text-primary' : '',
                      variant === 'compact' ? 'text-sm' : 'text-base'
                    )}>
                      {item.title}
                    </h4>
                    {item.description && (
                      <p className={cn('mt-1 text-sm text-muted-foreground', variant === 'compact' ? 'text-xs' : '')}>
                        {item.description}
                      </p>
                    )}
                  </div>
                  {item.time && (
                    <span className={cn('flex-shrink-0 text-sm text-muted-foreground whitespace-nowrap', variant === 'compact' ? 'text-xs' : '')}>
                      {item.time}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }
)

Timeline.displayName = 'Timeline'

interface TimelineStepperProps extends HTMLAttributes<HTMLDivElement> {
  steps: Array<{ label: string; description?: string }>
  currentStep: number
  orientation?: 'vertical' | 'horizontal'
}

export function TimelineStepper({ steps, currentStep, orientation = 'vertical', className, ...props }: TimelineStepperProps) {
  return (
    <div className={cn('relative', className)} {...props}>
      {orientation === 'vertical' && (
        <div className="absolute left-[14px] top-0 bottom-0 w-0.5 bg-border" aria-hidden="true" />
      )}

      <div className={cn('space-y-6', orientation === 'horizontal' && 'flex items-start')}>
        {steps.map((step, index) => {
          const isActive = index === currentStep
          const isCompleted = index < currentStep

          return (
            <div key={step.label} className={cn('relative pl-10', orientation === 'horizontal' && 'flex-1 min-w-0')}>
              <div className={cn(
                'absolute left-0 top-0 flex size-7 items-center justify-center z-10 transition-all duration-300',
                isCompleted ? 'bg-success text-success-foreground' : 'bg-muted text-muted-foreground border-2 border-border'
              )}>
                {isCompleted ? (
                  <svg className="size-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <span className="text-sm font-medium">{index + 1}</span>
                )}
              </div>

              <div className={cn('bg-card border border-card-border rounded-xl p-5 transition-slow', isActive && 'border-primary/30 bg-primary/5')}>
                <h4 className={cn('font-medium transition-colors', isActive || isCompleted ? 'text-foreground' : 'text-muted-foreground')}>
                  {step.label}
                </h4>
                {step.description && (
                  <p className="mt-1 text-sm text-muted-foreground">{step.description}</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}