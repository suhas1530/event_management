import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * Behaviour of the two-screen event enquiry flow.
 *
 * The flow is an enquiry, not a booking: these tests pin the wording, the
 * validation that stops an incomplete brief, the sign-in hand-off and the two
 * API calls (create a draft, then submit it).
 */

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  create: vi.fn(),
  updateDraft: vi.fn(),
  submit: vi.fn(),
  byId: vi.fn(),
  auth: { isAuthenticated: true, isLoading: false, user: { id: 'u1', name: 'Test User' } },
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mocks.push, replace: mocks.replace, back: vi.fn(), refresh: vi.fn() }),
  usePathname: () => '/plan-event',
}))

vi.mock('@/lib/api', () => ({
  eventRequestsApi: {
    create: mocks.create,
    updateDraft: mocks.updateDraft,
    submit: mocks.submit,
    byId: mocks.byId,
  },
}))

vi.mock('@/lib/auth-context', () => ({
  useAuth: () => mocks.auth,
}))

vi.mock('@/components/layout/SiteShell', () => ({
  default: (props: { children: React.ReactNode }) => props.children,
}))

import PlanEventPage from '@/app/plan-event/page'

function localISO(daysFromToday: number) {
  const date = new Date()
  date.setDate(date.getDate() + daysFromToday)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

beforeEach(() => {
  window.history.replaceState({}, '', '/plan-event')
  mocks.push.mockReset()
  mocks.replace.mockReset()
  mocks.create.mockReset().mockResolvedValue({ id: 'er-1', status: 'DRAFT' })
  mocks.updateDraft.mockReset()
  mocks.submit.mockReset().mockResolvedValue({ id: 'er-1', status: 'REQUIREMENT_SUBMITTED' })
  mocks.byId.mockReset()
  mocks.auth.isAuthenticated = true
})

/** Fill every field the brief validation requires. */
async function completeBrief(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Birthday' }))
  fireEvent.change(screen.getByLabelText(/Event date/), { target: { value: localISO(30) } })
  fireEvent.change(screen.getByLabelText(/Expected number of guests/), { target: { value: '120' } })
  await user.click(screen.getByRole('button', { name: 'Help me find a venue' }))
  fireEvent.change(screen.getByLabelText(/City \*/), { target: { value: 'Bengaluru' } })
}

async function goToReview(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: /Review request/ }))
  await screen.findByRole('heading', { name: 'Review your event request' })
}

describe('event enquiry — brief validation', () => {
  it('stops an empty brief on the first screen with a specific reason', async () => {
    const user = userEvent.setup()
    render(<PlanEventPage />)

    expect(screen.getByText('Step 1 of 2')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Review request/ }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Choose an event type to continue.')
    expect(screen.getByText('Step 1 of 2')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Review your event request' })).not.toBeInTheDocument()
  })

  it('rejects a past event date', async () => {
    const user = userEvent.setup()
    render(<PlanEventPage />)

    await user.click(screen.getByRole('button', { name: 'Birthday' }))
    fireEvent.change(screen.getByLabelText(/Event date/), { target: { value: localISO(-1) } })
    await user.click(screen.getByRole('button', { name: /Review request/ }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/event date cannot be in the past/i)
    expect(screen.getByText('Step 1 of 2')).toBeInTheDocument()
  })

  it('carries deep-link answers into the brief without losing them', () => {
    const date = localISO(45)
    window.history.replaceState(
      {},
      '',
      `/plan-event?type=WEDDING&date=${date}&guests=80&service=Catering&venueName=The%20Grand%20Hall&venueCity=Bengaluru`,
    )

    render(<PlanEventPage />)

    const eventTypeSection = document.getElementById('event-type')
    expect(eventTypeSection).not.toBeNull()
    expect(within(eventTypeSection!).getByRole('button', { name: 'Wedding' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByText(/You arrived asking about/)).toHaveTextContent('Catering')
    expect(screen.getByLabelText('Venue name *')).toHaveValue('The Grand Hall')
    expect(screen.getByLabelText(/City \*/)).toHaveValue('Bengaluru')
  })
})

describe('event enquiry — review and submission', () => {
  it('submits a draft and sends the customer to the enquiry confirmation', async () => {
    const user = userEvent.setup()
    render(<PlanEventPage />)

    await completeBrief(user)
    await goToReview(user)

    // The review screen must never describe the enquiry as a confirmed booking.
    expect(screen.getAllByText(/not a confirmed booking/i).length).toBeGreaterThan(0)
    expect(screen.getByText(/No payment is due now/i)).toBeInTheDocument()

    await user.click(screen.getByRole('checkbox'))
    await user.click(screen.getByRole('button', { name: /Submit event request/ }))

    expect(mocks.create).toHaveBeenCalledTimes(1)
    const payload = mocks.create.mock.calls[0][0]
    expect(payload.status).toBe('DRAFT')
    expect(payload.eventType).toBe('BIRTHDAY')
    expect(payload.guestCount).toBe(120)
    expect(payload.city).toBe('Bengaluru')
    expect(payload.requirements.venueStatus).toBe('help')

    expect(mocks.submit).toHaveBeenCalledWith('er-1')
    expect(mocks.push).toHaveBeenCalledWith('/event-request-submitted?id=er-1')
  })

  it('requires the enquiry acknowledgement before submitting', async () => {
    const user = userEvent.setup()
    render(<PlanEventPage />)

    await completeBrief(user)
    await goToReview(user)
    await user.click(screen.getByRole('button', { name: /Submit event request/ }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/event inquiry/i)
    expect(mocks.create).not.toHaveBeenCalled()
    expect(mocks.push).not.toHaveBeenCalled()
  })

  it('shows a server rejection instead of pretending the enquiry was sent', async () => {
    const user = userEvent.setup()
    mocks.create.mockRejectedValue({ error: 'The event request could not be saved.' })

    render(<PlanEventPage />)
    await completeBrief(user)
    await goToReview(user)

    await user.click(screen.getByRole('checkbox'))
    await user.click(screen.getByRole('button', { name: /Submit event request/ }))

    expect(await screen.findByRole('alert')).toHaveTextContent('The event request could not be saved.')
    expect(mocks.push).not.toHaveBeenCalled()
  })

  it('asks a signed-out visitor to sign in and preserves the brief on this device', async () => {
    const user = userEvent.setup()
    mocks.auth.isAuthenticated = false

    render(<PlanEventPage />)
    await completeBrief(user)
    await goToReview(user)

    await user.click(screen.getByRole('checkbox'))
    await user.click(screen.getByRole('button', { name: /Submit event request/ }))

    expect(mocks.create).not.toHaveBeenCalled()
    expect(mocks.push).toHaveBeenCalledWith(`/login?next=${encodeURIComponent('/plan-event')}`)
    expect(window.localStorage.getItem('heptome_event_request_content')).toContain('Bengaluru')
  })
})
