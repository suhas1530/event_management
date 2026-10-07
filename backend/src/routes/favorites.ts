import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/errorHandler';
import { authMiddleware } from '../middleware/auth';
import { validateBody, validateParams } from '../middleware/validate';
import prisma from '../utils/database';
import { NotFoundError } from '../middleware/errorHandler';

const router = Router();

const objectIdSchema = z.object({ id: z.string().regex(/^[0-9a-fA-F]{24}$/) });

router.use(authMiddleware);

// Get all favorites for user
router.get('/', asyncHandler(async (req, res) => {
  const favorites = await prisma.favorite.findMany({
    where: { userId: req.user!.id },
    include: {
      event: { select: { id: true, title: true, slug: true, type: true, heroImages: true, startingPrice: true, city: true, averageRating: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json(favorites);
}));

// Add favorite
router.post('/', validateBody(z.object({
  eventId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  packageId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  serviceId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  aiDesignId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
})), asyncHandler(async (req, res) => {
  const { eventId, packageId, serviceId, aiDesignId } = req.body;

  if (!eventId && !packageId && !serviceId && !aiDesignId) {
    return res.status(400).json({ error: 'At least one item to favorite is required' });
  }

  // Check if already favorited
  const existing = await prisma.favorite.findFirst({
    where: {
      userId: req.user!.id,
      ...(eventId && { eventId }),
      ...(packageId && { packageId }),
      ...(serviceId && { serviceId }),
      ...(aiDesignId && { aiDesignId }),
    },
  });

  if (existing) {
    return res.status(200).json({ ...existing, alreadyFavorited: true });
  }

  const favorite = await prisma.favorite.create({
    data: {
      userId: req.user!.id,
      eventId,
      packageId,
      serviceId,
      aiDesignId,
    },
  });

  res.status(201).json(favorite);
}));

// Remove favorite
router.delete('/:id', validateParams(objectIdSchema), asyncHandler(async (req, res) => {
  const favorite = await prisma.favorite.findFirst({
    where: { id: req.params.id, userId: req.user!.id },
  });

  if (!favorite) throw new NotFoundError('Favorite not found');

  await prisma.favorite.delete({ where: { id: req.params.id } });
  res.json({ message: 'Removed from favorites' });
}));

// Toggle favorite by event id
router.post('/toggle', validateBody(z.object({
  eventId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  packageId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  serviceId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
})), asyncHandler(async (req, res) => {
  const { eventId, packageId, serviceId } = req.body;

  const existing = await prisma.favorite.findFirst({
    where: {
      userId: req.user!.id,
      ...(eventId && { eventId }),
      ...(packageId && { packageId }),
      ...(serviceId && { serviceId }),
    },
  });

  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } });
    return res.json({ favorited: false });
  }

  await prisma.favorite.create({
    data: { userId: req.user!.id, eventId, packageId, serviceId },
  });

  res.status(201).json({ favorited: true });
}));

export default router;
