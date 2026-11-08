import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { TechnicianServiceItem } from '@/lib/api'

/**
 * Behaviour of the two-screen home-service booking flow, exercised through the
 * real component with only the network, routing and auth boundaries mocked.
 *
 * The tests protect three things that matter more than the layout:
 *  1. prices shown are the ones the API returned;
 *  2. an address outside the published coverage cannot reach review;
 *  3. a PENDING request is reported as a request, never as a confirmed booking.
 */

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  searchParams: new URLSearchParams(),
  servicesByCategory: vi.fn(),
  createBooking: vi.fn(),
  auth: { isAuthenticated: true, isLoading: false, user: { id: 'u1', name: 'Test User' } },
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mocks.push, replace: vi.fn(), back: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => mocks.searchParams,
  usePathname: () => '/book/technician',
}))

vi.mock('@/lib/api', () => ({
  technicianApi: {
    servicesByCategory: mocks.servicesByCategory,
    createBooking: mocks.createBooking,
  },
}))

vi.mock('@/lib/auth-context', () => ({
  useAuth: () => mocks.auth,
}))

vi.mock('@/components/layout/SiteShell', () => ({
  default: (props: { children: React.ReactNode }) => props.children,
}))

vi.mock('@/components/layout/SearchParamsBoundary', () => ({
  default: (props: { children: React.ReactNode }) => props.children,
}))

import BookTechnicianPage from '@/app/book/technician/page'

const acService: TechnicianServiceItem = {
  id: 'svc-ac-deep-clean',
  technicianId: 'tech-1',
  name: 'AC Deep Clean',
  slug: 'ac-deep-clean',
  description: 'Coil and filter wash with a full performance check',
  basePrice: 499,
  isActive: true,
  isPopular: true,
  category: 'AC_SERVICE',
  estimatedDuration: 60,
  pricingType: 'FIXED',
  images: [],
  tags: [],
}

beforeEach(() => {
  mocks.searchParams = new URLSearchParams()
  mocks.push.mockReset()
  mocks.servicesByCategory.mockReset().mockResolvedValue([acService])
  mocks.createBooking.mockReset()
  mocks.auth.isAuthenticated = true
})

/** Select the catalogue service and fill the one required address line. */
async function chooseServiceAndAddress(user: ReturnType<typeof userEvent.setup>) {
  await user.click(await screen.findByRole('button', { name: /AC Deep Clean/ }))
  fireEvent.change(screen.getByLabelText(/Address Line 1/i), {
    target: { value: '42, Sunshine Apartments' },
  })
}

/** Move from the details screen to the review screen with a covered address. */
async function goToReview(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Tomorrow' }))
  await user.click(screen.getByRole('button', { name: /8:00 AM/ }))
  await user.click(screen.getByRole('button', { name: /Review request/ }))
  await screen.findByRole('heading', { name: 'Review your request' })
}

