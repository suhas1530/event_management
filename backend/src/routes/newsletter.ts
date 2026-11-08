import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/errorHandler';
import { validateBody } from '../middleware/validate';
import { prisma } from '../utils/database';
import { config } from '../config';

const router = Router();

export const newsletterSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(5, 'Enter a valid email address')
    .max(254, 'Enter a valid email address')
    .email('Enter a valid email address'),
});

export type NewsletterInput = z.infer<typeof newsletterSchema>;

/**
 * Public newsletter signup.
 *
 * Upsert makes the endpoint idempotent: submitting the same address twice is a
 * success, not a duplicate-key error, and an address that previously
 * unsubscribed is put back on the list. No authentication required.
 */
router.post(
  '/',
  validateBody(newsletterSchema),
  asyncHandler(async (req, res) => {
    const { email } = req.body as NewsletterInput;

    const subscriber = await prisma.newsletterSubscriber.upsert({
      where: { email },
      update: { status: 'SUBSCRIBED' },
      create: { email, status: 'SUBSCRIBED', source: 'footer' },
    });

    // Surfaced for local development; the response never exposes internals.
    if (config.env !== 'production') {
      console.log(`[newsletter] subscriber ${subscriber.id} — ${email}`);
    }

    res.status(200).json({
      subscribed: true,
      message: "You're on the list. Look out for the next Heptome edit.",
    });
  })
);

export default router;
