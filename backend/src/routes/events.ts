import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { authMiddleware, requireRole } from '../middleware/auth';
import { validateBody, validateQuery, validateParams } from '../middleware/validate';
import { z } from 'zod';
import { eventService } from '../services/event';
import {
  createEventCategorySchema, updateEventCategorySchema,
  createEventSchema, updateEventSchema,
  createVenueSchema, updateVenueSchema,
  createServiceSchema, updateServiceSchema,
  createPackageSchema, updatePackageSchema,
  addPackageServiceSchema, eventQuerySchema,
} from '../validators/event';

const router = Router();

const objectIdSchema = z.object({ id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format') });
const slugSchema = z.object({ slug: z.string().min(1) });
const pkgSvcParams = objectIdSchema.extend({ serviceId: z.string().regex(/^[0-9a-fA-F]{24}$/) });

// ─────────────────────────────────────────────────────────────────────────────
// IMPORTANT: All literal sub-routes MUST come before /:id to avoid shadowing.
// ─────────────────────────────────────────────────────────────────────────────

// ── Event Categories ──────────────────────────────────────────────────────────
router.get('/categories', asyncHandler(async (_req, res) => {
  res.json(await eventService.getCategories());
}));

router.get('/categories/:id', validateParams(objectIdSchema), asyncHandler(async (req, res) => {
  res.json(await eventService.getCategoryById(req.params.id));
}));

router.post('/categories', authMiddleware, requireRole('ADMIN', 'SUPER_ADMIN'), validateBody(createEventCategorySchema), asyncHandler(async (req, res) => {
  res.status(201).json(await eventService.createCategory(req.body));
}));

router.patch('/categories/:id', authMiddleware, requireRole('ADMIN', 'SUPER_ADMIN'), validateParams(objectIdSchema), validateBody(updateEventCategorySchema), asyncHandler(async (req, res) => {
  res.json(await eventService.updateCategory(req.params.id, req.body));
}));

router.delete('/categories/:id', authMiddleware, requireRole('ADMIN', 'SUPER_ADMIN'), validateParams(objectIdSchema), asyncHandler(async (req, res) => {
  await eventService.deleteCategory(req.params.id);
  res.json({ message: 'Category deleted' });
}));

// ── Venues ────────────────────────────────────────────────────────────────────
router.get('/venues', asyncHandler(async (req, res) => {
  const { page = 1, limit = 12, city, search } = req.query;
  res.json(await eventService.getVenues({ page: Number(page), limit: Number(limit), city: city as string, search: search as string }));
}));

router.get('/venues/:id', validateParams(objectIdSchema), asyncHandler(async (req, res) => {
  res.json(await eventService.getVenueById(req.params.id));
}));

router.post('/venues', authMiddleware, requireRole('ADMIN', 'SUPER_ADMIN'), validateBody(createVenueSchema), asyncHandler(async (req, res) => {
  res.status(201).json(await eventService.createVenue(req.body));
}));

router.patch('/venues/:id', authMiddleware, requireRole('ADMIN', 'SUPER_ADMIN'), validateParams(objectIdSchema), validateBody(updateVenueSchema), asyncHandler(async (req, res) => {
  res.json(await eventService.updateVenue(req.params.id, req.body));
}));

router.delete('/venues/:id', authMiddleware, requireRole('ADMIN', 'SUPER_ADMIN'), validateParams(objectIdSchema), asyncHandler(async (req, res) => {
  await eventService.deleteVenue(req.params.id);
  res.json({ message: 'Venue deleted' });
}));

// ── Services ──────────────────────────────────────────────────────────────────
router.get('/services', asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, category, city, search } = req.query;
  res.json(await eventService.getServices({ page: Number(page), limit: Number(limit), category: category as string, city: city as string, search: search as string }));
}));

router.get('/services/popular', asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit as string) || 10;
  res.json(await eventService.getPopularServices(limit));
}));

router.get('/services/:id', validateParams(objectIdSchema), asyncHandler(async (req, res) => {
  res.json(await eventService.getServiceById(req.params.id));
}));

router.post('/services', authMiddleware, requireRole('ADMIN', 'SUPER_ADMIN'), validateBody(createServiceSchema), asyncHandler(async (req, res) => {
  res.status(201).json(await eventService.createService(req.body));
}));

router.patch('/services/:id', authMiddleware, requireRole('ADMIN', 'SUPER_ADMIN'), validateParams(objectIdSchema), validateBody(updateServiceSchema), asyncHandler(async (req, res) => {
  res.json(await eventService.updateService(req.params.id, req.body));
}));

router.delete('/services/:id', authMiddleware, requireRole('ADMIN', 'SUPER_ADMIN'), validateParams(objectIdSchema), asyncHandler(async (req, res) => {
  await eventService.deleteService(req.params.id);
  res.json({ message: 'Service deleted' });
}));

