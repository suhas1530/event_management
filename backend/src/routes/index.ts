import { Router } from 'express';
import authRoutes from './auth';
import eventRoutes from './events';
import bookingRoutes from './bookings';
import adminRoutes from './admin';
import aiRoutes from './ai';
import eventDesignRoutes from './eventDesign';
import notificationRoutes from './notifications';
import favoriteRoutes from './favorites';
import reviewRoutes from './reviews';
import technicianRoutes from './technicians';
import eventRequestRoutes from './eventRequests';
import contactRoutes from './contact';
import newsletterRoutes from './newsletter';
import paymentRoutes from './payments';

const router = Router();

router.use('/auth', authRoutes);
router.use('/events', eventRoutes);
router.use('/bookings', bookingRoutes);
router.use('/admin', adminRoutes);
router.use('/ai/event-design', eventDesignRoutes);
router.use('/ai', aiRoutes);
router.use('/notifications', notificationRoutes);
router.use('/favorites', favoriteRoutes);
router.use('/reviews', reviewRoutes);
router.use('/technicians', technicianRoutes);
router.use('/event-requests', eventRequestRoutes);
router.use('/contact', contactRoutes);
router.use('/newsletter', newsletterRoutes);
router.use('/payments', paymentRoutes);

export default router;
