import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/errorHandler';
import { adminMiddleware } from '../middleware/adminAuth';
import { validate, validateBody, validateQuery, validateParams } from '../middleware/validate';
import { adminService } from '../services/admin';
import { bookingService } from '../services/booking';
import prisma from '../utils/database';
import {
  createQuoteSchema, updateQuoteSchema,
  adminUpdateBookingSchema, bookingQuerySchema,
} from '../validators/booking';

const router = Router();

const objectIdSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format'),
});
const eventRequestStatusSchema = z.enum([
  'DRAFT', 'REQUIREMENT_SUBMITTED', 'UNDER_REVIEW', 'EVENT_MANAGER_ASSIGNED', 'REQUIREMENT_DISCUSSION',
  'PROPOSAL_PREPARING', 'PROPOSAL_SENT', 'CUSTOMER_REVIEWING', 'CHANGES_REQUESTED',
  'PROPOSAL_APPROVED', 'ADVANCE_PAYMENT_PENDING', 'ADVANCE_PAYMENT_RECEIVED', 'EVENT_CONFIRMED',
  'PLANNING_IN_PROGRESS', 'EVENT_PREPARATION', 'EVENT_DAY', 'EVENT_COMPLETED', 'FINAL_PAYMENT', 'COMPLETED',
]);

const adminAuth = adminMiddleware;

// ─── Dashboard ────────────────────────────────────────────────────────────────

router.get('/dashboard', adminAuth, asyncHandler(async (_req: Request, res: Response) => {
  const stats = await adminService.getDashboardStats();
  res.json(stats);
}));

router.get('/analytics/revenue', adminAuth, asyncHandler(async (req: Request, res: Response) => {
  const period = (req.query.period as '7d' | '30d' | '90d' | '12m') ?? '30d';
  res.json(await adminService.getRevenueAnalytics(period));
}));

router.get('/analytics/bookings', adminAuth, asyncHandler(async (_req: Request, res: Response) => {
  res.json(await adminService.getBookingAnalytics());
}));

// ─── Bookings ─────────────────────────────────────────────────────────────────

