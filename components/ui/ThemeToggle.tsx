'use client'

import { useEffect, useRef, useState } from 'react'
import { Check, Monitor, Moon, Sun } from 'lucide-react'
import { useTheme, type Theme } from '@/lib/theme-context'
import { cn } from '@/lib/utils'

type Variant = 'icon' | 'drawer'

interface ThemeToggleProps {
  variant?: Variant
  className?: string
}

const THEME_OPTIONS: {
  value: Theme
  label: string
  hint: string
  icon: typeof Sun
}[] = [
  { value: 'light', label: 'Light', hint: 'Warm ivory', icon: Sun },
  { value: 'dark', label: 'Dark', hint: 'Midnight premium', icon: Moon },
  { value: 'system', label: 'System', hint: 'Match your device', icon: Monitor },
]

/**
 * The single appearance control for the whole platform.
 *
 * - Compact header variant: an icon button with a keyboard-operable menu.
 * - Drawer variant: a labelled three-way radio group.
 *
 * The pre-hydration icon is driven by the `dark` class and the
 * `data-theme-mode` attribute, so it is correct before React mounts. The
 * selected menu item syncs after mount.
 */
export default function ThemeToggle({ variant = 'icon', className }: ThemeToggleProps) {
  const { mode, theme, setMode } = useTheme()
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    const onPointerDown = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        setOpen(false)
        buttonRef.current?.focus()
      }
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const items = menuRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitemradio"]')
    const selected = menuRef.current?.querySelector<HTMLButtonElement>('[aria-checked="true"]')
    ;(selected ?? items?.[0])?.focus()
  }, [open])

  function choose(next: Theme) {
    setMode(next)
    setOpen(false)
    buttonRef.current?.focus()
  }

  function onMenuKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return
    const items = Array.from(
      menuRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitemradio"]') ?? [],
    )
    if (items.length === 0) return
    event.preventDefault()
    const current = items.indexOf(document.activeElement as HTMLButtonElement)
    const next =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? items.length - 1
          : event.key === 'ArrowDown'
            ? (current + 1 + items.length) % items.length
            : (current - 1 + items.length) % items.length
    items[next]?.focus()
  }

  if (variant === 'drawer') {
    return (
      <div
        className={cn(
          'rounded-xl border border-border bg-card px-3 py-3 text-sm',
          className,
        )}
      >
        <div className="mb-2.5 flex items-center justify-between gap-3 px-1">
          <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Appearance
          </span>
          <span className="text-[11px] text-subtle-foreground">
            {mode === 'system' ? `System · ${theme ?? 'auto'}` : mode ?? 'Auto'}
          </span>
        </div>
        <div role="radiogroup" aria-label="Appearance" className="grid grid-cols-3 gap-1">
          {THEME_OPTIONS.map(({ value, label, icon: Icon }) => {
            const selected = mode === value
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setMode(value)}
                className={cn(
                  'flex min-h-11 flex-col items-center justify-center gap-1 rounded-lg border px-1 py-2 text-[11px] font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  selected
                    ? 'border-primary/60 bg-primary/10 text-foreground'
                    : 'border-transparent text-muted-foreground hover:border-border hover:bg-muted/60 hover:text-foreground',
                )}
              >
                <Icon
                  className={cn('size-4', selected ? 'text-primary' : 'text-subtle-foreground')}
                  aria-hidden="true"
                />
                {label}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen(value => !value)}
        aria-label="Theme settings"
        aria-haspopup="menu"
        aria-expanded={open}
        title={mode ? `Theme: ${mode === 'system' ? `System (${theme ?? 'auto'})` : mode}` : 'Theme settings'}
        className={cn(
          'relative rounded-lg p-2 text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          className,
        )}
      >
        <Sun
          className="theme-icon-resolved size-[18px] transition-transform duration-300 dark:hidden"
          aria-hidden="true"
        />
        <Moon
          className="theme-icon-resolved hidden size-[18px] transition-transform duration-300 dark:block"
          aria-hidden="true"
        />
        <span
          className="theme-system-indicator absolute bottom-1 right-1 size-1.5 rounded-full bg-gold"
          aria-hidden="true"
        />
      </button>

      {open && (
        <div
          ref={menuRef}
          role="menu"
          aria-label="Appearance"
          onKeyDown={onMenuKeyDown}
          className="animate-fade-in absolute right-0 top-full z-[var(--z-popover)] mt-2 w-60 overflow-hidden rounded-xl border border-popover-border bg-popover p-1.5 text-popover-foreground shadow-popover"
        >
          <p className="px-3 pb-1.5 pt-1 text-[10px] font-medium uppercase tracking-[0.18em] text-subtle-foreground">
            Appearance
          </p>
          {THEME_OPTIONS.map(({ value, label, hint, icon: Icon }) => {
            const selected = mode === value
            return (
              <button
                key={value}
                type="button"
                role="menuitemradio"
                aria-checked={selected}
                onClick={() => choose(value)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors duration-150 focus-visible:bg-muted/70 focus-visible:outline-none',
                  selected ? 'bg-primary/10' : 'hover:bg-muted/70',
                )}
              >
                <span
                  className={cn(
                    'flex size-8 shrink-0 items-center justify-center rounded-lg border',
                    selected
                      ? 'border-primary/30 bg-primary/10 text-primary'
                      : 'border-border bg-muted/40 text-muted-foreground',
                  )}
                >
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-foreground">{label}</span>
                  <span className="block text-xs text-subtle-foreground">{hint}</span>
                </span>
                {selected && <Check className="size-4 shrink-0 text-primary" aria-hidden="true" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
