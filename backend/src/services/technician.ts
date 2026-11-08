import { randomInt } from 'node:crypto';
import { TechnicianBookingStatus, TechnicianCategory, PaymentStatus, Prisma } from '@prisma/client';
import prisma from '../utils/database';
import { AppError, NotFoundError, AuthorizationError, ConflictError, ValidationError } from '../middleware/errorHandler';
import { checkServiceCoverage } from '../utils/serviceArea';
import type {
  CreateTechnicianBookingInput,
  UpdateTechnicianBookingInput,
  UpdateBookingStatusInput,
  TechnicianBookingQueryInput,
  TechnicianQueryInput,
  CreateTechnicianReviewInput,
} from '../validators/technician';

/** The two-hour arrival windows the booking UI publishes. */
const BOOKING_SLOTS: ReadonlyArray<readonly [string, string]> = [
  ['08:00', '10:00'],
  ['10:00', '12:00'],
  ['12:00', '14:00'],
  ['14:00', '16:00'],
  ['16:00', '18:00'],
  ['18:00', '20:00'],
];

/** How far ahead a doorstep visit may be requested. */
const BOOKING_WINDOW_DAYS = 90;

/** Stable calendar date in the platform's operating timezone. */
function dateKey(value: Date): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(value);
  const part = (type: string) => parts.find(item => item.type === type)?.value ?? '';
  return `${part('year')}-${part('month')}-${part('day')}`;
}

function weekdayInIndia(value: Date): number {
  const weekday = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    weekday: 'short',
  }).format(value);
  const index = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(weekday);
  return index === -1 ? value.getUTCDay() : index;
}

/** Current wall-clock time in the platform's operating timezone, as HH:MM. */
function timeInIndia(value: Date): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(value);
  const part = (type: string) => parts.find(item => item.type === type)?.value ?? '00';
  return `${part('hour')}:${part('minute')}`;
}

/**
 * Booking numbers are customer-facing but never guessed for authorisation. A
 * timestamp plus a cryptographic random suffix makes collisions vanishingly
 * unlikely; `createBooking` still retries on a unique-index violation.
 */
function generateBookingNumber(): string {
  const year = new Date().getFullYear();
  const time = Date.now().toString(36).toUpperCase();
  const random = randomInt(0, 0x100000000).toString(36).toUpperCase().padStart(7, '0');
  return `TECH-${year}-${time}-${random}`;
}

/** Statuses a booking may move to from its current state. */
const STATUS_TRANSITIONS: Record<TechnicianBookingStatus, TechnicianBookingStatus[]> = {
  PENDING: ['CONFIRMED', 'TECHNICIAN_ASSIGNED', 'CANCELLED', 'REJECTED'],
  CONFIRMED: ['TECHNICIAN_ASSIGNED', 'TECHNICIAN_CONFIRMED', 'CANCELLED', 'REJECTED'],
  TECHNICIAN_ASSIGNED: ['TECHNICIAN_CONFIRMED', 'CANCELLED', 'REJECTED'],
  TECHNICIAN_CONFIRMED: ['TECHNICIAN_ON_THE_WAY', 'CANCELLED', 'REJECTED'],
  TECHNICIAN_ON_THE_WAY: ['TECHNICIAN_ARRIVED', 'CANCELLED'],
  TECHNICIAN_ARRIVED: ['SERVICE_STARTED', 'CANCELLED'],
  SERVICE_STARTED: ['SERVICE_COMPLETED', 'CANCELLED'],
  SERVICE_COMPLETED: ['PAYMENT_COMPLETED', 'REVIEW_SUBMITTED'],
  PAYMENT_COMPLETED: ['REVIEW_SUBMITTED'],
  REVIEW_SUBMITTED: [],
  CANCELLED: [],
  REJECTED: [],
};

