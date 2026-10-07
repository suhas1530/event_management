import { BookingStatus, PaymentStatus, Prisma } from '@prisma/client';
import prisma from '../utils/database';
import { AppError, NotFoundError, AuthorizationError } from '../middleware/errorHandler';
import type {
  CreateBookingInput,
  UpdateBookingInput,
  AdminUpdateBookingInput,
  CreateQuoteInput,
  UpdateQuoteInput,
  BookingQueryInput,
  PaymentInput,
} from '../validators/booking';

function generateBookingNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(100000 + Math.random() * 900000);
  return `EVT-${year}-${random}`;
}

export class BookingService {
  async createBooking(userId: string, data: CreateBookingInput) {
    // Verify event exists
    const event = await prisma.event.findUnique({ where: { id: data.eventId } });
    if (!event || !event.isActive) {
      throw new NotFoundError('Event not found or unavailable');
    }

    // Check date availability
    const existingBooking = await prisma.booking.findFirst({
      where: {
        eventId: data.eventId,
        eventDate: new Date(data.eventDate),
        status: {
          notIn: ['CANCELLED', 'REJECTED', 'DRAFT'],
        },
      },
    });

    if (existingBooking) {
      throw new AppError(409, 'This date is already booked. Please select another date.', 'DATE_UNAVAILABLE');
    }

    // Calculate pricing from items
    let subtotal = 0;
    const bookingItems: Array<{
      serviceId: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
      customNotes?: string;
      sortOrder: number;
    }> = [];

    if (data.items && data.items.length > 0) {
      for (let i = 0; i < data.items.length; i++) {
        const item = data.items[i];
        const service = await prisma.service.findUnique({ where: { id: item.serviceId } });
        if (!service) throw new NotFoundError(`Service ${item.serviceId} not found`);

        let unitPrice = service.basePrice;
        if (service.pricingType === 'PER_GUEST' && service.pricePerGuest && data.guestCount) {
          unitPrice = service.pricePerGuest * data.guestCount;
        }

        const totalPrice = unitPrice * item.quantity;
        subtotal += totalPrice;

        bookingItems.push({
          serviceId: item.serviceId,
          quantity: item.quantity,
          unitPrice,
          totalPrice,
          customNotes: item.customNotes,
          sortOrder: i,
        });
      }
    }

    // Add package price if selected
    if (data.packageId) {
      const pkg = await prisma.package.findUnique({ where: { id: data.packageId } });
      if (pkg) subtotal += pkg.price;
    }

    const taxAmount = subtotal * 0.18; // 18% GST
    const totalAmount = subtotal + taxAmount;

    const booking = await prisma.booking.create({
      data: {
        bookingNumber: generateBookingNumber(),
        userId,
        eventId: data.eventId,
        packageId: data.packageId,
        venueId: data.venueId,
        aiDesignId: data.aiDesignId,
        eventDate: new Date(data.eventDate),
        eventEndDate: data.eventEndDate ? new Date(data.eventEndDate) : undefined,
        guestCount: data.guestCount,
        budget: data.budget,
        notes: data.notes,
        specialRequests: data.specialRequests,
        status: BookingStatus.REQUESTED,
        subtotal,
        taxAmount,
        discountAmount: 0,
        totalAmount,
        balanceAmount: totalAmount,
        items: {
          create: bookingItems,
        },
      },
      include: {
        event: { select: { id: true, title: true, slug: true, type: true } },
        package: { select: { id: true, name: true, price: true } },
        venue: { select: { id: true, name: true, city: true } },
        items: { include: { service: { select: { id: true, name: true, category: true } } } },
      },
    });

    // Create initial timeline entry
    await prisma.bookingTimeline.create({
      data: {
        bookingId: booking.id,
        status: BookingStatus.REQUESTED,
        title: 'Booking Requested',
        description: 'Your booking request has been received. Our team will review it shortly.',
        createdBy: userId,
      },
    });

    // Mark AI design as booked if linked
    if (data.aiDesignId) {
      await prisma.aIDesign.update({
        where: { id: data.aiDesignId },
        data: { isBooked: true, bookingId: booking.id },
      }).catch(() => {}); // Non-fatal
    }

    return booking;
  }

