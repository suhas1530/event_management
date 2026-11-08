import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { asyncHandler } from '../middleware/errorHandler';
import { authMiddleware } from '../middleware/auth';
import { adminMiddleware } from '../middleware/adminAuth';
import { validateBody, validateParams } from '../middleware/validate';
import { paymentService } from '../services/payment';
import {
  adminRefundSchema,
  createPaymentOrderSchema,
  paymentOrderParamsSchema,
  verifyPaymentSchema,
} from '../validators/payment';

const router = Router();

// Checkout actions are intentionally tighter than the global API limit. A
// double-click is handled by idempotency, not by allowing a burst of orders.
const paymentActionLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { error: 'Too many payment attempts, please wait a minute and try again', code: 'PAYMENT_RATE_LIMITED' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post(
  '/orders',
  authMiddleware,
  paymentActionLimiter,
  validateBody(createPaymentOrderSchema),
  asyncHandler(async (req, res) => {
    const order = await paymentService.createOrder(req.user!.id, req.body);
    res.status(200).json(order);
  }),
);

router.post(
  '/verify',
  authMiddleware,
  paymentActionLimiter,
  validateBody(verifyPaymentSchema),
  asyncHandler(async (req, res) => {
    const payment = await paymentService.verifyPayment(req.user!.id, req.body);
    res.status(200).json(payment);
  }),
);

router.get(
  '/orders/:orderId',
  authMiddleware,
  paymentActionLimiter,
  validateParams(paymentOrderParamsSchema),
  asyncHandler(async (req, res) => {
    const payment = await paymentService.getOrderStatus(req.user!.id, req.params.orderId);
    res.status(200).json(payment);
  }),
);

// Admin-only refund. Admin authentication is separate from customer auth so a
// customer token can never reach this route.
router.post(
  '/admin/refund',
  adminMiddleware,
  paymentActionLimiter,
  validateBody(adminRefundSchema),
  asyncHandler(async (req, res) => {
    const payment = await paymentService.createRefund(req.admin!.id, req.body);
    res.status(200).json(payment);
  }),
);

export default router;