router.get('/event-requests', adminAuth, asyncHandler(async (_req: Request, res: Response) => {
  const requests = await prisma.eventRequest.findMany({
    select: {
      id: true, requestNumber: true, customerId: true, eventType: true, eventDate: true,
      guestCount: true, city: true, budgetLabel: true, status: true, assignedManagerId: true,
      createdAt: true, updatedAt: true,
      customer: { select: { id: true, name: true, email: true, phone: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json(requests);
}));

router.get('/event-requests/:id', adminAuth, validateParams(objectIdSchema), asyncHandler(async (req: Request, res: Response) => {
  const eventRequest = await prisma.eventRequest.findUnique({
    where: { id: req.params.id },
    include: { customer: { select: { id: true, name: true, email: true, phone: true } } },
  });
  if (!eventRequest) {
    res.status(404).json({ error: 'Event request not found' });
    return;
  }
  res.json(eventRequest);
}));

router.patch('/event-requests/:id', adminAuth, validateParams(objectIdSchema), validateBody(z.object({
  status: eventRequestStatusSchema.optional(),
  assignedManagerId: z.string().regex(/^[0-9a-fA-F]{24}$/).nullable().optional(),
})), asyncHandler(async (req: Request, res: Response) => {
  const eventRequest = await prisma.eventRequest.update({
    where: { id: req.params.id },
    data: {
      ...(req.body.status ? { status: req.body.status } : {}),
      ...(req.body.assignedManagerId !== undefined ? { assignedManagerId: req.body.assignedManagerId } : {}),
    },
  });
  res.json(eventRequest);
}));

router.get('/event-requests/:id/proposals', adminAuth, validateParams(objectIdSchema), asyncHandler(async (req: Request, res: Response) => {
  const proposals = await prisma.eventProposal.findMany({ where: { requestId: req.params.id }, orderBy: { version: 'desc' } });
  res.json(proposals);
}));

router.post('/event-requests/:id/proposals', adminAuth, validateParams(objectIdSchema), validateBody(z.object({
  items: z.array(z.object({ name: z.string().min(1).max(160), description: z.string().max(500).optional(), quantity: z.number().positive(), unitPrice: z.number().nonnegative() })).min(1),
  taxRate: z.number().min(0).max(1).default(0.18),
  discountAmount: z.number().nonnegative().default(0),
  notes: z.string().max(4000).optional(),
  validUntil: z.string().datetime().optional(),
})), asyncHandler(async (req: Request, res: Response) => {
  const eventRequest = await prisma.eventRequest.findUnique({ where: { id: req.params.id } });
  if (!eventRequest) {
    res.status(404).json({ error: 'Event request not found' });
    return;
  }
  const previous = await prisma.eventProposal.findFirst({ where: { requestId: eventRequest.id }, orderBy: { version: 'desc' } });
  if (previous?.status === 'SENT') {
    await prisma.eventProposal.update({ where: { id: previous.id }, data: { status: 'SUPERSEDED' } });
  }
  const items = req.body.items.map((item: { quantity: number; unitPrice: number }) => ({ ...item, totalPrice: item.quantity * item.unitPrice }));
  const subtotal = items.reduce((total: number, item: { totalPrice: number }) => total + item.totalPrice, 0);
  const taxAmount = Math.round(subtotal * req.body.taxRate * 100) / 100;
  const totalAmount = subtotal + taxAmount - req.body.discountAmount;
  const proposal = await prisma.eventProposal.create({
    data: {
      requestId: eventRequest.id,
      version: (previous?.version ?? 0) + 1,
      createdBy: req.admin!.id,
      items,
      subtotal,
      taxAmount,
      discountAmount: req.body.discountAmount,
      totalAmount,
      notes: req.body.notes,
      validUntil: req.body.validUntil ? new Date(req.body.validUntil) : undefined,
      status: 'SENT',
    },
  });
  await prisma.eventRequest.update({ where: { id: eventRequest.id }, data: { status: 'PROPOSAL_SENT' } });
  res.status(201).json(proposal);
}));

router.get('/bookings', adminAuth, validateQuery(bookingQuerySchema),
  asyncHandler(async (req: Request, res: Response) => {
    res.json(await bookingService.getAllBookings(req.query as any));
  }));

router.get('/bookings/:id', adminAuth, validateParams(objectIdSchema),
  asyncHandler(async (req: Request, res: Response) => {
    res.json(await bookingService.getBookingById(req.params.id));
  }));

router.patch('/bookings/:id', adminAuth, validateParams(objectIdSchema), validate(adminUpdateBookingSchema),
  asyncHandler(async (req: Request, res: Response) => {
    res.json(await bookingService.adminUpdateBooking(req.params.id, req.body));
  }));

router.post('/bookings/:id/assign', adminAuth, validateParams(objectIdSchema),
  validate(z.object({ adminId: z.string().regex(/^[0-9a-fA-F]{24}$/) })),
  asyncHandler(async (req: Request, res: Response) => {
    res.json(await bookingService.assignAdmin(req.params.id, req.body.adminId));
  }));

// ─── Quotes ───────────────────────────────────────────────────────────────────

router.post('/bookings/:id/quotes', adminAuth, validateParams(objectIdSchema), validate(createQuoteSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const quote = await bookingService.createQuote(req.params.id, req.body, req.admin!.id);
    res.status(201).json(quote);
  }));

router.patch('/bookings/:id/quotes/:quoteId',
  adminAuth,
  validateParams(objectIdSchema.extend({ quoteId: z.string().regex(/^[0-9a-fA-F]{24}$/) })),
  validate(updateQuoteSchema),
  asyncHandler(async (req: Request, res: Response) => {
    res.json(await bookingService.updateQuote(req.params.id, req.params.quoteId, req.body));
  }));

router.post('/bookings/:id/quotes/:quoteId/send',
  adminAuth,
  validateParams(objectIdSchema.extend({ quoteId: z.string().regex(/^[0-9a-fA-F]{24}$/) })),
  asyncHandler(async (req: Request, res: Response) => {
    res.json(await bookingService.sendQuote(req.params.id, req.params.quoteId));
  }));

// ─── Payments ─────────────────────────────────────────────────────────────────

router.post('/bookings/:id/payments/:paymentId/verify',
  adminAuth,
  validateParams(objectIdSchema.extend({ paymentId: z.string().regex(/^[0-9a-fA-F]{24}$/) })),
  validate(z.object({
    status: z.enum(['COMPLETED', 'FAILED']),
    transactionId: z.string().optional(),
    gatewayResponse: z.record(z.unknown()).optional(),
  })),
  asyncHandler(async (req: Request, res: Response) => {
    res.json(await bookingService.verifyPayment(req.params.id, req.params.paymentId, req.body));
  }));

// ─── Timeline ─────────────────────────────────────────────────────────────────

router.post('/bookings/:id/timeline',
  adminAuth,
  validateParams(objectIdSchema),
  validate(z.object({
    status: z.enum([
      'DRAFT','REQUESTED','PENDING_REVIEW','QUOTED','CUSTOMER_APPROVAL',
      'PAYMENT_PENDING','CONFIRMED','IN_PROGRESS','COMPLETED','CANCELLED','REJECTED',
    ]),
    title: z.string().min(1),
    description: z.string().optional(),
    metadata: z.record(z.unknown()).optional(),
  })),
  asyncHandler(async (req: Request, res: Response) => {
    const entry = await bookingService.addTimelineEntry(req.params.id, req.body, req.admin!.id);
    res.status(201).json(entry);
  }));

// ─── Customers ────────────────────────────────────────────────────────────────

router.get('/customers', adminAuth, asyncHandler(async (req: Request, res: Response) => {
  const { page = 1, limit = 20, search, role } = req.query;
  res.json(await adminService.getCustomers({
    page: Number(page),
    limit: Number(limit),
    search: search as string | undefined,
    role: role as string | undefined,
  }));
}));

router.get('/customers/:id', adminAuth, validateParams(objectIdSchema),
  asyncHandler(async (req: Request, res: Response) => {
    res.json(await adminService.getCustomerById(req.params.id));
  }));

router.patch('/customers/:id/status', adminAuth, validateParams(objectIdSchema),
  validate(z.object({ isActive: z.boolean() })),
  asyncHandler(async (req: Request, res: Response) => {
    res.json(await adminService.updateUserStatus(req.params.id, req.body.isActive));
  }));

// ─── Admin management (SUPER_ADMIN only) ─────────────────────────────────────

router.get('/admins', adminAuth, asyncHandler(async (req: Request, res: Response) => {
  if (req.admin?.role !== 'SUPER_ADMIN') {
    res.status(403).json({ error: 'Super admin access required' });
    return;
  }
  res.json(await adminService.getAdmins());
}));

router.post('/admins', adminAuth,
  validate(z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(8),
    role: z.enum(['ADMIN','SUPER_ADMIN','EVENT_MANAGER','VENDOR']).optional(),
  })),
  asyncHandler(async (req: Request, res: Response) => {
    if (req.admin?.role !== 'SUPER_ADMIN') {
      res.status(403).json({ error: 'Super admin access required' });
      return;
    }
    res.status(201).json(await adminService.createAdmin(req.body));
  }));

// ─── Audit logs ───────────────────────────────────────────────────────────────

router.get('/audit-logs', adminAuth, asyncHandler(async (req: Request, res: Response) => {
  const { page = 1, limit = 50, adminId, entity } = req.query;
  res.json(await adminService.getAuditLogs({
    page: Number(page),
    limit: Number(limit),
    adminId: adminId as string | undefined,
    entity: entity as string | undefined,
  }));
}));

// ─── Messages ─────────────────────────────────────────────────────────────────

router.get('/bookings/:id/messages', adminAuth, validateParams(objectIdSchema),
  asyncHandler(async (req: Request, res: Response) => {
    res.json(await bookingService.getMessages(req.params.id));
  }));

router.post('/bookings/:id/messages', adminAuth, validateParams(objectIdSchema),
  validate(z.object({
    content: z.string().min(1),
    type: z.enum(['text','image','file']).default('text'),
    attachments: z.array(z.string()).optional(),
  })),
  asyncHandler(async (req: Request, res: Response) => {
    const message = await bookingService.sendMessage(req.params.id, req.admin!.id, req.body);
    res.status(201).json(message);
  }));

export default router;
