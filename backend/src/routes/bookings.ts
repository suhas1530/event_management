import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { authMiddleware, requireRole } from '../middleware/auth';
import { validateBody, validateQuery, validateParams } from '../middleware/validate';
import { z } from 'zod';
import { bookingService } from '../services/booking';
import { createBookingSchema, updateBookingSchema, adminUpdateBookingSchema, createQuoteSchema, updateQuoteSchema, bookingQuerySchema, paymentSchema } from '../validators/booking';

const router = Router();

const objectIdSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format'),
});

// User booking routes
router.post('/', authMiddleware, validateBody(createBookingSchema), asyncHandler(async (req, res) => {
  const booking = await bookingService.createBooking(req.user!.id, req.body);
  res.status(201).json(booking);
}));

router.get('/', authMiddleware, validateQuery(bookingQuerySchema), asyncHandler(async (req, res) => {
  const result = await bookingService.getUserBookings(req.user!.id, req.query as any);
  res.json(result);
}));

router.get('/:id', authMiddleware, validateParams(objectIdSchema), asyncHandler(async (req, res) => {
  const booking = await bookingService.getBookingById(req.params.id, req.user!.id);
  res.json(booking);
}));

router.patch('/:id', authMiddleware, validateParams(objectIdSchema), validateBody(updateBookingSchema), asyncHandler(async (req, res) => {
  const booking = await bookingService.updateBooking(req.params.id, req.user!.id, req.body);
  res.json(booking);
}));

router.delete('/:id', authMiddleware, validateParams(objectIdSchema), asyncHandler(async (req, res) => {
  await bookingService.cancelBooking(req.params.id, req.user!.id);
  res.json({ message: 'Booking cancelled successfully' });
}));

// Quote routes (user)
router.get('/:id/quotes', authMiddleware, validateParams(objectIdSchema), asyncHandler(async (req, res) => {
  const quotes = await bookingService.getQuotes(req.params.id, req.user!.id);
  res.json(quotes);
}));

router.post('/:id/quotes/:quoteId/approve', authMiddleware, validateParams(objectIdSchema.extend({ quoteId: z.string().regex(/^[0-9a-fA-F]{24}$/) })), asyncHandler(async (req, res) => {
  const quote = await bookingService.approveQuote(req.params.id, req.params.quoteId, req.user!.id);
  res.json(quote);
}));

router.post('/:id/quotes/:quoteId/reject', authMiddleware, validateParams(objectIdSchema.extend({ quoteId: z.string().regex(/^[0-9a-fA-F]{24}$/) })), asyncHandler(async (req, res) => {
  const quote = await bookingService.rejectQuote(req.params.id, req.params.quoteId, req.user!.id);
  res.json(quote);
}));

// Payment routes
router.post('/:id/payments', authMiddleware, validateParams(objectIdSchema), validateBody(paymentSchema), asyncHandler(async (req, res) => {
  const payment = await bookingService.initiatePayment(req.params.id, req.user!.id, req.body);
  res.json(payment);
}));

router.get('/:id/payments', authMiddleware, validateParams(objectIdSchema), asyncHandler(async (req, res) => {
  const payments = await bookingService.getPayments(req.params.id, req.user!.id);
  res.json(payments);
}));

// Booking timeline
router.get('/:id/timeline', authMiddleware, validateParams(objectIdSchema), asyncHandler(async (req, res) => {
  const timeline = await bookingService.getTimeline(req.params.id, req.user!.id);
  res.json(timeline);
}));

// Booking messages
router.get('/:id/messages', authMiddleware, validateParams(objectIdSchema), asyncHandler(async (req, res) => {
  const messages = await bookingService.getMessages(req.params.id, req.user!.id);
  res.json(messages);
}));

router.post('/:id/messages', authMiddleware, validateParams(objectIdSchema), validateBody(z.object({ content: z.string().min(1), type: z.enum(['text', 'image', 'file']).default('text'), attachments: z.array(z.string()).optional() })), asyncHandler(async (req, res) => {
  const message = await bookingService.sendMessage(req.params.id, req.user!.id, req.body);
  res.status(201).json(message);
}));

// Admin booking routes — NOTE: these are now handled by /api/v1/admin/bookings
// Kept here as a legacy alias with proper ordering
router.get('/admin/all', authMiddleware, requireRole('ADMIN', 'SUPER_ADMIN', 'EVENT_MANAGER'), validateQuery(bookingQuerySchema), asyncHandler(async (req, res) => {
  const result = await bookingService.getAllBookings(req.query as any);
  res.json(result);
}));

