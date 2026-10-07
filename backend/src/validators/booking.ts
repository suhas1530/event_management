import { z } from 'zod';

export const createBookingSchema = z.object({
  eventId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid event ID'),
  packageId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  venueId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  aiDesignId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  eventDate: z.string().datetime(),
  eventEndDate: z.string().datetime().optional(),
  guestCount: z.number().int().min(1),
  budget: z.number().min(0).optional(),
  notes: z.string().max(2000).optional(),
  specialRequests: z.string().max(2000).optional(),
  items: z.array(z.object({
    serviceId: z.string().regex(/^[0-9a-fA-F]{24}$/),
    quantity: z.number().int().min(1).default(1),
    customNotes: z.string().max(500).optional(),
  })).optional(),
});

export const updateBookingSchema = z.object({
  eventDate: z.string().datetime().optional(),
  eventEndDate: z.string().datetime().optional(),
  guestCount: z.number().int().min(1).optional(),
  budget: z.number().min(0).optional(),
  notes: z.string().max(2000).optional(),
  specialRequests: z.string().max(2000).optional(),
  status: z.enum([
    'DRAFT', 'REQUESTED', 'PENDING_REVIEW', 'QUOTED', 'CUSTOMER_APPROVAL',
    'PAYMENT_PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'REJECTED'
  ]).optional(),
});

export const adminUpdateBookingSchema = z.object({
  eventDate: z.string().datetime().optional(),
  eventEndDate: z.string().datetime().optional(),
  guestCount: z.number().int().min(1).optional(),
  budget: z.number().min(0).optional(),
  notes: z.string().max(2000).optional(),
  internalNotes: z.string().max(2000).optional(),
  specialRequests: z.string().max(2000).optional(),
  status: z.enum([
    'DRAFT', 'REQUESTED', 'PENDING_REVIEW', 'QUOTED', 'CUSTOMER_APPROVAL',
    'PAYMENT_PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'REJECTED'
  ]).optional(),
  assignedAdminId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  packageId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  venueId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  subtotal: z.number().min(0).optional(),
  taxAmount: z.number().min(0).optional(),
  discountAmount: z.number().min(0).optional(),
  totalAmount: z.number().min(0).optional(),
});

export const createQuoteSchema = z.object({
  bookingId: z.string().regex(/^[0-9a-fA-F]{24}$/),
  items: z.array(z.object({
    serviceId: z.string().regex(/^[0-9a-fA-F]{24}$/),
    name: z.string(),
    description: z.string().optional(),
    quantity: z.number().int().min(1),
    unitPrice: z.number().min(0),
    totalPrice: z.number().min(0),
  })).min(1),
  subtotal: z.number().min(0),
  taxAmount: z.number().min(0).default(0),
  discountAmount: z.number().min(0).default(0),
  totalAmount: z.number().min(0),
  validUntil: z.string().datetime(),
  notes: z.string().max(1000).optional(),
});

export const updateQuoteSchema = z.object({
  items: z.array(z.object({
    serviceId: z.string().regex(/^[0-9a-fA-F]{24}$/),
    name: z.string(),
    description: z.string().optional(),
    quantity: z.number().int().min(1),
    unitPrice: z.number().min(0),
    totalPrice: z.number().min(0),
  })).optional(),
  subtotal: z.number().min(0).optional(),
  taxAmount: z.number().min(0).optional(),
  discountAmount: z.number().min(0).optional(),
  totalAmount: z.number().min(0).optional(),
  validUntil: z.string().datetime().optional(),
  notes: z.string().max(1000).optional(),
  status: z.enum(['DRAFT', 'SENT', 'APPROVED', 'REJECTED', 'EXPIRED']).optional(),
});

export const bookingQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  status: z.string().optional(),
  eventId: z.string().optional(),
  userId: z.string().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  sortBy: z.enum(['createdAt', 'eventDate', 'totalAmount', 'status']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const paymentSchema = z.object({
  bookingId: z.string().regex(/^[0-9a-fA-F]{24}$/),
  amount: z.number().min(1),
  method: z.enum(['RAZORPAY', 'STRIPE', 'BANK_TRANSFER', 'CASH']),
  currency: z.string().length(3).default('INR'),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type UpdateBookingInput = z.infer<typeof updateBookingSchema>;
export type AdminUpdateBookingInput = z.infer<typeof adminUpdateBookingSchema>;
export type CreateQuoteInput = z.infer<typeof createQuoteSchema>;
export type UpdateQuoteInput = z.infer<typeof updateQuoteSchema>;
export type BookingQueryInput = z.infer<typeof bookingQuerySchema>;
export type PaymentInput = z.infer<typeof paymentSchema>;