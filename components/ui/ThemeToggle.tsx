'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme, type Theme } from '@/lib/theme-context'
import { cn } from '@/lib/utils'

type Variant = 'icon' | 'drawer'

interface ThemeToggleProps {
  variant?: Variant
  className?: string
}

/**
 * The single theme switcher used across the platform.
 *
 * - Sun for the light theme, Moon for the dark theme (the icon shows the
 *   theme you are currently in).
 * - `aria-label` + `title` always describe the ACTION ("Switch to light
 *   mode"), keyboard focusable, `aria-pressed` reports whether dark mode is on.
 * - Before hydration both renders (server + first client render) agree, so
 *   there is no icon/label flash.
 */
export default function ThemeToggle({ variant = 'icon', className }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme()

  // Dark is the product default, so the un-mounted render (and the very first
  // client render) assumes dark — no label flicker.
  const active: Theme = theme ?? 'dark'
  const target: Theme = active === 'dark' ? 'light' : 'dark'
  const label = `Switch to ${target} mode`

  const icon = active === 'dark'
    ? <Moon className="size-[18px]" aria-hidden="true" />
    : <Sun className="size-[18px]" aria-hidden="true" />

  if (variant === 'drawer') {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={label}
        aria-pressed={active === 'dark'}
        title={label}
        className={cn(
          'flex w-full items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3 text-sm text-foreground/80 transition-colors duration-200 hover:bg-muted/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          className,
        )}
      >
        <span className="font-medium">Appearance</span>
        <span className="flex items-center gap-2 text-xs text-muted-foreground normal-case tracking-normal">
          {active === 'dark' ? 'Dark' : 'Light'}
          <span
            aria-hidden="true"
            className="flex size-7 items-center justify-center rounded-full bg-muted text-foreground/70"
          >
            {icon}
          </span>
        </span>
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      aria-pressed={active === 'dark'}
      title={label}
      className={cn(
        'rounded-lg p-2 text-foreground/60 transition-colors duration-200 hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className,
      )}
    >
      {icon}
    </button>
  )
}