// Status transition labels for timeline
const STATUS_LABELS: Record<TechnicianBookingStatus, string> = {
  PENDING: 'Booking Placed',
  CONFIRMED: 'Booking Confirmed',
  TECHNICIAN_ASSIGNED: 'Technician Assigned',
  TECHNICIAN_CONFIRMED: 'Technician Confirmed',
  TECHNICIAN_ON_THE_WAY: 'Technician On The Way',
  TECHNICIAN_ARRIVED: 'Technician Arrived',
  SERVICE_STARTED: 'Service Started',
  SERVICE_COMPLETED: 'Service Completed',
  PAYMENT_COMPLETED: 'Payment Completed',
  REVIEW_SUBMITTED: 'Review Submitted',
  CANCELLED: 'Booking Cancelled',
  REJECTED: 'Booking Rejected',
};

const STATUS_DESCRIPTIONS: Record<TechnicianBookingStatus, string> = {
  PENDING: 'Your booking request has been received.',
  CONFIRMED: 'Your booking has been confirmed.',
  TECHNICIAN_ASSIGNED: 'A technician has been assigned to your request.',
  TECHNICIAN_CONFIRMED: 'The technician has confirmed the appointment.',
  TECHNICIAN_ON_THE_WAY: 'The technician is on the way to your location.',
  TECHNICIAN_ARRIVED: 'The technician has arrived at your location.',
  SERVICE_STARTED: 'The service has started.',
  SERVICE_COMPLETED: 'The service has been completed successfully.',
  PAYMENT_COMPLETED: 'Payment received. Thank you!',
  REVIEW_SUBMITTED: 'Thank you for your review.',
  CANCELLED: 'This booking has been cancelled.',
  REJECTED: 'This booking has been rejected.',
};

export class TechnicianService {
  // ─── Public listing ────────────────────────────────────────────────────────

