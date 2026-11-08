import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  subscribe: vi.fn(),
}))

vi.mock('@/lib/api', () => ({
  newsletterApi: {
    subscribe: mocks.subscribe,
  },
}))

import FooterNewsletter from '@/components/layout/FooterNewsletter'

beforeEach(() => {
  mocks.subscribe.mockReset()
  mocks.subscribe.mockResolvedValue({
    subscribed: true,
    message: "You're on the list. Look out for the next Heptome edit.",
  })
})

describe('FooterNewsletter', () => {
  it('validates the address before calling the API', async () => {
    const user = userEvent.setup()
    render(<FooterNewsletter />)

    await user.click(screen.getByRole('button', { name: 'Subscribe' }))

    expect(screen.getByRole('alert')).toHaveTextContent('Enter a valid email address')
    expect(mocks.subscribe).not.toHaveBeenCalled()
  })

  it('shows a loading state and then the server success copy', async () => {
    const user = userEvent.setup()
    let resolve: (value: { subscribed: boolean; message: string }) => void = () => {}
    mocks.subscribe.mockReturnValue(
      new Promise(resolvePromise => {
        resolve = resolvePromise
      }),
    )

    render(<FooterNewsletter />)

    await user.type(screen.getByLabelText('Email address'), 'reader@example.com')
    await user.click(screen.getByRole('button', { name: 'Subscribe' }))

    const pending = screen.getByRole('button', { name: /Subscribing/ })
    expect(pending).toBeDisabled()
    expect(pending).toHaveAttribute('aria-busy', 'true')

    resolve({ subscribed: true, message: 'Welcome to the edit.' })

    expect(await screen.findByRole('status')).toHaveTextContent("You're on the list.")
    expect(screen.getByRole('status')).toHaveTextContent('Welcome to the edit.')
    expect(mocks.subscribe).toHaveBeenCalledWith('reader@example.com')
  })

  it('keeps a server error recoverable and marks the input invalid', async () => {
    const user = userEvent.setup()
    mocks.subscribe.mockRejectedValue({ error: 'Too many requests, please try again later.' })

    render(<FooterNewsletter />)

    const input = screen.getByLabelText('Email address')
    await user.type(input, 'reader@example.com')
    await user.click(screen.getByRole('button', { name: 'Subscribe' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Too many requests, please try again later.',
    )
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByRole('button', { name: 'Subscribe' })).toBeEnabled()

    // Editing clears the error so the visitor can correct and resubmit.
    await user.type(input, 'x')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('lets the visitor subscribe another address after success', async () => {
    const user = userEvent.setup()
    render(<FooterNewsletter />)

    await user.type(screen.getByLabelText('Email address'), 'reader@example.com')
    await user.click(screen.getByRole('button', { name: 'Subscribe' }))

    await screen.findByRole('status')
    await user.click(screen.getByRole('button', { name: 'Subscribe another email' }))

    expect(screen.getByLabelText('Email address')).toHaveValue('')
    expect(screen.getByRole('button', { name: 'Subscribe' })).toBeInTheDocument()
  })
})
