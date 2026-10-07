import { Role, Prisma } from '@prisma/client';
import argon2 from 'argon2';
import prisma from '../utils/database';
import { NotFoundError, ConflictError, AppError } from '../middleware/errorHandler';

export class AdminService {
  // ─── Dashboard stats ──────────────────────────────────────────
  async getDashboardStats() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const [
      totalBookings,
      pendingBookings,
      confirmedBookings,
      completedBookings,
      cancelledBookings,
      totalRevenue,
      monthRevenue,
      lastMonthRevenue,
      totalCustomers,
      newCustomersThisMonth,
      upcomingEvents,
      totalAIDesigns,
    ] = await Promise.all([
      prisma.booking.count(),
      prisma.booking.count({ where: { status: { in: ['REQUESTED', 'PENDING_REVIEW', 'QUOTED', 'CUSTOMER_APPROVAL'] } } }),
      prisma.booking.count({ where: { status: 'CONFIRMED' } }),
      prisma.booking.count({ where: { status: 'COMPLETED' } }),
      prisma.booking.count({ where: { status: 'CANCELLED' } }),
      prisma.payment.aggregate({ where: { status: 'COMPLETED' }, _sum: { amount: true } }),
      prisma.payment.aggregate({ where: { status: 'COMPLETED', paidAt: { gte: startOfMonth } }, _sum: { amount: true } }),
      prisma.payment.aggregate({ where: { status: 'COMPLETED', paidAt: { gte: startOfLastMonth, lte: endOfLastMonth } }, _sum: { amount: true } }),
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
      prisma.user.count({ where: { role: 'CUSTOMER', createdAt: { gte: startOfMonth } } }),
      prisma.booking.count({ where: { eventDate: { gte: now }, status: 'CONFIRMED' } }),
      prisma.aIDesign.count(),
    ]);

    const totalRevenueAmount = totalRevenue._sum.amount ?? 0;
    const monthRevenueAmount = monthRevenue._sum.amount ?? 0;
    const lastMonthRevenueAmount = lastMonthRevenue._sum.amount ?? 0;
    const revenueGrowth = lastMonthRevenueAmount > 0
      ? ((monthRevenueAmount - lastMonthRevenueAmount) / lastMonthRevenueAmount) * 100
      : 0;

    return {
      bookings: {
        total: totalBookings,
        pending: pendingBookings,
        confirmed: confirmedBookings,
        completed: completedBookings,
        cancelled: cancelledBookings,
      },
      revenue: {
        total: totalRevenueAmount,
        thisMonth: monthRevenueAmount,
        lastMonth: lastMonthRevenueAmount,
        growth: Math.round(revenueGrowth * 10) / 10,
      },
      customers: {
        total: totalCustomers,
        newThisMonth: newCustomersThisMonth,
      },
      upcomingEvents,
      aiDesigns: totalAIDesigns,
    };
  }

  // ─── Revenue analytics ────────────────────────────────────────
  async getRevenueAnalytics(period: '7d' | '30d' | '90d' | '12m' = '30d') {
    const now = new Date();
    let startDate: Date;
    let groupBy: 'day' | 'month';

    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        groupBy = 'day';
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        groupBy = 'day';
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        groupBy = 'month';
        break;
      case '12m':
      default:
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), 1);
        groupBy = 'month';
        break;
    }

    const payments = await prisma.payment.findMany({
      where: {
        status: 'COMPLETED',
        paidAt: { gte: startDate },
      },
      select: { amount: true, paidAt: true },
      orderBy: { paidAt: 'asc' },
    });

    // Group by day or month
    const grouped = new Map<string, number>();

    for (const payment of payments) {
      if (!payment.paidAt) continue;
      const key = groupBy === 'day'
        ? payment.paidAt.toISOString().split('T')[0]
        : `${payment.paidAt.getFullYear()}-${String(payment.paidAt.getMonth() + 1).padStart(2, '0')}`;

      grouped.set(key, (grouped.get(key) ?? 0) + payment.amount);
    }

    return Array.from(grouped.entries()).map(([date, amount]) => ({ date, amount }));
  }

  // ─── Booking analytics ────────────────────────────────────────
  async getBookingAnalytics() {
    const [byStatus, byEventType, recentBookings] = await Promise.all([
      prisma.booking.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
      prisma.booking.findMany({
        include: { event: { select: { type: true } } },
        take: 1000,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.booking.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, email: true } },
          event: { select: { id: true, title: true, type: true } },
        },
      }),
    ]);

    // Count by event type
    const eventTypeCounts = new Map<string, number>();
    for (const b of byEventType) {
      const type = b.event?.type ?? 'CUSTOM';
      eventTypeCounts.set(type, (eventTypeCounts.get(type) ?? 0) + 1);
    }

    return {
      byStatus: byStatus.map((s) => ({ status: s.status, count: s._count.id })),
      byEventType: Array.from(eventTypeCounts.entries()).map(([type, count]) => ({ type, count })),
      recentBookings,
    };
  }

  // ─── Customer management ──────────────────────────────────────
  async getCustomers(query: { page?: number; limit?: number; search?: string; role?: string } = {}) {
    const { page = 1, limit = 20, search, role } = query;

    const where: Record<string, unknown> = {};
    if (role) where.role = role;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          avatar: true,
          role: true,
          isActive: true,
          isEmailVerified: true,
          lastLoginAt: true,
          createdAt: true,
          _count: { select: { bookings: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      data: users,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getCustomerById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        bookings: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            event: { select: { id: true, title: true, type: true } },
          },
        },
        _count: { select: { bookings: true, favorites: true, aiDesigns: true } },
      },
    });

    if (!user) throw new NotFoundError('Customer not found');
    return user;
  }

  async updateUserStatus(userId: string, isActive: boolean) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError('User not found');

    return prisma.user.update({
      where: { id: userId },
      data: { isActive },
      select: { id: true, name: true, email: true, isActive: true, role: true },
    });
  }

  // ─── Admin management ─────────────────────────────────────────
  async getAdmins() {
    return prisma.admin.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        _count: { select: { assignedBookings: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createAdmin(data: { name: string; email: string; password: string; role?: Role }) {
    const existing = await prisma.admin.findUnique({ where: { email: data.email } });
    if (existing) throw new ConflictError('Admin with this email already exists');

    const passwordHash = await argon2.hash(data.password, {
      type: argon2.argon2id,
      memoryCost: 2 ** 16,
      timeCost: 3,
      parallelism: 1,
    });

    return prisma.admin.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash,
        role: data.role ?? Role.ADMIN,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });
  }

  // ─── Audit logs ───────────────────────────────────────────────
  async getAuditLogs(query: { page?: number; limit?: number; adminId?: string; entity?: string } = {}) {
    const { page = 1, limit = 50, adminId, entity } = query;

    const where: Record<string, unknown> = {};
    if (adminId) where.adminId = adminId;
    if (entity) where.entity = entity;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          admin: { select: { id: true, name: true, email: true, role: true } },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      data: logs,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async createAuditLog(data: {
    adminId: string;
    action: string;
    entity: string;
    entityId: string;
    oldData?: unknown;
    newData?: unknown;
    ipAddress?: string;
    userAgent?: string;
  }) {
    return prisma.auditLog.create({
      data: {
        adminId: data.adminId,
        action: data.action,
        entity: data.entity,
        entityId: data.entityId,
        oldData: data.oldData ? (data.oldData as Prisma.InputJsonValue) : undefined,
        newData: data.newData ? (data.newData as Prisma.InputJsonValue) : undefined,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
    });
  }
}

export const adminService = new AdminService();
