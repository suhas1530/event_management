import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { TechnicianServiceItem } from '@/lib/api'

/**
 * End-to-end behaviour of the home-service booking wizard, exercised through the
 * real component with only the network, routing and auth boundaries mocked.
 *
 * The point of these tests is honesty: prices come from the API, a category
 * with no catalogue is a stated dead end (never a placeholder price), and an
 * address outside the coverage area stops the flow with the real reason.
 */

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  searchParams: new URLSearchParams(),
  servicesByCategory: vi.fn(),
  available: vi.fn(),
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
    available: mocks.available,
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
  mocks.available.mockReset().mockResolvedValue([])
  mocks.createBooking.mockReset()
  mocks.auth.isAuthenticated = true
})

describe('booking wizard — service step', () => {
  it('opens on the service step when a category is handed over in the URL', async () => {
    mocks.searchParams = new URLSearchParams('category=AC_SERVICE')

    render(<BookTechnicianPage />)

    expect(await screen.findByText('Select the service')).toBeInTheDocument()
    expect(screen.getByText('Step 2 of 9')).toBeInTheDocument()
    expect(mocks.servicesByCategory).toHaveBeenCalledWith('AC_SERVICE')
  })

  it('shows the price the API returned, not a stored one', async () => {
    mocks.searchParams = new URLSearchParams('category=AC_SERVICE')
    mocks.servicesByCategory.mockResolvedValue([{ ...acService, basePrice: 1234 }])

    render(<BookTechnicianPage />)

    expect(await screen.findByText('₹1,234')).toBeInTheDocument()
    expect(screen.queryByText('₹499')).not.toBeInTheDocument()
    expect(screen.getByText('starting from')).toBeInTheDocument()
  })

  it('states a dead end honestly when the category has no bookable services', async () => {
    mocks.searchParams = new URLSearchParams('category=AC_SERVICE')
    mocks.servicesByCategory.mockResolvedValue([])

    render(<BookTechnicianPage />)

    expect(await screen.findByText(/no bookable services listed yet/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /ask the team/i })).toHaveAttribute('href', '/contact')
    expect(screen.getByRole('link', { name: /browse other categories/i })).toHaveAttribute('href', '/services')
    // No invented price anywhere on the screen.
    expect(screen.queryByText(/starting from/i)).not.toBeInTheDocument()
  })

  it('explains a failed catalogue request instead of blaming the customer', async () => {
    mocks.searchParams = new URLSearchParams('category=AC_SERVICE')
    mocks.servicesByCategory.mockRejectedValue({ error: 'Network error' })

    render(<BookTechnicianPage />)

    expect(await screen.findByText(/could not load services for this category right now/i)).toBeInTheDocument()
  })

  it('starts at the category step when no category was handed over', async () => {
    render(<BookTechnicianPage />)

    expect(await screen.findByText('What do you need help with?')).toBeInTheDocument()
    expect(screen.getByText('Step 1 of 9')).toBeInTheDocument()
    expect(mocks.servicesByCategory).not.toHaveBeenCalled()
  })
})

describe('booking wizard — coverage', () => {
  it('blocks an address outside the coverage area and never reaches the slot step', async () => {
    const user = userEvent.setup()
    mocks.searchParams = new URLSearchParams('category=AC_SERVICE&pincode=562110')

    render(<BookTechnicianPage />)

    await user.click(await screen.findByRole('button', { name: /AC Deep Clean/ }))
    expect(await screen.findByText('Service location')).toBeInTheDocument()

    // The pincode is checked as soon as it is known, not after a slot is picked.
    expect(screen.getAllByText(/outside the current doorstep-service zone/i).length).toBeGreaterThan(0)

    await user.type(screen.getByLabelText(/Address Line 1/i), '42, Sunshine Apartments')
    await user.click(screen.getByRole('button', { name: /^Continue$/ }))

    await waitFor(() => {
      expect(screen.queryByText('When do you need it?')).not.toBeInTheDocument()
    })
    expect(screen.getAllByText(/outside the current doorstep-service zone/i).length).toBeGreaterThan(1)
  })

  it('lets a covered address continue to the date and slot step', async () => {
    const user = userEvent.setup()
    mocks.searchParams = new URLSearchParams('category=AC_SERVICE&pincode=560034')

    render(<BookTechnicianPage />)

    await user.click(await screen.findByRole('button', { name: /AC Deep Clean/ }))
    expect(await screen.findByText('Service location')).toBeInTheDocument()
    expect(screen.getByText(/Covered — Koramangala/i)).toBeInTheDocument()

    await user.type(screen.getByLabelText(/Address Line 1/i), '42, Sunshine Apartments')
    await user.click(screen.getByRole('button', { name: /^Continue$/ }))

    expect(await screen.findByText('When do you need it?')).toBeInTheDocument()
    expect(screen.getByText('Step 4 of 9')).toBeInTheDocument()
  })

  it('requires a date and a slot before leaving the schedule step', async () => {
    const user = userEvent.setup()
    mocks.searchParams = new URLSearchParams('category=AC_SERVICE&pincode=560034')

    render(<BookTechnicianPage />)

    await user.click(await screen.findByRole('button', { name: /AC Deep Clean/ }))
    await user.type(await screen.findByLabelText(/Address Line 1/i), '42, Sunshine Apartments')
    await user.click(screen.getByRole('button', { name: /^Continue$/ }))
    await user.click(await screen.findByRole('button', { name: /^Continue$/ }))

    expect(await screen.findByText(/please select a date/i)).toBeInTheDocument()
    expect(screen.getByText('When do you need it?')).toBeInTheDocument()
  })
})

