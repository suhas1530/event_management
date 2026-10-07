import { Router } from 'express';
import authRoutes from './auth';
import eventRoutes from './events';
import bookingRoutes from './bookings';
import adminRoutes from './admin';
import aiRoutes from './ai';
import notificationRoutes from './notifications';
import favoriteRoutes from './favorites';
import reviewRoutes from './reviews';
import technicianRoutes from './technicians';
import eventRequestRoutes from './eventRequests';
import contactRoutes from './contact';

const router = Router();

router.use('/auth', authRoutes);
router.use('/events', eventRoutes);
router.use('/bookings', bookingRoutes);
router.use('/admin', adminRoutes);
router.use('/ai', aiRoutes);
router.use('/notifications', notificationRoutes);
router.use('/favorites', favoriteRoutes);
router.use('/reviews', reviewRoutes);
router.use('/technicians', technicianRoutes);
router.use('/event-requests', eventRequestRoutes);
router.use('/contact', contactRoutes);

export default router;
