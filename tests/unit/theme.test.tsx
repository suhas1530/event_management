import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ThemeProvider, useTheme, THEME_STORAGE_KEY } from '@/lib/theme-context'
import ThemeToggle from '@/components/ui/ThemeToggle'

/**
 * Theme system behaviour.
 *
 * The provider is the only thing that touches `<html>` and localStorage, so
 * these tests exercise it directly plus the real switcher. The edge cases that
 * matter in production — OS preference, storage disabled, corrupt stored
 * values, the pre-hydration default — are pinned here rather than assumed.
 */

function ThemeProbe() {
  const { mode, theme, resolvedTheme } = useTheme()
  return (
    <span data-testid="theme-value">
      {mode ?? 'unmounted'}:{theme ?? 'unmounted'}:{resolvedTheme ?? 'unmounted'}
    </span>
  )
}

function renderTheme(children?: React.ReactNode) {
  return render(
    <ThemeProvider>
      {children ?? <ThemeProbe />}
    </ThemeProvider>,
  )
}

/** Replaces `matchMedia` so the provider sees the requested OS preference. */
function mockSystemTheme(scheme: 'light' | 'dark') {
  vi.spyOn(window, 'matchMedia').mockImplementation((query: string) => ({
    matches: query === '(prefers-color-scheme: dark)' ? scheme === 'dark' : false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia
}

function expectResolved(value: 'light' | 'dark') {
  return waitFor(() =>
    expect(screen.getByTestId('theme-value')).toHaveTextContent(new RegExp(`:${value}:${value}$`)),
  )
}

beforeEach(() => {
  document.documentElement.classList.remove('dark')
  document.documentElement.classList.remove('theme-switching')
  delete document.documentElement.dataset.theme
  delete document.documentElement.dataset.themeMode
  window.localStorage.clear()
  vi.restoreAllMocks()
})

describe('ThemeProvider', () => {
  it('follows a light OS preference when nothing is stored', async () => {
    mockSystemTheme('light')
    renderTheme()

    await expectResolved('light')
    expect(screen.getByTestId('theme-value')).toHaveTextContent('system:light:light')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
    expect(document.documentElement.dataset.theme).toBe('light')
    expect(document.documentElement.dataset.themeMode).toBe('system')
    // A default is not a choice — nothing is written until the visitor picks.
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBeNull()
  })

  it('follows a dark OS preference when nothing is stored', async () => {
    mockSystemTheme('dark')
    renderTheme()

    await expectResolved('dark')
    expect(screen.getByTestId('theme-value')).toHaveTextContent('system:dark:dark')
    expect(document.documentElement).toHaveClass('dark')
    expect(document.documentElement.dataset.themeMode).toBe('system')
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBeNull()
  })

  it('applies a stored light preference even when the OS is dark', async () => {
    mockSystemTheme('dark')
    window.localStorage.setItem(THEME_STORAGE_KEY, 'light')
    renderTheme()

    await expectResolved('light')
    expect(screen.getByTestId('theme-value')).toHaveTextContent('light:light:light')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
    expect(document.documentElement.dataset.theme).toBe('light')
    expect(document.documentElement.dataset.themeMode).toBe('light')
  })

  it('applies a stored system mode and resolves it against the OS', async () => {
    mockSystemTheme('dark')
    window.localStorage.setItem(THEME_STORAGE_KEY, 'system')
    renderTheme()

    await expectResolved('dark')
    expect(screen.getByTestId('theme-value')).toHaveTextContent('system:dark:dark')
    expect(document.documentElement.dataset.themeMode).toBe('system')
  })

  it('ignores corrupt stored values and falls back to the OS preference', async () => {
    mockSystemTheme('light')
    window.localStorage.setItem(THEME_STORAGE_KEY, 'sepia')
    renderTheme()

    await expectResolved('light')
    expect(screen.getByTestId('theme-value')).toHaveTextContent('system:light:light')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('persists an explicit choice from the menu and updates the painted theme', async () => {
    mockSystemTheme('light')
    renderTheme(
      <>
        <ThemeToggle />
        <ThemeProbe />
      </>,
    )

    const trigger = await screen.findByRole('button', { name: 'Theme settings' })
    await userEvent.click(trigger)

    const dark = await screen.findByRole('menuitemradio', { name: /Dark/ })
    await userEvent.click(dark)

    await expectResolved('dark')
    expect(screen.getByTestId('theme-value')).toHaveTextContent('dark:dark:dark')
    expect(document.documentElement).toHaveClass('dark')
    expect(document.documentElement.dataset.themeMode).toBe('dark')
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark')
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('still switches themes when localStorage is unavailable', async () => {
    mockSystemTheme('light')
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

    const trigger = await screen.findByRole('button', { name: 'Theme settings' })
    await userEvent.click(trigger)
    await userEvent.click(await screen.findByRole('menuitemradio', { name: /Dark/ }))

    await expectResolved('dark')
    expect(document.documentElement).toHaveClass('dark')
    expect(setItem).toHaveBeenCalled()
  })
})

describe('ThemeToggle', () => {
  it('exposes an accessible menu with all three appearance modes', async () => {
    mockSystemTheme('light')
    renderTheme(<ThemeToggle />)

    const trigger = await screen.findByRole('button', { name: 'Theme settings' })
    expect(trigger).toHaveAttribute('aria-haspopup', 'menu')
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(trigger).toHaveAttribute('title', 'Theme: System (light)')

    await userEvent.click(trigger)

    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    const options = await screen.findAllByRole('menuitemradio')
    expect(options).toHaveLength(3)
    expect(screen.getByRole('menuitemradio', { name: /Light/ })).toBeInTheDocument()
    expect(screen.getByRole('menuitemradio', { name: /Dark/ })).toBeInTheDocument()
    const system = screen.getByRole('menuitemradio', { name: /System/ })
    expect(system).toBeInTheDocument()
    expect(system).toHaveAttribute('aria-checked', 'true')
  })

  it('is keyboard operable and restores focus when dismissed', async () => {
    mockSystemTheme('light')
    renderTheme(
      <>
        <ThemeToggle />
        <ThemeProbe />
      </>,
    )

    const trigger = await screen.findByRole('button', { name: 'Theme settings' })
    trigger.focus()
    expect(trigger).toHaveFocus()

    await userEvent.keyboard('{Enter}')
    const menu = await screen.findByRole('menu')
    expect(menu).toBeInTheDocument()

    // The selected option receives focus; one arrow press lands on Dark.
    expect(screen.getByRole('menuitemradio', { name: /System/ })).toHaveFocus()
    await userEvent.keyboard('{ArrowUp}')
    expect(screen.getByRole('menuitemradio', { name: /Dark/ })).toHaveFocus()
    await userEvent.keyboard('{Enter}')

    await expectResolved('dark')
    expect(trigger).toHaveFocus()

    await userEvent.keyboard('{Enter}')
    await screen.findByRole('menu')
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument())
    expect(trigger).toHaveFocus()
  })

  it('renders a labelled drawer variant as a three-way radio group', async () => {
    mockSystemTheme('light')
    renderTheme(<ThemeToggle variant="drawer" />)

    const group = await screen.findByRole('radiogroup', { name: 'Appearance' })
    expect(group).toBeInTheDocument()
    expect(screen.getByText('Appearance')).toBeInTheDocument()
    expect(screen.getByText('System · light')).toBeInTheDocument()

    const radios = screen.getAllByRole('radio')
    expect(radios).toHaveLength(3)
    expect(screen.getByRole('radio', { name: 'System' })).toBeChecked()
    expect(screen.getByRole('radio', { name: 'Light' })).not.toBeChecked()
  })

  it('switches theme from the drawer and persists the choice', async () => {
    mockSystemTheme('light')
    renderTheme(
      <>
        <ThemeToggle variant="drawer" />
        <ThemeProbe />
      </>,
    )

    await screen.findByRole('radio', { name: 'Dark' })
    await userEvent.click(screen.getByRole('radio', { name: 'Dark' }))

    await expectResolved('dark')
    expect(document.documentElement).toHaveClass('dark')
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark')
    expect(screen.getByRole('radio', { name: 'Dark' })).toBeChecked()
    expect(screen.getByText('dark')).toBeInTheDocument()
  })
})
