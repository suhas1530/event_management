import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/errorHandler';
import { validateBody } from '../middleware/validate';
import { prisma } from '../utils/database';
import { config } from '../config';

const router = Router();

export const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(80),
  email: z.string().email('Enter a valid email address'),
  phone: z.string().min(7, 'Enter a valid phone number').max(20).optional().or(z.literal('')),
  topic: z.enum(['technician', 'event', 'billing', 'partnership', 'other']),
  message: z.string().min(10, 'Tell us a little more (at least 10 characters)').max(2000),
});

export type ContactMessageInput = z.infer<typeof contactSchema>;

/** Client sends lowercase topic slugs; Prisma stores SCREAMING_CASE. */
const TOPIC_ENUM: Record<ContactMessageInput['topic'], 'TECHNICIAN' | 'EVENT' | 'BILLING' | 'PARTNERSHIP' | 'OTHER'> = {
  technician: 'TECHNICIAN',
  event: 'EVENT',
  billing: 'BILLING',
  partnership: 'PARTNERSHIP',
  other: 'OTHER',
};

/**
 * Public contact form.
 *
 * Persisted to MongoDB so enquiries are real, retrievable records rather than
 * an email stub. No authentication required.
 */
router.post(
  '/',
  validateBody(contactSchema),
  asyncHandler(async (req, res) => {
    const { name, email, phone, topic, message } = req.body as ContactMessageInput;

    const enquiry = await prisma.contactMessage.create({
      data: {
        name,
        email,
        phone: phone || null,
        topic: TOPIC_ENUM[topic],
        message,
        status: 'NEW',
        source: 'website',
      },
    });

    // Surfaced for local development; never leaks internals to the client.
    if (config.env !== 'production') {
      console.log(`[contact] new enquiry ${enquiry.id} — ${topic} from ${email}`);
    }

    res.status(201).json({
      id: enquiry.id,
      message: 'Thanks for reaching out. Our team will get back to you within one business day.',
    });
  })
);

/** Contact channel details, served from config so nothing is hard-coded. */
router.get('/info', (_req, res) => {
  res.json({
    email: config.supportEmail,
    phone: config.supportPhone,
    supportHours: config.supportHours,
  });
});

export default router;