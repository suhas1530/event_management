import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/errorHandler';
import { authMiddleware, requireRole } from '../middleware/auth';
import { adminMiddleware } from '../middleware/adminAuth';
import { validate, validateQuery, validateParams } from '../middleware/validate';
import { technicianService } from '../services/technician';
import prisma from '../utils/database';
import {
  createTechnicianBookingSchema,
  updateTechnicianBookingSchema,
  updateBookingStatusSchema,
  technicianBookingQuerySchema,
  technicianQuerySchema,
  createTechnicianReviewSchema,
} from '../validators/technician';

const router = Router();
const objectId = z.object({ id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID') });

/** Mirrors the `TechnicianCategory` enum in the Prisma schema. */
const TECHNICIAN_CATEGORIES = new Set([
  'PLUMBING', 'ELECTRICAL', 'AC_SERVICE', 'APPLIANCE_REPAIR', 'CARPENTRY',
  'PAINTING', 'CLEANING', 'COMPUTER_REPAIR', 'CCTV_INSTALLATION',
  'PEST_CONTROL', 'OTHER',
]);

/**
 * Normalises a category coming from a query string or path segment.
 *
 * Accepts the slugs the marketing site uses (`ac-service`, `ac service`) as
 * well as the enum form, and returns `null` when the value cannot be mapped to
 * a real `TechnicianCategory`. Callers must never hand an unvalidated value to
 * Prisma: an unknown enum value surfaces as an opaque 500 from the driver.
 */
function parseCategory(raw: unknown): string | null {
  const value = String(raw ?? '').trim().toUpperCase().replace(/[\s-]+/g, '_');
  if (!value) return '';
  return TECHNICIAN_CATEGORIES.has(value) ? value : null;
}

function unknownCategory(res: import('express').Response, raw: unknown) {
  return res.status(400).json({
    error: `Unknown technician category "${String(raw ?? '')}"`,
    code: 'VALIDATION_ERROR',
    details: [
      { field: 'category', message: `Expected one of: ${[...TECHNICIAN_CATEGORIES].join(', ')}` },
    ],
  });
}

// ─── Public: technician listing ───────────────────────────────────────────────

router.get('/', validateQuery(technicianQuerySchema), asyncHandler(async (req, res) => {
  const result = await technicianService.getTechnicians(req.query as any);
  res.json(result);
}));

router.get('/available', validateQuery(z.object({
  category: z.string().optional(),
  date: z.string().optional(),
})), asyncHandler(async (req, res) => {
  const category = parseCategory(req.query.category);
  if (category === null) return unknownCategory(res, req.query.category);

  const techs = await technicianService.getAvailableTechnicians(category, req.query.date?.toString() ?? '');
  res.json(techs);
}));

// `validateQuery` supplies the page/limit defaults the service needs to compute
// `skip` — without it, an unparameterised call reached Prisma with a missing
// `skip` argument and returned a 500.
router.get('/category/:category', validateQuery(technicianQuerySchema.omit({ category: true })), asyncHandler(async (req, res) => {
  const category = parseCategory(req.params.category);
  if (category === null) return unknownCategory(res, req.params.category);

  const result = await technicianService.getTechniciansByCategory(category, req.query as any);
  res.json(result);
}));

router.get('/services/category/:category', asyncHandler(async (req, res) => {
  const category = parseCategory(req.params.category);
  if (category === null) return unknownCategory(res, req.params.category);

  const services = await technicianService.getServicesByCategory(category);
  res.json(services);
}));

router.get('/services/:id', validateParams(objectId), asyncHandler(async (req, res) => {
  const service = await technicianService.getServiceById(req.params.id);
  res.json(service);
}));

// ─── Technician-role: view own assigned jobs ──────────────────────────────────
// NOTE: these two routes must stay ABOVE `/:id`. Express matches in
// registration order, so a single-segment path like `/my-jobs` registered
// after `/:id` would be swallowed by it and fail ObjectId validation.

router.get('/my-jobs', authMiddleware, requireRole('TECHNICIAN'), validateQuery(technicianBookingQuerySchema), asyncHandler(async (req, res) => {
  // Find the technician profile for this user
  const techProfile = await prisma.technician.findUnique({
    where: { userId: req.user!.id },
  });
  if (!techProfile) return res.status(404).json({ error: 'Technician profile not found' });
  const result = await technicianService.getTechnicianBookings(techProfile.id, req.query as any);
  res.json(result);
}));

router.patch('/my-jobs/:id/status', authMiddleware, requireRole('TECHNICIAN'), validateParams(objectId), validate(updateBookingStatusSchema), asyncHandler(async (req, res) => {
  const techProfile = await prisma.technician.findUnique({
    where: { userId: req.user!.id },
  });
  if (!techProfile) return res.status(404).json({ error: 'Technician profile not found' });

  // Technicians can only move to certain statuses
  const allowedForTechnician = [
    'TECHNICIAN_CONFIRMED', 'TECHNICIAN_ON_THE_WAY', 'TECHNICIAN_ARRIVED',
    'SERVICE_STARTED', 'SERVICE_COMPLETED',
  ];
  if (!allowedForTechnician.includes(req.body.status)) {
    return res.status(403).json({ error: 'Technicians cannot set this status' });
  }

  const booking = await technicianService.updateBookingStatus(req.params.id, req.body, req.user!.id);
  res.json(booking);
}));

router.get('/:id', validateParams(objectId), asyncHandler(async (req, res) => {
  const tech = await technicianService.getTechnicianById(req.params.id);
  res.json(tech);
}));

// ─── Customer: create / manage their own bookings ─────────────────────────────

router.post('/bookings', authMiddleware, validate(createTechnicianBookingSchema), asyncHandler(async (req, res) => {
  const booking = await technicianService.createBooking(req.user!.id, req.body);
  res.status(201).json(booking);
}));

router.get('/bookings/my', authMiddleware, validateQuery(technicianBookingQuerySchema), asyncHandler(async (req, res) => {
  const result = await technicianService.getCustomerBookings(req.user!.id, req.query as any);
  res.json(result);
}));

router.get('/bookings/:id', authMiddleware, validateParams(objectId), asyncHandler(async (req, res) => {
  const booking = await technicianService.getBookingById(req.params.id, req.user!.id);
  res.json(booking);
}));

router.delete('/bookings/:id', authMiddleware, validateParams(objectId), validate(z.object({ reason: z.string().max(500).optional() })), asyncHandler(async (req, res) => {
  await technicianService.cancelBooking(req.params.id, req.user!.id, req.body.reason);
  res.json({ message: 'Booking cancelled' });
}));

// Review after completion
router.post('/bookings/:id/review', authMiddleware, validateParams(objectId), validate(createTechnicianReviewSchema), asyncHandler(async (req, res) => {
  const review = await technicianService.createReview(req.params.id, req.user!.id, req.body);
  res.status(201).json(review);
}));

// ─── Admin: full booking management ──────────────────────────────────────────

router.get('/admin/bookings', adminMiddleware, validateQuery(technicianBookingQuerySchema), asyncHandler(async (req, res) => {
  const result = await technicianService.getAllBookings(req.query as any);
  res.json(result);
}));

router.get('/admin/bookings/:id', adminMiddleware, validateParams(objectId), asyncHandler(async (req, res) => {
  const booking = await technicianService.getBookingById(req.params.id);
  res.json(booking);
}));

router.patch('/admin/bookings/:id/status', adminMiddleware, validateParams(objectId), validate(updateBookingStatusSchema), asyncHandler(async (req, res) => {
  const booking = await technicianService.updateBookingStatus(req.params.id, req.body, req.admin!.id);
  res.json(booking);
}));

router.post('/admin/bookings/:id/assign', adminMiddleware, validateParams(objectId), validate(z.object({ technicianId: z.string().regex(/^[0-9a-fA-F]{24}$/) })), asyncHandler(async (req, res) => {
  const booking = await technicianService.assignTechnician(req.params.id, req.body.technicianId, req.admin!.id);
  res.json(booking);
}));

router.get('/admin/stats', adminMiddleware, asyncHandler(async (_req, res) => {
  const stats = await technicianService.getDashboardStats();
  res.json(stats);
}));

export default router;
