import { z } from 'zod';

const TECH_CATEGORIES = [
  'PLUMBING','ELECTRICAL','AC_SERVICE','APPLIANCE_REPAIR',
  'CARPENTRY','PAINTING','CLEANING','COMPUTER_REPAIR',
  'CCTV_INSTALLATION','PEST_CONTROL','OTHER',
] as const;

const TECH_BOOKING_STATUSES = [
  'PENDING','CONFIRMED','TECHNICIAN_ASSIGNED','TECHNICIAN_CONFIRMED',
  'TECHNICIAN_ON_THE_WAY','TECHNICIAN_ARRIVED','SERVICE_STARTED',
  'SERVICE_COMPLETED','PAYMENT_COMPLETED','REVIEW_SUBMITTED',
  'CANCELLED','REJECTED',
] as const;

// ─── Technician profile ───────────────────────────────────────────────────────

export const createTechnicianSchema = z.object({
  name: z.string().min(2).max(100),
  phone: z.string().regex(/^\+?[0-9]{10,15}$/, 'Invalid phone number'),
  email: z.string().email(),
  category: z.enum(TECH_CATEGORIES),
  experience: z.number().int().min(0).max(50).default(0),
  bio: z.string().max(1000).optional(),
  serviceAreas: z.array(z.string()).default([]),
  skills: z.array(z.string()).default([]),
  avatar: z.string().url().optional(),
});

export const updateTechnicianSchema = createTechnicianSchema.partial();

// ─── Technician booking ───────────────────────────────────────────────────────

export const createTechnicianBookingSchema = z.object({
  serviceId: z.string().regex(/^[0-9a-fA-F]{24}$/),
  category: z.enum(TECH_CATEGORIES),
  serviceDescription: z.string().max(2000).optional(),
  technicianId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  // Address
  addressLine1: z.string().min(5).max(200),
  addressLine2: z.string().max(200).optional(),
  addressCity: z.string().min(2).max(100),
  addressState: z.string().max(100).optional(),
  addressPincode: z.string().regex(/^[0-9]{6}$/, 'Invalid pincode'),
  addressLabel: z.enum(['Home', 'Work', 'Other']).default('Home'),
  // Scheduling
  scheduledDate: z.string().datetime(),
  timeSlotStart: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Invalid time HH:MM'),
  timeSlotEnd: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Invalid time HH:MM'),
  // Payment
  paymentMethod: z.enum(['CASH','UPI','CARD','ONLINE','BANK_TRANSFER']).optional(),
  customerNotes: z.string().max(1000).optional(),
  attachments: z.array(z.string().url()).default([]),
});

export const updateTechnicianBookingSchema = z.object({
  technicianId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  scheduledDate: z.string().datetime().optional(),
  timeSlotStart: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
  timeSlotEnd: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
  customerNotes: z.string().max(1000).optional(),
  technicianNotes: z.string().max(1000).optional(),
  finalPrice: z.number().min(0).optional(),
  materialCost: z.number().min(0).optional(),
  cancellationReason: z.string().max(500).optional(),
});

export const updateBookingStatusSchema = z.object({
  status: z.enum(TECH_BOOKING_STATUSES),
  note: z.string().max(500).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const technicianBookingQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  status: z.string().optional(),
  category: z.string().optional(),
  technicianId: z.string().optional(),
  customerId: z.string().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  sortBy: z.enum(['createdAt','scheduledDate','totalAmount','status']).default('createdAt'),
  sortOrder: z.enum(['asc','desc']).default('desc'),
});

export const technicianQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  category: z.string().optional(),
  city: z.string().optional(),
  search: z.string().optional(),
  isVerified: z.coerce.boolean().optional(),
  isAvailable: z.coerce.boolean().optional(),
});

export const createTechnicianReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  title: z.string().max(200).optional(),
  comment: z.string().max(2000).optional(),
  images: z.array(z.string().url()).default([]),
});

export type CreateTechnicianInput = z.infer<typeof createTechnicianSchema>;
export type UpdateTechnicianInput = z.infer<typeof updateTechnicianSchema>;
export type CreateTechnicianBookingInput = z.infer<typeof createTechnicianBookingSchema>;
export type UpdateTechnicianBookingInput = z.infer<typeof updateTechnicianBookingSchema>;
export type UpdateBookingStatusInput = z.infer<typeof updateBookingStatusSchema>;
export type TechnicianBookingQueryInput = z.infer<typeof technicianBookingQuerySchema>;
export type TechnicianQueryInput = z.infer<typeof technicianQuerySchema>;
export type CreateTechnicianReviewInput = z.infer<typeof createTechnicianReviewSchema>;