describe('booking flow — service and price', () => {
  it('opens on a single details screen with the category handed over in the URL', async () => {
    mocks.searchParams = new URLSearchParams('category=AC_SERVICE')

    render(<BookTechnicianPage />)

    expect(await screen.findByText('Step 1 of 2')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'What do you need?' })).toBeInTheDocument()
    expect(mocks.servicesByCategory).toHaveBeenCalledWith('AC_SERVICE')
  })

  it('shows the price the API returned, not a stored one', async () => {
    mocks.searchParams = new URLSearchParams('category=AC_SERVICE')
    mocks.servicesByCategory.mockResolvedValue([{ ...acService, basePrice: 1234 }])

    const user = userEvent.setup()
    render(<BookTechnicianPage />)

    await user.click(await screen.findByRole('button', { name: /AC Deep Clean/ }))

    // The card and the estimate panel both read from the same API value.
    expect(await screen.findAllByText('₹1,234')).toHaveLength(2)
    expect(screen.queryByText('₹499')).not.toBeInTheDocument()
    // 1234 + 99 visit charge, 18% GST rounded once, = 1573.
    expect(screen.getByText('₹1,573')).toBeInTheDocument()
  })

  it('states a dead end honestly when the category has no bookable services', async () => {
    mocks.searchParams = new URLSearchParams('category=AC_SERVICE')
    mocks.servicesByCategory.mockResolvedValue([])

    render(<BookTechnicianPage />)

    expect(await screen.findByText(/no bookable services listed yet/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /ask the team/i })).toHaveAttribute('href', '/contact')
    expect(screen.getByRole('link', { name: /browse other categories/i })).toHaveAttribute('href', '/services')
    // No invented price anywhere on the screen.
    expect(screen.queryByText(/₹/)).not.toBeInTheDocument()
  })

  it('explains a failed catalogue request instead of blaming the customer', async () => {
    mocks.searchParams = new URLSearchParams('category=AC_SERVICE')
    mocks.servicesByCategory.mockRejectedValue({ error: 'Network error' })

    render(<BookTechnicianPage />)

    expect(await screen.findByText(/could not load services for this category right now/i)).toBeInTheDocument()
  })

  it('starts with the category choices when no category was handed over', async () => {
    render(<BookTechnicianPage />)

    expect(await screen.findByRole('heading', { name: 'What do you need?' })).toBeInTheDocument()
    expect(screen.getByText('Step 1 of 2')).toBeInTheDocument()
    expect(mocks.servicesByCategory).not.toHaveBeenCalled()
  })
})

