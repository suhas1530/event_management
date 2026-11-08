import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { asyncHandler } from '../middleware/errorHandler';
import { authMiddleware } from '../middleware/auth';
import { validateBody, validateParams } from '../middleware/validate';
import { eventDesignService } from '../services/eventDesign';
import {
  eventDesignCustomizeSchema,
  eventDesignGenerateSchema,
  eventDesignRegenerateSchema,
  eventDesignSaveSchema,
} from '../validators/eventDesign';

const router = Router();

const designLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 12,
  message: {
    error: 'Too many design requests. Please wait a minute and try again.',
    code: 'AI_RATE_LIMITED',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const designIdSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid design ID'),
});

// Public: guests can explore recommendations. Nothing is saved until they
// explicitly sign in and choose Save.
router.post(
  '/recommendations',
  designLimiter,
  validateBody(eventDesignGenerateSchema),
  asyncHandler(async (req, res) => {
    const result = await eventDesignService.generate(req.body);
    res.json(result);
  }),
);

router.post(
  '/regenerate',
  designLimiter,
  validateBody(eventDesignRegenerateSchema),
  asyncHandler(async (req, res) => {
    const result = await eventDesignService.regenerate(req.body);
    res.json(result);
  }),
);

router.post(
  '/customize',
  designLimiter,
  validateBody(eventDesignCustomizeSchema),
  asyncHandler(async (req, res) => {
    const result = await eventDesignService.customize(req.body);
    res.json(result);
  }),
);

// Authenticated: saved designs are always scoped to the signed-in user.
router.post(
  '/save',
  authMiddleware,
  designLimiter,
  validateBody(eventDesignSaveSchema),
  asyncHandler(async (req, res) => {
    const design = await eventDesignService.save(req.user!.id, req.body);
    res.status(201).json({ design });
  }),
);

router.get(
  '/saved',
  authMiddleware,
  asyncHandler(async (req, res) => {
    const designs = await eventDesignService.getSaved(req.user!.id);
    res.json({ designs });
  }),
);

router.get(
  '/saved/:id',
  authMiddleware,
  validateParams(designIdSchema),
  asyncHandler(async (req, res) => {
    const design = await eventDesignService.getSavedById(req.user!.id, req.params.id);
    res.json({ design });
  }),
);

export default router;
