import { z } from 'zod';

export const notificationSchema = z.object({
  userId: z.string().regex(/^[0-9a-fA-F]{24}$/),
  type: z.string().min(1).max(50),
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(1000),
  data: z.record(z.unknown()).optional(),
  channels: z.array(z.enum(['IN_APP', 'EMAIL', 'WHATSAPP', 'SMS'])).default(['IN_APP']),
});

export const bulkNotificationSchema = z.object({
  userIds: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/)).min(1).max(1000),
  type: z.string().min(1).max(50),
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(1000),
  data: z.record(z.unknown()).optional(),
  channels: z.array(z.enum(['IN_APP', 'EMAIL', 'WHATSAPP', 'SMS'])).default(['IN_APP']),
});

export const notificationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  isRead: z.coerce.boolean().optional(),
  type: z.string().optional(),
});

export type NotificationInput = z.infer<typeof notificationSchema>;
export type BulkNotificationInput = z.infer<typeof bulkNotificationSchema>;
export type NotificationQueryInput = z.infer<typeof notificationQuerySchema>;