describe('booking wizard — submission', () => {
  /** Walk the wizard to the confirm step with a stubbed catalogue. */
  async function completeWizard(user: ReturnType<typeof userEvent.setup>) {
    await user.click(await screen.findByRole('button', { name: /AC Deep Clean/ }))
    await user.type(await screen.findByLabelText(/Address Line 1/i), '42, Sunshine Apartments')
    await user.click(screen.getByRole('button', { name: /^Continue$/ })) // location
    await user.click(await screen.findByRole('button', { name: 'Today' }))
    await user.click(screen.getByRole('button', { name: /8:00 AM/ }))
    await user.click(screen.getByRole('button', { name: /^Continue$/ })) // schedule
    await user.click(await screen.findByRole('button', { name: /Let Heptome assign a professional/ }))
    await user.click(screen.getByRole('button', { name: /^Continue$/ })) // technician
    await user.click(screen.getByRole('button', { name: /^Continue$/ })) // problem
    await user.click(screen.getByRole('button', { name: /^Continue$/ })) // pricing
    await user.click(screen.getByRole('button', { name: /^Continue$/ })) // payment
  }

  it('sends the answers to the API and never claims a confirmed booking', async () => {
    const user = userEvent.setup()
    mocks.searchParams = new URLSearchParams('category=AC_SERVICE&pincode=560034')
    mocks.createBooking.mockResolvedValue({
      id: 'bk-1',
      bookingNumber: 'HB-2026-0001',
      status: 'PENDING',
      technicianId: null,
      scheduledDate: new Date().toISOString(),
      timeSlotStart: '08:00',
      timeSlotEnd: '10:00',
      totalAmount: 706,
    })

    render(<BookTechnicianPage />)
    await completeWizard(user)
    await user.click(await screen.findByRole('button', { name: /Confirm Booking/ }))

    expect(await screen.findByText('Slot requested')).toBeInTheDocument()
    expect(screen.getByText('Request received')).toBeInTheDocument()
    // The critical honesty check: a PENDING booking is not a confirmation.
    expect(screen.queryByText(/booking confirmed/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/you're all set/i)).not.toBeInTheDocument()
    expect(screen.getByText(/HB-2026-0001/)).toBeInTheDocument()

    expect(mocks.createBooking).toHaveBeenCalledTimes(1)
    const payload = mocks.createBooking.mock.calls[0][0]
    expect(payload.serviceId).toBe('svc-ac-deep-clean')
    expect(payload.category).toBe('AC_SERVICE')
    expect(payload.addressPincode).toBe('560034')
    expect(payload.addressCity).toBe('Bengaluru')
    expect(payload.timeSlotStart).toBe('08:00')
    // Sent as an instant, not a bare date: 09:00 in the customer's own timezone.
    expect(payload.scheduledDate).toMatch(/T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
    expect(new Date(payload.scheduledDate).getHours()).toBe(9)
    // Attachments are a local preview only — they must never be uploaded.
    expect(payload.attachments).toBeUndefined()
  })

  it('surfaces a server rejection instead of showing a success screen', async () => {
    const user = userEvent.setup()
    mocks.searchParams = new URLSearchParams('category=AC_SERVICE&pincode=560034')
    mocks.createBooking.mockRejectedValue({ error: 'No professional is available for that slot' })

    render(<BookTechnicianPage />)
    await completeWizard(user)
    await user.click(await screen.findByRole('button', { name: /Confirm Booking/ }))

    expect(await screen.findByText(/No professional is available for that slot/)).toBeInTheDocument()
    expect(screen.queryByText('Slot requested')).not.toBeInTheDocument()
  })

  it('asks a signed-out customer to sign in and returns them to the same wizard URL', async () => {
    const user = userEvent.setup()
    mocks.auth.isAuthenticated = false
    mocks.searchParams = new URLSearchParams('category=AC_SERVICE&pincode=560034')

    render(<BookTechnicianPage />)
    await completeWizard(user)
    await user.click(await screen.findByRole('button', { name: /Confirm Booking/ }))

    expect(mocks.createBooking).not.toHaveBeenCalled()
    expect(mocks.push).toHaveBeenCalledTimes(1)
    expect(mocks.push.mock.calls[0][0]).toBe(
      `/login?redirect=${encodeURIComponent('/book/technician?category=AC_SERVICE&pincode=560034')}`
    )
  })
})

describe('booking wizard — pricing steps', () => {
  it('shows the itemised estimate that matches the server arithmetic', async () => {
    const user = userEvent.setup()
    mocks.searchParams = new URLSearchParams('category=AC_SERVICE&pincode=560034')

    render(<BookTechnicianPage />)

    // Service → location
    await user.click(await screen.findByRole('button', { name: /AC Deep Clean/ }))
    await user.type(await screen.findByLabelText(/Address Line 1/i), '42, Sunshine Apartments')
    await user.click(screen.getByRole('button', { name: /^Continue$/ }))

    // Location → schedule, where a date *and* a slot are both required.
    await user.click(await screen.findByRole('button', { name: /^Continue$/ }))
    expect(await screen.findByText(/please select a date/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Today' }))
    await user.click(screen.getByRole('button', { name: /8:00 AM/ }))
    await user.click(screen.getByRole('button', { name: /^Continue$/ }))

    // Schedule → technician → problem → pricing
    await user.click(await screen.findByRole('button', { name: /Let Heptome assign a professional/ }))
    await user.click(screen.getByRole('button', { name: /^Continue$/ }))
    await user.click(screen.getByRole('button', { name: /^Continue$/ }))

    expect(await screen.findByText('Price estimate')).toBeInTheDocument()
    expect(screen.getByText('₹499')).toBeInTheDocument()
    expect(screen.getByText('₹99')).toBeInTheDocument()
    expect(screen.getByText('₹108')).toBeInTheDocument()
    expect(screen.getByText('₹706')).toBeInTheDocument()
  })
})