  async getTechnicians(query: TechnicianQueryInput) {
    const { page, limit, category, city, search, isVerified, isAvailable } = query;
    const where: Record<string, unknown> = { isActive: true };

    if (category) where.category = category;
    if (city) where.serviceAreas = { has: city };
    if (isVerified !== undefined) where.isVerified = isVerified;
    if (isAvailable !== undefined) where.isAvailable = isAvailable;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { skills: { has: search } },
        { bio: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [technicians, total] = await Promise.all([
      prisma.technician.findMany({
        where,
        orderBy: [{ rating: 'desc' }, { completedJobs: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: { select: { id: true, name: true, email: true, avatar: true } },
          services: { where: { isActive: true }, take: 5 },
        },
      }),
      prisma.technician.count({ where }),
    ]);

    return { data: technicians, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async getTechnicianById(id: string) {
    const technician = await prisma.technician.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true, avatar: true } },
        services: { where: { isActive: true } },
        availability: { where: { isActive: true } },
        reviews: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: { customer: { select: { id: true, name: true, avatar: true } } },
        },
        _count: { select: { bookings: true, reviews: true } },
      },
    });

    if (!technician) throw new NotFoundError('Technician not found');
    return technician;
  }

  async getTechniciansByCategory(category: string, query: TechnicianQueryInput) {
    return this.getTechnicians({ ...query, category });
  }

  async getAvailableTechnicians(category: string, date: string) {
    // Only filter on category when one was supplied — passing an empty string
    // to an enum field makes Prisma throw, which surfaced as a 500.
    return prisma.technician.findMany({
      where: {
        ...(category ? { category: category as TechnicianCategory } : {}),
        isActive: true,
        isAvailable: true,
        isVerified: true,
      },
      orderBy: [{ rating: 'desc' }],
      take: 10,
      include: {
        user: { select: { id: true, name: true, avatar: true } },
        services: { where: { isActive: true }, take: 3 },
      },
    });
  }

  // ─── Services for a category ───────────────────────────────────────────────

  async getServicesByCategory(category: string) {
    return prisma.technicianService.findMany({
      where: {
        ...(category ? { category: category as TechnicianCategory } : {}),
        isActive: true,
      },
      orderBy: [{ isPopular: 'desc' }, { basePrice: 'asc' }],
      take: 50,
    });
  }

  async getServiceById(id: string) {
    const service = await prisma.technicianService.findUnique({ where: { id } });
    if (!service) throw new NotFoundError('Service not found');
    return service;
  }

  // ─── Booking creation ──────────────────────────────────────────────────────

  async createBooking(customerId: string, data: CreateTechnicianBookingInput) {
    // ── Service integrity ──────────────────────────────────────────────────
    // The service id is the only source of truth for the price. The category
    // sent by the client must match it, otherwise a caller could buy a cheap
    // service while filing it under an unrelated category.
    const service = await prisma.technicianService.findUnique({ where: { id: data.serviceId } });
    if (!service || !service.isActive) throw new NotFoundError('Service not found or unavailable');
    if (service.category !== data.category) {
      throw new ValidationError('The selected service does not belong to that category.');
    }

    // ── Coverage ───────────────────────────────────────────────────────────
    // The browser checks this for fast feedback, but a request can be sent
    // directly to the API, so the same rule is enforced here.
    const coverage = checkServiceCoverage({
      city: data.addressCity,
      pincode: data.addressPincode,
    });
    if (!coverage.supported) {
      throw new ValidationError(coverage.reason ?? 'This address is outside the service area.');
    }

    // ── Scheduling ─────────────────────────────────────────────────────────
    const scheduledDate = new Date(data.scheduledDate);
    if (Number.isNaN(scheduledDate.getTime())) {
      throw new ValidationError('Invalid scheduled date.');
    }

    const requestedDay = dateKey(scheduledDate);
    const today = dateKey(new Date());
    if (requestedDay < today) {
      throw new ValidationError('The visit date cannot be in the past.');
    }

    const latest = new Date();
    latest.setDate(latest.getDate() + BOOKING_WINDOW_DAYS);
    if (requestedDay > dateKey(latest)) {
      throw new ValidationError(`Visits can be requested up to ${BOOKING_WINDOW_DAYS} days ahead.`);
    }

    const slotIsPublished = BOOKING_SLOTS.some(
      ([start, end]) => start === data.timeSlotStart && end === data.timeSlotEnd,
    );
    if (!slotIsPublished) {
      throw new ValidationError('Choose one of the published two-hour arrival windows.');
    }

    // A same-day request for a window that has already started cannot be
    // fulfilled. The browser disables these windows; the API must enforce it
    // too because a caller can post directly.
    if (requestedDay === today && data.timeSlotStart <= timeInIndia(new Date())) {
      throw new ValidationError('That arrival window has already started. Choose a later window.');
    }

    // Midnight-to-midnight range in India, used for duplicate and conflict
    // checks without comparing instants across timezones.
    const dayStart = new Date(`${requestedDay}T00:00:00+05:30`);
    const dayEnd = new Date(`${requestedDay}T23:59:59.999+05:30`);

    // ── Preferred technician (optional) ────────────────────────────────────
    if (data.technicianId) {
      const tech = await prisma.technician.findUnique({
        where: { id: data.technicianId },
        include: { availability: { where: { isActive: true } } },
      });
      if (!tech || !tech.isActive || !tech.isAvailable) {
        throw new NotFoundError('Technician not found or unavailable');
      }
      if (!tech.isVerified) {
        throw new ValidationError('That professional is not available for direct booking yet.');
      }
      if (tech.category !== data.category) {
        throw new ValidationError('That professional does not handle this category.');
      }
      // A service belongs to a technician; choosing a different professional
      // would mean the stored service price is not theirs.
      if (service.technicianId !== tech.id) {
        throw new ValidationError('That professional does not offer the selected service.');
      }

      const weekday = weekdayInIndia(scheduledDate);
      const windows = tech.availability.filter(item => item.dayOfWeek === weekday);
      if (
        windows.length > 0 &&
        !windows.some(
          window => data.timeSlotStart >= window.startTime && data.timeSlotEnd <= window.endTime,
        )
      ) {
        throw new ConflictError('The professional does not work during that window.');
      }

      const clash = await prisma.technicianBooking.findFirst({
        where: {
          technicianId: tech.id,
          scheduledDate: { gte: dayStart, lte: dayEnd },
          status: { notIn: [TechnicianBookingStatus.CANCELLED, TechnicianBookingStatus.REJECTED] },
          timeSlotStart: { lt: data.timeSlotEnd },
          timeSlotEnd: { gt: data.timeSlotStart },
        },
        select: { bookingNumber: true },
      });
      if (clash) {
        throw new ConflictError('The professional already has a booking in that window.');
      }
    }

    // ── Duplicate submission guard ─────────────────────────────────────────
    // A double-click or a retried request must not create two identical jobs.
    // Only very recent, still-open requests count; a customer remains free to
    // book the same service again later.
    const duplicate = await prisma.technicianBooking.findFirst({
      where: {
        customerId,
        serviceId: data.serviceId,
        scheduledDate: { gte: dayStart, lte: dayEnd },
        timeSlotStart: data.timeSlotStart,
        status: {
          in: [
            TechnicianBookingStatus.PENDING,
            TechnicianBookingStatus.CONFIRMED,
            TechnicianBookingStatus.TECHNICIAN_ASSIGNED,
          ],
        },
        createdAt: { gte: new Date(Date.now() - 5 * 60 * 1000) },
      },
      select: { bookingNumber: true },
    });
    if (duplicate) {
      throw new ConflictError(
        `A matching request (${duplicate.bookingNumber}) was just created. Check your dashboard before trying again.`,
      );
    }

    // ── Trusted pricing ────────────────────────────────────────────────────
    const estimatedPrice = service.basePrice;
    const visitCharge = 99;
    const taxRate = 0.18;
    const subtotal = estimatedPrice + visitCharge;
    const taxAmount = Math.round(subtotal * taxRate);
    const totalAmount = subtotal + taxAmount;

    let booking: Awaited<ReturnType<typeof prisma.technicianBooking.create>> | undefined;
    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        booking = await prisma.technicianBooking.create({
          data: {
            bookingNumber: generateBookingNumber(),
            customerId,
            technicianId: data.technicianId ?? null,
            serviceId: data.serviceId,
            category: data.category as TechnicianCategory,
            serviceDescription: data.serviceDescription,
            requestType: 'STANDARD',
            addressLine1: data.addressLine1,
            addressLine2: data.addressLine2,
            addressCity: data.addressCity,
            addressState: data.addressState,
            addressPincode: data.addressPincode,
            addressLabel: data.addressLabel,
            scheduledDate,
            timeSlotStart: data.timeSlotStart,
            timeSlotEnd: data.timeSlotEnd,
            estimatedPrice,
            visitCharge,
            taxAmount,
            discountAmount: 0,
            totalAmount,
            balanceAmount: totalAmount,
            paymentMethod: (data.paymentMethod as any) ?? null,
            status: TechnicianBookingStatus.PENDING,
            customerNotes: data.customerNotes,
            attachments: data.attachments,
          },
          include: {
            service: true,
            technician: { include: { user: { select: { id: true, name: true, avatar: true } } } },
            customer: { select: { id: true, name: true, email: true, phone: true } },
          },
        });
        break;
      } catch (error) {
        const isBookingNumberCollision =
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002' &&
          attempt < 4;
        if (!isBookingNumberCollision) throw error;
      }
    }

    if (!booking) {
      throw new AppError(500, 'Could not allocate a booking number. Please try again.', 'BOOKING_NUMBER_FAILED');
    }

    // Initial timeline entry
    await prisma.technicianBookingTimeline.create({
      data: {
        bookingId: booking.id,
        status: TechnicianBookingStatus.PENDING,
        title: STATUS_LABELS.PENDING,
        description: STATUS_DESCRIPTIONS.PENDING,
        createdBy: customerId,
      },
    });

    return booking;
  }

  async getCustomerBookings(customerId: string, query: TechnicianBookingQueryInput) {
    const { page, limit, status, sortBy, sortOrder } = query;
    const where: Record<string, unknown> = { customerId };
    if (status) where.status = status;

    const [bookings, total] = await Promise.all([
      prisma.technicianBooking.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          service: { select: { id: true, name: true, category: true, images: true } },
          technician: { include: { user: { select: { id: true, name: true, avatar: true } } } },
        },
      }),
      prisma.technicianBooking.count({ where }),
    ]);

    return { data: bookings, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async getBookingById(bookingId: string, userId?: string) {
    const booking = await prisma.technicianBooking.findUnique({
      where: { id: bookingId },
      include: {
        service: true,
        technician: { include: { user: { select: { id: true, name: true, avatar: true, phone: true } } } },
        customer: { select: { id: true, name: true, email: true, phone: true, avatar: true } },
        timeline: { orderBy: { createdAt: 'asc' } },
        payments: { orderBy: { createdAt: 'desc' } },
        review: true,
      },
    });

    if (!booking) throw new NotFoundError('Booking not found');

    if (userId && booking.customerId !== userId) {
      // Also check if userId is the technician's user
      const techUser = booking.technician?.userId;
      if (techUser !== userId) throw new AuthorizationError('Access denied');
    }

    return booking;
  }

  async cancelBooking(bookingId: string, customerId: string, reason?: string) {
    const booking = await prisma.technicianBooking.findUnique({ where: { id: bookingId } });
    if (!booking) throw new NotFoundError('Booking not found');
    if (booking.customerId !== customerId) throw new AuthorizationError('Access denied');

    const cancellableStatuses: TechnicianBookingStatus[] = [
      TechnicianBookingStatus.PENDING,
      TechnicianBookingStatus.CONFIRMED,
      TechnicianBookingStatus.TECHNICIAN_ASSIGNED,
    ];

    if (!cancellableStatuses.includes(booking.status)) {
      throw new AppError(400, 'This booking cannot be cancelled at this stage', 'CANNOT_CANCEL');
    }

    await prisma.technicianBooking.update({
      where: { id: bookingId },
      data: { status: TechnicianBookingStatus.CANCELLED, cancelledAt: new Date(), cancellationReason: reason },
    });

    await prisma.technicianBookingTimeline.create({
      data: {
        bookingId,
        status: TechnicianBookingStatus.CANCELLED,
        title: STATUS_LABELS.CANCELLED,
        description: reason ?? STATUS_DESCRIPTIONS.CANCELLED,
        createdBy: customerId,
      },
    });
  }

  // ─── Admin operations ──────────────────────────────────────────────────────

  async getAllBookings(query: TechnicianBookingQueryInput) {
    const { page, limit, status, category, technicianId, customerId, dateFrom, dateTo, sortBy, sortOrder } = query;
    const where: Record<string, unknown> = {};

    if (status) where.status = status;
    if (category) where.category = category;
    if (technicianId) where.technicianId = technicianId;
    if (customerId) where.customerId = customerId;
    if (dateFrom || dateTo) {
      where.scheduledDate = {};
      if (dateFrom) (where.scheduledDate as any).gte = new Date(dateFrom);
      if (dateTo) (where.scheduledDate as any).lte = new Date(dateTo);
    }

    const [bookings, total] = await Promise.all([
      prisma.technicianBooking.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          service: { select: { id: true, name: true, category: true } },
          technician: { include: { user: { select: { id: true, name: true, avatar: true } } } },
          customer: { select: { id: true, name: true, email: true, phone: true } },
        },
      }),
      prisma.technicianBooking.count({ where }),
    ]);

    return { data: bookings, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async updateBookingStatus(bookingId: string, data: UpdateBookingStatusInput, updatedBy: string) {
    const booking = await prisma.technicianBooking.findUnique({ where: { id: bookingId } });
    if (!booking) throw new NotFoundError('Booking not found');

    const status = data.status as TechnicianBookingStatus;

    // Status is a workflow, not a free-text field: a completed job cannot go
    // back to "on the way", and a cancelled booking cannot be revived by a
    // stray PATCH. Repeating the current status is treated as a no-op.
    if (status !== booking.status) {
      const allowed = STATUS_TRANSITIONS[booking.status] ?? [];
      if (!allowed.includes(status)) {
        throw new ValidationError(
          `A booking in "${booking.status}" cannot move to "${status}".`,
        );
      }
    }

    const updateData: Record<string, unknown> = { status };
    if (status === TechnicianBookingStatus.CONFIRMED) updateData.confirmedAt = new Date();
    if (status === TechnicianBookingStatus.SERVICE_STARTED) updateData.startedAt = new Date();
    if (status === TechnicianBookingStatus.SERVICE_COMPLETED) updateData.completedAt = new Date();
    if (status === TechnicianBookingStatus.PAYMENT_COMPLETED) {
      updateData.paymentStatus = PaymentStatus.COMPLETED;
      updateData.paidAmount = booking.totalAmount;
      updateData.balanceAmount = 0;
    }
    if (status === TechnicianBookingStatus.CANCELLED) {
      updateData.cancelledAt = new Date();
      if (data.note) updateData.cancellationReason = data.note;
    }

    await prisma.technicianBooking.update({ where: { id: bookingId }, data: updateData });

    await prisma.technicianBookingTimeline.create({
      data: {
        bookingId,
        status,
        title: STATUS_LABELS[status],
        description: data.note ?? STATUS_DESCRIPTIONS[status],
        metadata: data.metadata as Prisma.InputJsonValue ?? null,
        createdBy: updatedBy,
      },
    });

    return prisma.technicianBooking.findUnique({
      where: { id: bookingId },
      include: {
        service: true,
        technician: { include: { user: { select: { id: true, name: true, avatar: true } } } },
        customer: { select: { id: true, name: true, email: true, phone: true } },
        timeline: { orderBy: { createdAt: 'asc' } },
      },
    });
  }

  async assignTechnician(bookingId: string, technicianId: string, assignedBy: string) {
    const [booking, technician] = await Promise.all([
      prisma.technicianBooking.findUnique({ where: { id: bookingId } }),
      prisma.technician.findUnique({
        where: { id: technicianId },
        include: { availability: { where: { isActive: true } } },
      }),
    ]);

    if (!booking) throw new NotFoundError('Booking not found');
    if (!technician) throw new NotFoundError('Technician not found');
    if (!technician.isActive || !technician.isAvailable) {
      throw new AppError(400, 'Technician is not available', 'TECHNICIAN_UNAVAILABLE');
    }
    if (!technician.isVerified) {
      throw new ValidationError('Only verified professionals can be assigned to a booking.');
    }
    if (
      booking.status !== TechnicianBookingStatus.PENDING &&
      booking.status !== TechnicianBookingStatus.CONFIRMED
    ) {
      throw new ValidationError(`A booking in "${booking.status}" cannot be assigned.`);
    }
    if (technician.category !== booking.category) {
      throw new ValidationError('The technician does not handle this booking category.');
    }

    const weekday = weekdayInIndia(booking.scheduledDate);
    const windows = technician.availability.filter(item => item.dayOfWeek === weekday);
    if (
      windows.length > 0 &&
      !windows.some(
        window => booking.timeSlotStart >= window.startTime && booking.timeSlotEnd <= window.endTime,
      )
    ) {
      throw new ConflictError('The professional does not work during that window.');
    }

    const dayStart = new Date(`${dateKey(booking.scheduledDate)}T00:00:00+05:30`);
    const dayEnd = new Date(`${dateKey(booking.scheduledDate)}T23:59:59.999+05:30`);
    const clash = await prisma.technicianBooking.findFirst({
      where: {
        id: { not: booking.id },
        technicianId,
        scheduledDate: { gte: dayStart, lte: dayEnd },
        status: { notIn: [TechnicianBookingStatus.CANCELLED, TechnicianBookingStatus.REJECTED] },
        timeSlotStart: { lt: booking.timeSlotEnd },
        timeSlotEnd: { gt: booking.timeSlotStart },
      },
      select: { bookingNumber: true },
    });
    if (clash) {
      throw new ConflictError(
        `The technician already has booking ${clash.bookingNumber} in that window.`,
      );
    }

    await prisma.technicianBooking.update({
      where: { id: bookingId },
      data: {
        technicianId,
        status: TechnicianBookingStatus.TECHNICIAN_ASSIGNED,
        assignedAt: new Date(),
      },
    });

    await prisma.technicianBookingTimeline.create({
      data: {
        bookingId,
        status: TechnicianBookingStatus.TECHNICIAN_ASSIGNED,
        title: STATUS_LABELS.TECHNICIAN_ASSIGNED,
        description: `${technician.name} has been assigned to this booking.`,
        createdBy: assignedBy,
      },
    });

    return prisma.technicianBooking.findUnique({
      where: { id: bookingId },
      include: {
        service: true,
        technician: { include: { user: { select: { id: true, name: true, avatar: true } } } },
        customer: { select: { id: true, name: true, email: true } },
      },
    });
  }

  // ─── Technician-facing operations ─────────────────────────────────────────

  async getTechnicianBookings(technicianId: string, query: TechnicianBookingQueryInput) {
    const { page, limit, status, sortBy, sortOrder } = query;
    const where: Record<string, unknown> = { technicianId };
    if (status) where.status = status;

    const [bookings, total] = await Promise.all([
      prisma.technicianBooking.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          service: { select: { id: true, name: true, category: true } },
          customer: { select: { id: true, name: true, phone: true, avatar: true } },
          timeline: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
      }),
      prisma.technicianBooking.count({ where }),
    ]);

    return { data: bookings, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  // ─── Reviews ───────────────────────────────────────────────────────────────

  async createReview(bookingId: string, customerId: string, data: CreateTechnicianReviewInput) {
    const booking = await prisma.technicianBooking.findUnique({ where: { id: bookingId } });
    if (!booking) throw new NotFoundError('Booking not found');
    if (booking.customerId !== customerId) throw new AuthorizationError('Access denied');
    if (booking.status !== TechnicianBookingStatus.SERVICE_COMPLETED &&
        booking.status !== TechnicianBookingStatus.PAYMENT_COMPLETED) {
      throw new AppError(400, 'Can only review completed services', 'SERVICE_NOT_COMPLETED');
    }
    if (!booking.technicianId) throw new AppError(400, 'No technician assigned', 'NO_TECHNICIAN');

    // Check for existing review
    const existing = await prisma.technicianReview.findUnique({ where: { bookingId } });
    if (existing) throw new ConflictError('You have already reviewed this booking');

    const review = await prisma.technicianReview.create({
      data: {
        bookingId,
        technicianId: booking.technicianId,
        customerId,
        rating: data.rating,
        title: data.title,
        comment: data.comment,
        images: data.images,
        isVerified: true,
      },
    });

    // Update technician rating
    const stats = await prisma.technicianReview.aggregate({
      where: { technicianId: booking.technicianId },
      _avg: { rating: true },
      _count: { id: true },
    });

    await prisma.technician.update({
      where: { id: booking.technicianId },
      data: {
        rating: Math.round((stats._avg.rating ?? 0) * 10) / 10,
        totalReviews: stats._count.id,
      },
    });

    // Mark review submitted
    await prisma.technicianBooking.update({
      where: { id: bookingId },
      data: { status: TechnicianBookingStatus.REVIEW_SUBMITTED },
    });

    await prisma.technicianBookingTimeline.create({
      data: {
        bookingId,
        status: TechnicianBookingStatus.REVIEW_SUBMITTED,
        title: STATUS_LABELS.REVIEW_SUBMITTED,
        description: `Rated ${data.rating} stars.`,
        createdBy: customerId,
      },
    });

    return review;
  }

  // ─── Admin stats ───────────────────────────────────────────────────────────

  async getDashboardStats() {
    const [total, pending, confirmed, completed, cancelled, revenue] = await Promise.all([
      prisma.technicianBooking.count(),
      prisma.technicianBooking.count({ where: { status: { in: ['PENDING', 'CONFIRMED', 'TECHNICIAN_ASSIGNED'] } } }),
      prisma.technicianBooking.count({ where: { status: 'TECHNICIAN_CONFIRMED' } }),
      prisma.technicianBooking.count({ where: { status: { in: ['SERVICE_COMPLETED', 'PAYMENT_COMPLETED', 'REVIEW_SUBMITTED'] } } }),
      prisma.technicianBooking.count({ where: { status: 'CANCELLED' } }),
      prisma.technicianBooking.aggregate({
        where: { paymentStatus: 'COMPLETED' },
        _sum: { totalAmount: true },
      }),
    ]);

    return {
      total, pending, confirmed, completed, cancelled,
      revenue: revenue._sum.totalAmount ?? 0,
    };
  }
}

export const technicianService = new TechnicianService();
