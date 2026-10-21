'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

/**
 * Heptome theme system.
 *
 * - One global `Theme` state, persisted in localStorage (`heptome-theme`).
 * - The class lives on `<html>` and the inline bootstrap script in
 *   `app/layout.tsx` applies it BEFORE first paint, so there is no flash of
 *   the wrong theme and no hydration mismatch (the server and the client
 *   first render agree; the stored value only affects DOM mutations after
 *   hydration).
 * - First visit defaults to the cinematic dark design; the visitor's explicit
 *   choice then persists across refreshes and navigation.
 * - Blocking structures (3D hero, fall-back art) read from static tokens and
 *   stay dark in both themes by design.
 */

export type Theme = 'light' | 'dark'

export const THEME_STORAGE_KEY = 'heptome-theme'

function bootstrapTheme(): Theme | null {
  if (typeof window === 'undefined') return null
  const applied = document.documentElement.dataset.theme
  if (applied === 'light' || applied === 'dark') return applied
  // Pre-hydration the inline script may not have run for some reason — do the
  // same job it does so `theme` is never out of sync with the class list.
  let stored: string | null = null
  try {
    stored = window.localStorage.getItem(THEME_STORAGE_KEY)
  } catch {
    stored = null
  }
  const theme: Theme = stored === 'light' || stored === 'dark' ? stored : 'dark'
  document.documentElement.classList.toggle('dark', theme === 'dark')
  document.documentElement.dataset.theme = theme
  return theme
}

let switchTimer: ReturnType<typeof setTimeout> | undefined

function applyTheme(theme: Theme) {
  const root = document.documentElement
  root.classList.toggle('dark', theme === 'dark')
  root.dataset.theme = theme

  // One short cross-fade of background/border/colors, then cleanup so steady
  // state never carries transition classes (reduced-motion users get the
  // instant switch because globals.css reduces all transitions).
  root.classList.add('theme-switching')
  if (switchTimer) clearTimeout(switchTimer)
  switchTimer = setTimeout(() => root.classList.remove('theme-switching'), 380)
}

interface ThemeContextValue {
  /** `null` until the client is mounted (SSR/first render agree on dark). */
  theme: Theme | null
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: null,
  setTheme: () => {},
  toggleTheme: () => {},
})

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme | null>(null)

  const setTheme = useCallback((next: Theme) => {
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next)
    } catch {
      // Storage unavailable (private mode, quota…) — the choice still applies
      // for this session; persistence silently degrades.
    }
    applyTheme(next)
    setThemeState(next)
  }, [])

  const toggleTheme = useCallback(() => {
    // The DOM class list is the source of truth — safe inside the callback
    // (no stale state) and identical after hydration.
    const current: Theme = document.documentElement.classList.contains('dark') ? 'dark' : 'light'
    setTheme(current === 'dark' ? 'light' : 'dark')
  }, [setTheme])

  useEffect(() => {
    setThemeState(bootstrapTheme())
  }, [])

  const value = useMemo(
    () => ({ theme, setTheme, toggleTheme }),
    [theme, setTheme, toggleTheme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  return useContext(ThemeContext)
}
