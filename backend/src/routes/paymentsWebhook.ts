import express, { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { paymentService } from '../services/payment';

const router = Router();

/**
 * Razorpay webhook endpoint.
 *
 * This router is mounted before express.json() in app.ts. The raw Buffer is
 * therefore exactly what Razorpay signed; re-serialising parsed JSON would
 * change whitespace and invalidate the HMAC.
 */
router.post(
  '/',
  express.raw({ type: 'application/json', limit: '1mb' }),
  asyncHandler(async (req, res) => {
    const signature = req.header('x-razorpay-signature');
    if (!signature) {
      res.status(400).json({
        error: 'Missing Razorpay webhook signature',
        code: 'MISSING_WEBHOOK_SIGNATURE',
      });
      return;
    }

    const rawBody = Buffer.isBuffer(req.body)
      ? req.body
      : Buffer.from(typeof req.body === 'string' ? req.body : '', 'utf8');
    if (rawBody.length === 0) {
      res.status(400).json({
        error: 'Empty Razorpay webhook payload',
        code: 'INVALID_WEBHOOK_PAYLOAD',
      });
      return;
    }

    const result = await paymentService.handleWebhook(rawBody, signature);
    // Razorpay retries non-2xx responses. Duplicates and unrelated events are
    // acknowledged so a valid delivery is not retried forever.
    res.status(200).json({
      received: true,
      duplicate: result.duplicate,
      ignored: result.ignored,
    });
  }),
);

export default router;
