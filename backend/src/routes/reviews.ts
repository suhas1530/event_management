import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/errorHandler';
import { authMiddleware } from '../middleware/auth';
import { validateBody, validateParams, validateQuery } from '../middleware/validate';
import prisma from '../utils/database';
import { NotFoundError, AppError, AuthorizationError } from '../middleware/errorHandler';

const router = Router();

const objectIdSchema = z.object({ id: z.string().regex(/^[0-9a-fA-F]{24}$/) });

const createReviewSchema = z.object({
  eventId: z.string().regex(/^[0-9a-fA-F]{24}$/),
  bookingId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  rating: z.number().int().min(1).max(5),
  title: z.string().min(2).max(200).optional(),
  comment: z.string().min(10).max(2000).optional(),
  images: z.array(z.string().url()).max(5).default([]),
});

const reviewQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  eventId: z.string().optional(),
  rating: z.coerce.number().int().min(1).max(5).optional(),
  sortBy: z.enum(['createdAt', 'rating']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Get reviews (public)
router.get('/', validateQuery(reviewQuerySchema), asyncHandler(async (req, res) => {
  const { page, limit, eventId, rating, sortBy, sortOrder } = req.query as any;

  const where: Record<string, unknown> = { isVisible: true };
  if (eventId) where.eventId = eventId;
  if (rating) where.rating = Number(rating);

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where,
      orderBy: { [sortBy as string]: sortOrder },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      include: {
        user: { select: { id: true, name: true, avatar: true } },
        event: { select: { id: true, title: true, slug: true } },
      },
    }),
    prisma.review.count({ where }),
  ]);

  res.json({
    data: reviews,
    pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) },
  });
}));

// Create review (authenticated, must have completed booking)
router.post('/', authMiddleware, validateBody(createReviewSchema), asyncHandler(async (req, res) => {
  const { eventId, bookingId, rating, title, comment, images } = req.body;

  // Verify event exists
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) throw new NotFoundError('Event not found');

  // Check for duplicate
  const existing = await prisma.review.findFirst({
    where: { userId: req.user!.id, eventId },
  });
  if (existing) throw new AppError(409, 'You have already reviewed this event', 'DUPLICATE_REVIEW');

  // If bookingId provided, verify it belongs to user and is completed
  if (bookingId) {
    const booking = await prisma.booking.findFirst({
      where: { id: bookingId, userId: req.user!.id },
    });
    if (!booking) throw new NotFoundError('Booking not found');
  }

  const review = await prisma.review.create({
    data: {
      userId: req.user!.id,
      eventId,
      bookingId,
      rating,
      title,
      comment,
      images,
      isVerified: !!bookingId,
    },
    include: {
      user: { select: { id: true, name: true, avatar: true } },
    },
  });

  // Update event average rating
  const stats = await prisma.review.aggregate({
    where: { eventId, isVisible: true },
    _avg: { rating: true },
    _count: { id: true },
  });

  await prisma.event.update({
    where: { id: eventId },
    data: {
      averageRating: Math.round((stats._avg.rating ?? 0) * 10) / 10,
      totalReviews: stats._count.id,
    },
  });

  res.status(201).json(review);
}));

// Update review (owner only)
router.patch('/:id', authMiddleware, validateParams(objectIdSchema), validateBody(createReviewSchema.partial().omit({ eventId: true, bookingId: true })), asyncHandler(async (req, res) => {
  const review = await prisma.review.findUnique({ where: { id: req.params.id } });
  if (!review) throw new NotFoundError('Review not found');
  if (review.userId !== req.user!.id) throw new AuthorizationError('Access denied');

  const updated = await prisma.review.update({
    where: { id: req.params.id },
    data: req.body,
  });

  res.json(updated);
}));

// Delete review
router.delete('/:id', authMiddleware, validateParams(objectIdSchema), asyncHandler(async (req, res) => {
  const review = await prisma.review.findUnique({ where: { id: req.params.id } });
  if (!review) throw new NotFoundError('Review not found');

  // Owner or admin can delete
  const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(req.user!.role);
  if (review.userId !== req.user!.id && !isAdmin) throw new AuthorizationError('Access denied');

  await prisma.review.delete({ where: { id: req.params.id } });
  res.json({ message: 'Review deleted' });
}));

export default router;
