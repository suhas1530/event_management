import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * Server-side booking integrity.
 *
 * These tests exercise the real service layer with Prisma mocked at the module
 * boundary. They cover the rules a direct API caller cannot bypass: service and
 * category consistency, coverage, published slots, duplicate requests, trusted
 * pricing and the status workflow.
 */

const prismaMock = vi.hoisted(() => ({
  technicianService: { findUnique: vi.fn() },
  technician: { findUnique: vi.fn() },
  technicianBooking: {
    findFirst: vi.fn(),
    create: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  technicianBookingTimeline: { create: vi.fn() },
}))

vi.mock('../../backend/src/utils/database', () => ({ default: prismaMock }))

import { TechnicianService } from '../../backend/src/services/technician'
import { checkServiceCoverage } from '../../backend/src/utils/serviceArea'
import { createTechnicianBookingSchema } from '../../backend/src/validators/technician'

const SERVICE_ID = '64b7f0c2a1b2c3d4e5f60718'

const service = {
  id: SERVICE_ID,
  technicianId: '64b7f0c2a1b2c3d4e5f60719',
  name: 'AC Deep Clean',
  category: 'AC_SERVICE',
  basePrice: 499,
  isActive: true,
}

function futureISO(days: number) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  date.setHours(9, 0, 0, 0)
  return date.toISOString()
}

function validInput() {
  return {
    serviceId: SERVICE_ID,
    category: 'AC_SERVICE' as const,
    addressLine1: '42, Sunshine Apartments',
    addressCity: 'Bengaluru',
    addressState: 'Karnataka',
    addressPincode: '560034',
    addressLabel: 'Home' as const,
    scheduledDate: futureISO(2),
    timeSlotStart: '08:00',
    timeSlotEnd: '10:00',
    paymentMethod: 'CASH' as const,
    attachments: [] as string[],
  }
}

