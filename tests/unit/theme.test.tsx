import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ThemeProvider, useTheme, THEME_STORAGE_KEY } from '@/lib/theme-context'
import ThemeToggle from '@/components/ui/ThemeToggle'

/**
 * Theme system behaviour.
 *
 * The provider is the only thing that touches `<html>` and localStorage, so
 * these tests exercise it directly plus the real toggle button. The edge cases
 * that matter in production — storage disabled, corrupt stored values, the
 * pre-hydration default — are pinned here rather than assumed.
 */

function ThemeProbe() {
  const { theme } = useTheme()
  return <span data-testid="theme-value">{theme ?? 'unmounted'}</span>
}

function renderTheme(children?: React.ReactNode) {
  return render(
    <ThemeProvider>
      {children ?? <ThemeProbe />}
    </ThemeProvider>,
  )
}

beforeEach(() => {
  document.documentElement.classList.remove('dark')
  document.documentElement.classList.remove('theme-switching')
  delete document.documentElement.dataset.theme
})

describe('ThemeProvider', () => {
  it('defaults to the cinematic dark theme when nothing is stored', async () => {
    renderTheme()

    await waitFor(() => expect(screen.getByTestId('theme-value')).toHaveTextContent('dark'))
    expect(document.documentElement).toHaveClass('dark')
    expect(document.documentElement.dataset.theme).toBe('dark')
    // A default is not a choice — nothing is written until the visitor picks.
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBeNull()
  })

  it('applies a stored light preference on mount', async () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, 'light')
    renderTheme()

    await waitFor(() => expect(screen.getByTestId('theme-value')).toHaveTextContent('light'))
    expect(document.documentElement.classList.contains('dark')).toBe(false)
    expect(document.documentElement.dataset.theme).toBe('light')
  })

  it('ignores corrupt stored values and falls back to dark', async () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, 'sepia')
    renderTheme()

    await waitFor(() => expect(screen.getByTestId('theme-value')).toHaveTextContent('dark'))
    expect(document.documentElement).toHaveClass('dark')
  })

  it('persists an explicit choice and toggles the html class', async () => {
    renderTheme(
      <>
        <ThemeToggle />
        <ThemeProbe />
      </>,
    )

    const toggle = await screen.findByRole('button', { name: 'Switch to light mode' })
    await userEvent.click(toggle)

    await waitFor(() => expect(screen.getByTestId('theme-value')).toHaveTextContent('light'))
    expect(document.documentElement.classList.contains('dark')).toBe(false)
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('light')

    await userEvent.click(toggle)
    await waitFor(() => expect(screen.getByTestId('theme-value')).toHaveTextContent('dark'))
    expect(document.documentElement).toHaveClass('dark')
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark')
  })

  it('still switches themes when localStorage is unavailable', async () => {
    // Private-mode / quota-exceeded browsers throw on write. The switch must
    // keep working for the session — only persistence degrades.
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('QuotaExceededError')
    })

    renderTheme(
      <>
        <ThemeToggle />
        <ThemeProbe />
      </>,
    )

    const toggle = await screen.findByRole('button', { name: 'Switch to light mode' })
    await userEvent.click(toggle)

    await waitFor(() => expect(screen.getByTestId('theme-value')).toHaveTextContent('light'))
    expect(document.documentElement.classList.contains('dark')).toBe(false)
    expect(setItem).toHaveBeenCalled()
    setItem.mockRestore()
  })
})

describe('ThemeToggle', () => {
  it('exposes an action label, tooltip and dark-mode pressed state', async () => {
    renderTheme(<ThemeToggle />)

    const toggle = await screen.findByRole('button', { name: 'Switch to light mode' })
    expect(toggle).toHaveAttribute('title', 'Switch to light mode')
    expect(toggle).toHaveAttribute('aria-pressed', 'true')

    await userEvent.click(toggle)

    const next = await screen.findByRole('button', { name: 'Switch to dark mode' })
    expect(next).toHaveAttribute('title', 'Switch to dark mode')
    expect(next).toHaveAttribute('aria-pressed', 'false')
  })

  it('is keyboard operable', async () => {
    renderTheme(
      <>
        <ThemeToggle />
        <ThemeProbe />
      </>,
    )

    const toggle = await screen.findByRole('button', { name: 'Switch to light mode' })
    toggle.focus()
    expect(toggle).toHaveFocus()
    await userEvent.keyboard('{Enter}')

    await waitFor(() => expect(screen.getByTestId('theme-value')).toHaveTextContent('light'))
  })

  it('renders a labelled drawer variant with the current theme name', async () => {
    renderTheme(<ThemeToggle variant="drawer" />)

    const toggle = await screen.findByRole('button', { name: 'Switch to light mode' })
    expect(toggle).toHaveTextContent('Appearance')
    expect(toggle).toHaveTextContent('Dark')
  })
})
