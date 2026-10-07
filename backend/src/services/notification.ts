import { NotificationChannel, Prisma } from '@prisma/client';
import prisma from '../utils/database';
import { NotFoundError } from '../middleware/errorHandler';
import type { NotificationQueryInput } from '../validators/notification';

export class NotificationService {
  async createNotification(data: {
    userId: string;
    type: string;
    title: string;
    message: string;
    data?: Record<string, unknown>;
    channels?: NotificationChannel[];
  }) {
    return prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        data: data.data as Prisma.InputJsonValue ?? null,
        channels: data.channels ?? [NotificationChannel.IN_APP],
        sentAt: new Date(),
      },
    });
  }

  async createBulkNotifications(data: {
    userIds: string[];
    type: string;
    title: string;
    message: string;
    data?: Record<string, unknown>;
    channels?: NotificationChannel[];
  }) {
    const notifications = data.userIds.map((userId) => ({
      userId,
      type: data.type,
      title: data.title,
      message: data.message,
      data: (data.data ?? null) as Prisma.InputJsonValue | null,
      channels: data.channels ?? [NotificationChannel.IN_APP],
      sentAt: new Date(),
    }));

    return prisma.notification.createMany({ data: notifications });
  }

  async getUserNotifications(userId: string, query: NotificationQueryInput) {
    const { page, limit, isRead, type } = query;

    const where: Record<string, unknown> = { userId };
    if (isRead !== undefined) where.isRead = isRead;
    if (type) where.type = type;

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    return {
      data: notifications,
      unreadCount,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async markAsRead(notificationId: string, userId: string) {
    const notification = await prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });

    if (!notification) throw new NotFoundError('Notification not found');

    return prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async deleteNotification(notificationId: string, userId: string) {
    const notification = await prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });

    if (!notification) throw new NotFoundError('Notification not found');

    return prisma.notification.delete({ where: { id: notificationId } });
  }

  // Helper method used by other services to notify users
  async notifyBookingUpdate(
    userId: string,
    bookingNumber: string,
    type: string,
    title: string,
    message: string,
    bookingId?: string
  ) {
    return this.createNotification({
      userId,
      type,
      title,
      message,
      data: { bookingId, bookingNumber },
      channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
    });
  }
}

export const notificationService = new NotificationService();
