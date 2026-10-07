import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { authMiddleware } from '../middleware/auth';
import { validateParams, validateQuery } from '../middleware/validate';
import { z } from 'zod';
import { notificationService } from '../services/notification';
import { notificationQuerySchema } from '../validators/notification';

const router = Router();

const objectIdSchema = z.object({ id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format') });

// All notification routes require authentication
router.use(authMiddleware);

// Get user notifications
router.get('/', validateQuery(notificationQuerySchema), asyncHandler(async (req, res) => {
  const result = await notificationService.getUserNotifications(req.user!.id, req.query as any);
  res.json(result);
}));

// Mark single as read
router.patch('/:id/read', validateParams(objectIdSchema), asyncHandler(async (req, res) => {
  const notification = await notificationService.markAsRead(req.params.id, req.user!.id);
  res.json(notification);
}));

// Mark all as read
router.patch('/read-all', asyncHandler(async (req, res) => {
  await notificationService.markAllAsRead(req.user!.id);
  res.json({ message: 'All notifications marked as read' });
}));

// Delete notification
router.delete('/:id', validateParams(objectIdSchema), asyncHandler(async (req, res) => {
  await notificationService.deleteNotification(req.params.id, req.user!.id);
  res.json({ message: 'Notification deleted' });
}));

export default router;
