import { z } from 'zod';

export const PAYMENT_TARGET_TYPES = [
  'EVENT_BOOKING',
  'TECHNICIAN_BOOKING',
  'EVENT_REQUEST',
] as const;

export const createPaymentOrderSchema = z.object({
  targetType: z.enum(PAYMENT_TARGET_TYPES),
  targetId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid target ID'),
  /**
   * Optional client retry key. The server still derives the amount, owner and
   * eligibility; this only makes a retried create-order request idempotent.
   */
  idempotencyKey: z
    .string()
    .min(8)
    .max(128)
    .regex(/^[A-Za-z0-9._:-]+$/, 'Invalid idempotency key')
    .optional(),
});

export const verifyPaymentSchema = z.object({
  razorpay_order_id: z.string().regex(/^order_[A-Za-z0-9]+$/, 'Invalid Razorpay order ID'),
  razorpay_payment_id: z.string().regex(/^pay_[A-Za-z0-9]+$/, 'Invalid Razorpay payment ID'),
  razorpay_signature: z.string().regex(/^[a-f0-9]{64}$/i, 'Invalid Razorpay signature'),
});

export const paymentOrderParamsSchema = z.object({
  orderId: z.string().regex(/^order_[A-Za-z0-9]+$/, 'Invalid Razorpay order ID'),
});

export const adminRefundSchema = z.object({
  targetType: z.enum(PAYMENT_TARGET_TYPES),
  paymentId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid payment ID'),
  amount: z.number().positive().optional(),
  reason: z.string().max(500).optional(),
});

export type PaymentTargetType = (typeof PAYMENT_TARGET_TYPES)[number];
export type CreatePaymentOrderInput = z.infer<typeof createPaymentOrderSchema>;
export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>;
export type AdminRefundInput = z.infer<typeof adminRefundSchema>;
