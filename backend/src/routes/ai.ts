import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { authMiddleware } from '../middleware/auth';
import { validateBody, validateParams } from '../middleware/validate';
import { z } from 'zod';
import { aiService } from '../services/ai';
import {
  aiEventDesignSchema,
  refineDesignSchema,
  aiEstimateSchema,
  aiChatSchema,
  saveDesignSchema,
} from '../validators/ai';

const router = Router();

const objectIdSchema = z.object({ id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format') });

// Generate event design (auth required — saves to user account)
router.post('/event-design', authMiddleware, validateBody(aiEventDesignSchema), asyncHandler(async (req, res) => {
  const result = await aiService.generateEventDesign(req.user!.id, req.body);
  res.status(201).json(result);
}));

// Refine existing design
router.post('/refine-design', authMiddleware, validateBody(refineDesignSchema), asyncHandler(async (req, res) => {
  const result = await aiService.refineDesign(req.user!.id, req.body);
  res.json(result);
}));

// Get cost estimate (no auth required for anonymous estimation)
router.post('/estimate', validateBody(aiEstimateSchema), asyncHandler(async (req, res) => {
  const result = await aiService.estimateCost(req.body);
  res.json(result);
}));

// AI chat
router.post('/chat', validateBody(aiChatSchema), asyncHandler(async (req, res) => {
  const result = await aiService.chat(req.body);
  res.json(result);
}));

// Save design
router.post('/designs/:id/save', authMiddleware, validateParams(objectIdSchema), asyncHandler(async (req, res) => {
  const design = await aiService.saveDesign(req.params.id, req.user!.id);
  res.json(design);
}));

// Get user's saved designs
router.get('/designs', authMiddleware, asyncHandler(async (req, res) => {
  const designs = await aiService.getUserDesigns(req.user!.id);
  res.json(designs);
}));

// Get single design
router.get('/designs/:id', authMiddleware, validateParams(objectIdSchema), asyncHandler(async (req, res) => {
  const design = await aiService.getDesignById(req.params.id, req.user!.id);
  res.json(design);
}));

export default router;
