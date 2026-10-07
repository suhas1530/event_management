'use client'

import { forwardRef, type HTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { ChevronRight } from 'lucide-react'

interface StepperProps extends HTMLAttributes<HTMLDivElement> {
  steps: Array<{ label: string; description?: string; href?: string }>
  currentStep: number
  orientation?: 'horizontal' | 'vertical'
  variant?: 'default' | 'compact'
  className?: string
}

export const Stepper = forwardRef<HTMLDivElement, StepperProps>(
  ({ className, steps, currentStep, orientation = 'horizontal', variant = 'default', children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('relative', className)} {...props}>
        <ol className={cn('flex items-center', orientation === 'vertical' ? 'flex-col' : '')} role="list">
          {steps.map((step, index) => {
            const isActive = index === currentStep
            const isCompleted = index < currentStep
            const isLast = index === steps.length - 1

            return (
              <li key={step.label} className={cn('relative flex items-center', orientation === 'vertical' ? 'flex-col items-start gap-2' : 'flex-1')}>
                {/* Connector line */}
                {!isLast && orientation === 'horizontal' && (
                  <div className={cn('absolute left-1/2 top-[14px] w-full h-0.5 -translate-x-1/2', isCompleted ? 'bg-primary' : 'bg-border')} aria-hidden="true" />
                )}
                {!isLast && orientation === 'vertical' && (
                  <div className={cn('absolute left-[14px] top-1/2 h-full w-0.5 -translate-y-1/2', isCompleted ? 'bg-primary' : 'bg-border')} aria-hidden="true" />
                )}

                <div className={cn('relative flex items-center gap-3 z-10', orientation === 'vertical' ? 'flex-row' : 'flex-col items-center')}>
                  {/* Step indicator */}
                  <div className={cn(
                    'flex items-center justify-center transition-all duration-300',
                    isCompleted
                      ? 'bg-primary text-primary-foreground'
                      : isActive
                      ? 'bg-primary text-primary-foreground ring-4 ring-primary/20'
                      : 'bg-muted text-muted-foreground border-2 border-border'
                  )}>
                    {isCompleted ? (
                      <svg className="size-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <span className="font-medium">{index + 1}</span>
                    )}
                  </div>

                  {/* Step content */}
                  <div className={cn('text-center', orientation === 'vertical' ? 'text-left' : '')}>
                    <span className={cn(
                      'font-medium transition-colors',
                      isActive || isCompleted ? 'text-foreground' : 'text-muted-foreground',
                      variant === 'compact' ? 'text-sm' : 'text-base'
                    )}>
                      {step.label}
                    </span>
                    {step.description && variant !== 'compact' && (
                      <span className={cn(
                        'block text-sm transition-colors mt-0.5',
                        isActive || isCompleted ? 'text-muted-foreground' : 'text-muted-foreground/60'
                      )}>
                        {step.description}
                      </span>
                    )}
                  </div>
                </div>
              </li>
            )
          })}
        </ol>
      </div>
    )
  }
)

Stepper.displayName = 'Stepper'

interface StepperNavProps extends HTMLAttributes<HTMLDivElement> {
  currentStep: number
  totalSteps: number
  onNext: () => void
  onBack: () => void
  onSubmit?: () => void
  isLastStep?: boolean
  submitting?: boolean
  nextLabel?: string
  backLabel?: string
  submitLabel?: string
}

export function StepperNav({
  currentStep,
  totalSteps,
  onNext,
  onBack,
  onSubmit,
  isLastStep = false,
  submitting = false,
  nextLabel = 'Continue',
  backLabel = 'Back',
  submitLabel = 'Submit',
  className,
  ...props
}: StepperNavProps) {
  return (
    <div className={cn('flex items-center justify-between gap-4 mt-8 pt-6 border-t border-border', className)} {...props}>
      <button
        type="button"
        onClick={onBack}
        disabled={currentStep === 0}
        className="btn-secondary btn-sm"
        aria-disabled={currentStep === 0}
      >
        {backLabel}
      </button>

      <div className="flex-1" />

      {isLastStep && onSubmit ? (
        <button
          type="button"
          onClick={onSubmit}
          disabled={submitting}
          className="btn-primary btn-sm"
        >
          {submitting ? 'Submitting…' : submitLabel}
        </button>
      ) : (
        <button
          type="button"
          onClick={onNext}
          className="btn-primary btn-sm group"
        >
          {nextLabel}
          <ChevronRight className="size-4 transition group-hover:translate-x-1" aria-hidden="true" />
        </button>
      )}
    </div>
  )
}