router.get('/admin/:id', authMiddleware, requireRole('ADMIN', 'SUPER_ADMIN', 'EVENT_MANAGER'), validateParams(objectIdSchema), asyncHandler(async (req, res) => {
  const booking = await bookingService.getBookingById(req.params.id);
  res.json(booking);
}));

router.patch('/admin/:id', authMiddleware, requireRole('ADMIN', 'SUPER_ADMIN', 'EVENT_MANAGER'), validateParams(objectIdSchema), validateBody(adminUpdateBookingSchema), asyncHandler(async (req, res) => {
  const booking = await bookingService.adminUpdateBooking(req.params.id, req.body);
  res.json(booking);
}));

router.post('/admin/:id/assign', authMiddleware, requireRole('ADMIN', 'SUPER_ADMIN'), validateParams(objectIdSchema), validateBody(z.object({ adminId: z.string().regex(/^[0-9a-fA-F]{24}$/) })), asyncHandler(async (req, res) => {
  const booking = await bookingService.assignAdmin(req.params.id, req.body.adminId);
  res.json(booking);
}));

// Admin quote routes
router.post('/admin/:id/quotes', authMiddleware, requireRole('ADMIN', 'SUPER_ADMIN', 'EVENT_MANAGER'), validateParams(objectIdSchema), validateBody(createQuoteSchema), asyncHandler(async (req, res) => {
  const quote = await bookingService.createQuote(req.params.id, req.body, req.user!.id);
  res.status(201).json(quote);
}));

router.patch('/admin/:id/quotes/:quoteId', authMiddleware, requireRole('ADMIN', 'SUPER_ADMIN', 'EVENT_MANAGER'), validateParams(objectIdSchema.extend({ quoteId: z.string().regex(/^[0-9a-fA-F]{24}$/) })), validateBody(updateQuoteSchema), asyncHandler(async (req, res) => {
  const quote = await bookingService.updateQuote(req.params.id, req.params.quoteId, req.body);
  res.json(quote);
}));

router.post('/admin/:id/quotes/:quoteId/send', authMiddleware, requireRole('ADMIN', 'SUPER_ADMIN', 'EVENT_MANAGER'), validateParams(objectIdSchema.extend({ quoteId: z.string().regex(/^[0-9a-fA-F]{24}$/) })), asyncHandler(async (req, res) => {
  const quote = await bookingService.sendQuote(req.params.id, req.params.quoteId);
  res.json(quote);
}));

// Admin payment verification
router.post('/admin/:id/payments/:paymentId/verify', authMiddleware, requireRole('ADMIN', 'SUPER_ADMIN'), validateParams(objectIdSchema.extend({ paymentId: z.string().regex(/^[0-9a-fA-F]{24}$/) })), validateBody(z.object({ status: z.enum(['COMPLETED', 'FAILED']), transactionId: z.string().optional(), gatewayResponse: z.record(z.unknown()).optional() })), asyncHandler(async (req, res) => {
  const payment = await bookingService.verifyPayment(req.params.id, req.params.paymentId, req.body);
  res.json(payment);
}));

// Admin timeline
router.post('/admin/:id/timeline', authMiddleware, requireRole('ADMIN', 'SUPER_ADMIN', 'EVENT_MANAGER'), validateParams(objectIdSchema), validateBody(z.object({ status: z.enum(['DRAFT', 'REQUESTED', 'PENDING_REVIEW', 'QUOTED', 'CUSTOMER_APPROVAL', 'PAYMENT_PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'REJECTED']), title: z.string().min(1), description: z.string().optional(), metadata: z.record(z.unknown()).optional() })), asyncHandler(async (req, res) => {
  const timeline = await bookingService.addTimelineEntry(req.params.id, req.body, req.user!.id);
  res.status(201).json(timeline);
}));

// Admin documents
router.post('/admin/:id/documents', authMiddleware, requireRole('ADMIN', 'SUPER_ADMIN', 'EVENT_MANAGER'), validateParams(objectIdSchema), validateBody(z.object({ name: z.string().min(1), url: z.string().url(), type: z.string().min(1), size: z.number().int().positive() })), asyncHandler(async (req, res) => {
  const document = await bookingService.addDocument(req.params.id, req.body, req.user!.id);
  res.status(201).json(document);
}));

router.get('/admin/:id/documents', authMiddleware, requireRole('ADMIN', 'SUPER_ADMIN', 'EVENT_MANAGER'), validateParams(objectIdSchema), asyncHandler(async (req, res) => {
  const documents = await bookingService.getDocuments(req.params.id);
  res.json(documents);
}));

export default router;