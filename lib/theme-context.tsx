'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'

/**
 * Heptome theme system — the single source of truth.
 *
 * - One `ThemeMode` (`light`, `dark`, `system`) lives in this provider.
 * - `system` follows the operating-system preference and keeps following it
 *   while the tab is open; it is a real mode, not a one-time snapshot.
 * - The resolved theme is written to `<html class="dark">`, `data-theme` and
 *   `data-theme-mode`. An inline bootstrap script in `app/layout.tsx` applies
 *   the same values before first paint, so there is no flash and no
 *   hydration mismatch.
 * - Explicit choices persist in localStorage under `heptome-theme`. A first
 *   visit defaults to `system` and writes nothing until the visitor chooses.
 */

export type Theme = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'

export const THEME_STORAGE_KEY = 'heptome-theme'

export function systemTheme(): ResolvedTheme {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function readStoredTheme(): Theme | null {
  if (typeof window === 'undefined') return null
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY)
    return stored === 'light' || stored === 'dark' || stored === 'system' ? stored : null
  } catch {
    return null
  }
}

function resolveTheme(mode: Theme): ResolvedTheme {
  return mode === 'system' ? systemTheme() : mode
}

let switchTimer: ReturnType<typeof setTimeout> | undefined

/** Applies a mode to the document and returns the concrete theme it resolved to. */
export function applyTheme(mode: Theme, animate = false): ResolvedTheme {
  if (typeof document === 'undefined') return resolveTheme(mode)

  const resolved = resolveTheme(mode)
  const root = document.documentElement

  root.classList.toggle('dark', resolved === 'dark')
  root.dataset.theme = resolved
  root.dataset.themeMode = mode

  if (animate && typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!reduced) {
      root.classList.add('theme-switching')
      if (switchTimer) clearTimeout(switchTimer)
      switchTimer = setTimeout(() => root.classList.remove('theme-switching'), 260)
    }
  }

  return resolved
}

interface ThemeContextValue {
  /** Selected mode. `null` until the client is mounted (SSR-safe). */
  mode: Theme | null
  /** Concrete light/dark theme currently painted. */
  theme: ResolvedTheme | null
  resolvedTheme: ResolvedTheme | null
  setMode: (mode: Theme) => void
  /** Backwards-compatible alias for `setMode`. */
  setTheme: (mode: Theme) => void
  /** Cycles light → dark → system. */
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue>({
  mode: null,
  theme: null,
  resolvedTheme: null,
  setMode: () => {},
  setTheme: () => {},
  toggleTheme: () => {},
})

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<Theme | null>(null)
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme | null>(null)
  const modeRef = useRef<Theme>('system')

  const commit = useCallback((next: Theme, persist: boolean) => {
    modeRef.current = next

    if (persist) {
      try {
        window.localStorage.setItem(THEME_STORAGE_KEY, next)
      } catch {
        // Storage unavailable (private mode, quota…) — the choice still
        // applies for this session; persistence degrades quietly.
      }
    }

    const resolved = applyTheme(next, true)
    setModeState(next)
    setResolvedTheme(resolved)
  }, [])

  const setMode = useCallback((next: Theme) => commit(next, true), [commit])
  const toggleTheme = useCallback(() => {
    const current = modeRef.current
    const next: Theme = current === 'light' ? 'dark' : current === 'dark' ? 'system' : 'light'
    commit(next, true)
  }, [commit])

  /* Hydrate from the values the inline script already applied. The first
     render intentionally renders no mode-dependent label; this effect then
     syncs React with the DOM without changing the painted theme. */
  useEffect(() => {
    const root = document.documentElement
    const stored = readStoredTheme()
    const appliedMode = root.dataset.themeMode
    const initial: Theme =
      stored ??
      (appliedMode === 'light' || appliedMode === 'dark' || appliedMode === 'system'
        ? appliedMode
        : 'system')

    modeRef.current = initial
    root.dataset.themeMode = initial
    const applied = root.dataset.theme
    /* In system mode the OS may have changed between the inline bootstrap
       paint and hydration (a browser/OS switch, or Playwright's emulation).
       Re-resolve instead of trusting the painted attribute. */
    const resolved =
      initial === 'system'
        ? applyTheme('system', false)
        : applied === 'light' || applied === 'dark'
          ? applied
          : applyTheme(initial, false)

    setModeState(initial)
    setResolvedTheme(resolved)
  }, [])

  /* In system mode, follow the OS live — no refresh required. */
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
    const media = window.matchMedia('(prefers-color-scheme: dark)')

    const onChange = () => {
      if (modeRef.current !== 'system') return
      const resolved = applyTheme('system', true)
      setResolvedTheme(resolved)
    }

    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  const value = useMemo(
    () => ({
      mode,
      theme: resolvedTheme,
      resolvedTheme,
      setMode,
      setTheme: setMode,
      toggleTheme,
    }),
    [mode, resolvedTheme, setMode, toggleTheme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  return useContext(ThemeContext)
}