describe('booking flow — coverage and schedule', () => {
  it('blocks an address outside the coverage area before review', async () => {
    const user = userEvent.setup()
    mocks.searchParams = new URLSearchParams('category=AC_SERVICE&pincode=562110')

    render(<BookTechnicianPage />)
    await chooseServiceAndAddress(user)

    expect(screen.getAllByText(/Devanahalli is outside the current doorstep-service zone/i).length).toBeGreaterThan(0)

    await user.click(screen.getByRole('button', { name: /Review request/ }))

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent(/outside the current doorstep-service zone/i)
    expect(screen.getByText('Step 1 of 2')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Review your request' })).not.toBeInTheDocument()
  })

  it('requires a date and an arrival window before review', async () => {
    const user = userEvent.setup()
    mocks.searchParams = new URLSearchParams('category=AC_SERVICE&pincode=560034')

    render(<BookTechnicianPage />)
    await chooseServiceAndAddress(user)

    expect(screen.getByText(/Covered — Koramangala/)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Review request/ }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/choose a visit date/i)
    expect(screen.getByText('Step 1 of 2')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Tomorrow' }))
    await user.click(screen.getByRole('button', { name: /8:00 AM/ }))
    await user.click(screen.getByRole('button', { name: /Review request/ }))

    expect(await screen.findByRole('heading', { name: 'Review your request' })).toBeInTheDocument()
    expect(screen.getByText('Step 2 of 2')).toBeInTheDocument()
  })
})

describe('booking flow — submission', () => {
  it('sends the answers to the API and never claims a confirmed booking', async () => {
    const user = userEvent.setup()
    mocks.searchParams = new URLSearchParams('category=AC_SERVICE&pincode=560034')
    mocks.createBooking.mockResolvedValue({
      id: 'bk-1',
      bookingNumber: 'TECH-2026-ABC123',
      status: 'PENDING',
      technicianId: null,
      scheduledDate: new Date().toISOString(),
      timeSlotStart: '08:00',
      timeSlotEnd: '10:00',
      totalAmount: 706,
    })

    render(<BookTechnicianPage />)
    await chooseServiceAndAddress(user)
    await goToReview(user)

    await user.click(screen.getByRole('checkbox'))
    await user.click(screen.getByRole('button', { name: /Send booking request/ }))

    expect(await screen.findByText('Request received')).toBeInTheDocument()
    expect(screen.getByText('Slot requested')).toBeInTheDocument()
    // The critical honesty check: a PENDING booking is not a confirmation.
    expect(screen.queryByText(/booking confirmed/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/you're all set/i)).not.toBeInTheDocument()
    expect(screen.getByText(/TECH-2026-ABC123/)).toBeInTheDocument()

    expect(mocks.createBooking).toHaveBeenCalledTimes(1)
    const payload = mocks.createBooking.mock.calls[0][0]
    expect(payload.serviceId).toBe('svc-ac-deep-clean')
    expect(payload.category).toBe('AC_SERVICE')
    expect(payload.addressPincode).toBe('560034')
    expect(payload.addressCity).toBe('Bengaluru')
    expect(payload.timeSlotStart).toBe('08:00')
    expect(payload.timeSlotEnd).toBe('10:00')
    expect(payload.paymentMethod).toBe('CASH')
    // Sent as an instant, not a bare date: 09:00 in the platform's timezone.
    expect(payload.scheduledDate).toMatch(/T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
    expect(
      new Date(payload.scheduledDate).toLocaleTimeString('en-GB', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }),
    ).toBe('09:00')
    // Attachments are not part of this form and must never be uploaded.
    expect(payload.attachments).toBeUndefined()
  })

  it('requires the request acknowledgement before sending', async () => {
    const user = userEvent.setup()
    mocks.searchParams = new URLSearchParams('category=AC_SERVICE&pincode=560034')

    render(<BookTechnicianPage />)
    await chooseServiceAndAddress(user)
    await goToReview(user)

    await user.click(screen.getByRole('button', { name: /Send booking request/ }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/booking request/i)
    expect(mocks.createBooking).not.toHaveBeenCalled()
    expect(screen.queryByText('Slot requested')).not.toBeInTheDocument()
  })

  it('surfaces a server rejection instead of showing a success screen', async () => {
    const user = userEvent.setup()
    mocks.searchParams = new URLSearchParams('category=AC_SERVICE&pincode=560034')
    mocks.createBooking.mockRejectedValue({ error: 'No professional is available for that slot' })

    render(<BookTechnicianPage />)
    await chooseServiceAndAddress(user)
    await goToReview(user)

    await user.click(screen.getByRole('checkbox'))
    await user.click(screen.getByRole('button', { name: /Send booking request/ }))

    expect(await screen.findByText(/No professional is available for that slot/)).toBeInTheDocument()
    expect(screen.queryByText('Slot requested')).not.toBeInTheDocument()
  })

  it('asks a signed-out customer to sign in and returns them to the wizard', async () => {
    const user = userEvent.setup()
    mocks.auth.isAuthenticated = false
    mocks.searchParams = new URLSearchParams('category=AC_SERVICE&pincode=560034')

    render(<BookTechnicianPage />)
    await chooseServiceAndAddress(user)
    await goToReview(user)

    await user.click(screen.getByRole('checkbox'))
    await user.click(screen.getByRole('button', { name: /Send booking request/ }))

    expect(mocks.createBooking).not.toHaveBeenCalled()
    expect(mocks.push).toHaveBeenCalledTimes(1)
    expect(mocks.push.mock.calls[0][0]).toBe(
      `/login?redirect=${encodeURIComponent('/book/technician')}`
    )
    // The brief is preserved locally so the sign-in round trip loses nothing.
    await waitFor(() => {
      expect(window.sessionStorage.getItem('heptome_technician_booking_draft')).toContain('AC_SERVICE')
    })
  })
})

describe('booking flow — estimate', () => {
  it('shows the itemised estimate that matches the server arithmetic', async () => {
    const user = userEvent.setup()
    mocks.searchParams = new URLSearchParams('category=AC_SERVICE&pincode=560034')

    render(<BookTechnicianPage />)
    await user.click(await screen.findByRole('button', { name: /AC Deep Clean/ }))

    expect(screen.getAllByText('₹499').length).toBeGreaterThan(0)
    expect(screen.getByText('₹99')).toBeInTheDocument()
    expect(screen.getByText('₹108')).toBeInTheDocument()
    expect(screen.getByText('₹706')).toBeInTheDocument()
  })
})