// ── Packages ──────────────────────────────────────────────────────────────────
router.get('/packages', asyncHandler(async (req, res) => {
  const { page = 1, limit = 12, eventId, search } = req.query;
  res.json(await eventService.getPackages({ page: Number(page), limit: Number(limit), eventId: eventId as string, search: search as string }));
}));

router.get('/packages/:id', validateParams(objectIdSchema), asyncHandler(async (req, res) => {
  res.json(await eventService.getPackageById(req.params.id));
}));

router.post('/packages', authMiddleware, requireRole('ADMIN', 'SUPER_ADMIN'), validateBody(createPackageSchema), asyncHandler(async (req, res) => {
  res.status(201).json(await eventService.createPackage(req.body));
}));

router.patch('/packages/:id', authMiddleware, requireRole('ADMIN', 'SUPER_ADMIN'), validateParams(objectIdSchema), validateBody(updatePackageSchema), asyncHandler(async (req, res) => {
  res.json(await eventService.updatePackage(req.params.id, req.body));
}));

router.delete('/packages/:id', authMiddleware, requireRole('ADMIN', 'SUPER_ADMIN'), validateParams(objectIdSchema), asyncHandler(async (req, res) => {
  await eventService.deletePackage(req.params.id);
  res.json({ message: 'Package deleted' });
}));

router.post('/packages/:packageId/services', authMiddleware, requireRole('ADMIN', 'SUPER_ADMIN'),
  validateParams(z.object({ packageId: z.string().regex(/^[0-9a-fA-F]{24}$/) })),
  validateBody(addPackageServiceSchema), asyncHandler(async (req, res) => {
    res.status(201).json(await eventService.addPackageService(req.params.packageId, req.body));
  }));

router.delete('/packages/:packageId/services/:serviceId', authMiddleware, requireRole('ADMIN', 'SUPER_ADMIN'),
  validateParams(pkgSvcParams.extend({ packageId: z.string().regex(/^[0-9a-fA-F]{24}$/) })),
  asyncHandler(async (req, res) => {
    await eventService.removePackageService(req.params.packageId, req.params.serviceId);
    res.json({ message: 'Service removed from package' });
  }));

router.patch('/packages/:packageId/services/:serviceId', authMiddleware, requireRole('ADMIN', 'SUPER_ADMIN'),
  validateParams(pkgSvcParams.extend({ packageId: z.string().regex(/^[0-9a-fA-F]{24}$/) })),
  validateBody(addPackageServiceSchema.partial()), asyncHandler(async (req, res) => {
    res.json(await eventService.updatePackageService(req.params.packageId, req.params.serviceId, req.body));
  }));

// ── Events list + filters (before /:id) ──────────────────────────────────────
router.get('/featured', asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit as string) || 6;
  res.json(await eventService.getFeaturedEvents(limit));
}));

router.get('/slug/:slug', validateParams(slugSchema), asyncHandler(async (req, res) => {
  res.json(await eventService.getEventBySlug(req.params.slug));
}));

router.get('/category/:categoryId', validateParams(objectIdSchema.extend({ categoryId: z.string().regex(/^[0-9a-fA-F]{24}$/) })),
  validateQuery(eventQuerySchema), asyncHandler(async (req, res) => {
    res.json(await eventService.getEventsByCategory(req.params.categoryId, req.query as any));
  }));

router.get('/type/:type', validateQuery(eventQuerySchema), asyncHandler(async (req, res) => {
  res.json(await eventService.getEventsByType(req.params.type as any, req.query as any));
}));

router.get('/', validateQuery(eventQuerySchema), asyncHandler(async (req, res) => {
  res.json(await eventService.getEvents(req.query as any));
}));

// ── Event by ID (MUST be last to avoid swallowing other routes) ───────────────
router.get('/:id', validateParams(objectIdSchema), asyncHandler(async (req, res) => {
  const event = await eventService.getEventById(req.params.id, req.query.incrementView === 'true');
  res.json(event);
}));

router.post('/', authMiddleware, requireRole('ADMIN', 'SUPER_ADMIN'), validateBody(createEventSchema), asyncHandler(async (req, res) => {
  res.status(201).json(await eventService.createEvent(req.body));
}));

router.patch('/:id', authMiddleware, requireRole('ADMIN', 'SUPER_ADMIN'), validateParams(objectIdSchema), validateBody(updateEventSchema), asyncHandler(async (req, res) => {
  res.json(await eventService.updateEvent(req.params.id, req.body));
}));

router.delete('/:id', authMiddleware, requireRole('ADMIN', 'SUPER_ADMIN'), validateParams(objectIdSchema), asyncHandler(async (req, res) => {
  await eventService.deleteEvent(req.params.id);
  res.json({ message: 'Event deleted' });
}));

export default router;
