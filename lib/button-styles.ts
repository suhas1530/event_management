import { cn } from './utils'

/**
 * Button styling.
 *
 * This module is deliberately free of React hooks and the `'use client'`
 * directive so both server and client components can call `buttonClass()` to
 * build a class string. Anything needing browser APIs (motion, state, reduced
 * motion) belongs in a client component, not here.
 */

export const BUTTON_BASE =
  'inline-flex items-center justify-center gap-2 rounded-lg text-sm font-semibold transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0b0d] disabled:pointer-events-none disabled:opacity-50'

export const BUTTON_VARIANTS = {
  primary:
    'bg-primary text-primary-foreground hover:-translate-y-px hover:bg-primary-hover hover:shadow-lg',
  secondary:
    'border border-white/15 text-white/80 hover:-translate-y-px hover:border-primary/50 hover:text-primary',
  ghost: 'text-white/60 hover:bg-white/5 hover:text-white',
  link: 'text-primary underline-offset-4 hover:underline',
} as const

export const BUTTON_SIZES = {
  sm: 'px-4 py-2 text-[0.8125rem]',
  md: 'px-5 py-2.5',
  lg: 'px-7 py-3.5 text-base',
} as const

export type ButtonVariant = keyof typeof BUTTON_VARIANTS
export type ButtonSize = keyof typeof BUTTON_SIZES

export function buttonClass(
  variant: ButtonVariant = 'primary',
  size: ButtonSize = 'md',
  className?: string
) {
  return cn(BUTTON_BASE, BUTTON_VARIANTS[variant], BUTTON_SIZES[size], className)
}