  async getUserBookings(userId: string, query: BookingQueryInput) {
    const { page, limit, status, sortBy, sortOrder } = query;

    const where: Record<string, unknown> = { userId };
    if (status) where.status = status;

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          event: { select: { id: true, title: true, slug: true, type: true, heroImages: true } },
          package: { select: { id: true, name: true } },
          venue: { select: { id: true, name: true, city: true } },
          _count: { select: { messages: true } },
        },
      }),
      prisma.booking.count({ where }),
    ]);

    return {
      data: bookings,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getBookingById(bookingId: string, userId?: string) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true, avatar: true } },
        event: { select: { id: true, title: true, slug: true, type: true, heroImages: true, location: true } },
        package: {
          include: {
            services: { include: { service: { select: { id: true, name: true, category: true } } } },
          },
        },
        venue: true,
        assignedAdmin: { select: { id: true, name: true, email: true, avatar: true } },
        aiDesign: true,
        items: {
          include: { service: { select: { id: true, name: true, category: true, images: true } } },
          orderBy: { sortOrder: 'asc' },
        },
        quotes: { orderBy: { version: 'desc' } },
        payments: { orderBy: { createdAt: 'desc' } },
        timeline: { orderBy: { createdAt: 'asc' } },
        documents: { orderBy: { createdAt: 'desc' } },
        _count: { select: { messages: true } },
      },
    });

    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    // If a userId is provided, ensure it matches (customer can only see their own)
    if (userId && booking.userId !== userId) {
      throw new AuthorizationError('You do not have access to this booking');
    }

    return booking;
  }

  async updateBooking(bookingId: string, userId: string, data: UpdateBookingInput) {
    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });

    if (!booking) throw new NotFoundError('Booking not found');
    if (booking.userId !== userId) throw new AuthorizationError('Access denied');

    // Customers can only update DRAFT or REQUESTED bookings
    if (!['DRAFT', 'REQUESTED'].includes(booking.status)) {
      throw new AppError(400, 'Cannot modify a booking that is already being processed', 'BOOKING_NOT_EDITABLE');
    }

    return prisma.booking.update({
      where: { id: bookingId },
      data: {
        ...(data.eventDate && { eventDate: new Date(data.eventDate) }),
        ...(data.eventEndDate && { eventEndDate: new Date(data.eventEndDate) }),
        ...(data.guestCount && { guestCount: data.guestCount }),
        ...(data.budget !== undefined && { budget: data.budget }),
        ...(data.notes !== undefined && { notes: data.notes }),
        ...(data.specialRequests !== undefined && { specialRequests: data.specialRequests }),
      },
    });
  }

  async cancelBooking(bookingId: string, userId: string) {
    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });

    if (!booking) throw new NotFoundError('Booking not found');
    if (booking.userId !== userId) throw new AuthorizationError('Access denied');

    const cancellableStatuses: BookingStatus[] = [
      BookingStatus.DRAFT,
      BookingStatus.REQUESTED,
      BookingStatus.PENDING_REVIEW,
    ];

    if (!cancellableStatuses.includes(booking.status)) {
      throw new AppError(400, 'This booking cannot be cancelled at this stage. Please contact support.', 'CANNOT_CANCEL');
    }

    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: BookingStatus.CANCELLED,
        cancelledAt: new Date(),
        cancellationReason: 'Cancelled by customer',
      },
    });

    await prisma.bookingTimeline.create({
      data: {
        bookingId,
        status: BookingStatus.CANCELLED,
        title: 'Booking Cancelled',
        description: 'Booking was cancelled by the customer.',
        createdBy: userId,
      },
    });
  }

  // ─── Quotes ────────────────────────────────────────────────────

  async getQuotes(bookingId: string, userId: string) {
    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) throw new NotFoundError('Booking not found');
    if (booking.userId !== userId) throw new AuthorizationError('Access denied');

    return prisma.quote.findMany({
      where: { bookingId },
      orderBy: { version: 'desc' },
    });
  }

  async createQuote(bookingId: string, data: CreateQuoteInput, adminId: string) {
    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) throw new NotFoundError('Booking not found');

    // Get latest version number
    const lastQuote = await prisma.quote.findFirst({
      where: { bookingId },
      orderBy: { version: 'desc' },
    });

    const version = (lastQuote?.version ?? 0) + 1;

    const quote = await prisma.quote.create({
      data: {
        bookingId,
        version,
        items: data.items,
        subtotal: data.subtotal,
        taxAmount: data.taxAmount,
        discountAmount: data.discountAmount,
        totalAmount: data.totalAmount,
        validUntil: new Date(data.validUntil),
        notes: data.notes,
        status: 'DRAFT',
        createdBy: adminId,
      },
    });

    return quote;
  }

  async updateQuote(bookingId: string, quoteId: string, data: UpdateQuoteInput) {
    const quote = await prisma.quote.findFirst({ where: { id: quoteId, bookingId } });
    if (!quote) throw new NotFoundError('Quote not found');

    if (quote.status === 'APPROVED') {
      throw new AppError(400, 'Cannot modify an approved quote', 'QUOTE_APPROVED');
    }

    return prisma.quote.update({
      where: { id: quoteId },
      data: {
        ...(data.items !== undefined && { items: data.items }),
        ...(data.subtotal !== undefined && { subtotal: data.subtotal }),
        ...(data.taxAmount !== undefined && { taxAmount: data.taxAmount }),
        ...(data.discountAmount !== undefined && { discountAmount: data.discountAmount }),
        ...(data.totalAmount !== undefined && { totalAmount: data.totalAmount }),
        ...(data.validUntil && { validUntil: new Date(data.validUntil) }),
        ...(data.notes !== undefined && { notes: data.notes }),
        ...(data.status && { status: data.status }),
      },
    });
  }

  async sendQuote(bookingId: string, quoteId: string) {
    const quote = await prisma.quote.findFirst({ where: { id: quoteId, bookingId } });
    if (!quote) throw new NotFoundError('Quote not found');

    const updatedQuote = await prisma.quote.update({
      where: { id: quoteId },
      data: { status: 'SENT' },
    });

    // Update booking status to QUOTED
    await prisma.booking.update({
      where: { id: bookingId },
      data: { status: BookingStatus.QUOTED },
    });

    await prisma.bookingTimeline.create({
      data: {
        bookingId,
        status: BookingStatus.QUOTED,
        title: 'Quote Sent',
        description: `Quote v${quote.version} for ₹${quote.totalAmount.toLocaleString('en-IN')} has been sent. Please review and approve.`,
      },
    });

    return updatedQuote;
  }

  async approveQuote(bookingId: string, quoteId: string, userId: string) {
    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) throw new NotFoundError('Booking not found');
    if (booking.userId !== userId) throw new AuthorizationError('Access denied');

    const quote = await prisma.quote.findFirst({ where: { id: quoteId, bookingId } });
    if (!quote) throw new NotFoundError('Quote not found');

    if (quote.status !== 'SENT') {
      throw new AppError(400, 'Only sent quotes can be approved', 'QUOTE_NOT_SENT');
    }

    const updatedQuote = await prisma.quote.update({
      where: { id: quoteId },
      data: { status: 'APPROVED', approvedAt: new Date() },
    });

    // Update booking totals and status
    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: BookingStatus.PAYMENT_PENDING,
        subtotal: quote.subtotal,
        taxAmount: quote.taxAmount,
        discountAmount: quote.discountAmount,
        totalAmount: quote.totalAmount,
        balanceAmount: quote.totalAmount,
      },
    });

    await prisma.bookingTimeline.create({
      data: {
        bookingId,
        status: BookingStatus.PAYMENT_PENDING,
        title: 'Quote Approved',
        description: 'You have approved the quote. Please proceed with the payment to confirm your booking.',
        createdBy: userId,
      },
    });

    return updatedQuote;
  }

  async rejectQuote(bookingId: string, quoteId: string, userId: string) {
    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) throw new NotFoundError('Booking not found');
    if (booking.userId !== userId) throw new AuthorizationError('Access denied');

    const quote = await prisma.quote.findFirst({ where: { id: quoteId, bookingId } });
    if (!quote) throw new NotFoundError('Quote not found');

    if (quote.status !== 'SENT') {
      throw new AppError(400, 'Only sent quotes can be rejected', 'QUOTE_NOT_SENT');
    }

    const updatedQuote = await prisma.quote.update({
      where: { id: quoteId },
      data: { status: 'REJECTED', rejectedAt: new Date() },
    });

    await prisma.booking.update({
      where: { id: bookingId },
      data: { status: BookingStatus.PENDING_REVIEW },
    });

    await prisma.bookingTimeline.create({
      data: {
        bookingId,
        status: BookingStatus.PENDING_REVIEW,
        title: 'Quote Rejected',
        description: 'You have rejected the quote. Our team will review your feedback and prepare a revised quote.',
        createdBy: userId,
      },
    });

    return updatedQuote;
  }

  // ─── Payments ─────────────────────────────────────────────────

  async initiatePayment(bookingId: string, userId: string, data: PaymentInput) {
    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) throw new NotFoundError('Booking not found');
    if (booking.userId !== userId) throw new AuthorizationError('Access denied');

    if (booking.status !== BookingStatus.PAYMENT_PENDING) {
      throw new AppError(400, 'Payment is not due for this booking', 'PAYMENT_NOT_DUE');
    }

    if (data.amount > booking.balanceAmount) {
      throw new AppError(400, 'Payment amount exceeds balance due', 'AMOUNT_EXCEEDS_BALANCE');
    }

    const payment = await prisma.payment.create({
      data: {
        bookingId,
        amount: data.amount,
        currency: data.currency,
        method: data.method,
        status: PaymentStatus.PENDING,
        // In production: create Razorpay/Stripe order here and return gatewayOrderId
        gatewayOrderId: `GW-${Date.now()}`,
      },
    });

    return payment;
  }

  async getPayments(bookingId: string, userId: string) {
    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) throw new NotFoundError('Booking not found');
    if (booking.userId !== userId) throw new AuthorizationError('Access denied');

    return prisma.payment.findMany({
      where: { bookingId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async verifyPayment(
    bookingId: string,
    paymentId: string,
    data: { status: 'COMPLETED' | 'FAILED'; transactionId?: string; gatewayResponse?: Record<string, unknown> }
  ) {
    const payment = await prisma.payment.findFirst({ where: { id: paymentId, bookingId } });
    if (!payment) throw new NotFoundError('Payment not found');

    const updatedPayment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: data.status as PaymentStatus,
        transactionId: data.transactionId,
        gatewayResponse: data.gatewayResponse as Prisma.InputJsonValue ?? null,
        paidAt: data.status === 'COMPLETED' ? new Date() : undefined,
      },
    });

    if (data.status === 'COMPLETED') {
      // Update booking paid/balance amounts
      const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
      if (booking) {
        const newPaid = booking.paidAmount + payment.amount;
        const newBalance = booking.totalAmount - newPaid;
        const newStatus = newBalance <= 0 ? BookingStatus.CONFIRMED : booking.status;

        await prisma.booking.update({
          where: { id: bookingId },
          data: {
            paidAmount: newPaid,
            balanceAmount: Math.max(0, newBalance),
            paymentStatus: newBalance <= 0 ? PaymentStatus.COMPLETED : PaymentStatus.PARTIAL,
            status: newStatus,
            confirmedAt: newBalance <= 0 ? new Date() : undefined,
          },
        });

        if (newStatus === BookingStatus.CONFIRMED) {
          await prisma.bookingTimeline.create({
            data: {
              bookingId,
              status: BookingStatus.CONFIRMED,
              title: 'Booking Confirmed',
              description: `Payment of ₹${payment.amount.toLocaleString('en-IN')} received. Your booking is confirmed!`,
            },
          });
        }
      }
    }

    return updatedPayment;
  }

  // ─── Timeline ──────────────────────────────────────────────────

  async getTimeline(bookingId: string, userId?: string) {
    if (userId) {
      const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
      if (!booking) throw new NotFoundError('Booking not found');
      if (booking.userId !== userId) throw new AuthorizationError('Access denied');
    }

    return prisma.bookingTimeline.findMany({
      where: { bookingId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async addTimelineEntry(
    bookingId: string,
    data: { status: BookingStatus; title: string; description?: string; metadata?: Record<string, unknown> },
    adminId: string
  ) {
    return prisma.bookingTimeline.create({
      data: {
        bookingId,
        status: data.status,
        title: data.title,
        description: data.description,
        metadata: data.metadata as Prisma.InputJsonValue ?? null,
        createdBy: adminId,
      },
    });
  }

  // ─── Messages ─────────────────────────────────────────────────

  async getMessages(bookingId: string, userId?: string) {
    if (userId) {
      const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
      if (!booking) throw new NotFoundError('Booking not found');
      if (booking.userId !== userId) throw new AuthorizationError('Access denied');
    }

    return prisma.message.findMany({
      where: { bookingId },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: { select: { id: true, name: true, avatar: true, role: true } },
      },
    });
  }

  async sendMessage(
    bookingId: string,
    senderId: string,
    data: { content: string; type: string; attachments?: string[] }
  ) {
    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) throw new NotFoundError('Booking not found');

    // Verify sender is either the booking owner or an admin
    const isOwner = booking.userId === senderId;
    const admin = await prisma.admin.findUnique({ where: { id: senderId } }).catch(() => null);
    const user = await prisma.user.findUnique({ where: { id: senderId } }).catch(() => null);

    if (!isOwner && !admin && !(user && ['ADMIN', 'SUPER_ADMIN', 'EVENT_MANAGER'].includes(user.role))) {
      throw new AuthorizationError('Not authorized to send messages for this booking');
    }

    // For admin senders, we need a User record — admins with User records or use admin id
    // In practice, messages use the User model senderId
    const message = await prisma.message.create({
      data: {
        bookingId,
        senderId,
        content: data.content,
        type: data.type,
        attachments: data.attachments ?? [],
      },
      include: {
        sender: { select: { id: true, name: true, avatar: true, role: true } },
      },
    });

    return message;
  }

  // ─── Documents ────────────────────────────────────────────────

  async addDocument(
    bookingId: string,
    data: { name: string; url: string; type: string; size: number },
    uploadedBy: string
  ) {
    return prisma.bookingDocument.create({
      data: { bookingId, ...data, uploadedBy },
    });
  }

  async getDocuments(bookingId: string) {
    return prisma.bookingDocument.findMany({
      where: { bookingId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ─── Admin operations ─────────────────────────────────────────

  async getAllBookings(query: BookingQueryInput) {
    const { page, limit, status, eventId, userId, dateFrom, dateTo, sortBy, sortOrder } = query;

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (eventId) where.eventId = eventId;
    if (userId) where.userId = userId;
    if (dateFrom || dateTo) {
      where.eventDate = {};
      if (dateFrom) (where.eventDate as Record<string, Date>).gte = new Date(dateFrom);
      if (dateTo) (where.eventDate as Record<string, Date>).lte = new Date(dateTo);
    }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: { select: { id: true, name: true, email: true, phone: true, avatar: true } },
          event: { select: { id: true, title: true, type: true } },
          venue: { select: { id: true, name: true, city: true } },
          assignedAdmin: { select: { id: true, name: true } },
          _count: { select: { messages: true, quotes: true } },
        },
      }),
      prisma.booking.count({ where }),
    ]);

    return {
      data: bookings,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async adminUpdateBooking(bookingId: string, data: AdminUpdateBookingInput) {
    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) throw new NotFoundError('Booking not found');

    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        ...(data.eventDate && { eventDate: new Date(data.eventDate) }),
        ...(data.eventEndDate && { eventEndDate: new Date(data.eventEndDate) }),
        ...(data.guestCount !== undefined && { guestCount: data.guestCount }),
        ...(data.budget !== undefined && { budget: data.budget }),
        ...(data.notes !== undefined && { notes: data.notes }),
        ...(data.internalNotes !== undefined && { internalNotes: data.internalNotes }),
        ...(data.specialRequests !== undefined && { specialRequests: data.specialRequests }),
        ...(data.status && { status: data.status as BookingStatus }),
        ...(data.assignedAdminId !== undefined && { assignedAdminId: data.assignedAdminId }),
        ...(data.packageId !== undefined && { packageId: data.packageId }),
        ...(data.venueId !== undefined && { venueId: data.venueId }),
        ...(data.subtotal !== undefined && { subtotal: data.subtotal }),
        ...(data.taxAmount !== undefined && { taxAmount: data.taxAmount }),
        ...(data.discountAmount !== undefined && { discountAmount: data.discountAmount }),
        ...(data.totalAmount !== undefined && {
          totalAmount: data.totalAmount,
          balanceAmount: data.totalAmount - booking.paidAmount,
        }),
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        event: { select: { id: true, title: true, type: true } },
      },
    });

    // Auto-create timeline entry on status change
    if (data.status && data.status !== booking.status) {
      const statusLabels: Record<string, string> = {
        PENDING_REVIEW: 'Under Review',
        QUOTED: 'Quote Prepared',
        CUSTOMER_APPROVAL: 'Awaiting Customer Approval',
        PAYMENT_PENDING: 'Payment Pending',
        CONFIRMED: 'Booking Confirmed',
        IN_PROGRESS: 'Event in Progress',
        COMPLETED: 'Event Completed',
        CANCELLED: 'Booking Cancelled',
        REJECTED: 'Booking Rejected',
      };

      await prisma.bookingTimeline.create({
        data: {
          bookingId,
          status: data.status as BookingStatus,
          title: statusLabels[data.status] ?? data.status,
          description: `Booking status updated to ${data.status.replace(/_/g, ' ').toLowerCase()}.`,
        },
      });
    }

    return updated;
  }

  async assignAdmin(bookingId: string, adminId: string) {
    const [booking, admin] = await Promise.all([
      prisma.booking.findUnique({ where: { id: bookingId } }),
      prisma.admin.findUnique({ where: { id: adminId } }),
    ]);

    if (!booking) throw new NotFoundError('Booking not found');
    if (!admin) throw new NotFoundError('Admin not found');

    return prisma.booking.update({
      where: { id: bookingId },
      data: { assignedAdminId: adminId },
    });
  }
}

export const bookingService = new BookingService();