beforeEach(() => {
  prismaMock.technicianService.findUnique.mockReset().mockResolvedValue(service)
  prismaMock.technician.findUnique.mockReset()
  prismaMock.technicianBooking.findFirst.mockReset().mockResolvedValue(null)
  prismaMock.technicianBooking.create.mockReset().mockResolvedValue({
    id: 'booking-1',
    bookingNumber: 'TECH-2026-TEST',
    status: 'PENDING',
    technicianId: null,
    scheduledDate: futureISO(2),
    timeSlotStart: '08:00',
    timeSlotEnd: '10:00',
    totalAmount: 706,
  })
  prismaMock.technicianBooking.findUnique.mockReset()
  prismaMock.technicianBooking.update.mockReset()
  prismaMock.technicianBookingTimeline.create.mockReset()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('doorstep coverage (server)', () => {
  it('accepts a served Bengaluru pincode', () => {
    expect(checkServiceCoverage({ city: 'Bengaluru', pincode: '560034' })).toEqual({ supported: true })
  })

  it('rejects a locality that is explicitly outside the zone, with the reason', () => {
    expect(checkServiceCoverage({ city: 'Bengaluru', pincode: '562110' })).toEqual({
      supported: false,
      reason: 'Devanahalli is outside the current doorstep-service zone.',
    })
  })

  it('rejects a served pincode paired with another city', () => {
    const result = checkServiceCoverage({ city: 'Mumbai', pincode: '560034' })
    expect(result.supported).toBe(false)
    expect(result.reason).toMatch(/only in Bengaluru/i)
  })

  it('rejects a malformed pincode', () => {
    expect(checkServiceCoverage({ city: 'Bengaluru', pincode: '56003' }).supported).toBe(false)
  })
})

describe('booking payload validation', () => {
  it('accepts a complete, valid request', () => {
    expect(createTechnicianBookingSchema.safeParse(validInput()).success).toBe(true)
  })

  it('rejects a slot whose end is not after its start', () => {
    const result = createTechnicianBookingSchema.safeParse({
      ...validInput(),
      timeSlotStart: '10:00',
      timeSlotEnd: '10:00',
    })
    expect(result.success).toBe(false)
  })

  it('rejects a non-Mongo service id and an invalid pincode', () => {
    expect(
      createTechnicianBookingSchema.safeParse({ ...validInput(), serviceId: 'svc-ac' }).success,
    ).toBe(false)
    expect(
      createTechnicianBookingSchema.safeParse({ ...validInput(), addressPincode: '400001' }).success,
    ).toBe(true)
    expect(
      createTechnicianBookingSchema.safeParse({ ...validInput(), addressPincode: '40001' }).success,
    ).toBe(false)
  })
})

describe('createBooking integrity', () => {
  it('rejects a service filed under the wrong category', async () => {
    const technicianService = new TechnicianService()

    await expect(
      technicianService.createBooking('customer-1', { ...validInput(), category: 'PLUMBING' }),
    ).rejects.toThrow(/does not belong to that category/i)
    expect(prismaMock.technicianBooking.create).not.toHaveBeenCalled()
  })

  it('rejects an address outside the coverage area even when the browser check is bypassed', async () => {
    const technicianService = new TechnicianService()

    await expect(
      technicianService.createBooking('customer-1', { ...validInput(), addressPincode: '562110' }),
    ).rejects.toThrow(/outside the current doorstep-service zone/i)
    expect(prismaMock.technicianBooking.create).not.toHaveBeenCalled()
  })

  it('rejects a date in the past and a date beyond the booking window', async () => {
    const technicianService = new TechnicianService()

    await expect(
      technicianService.createBooking('customer-1', {
        ...validInput(),
        scheduledDate: futureISO(-2),
      }),
    ).rejects.toThrow(/cannot be in the past/i)

    await expect(
      technicianService.createBooking('customer-1', {
        ...validInput(),
        scheduledDate: futureISO(120),
      }),
    ).rejects.toThrow(/up to 90 days ahead/i)

    expect(prismaMock.technicianBooking.create).not.toHaveBeenCalled()
  })

  it('rejects an arrival window that is not one of the published slots', async () => {
    const technicianService = new TechnicianService()

    await expect(
      technicianService.createBooking('customer-1', {
        ...validInput(),
        timeSlotStart: '09:00',
        timeSlotEnd: '10:00',
      }),
    ).rejects.toThrow(/published two-hour arrival windows/i)
    expect(prismaMock.technicianBooking.create).not.toHaveBeenCalled()
  })

  it('rejects a same-day window that has already started', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-10-28T10:00:00+05:30'))
    const technicianService = new TechnicianService()

    await expect(
      technicianService.createBooking('customer-1', {
        ...validInput(),
        scheduledDate: new Date('2026-10-28T09:00:00+05:30').toISOString(),
        timeSlotStart: '08:00',
        timeSlotEnd: '10:00',
      }),
    ).rejects.toThrow(/already started/i)
    expect(prismaMock.technicianBooking.create).not.toHaveBeenCalled()
  })

  it('rejects a duplicate open request for the same service and window', async () => {
    prismaMock.technicianBooking.findFirst.mockResolvedValue({ bookingNumber: 'TECH-2026-OLD' })
    const technicianService = new TechnicianService()

    await expect(technicianService.createBooking('customer-1', validInput())).rejects.toThrow(
      /TECH-2026-OLD/,
    )
    expect(prismaMock.technicianBooking.create).not.toHaveBeenCalled()
  })

  it('prices from the service record and creates a PENDING request', async () => {
    const technicianService = new TechnicianService()

    await technicianService.createBooking('customer-1', validInput())

    expect(prismaMock.technicianBooking.create).toHaveBeenCalledTimes(1)
    const data = prismaMock.technicianBooking.create.mock.calls[0][0].data
    expect(data.estimatedPrice).toBe(499)
    expect(data.visitCharge).toBe(99)
    expect(data.taxAmount).toBe(108)
    expect(data.totalAmount).toBe(706)
    expect(data.balanceAmount).toBe(706)
    expect(data.status).toBe('PENDING')
    expect(data.technicianId).toBeNull()
    expect(data.bookingNumber).toMatch(/^TECH-\d{4}-/)
    expect(prismaMock.technicianBookingTimeline.create).toHaveBeenCalledTimes(1)
  })
})

describe('booking status workflow', () => {
  it('refuses to move a completed job backwards', async () => {
    prismaMock.technicianBooking.findUnique.mockResolvedValue({
      id: 'booking-1',
      status: 'SERVICE_COMPLETED',
      totalAmount: 706,
    })
    const technicianService = new TechnicianService()

    await expect(
      technicianService.updateBookingStatus(
        'booking-1',
        { status: 'TECHNICIAN_ASSIGNED' },
        'admin-1',
      ),
    ).rejects.toThrow(/cannot move to/i)
    expect(prismaMock.technicianBooking.update).not.toHaveBeenCalled()
  })

  it('records a valid PENDING to CONFIRMED transition', async () => {
    prismaMock.technicianBooking.findUnique
      .mockResolvedValueOnce({ id: 'booking-1', status: 'PENDING', totalAmount: 706 })
      .mockResolvedValueOnce({ id: 'booking-1', status: 'CONFIRMED' })
    const technicianService = new TechnicianService()

    await technicianService.updateBookingStatus('booking-1', { status: 'CONFIRMED' }, 'admin-1')

    const update = prismaMock.technicianBooking.update.mock.calls[0][0]
    expect(update.data.status).toBe('CONFIRMED')
    expect(update.data.confirmedAt).toBeInstanceOf(Date)
    expect(prismaMock.technicianBookingTimeline.create).toHaveBeenCalledTimes(1)
  })
})

describe('technician assignment integrity', () => {
  const booking = {
    id: 'booking-1',
    status: 'PENDING',
    category: 'AC_SERVICE',
    scheduledDate: new Date('2026-11-02T09:00:00+05:30'),
    timeSlotStart: '08:00',
    timeSlotEnd: '10:00',
  }

  it('refuses to assign an unverified professional', async () => {
    prismaMock.technicianBooking.findUnique.mockResolvedValue(booking)
    prismaMock.technician.findUnique.mockResolvedValue({
      id: 'tech-1',
      isActive: true,
      isAvailable: true,
      isVerified: false,
      category: 'AC_SERVICE',
      availability: [],
    })
    const technicianService = new TechnicianService()

    await expect(
      technicianService.assignTechnician('booking-1', 'tech-1', 'admin-1'),
    ).rejects.toThrow(/verified professionals/i)
    expect(prismaMock.technicianBooking.update).not.toHaveBeenCalled()
  })

  it('refuses a slot outside the professional published availability', async () => {
    prismaMock.technicianBooking.findUnique.mockResolvedValue(booking)
    prismaMock.technician.findUnique.mockResolvedValue({
      id: 'tech-1',
      isActive: true,
      isAvailable: true,
      isVerified: true,
      category: 'AC_SERVICE',
      availability: [{ dayOfWeek: 1, startTime: '10:00', endTime: '12:00' }],
    })
    const technicianService = new TechnicianService()

    await expect(
      technicianService.assignTechnician('booking-1', 'tech-1', 'admin-1'),
    ).rejects.toThrow(/does not work during that window/i)
    expect(prismaMock.technicianBooking.update).not.toHaveBeenCalled()
  })
})
