import { PrismaClient, EventType, EventCategory, Event, Service, Package, Venue } from '@prisma/client';
import prisma from '../utils/database';
import { AppError, NotFoundError } from '../middleware/errorHandler';
import { EventQueryInput, CreateEventInput, UpdateEventInput, CreateVenueInput, UpdateVenueInput, CreateServiceInput, UpdateServiceInput, CreatePackageInput, UpdatePackageInput, AddPackageServiceInput, CreateEventCategoryInput, UpdateEventCategoryInput } from '../validators/event';

interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class EventService {
  // Event Categories
  async getCategories() {
    return prisma.eventCategory.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' },
      include: {
        _count: {
          select: { events: true },
        },
      },
    });
  }

  async getCategoryById(id: string) {
    const category = await prisma.eventCategory.findUnique({
      where: { id },
      include: {
        events: {
          where: { isActive: true },
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!category) {
      throw new NotFoundError('Category not found');
    }

    return category;
  }

  async createCategory(data: CreateEventCategoryInput) {
    return prisma.eventCategory.create({ data });
  }

  async updateCategory(id: string, data: UpdateEventCategoryInput) {
    await this.getCategoryById(id);
    return prisma.eventCategory.update({ where: { id }, data });
  }

  async deleteCategory(id: string) {
    await this.getCategoryById(id);
    return prisma.eventCategory.delete({ where: { id } });
  }

  // Events
  async getEvents(query: EventQueryInput): Promise<PaginatedResult<Event>> {
    const {
      page = 1,
      limit = 12,
      category,
      type,
      city,
      minPrice,
      maxPrice,
      minGuests,
      maxGuests,
      isIndoor,
      isOutdoor,
      isLuxury,
      isFeatured,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const where: Record<string, unknown> = { isActive: true };

    if (category) where.categoryId = category;
    if (type) where.type = type as EventType;
    if (city) where.city = { contains: city, mode: 'insensitive' };
    if (minPrice || maxPrice) {
      where.startingPrice = {};
      if (minPrice) (where.startingPrice as Record<string, number>).gte = minPrice;
      if (maxPrice) (where.startingPrice as Record<string, number>).lte = maxPrice;
    }
    if (minGuests) where.maxGuests = { ...(where.maxGuests as object), gte: minGuests };
    if (maxGuests) where.minGuests = { ...(where.minGuests as object), lte: maxGuests };
    if (isIndoor !== undefined) where.isIndoor = isIndoor;
    if (isOutdoor !== undefined) where.isOutdoor = isOutdoor;
    if (isLuxury !== undefined) where.isLuxury = isLuxury;
    if (isFeatured !== undefined) where.isFeatured = isFeatured;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          category: true,
          venue: true,
          _count: { select: { reviews: true, bookings: true } },
        },
      }),
      prisma.event.count({ where }),
    ]);

    return {
      data: events,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getEventById(id: string, incrementView = false) {
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        category: true,
        venue: true,
        eventServices: {
          include: { service: true },
        },
        packages: {
          where: { isActive: true },
          include: {
            services: {
              include: { service: true },
            },
          },
        },
        reviews: {
          where: { isVisible: true },
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: { user: { select: { id: true, name: true, avatar: true } } },
        },
        _count: { select: { reviews: true, bookings: true, favorites: true } },
      },
    });

    if (!event) {
      throw new NotFoundError('Event not found');
    }

    if (incrementView) {
      await prisma.event.update({
        where: { id },
        data: { viewCount: { increment: 1 } },
      });
    }

    return event;
  }

  async getEventBySlug(slug: string) {
    const event = await prisma.event.findUnique({
      where: { slug },
      include: {
        category: true,
        venue: true,
        eventServices: { include: { service: true } },
        packages: {
          where: { isActive: true },
          include: { services: { include: { service: true } } },
        },
        reviews: {
          where: { isVisible: true },
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: { user: { select: { id: true, name: true, avatar: true } } },
        },
      },
    });

    if (!event) {
      throw new NotFoundError('Event not found');
    }

    return event;
  }

  async createEvent(data: CreateEventInput) {
    return prisma.event.create({ data });
  }

  async updateEvent(id: string, data: UpdateEventInput) {
    await this.getEventById(id);
    return prisma.event.update({ where: { id }, data });
  }

  async deleteEvent(id: string) {
    await this.getEventById(id);
    return prisma.event.delete({ where: { id } });
  }

  async getFeaturedEvents(limit = 6) {
    return prisma.event.findMany({
      where: { isActive: true, isFeatured: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { category: true, venue: true },
    });
  }

  async getEventsByCategory(categoryId: string, query: EventQueryInput) {
    return this.getEvents({ ...query, category: categoryId });
  }

  async getEventsByType(type: EventType, query: EventQueryInput) {
    return this.getEvents({ ...query, type });
  }

  // Venues
  async getVenues(query: { page?: number; limit?: number; city?: string; search?: string } = {}) {
    const { page = 1, limit = 12, city, search } = query;
    const where: Record<string, unknown> = { isActive: true };

    if (city) where.city = { contains: city, mode: 'insensitive' };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [venues, total] = await Promise.all([
      prisma.venue.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.venue.count({ where }),
    ]);

    return { data: venues, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async getVenueById(id: string) {
    const venue = await prisma.venue.findUnique({
      where: { id },
      include: {
        events: { where: { isActive: true }, take: 10 },
      },
    });

    if (!venue) throw new NotFoundError('Venue not found');
    return venue;
  }

  async createVenue(data: CreateVenueInput) {
    return prisma.venue.create({ data });
  }

  async updateVenue(id: string, data: UpdateVenueInput) {
    await this.getVenueById(id);
    return prisma.venue.update({ where: { id }, data });
  }

  async deleteVenue(id: string) {
    await this.getVenueById(id);
    return prisma.venue.delete({ where: { id } });
  }

  // Services
  async getServices(query: { page?: number; limit?: number; category?: string; city?: string; search?: string } = {}) {
    const { page = 1, limit = 20, category, city, search } = query;
    const where: Record<string, unknown> = { isActive: true };

    if (category) where.category = category;
    if (city) where.city = { contains: city, mode: 'insensitive' };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [services, total] = await Promise.all([
      prisma.service.findMany({
        where,
        orderBy: [{ isPopular: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.service.count({ where }),
    ]);

    return { data: services, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async getServiceById(id: string) {
    const service = await prisma.service.findUnique({
      where: { id },
      include: {
        packages: { include: { package: true } },
      },
    });

    if (!service) throw new NotFoundError('Service not found');
    return service;
  }

  async createService(data: CreateServiceInput) {
    return prisma.service.create({ data });
  }

  async updateService(id: string, data: UpdateServiceInput) {
    await this.getServiceById(id);
    return prisma.service.update({ where: { id }, data });
  }

  async deleteService(id: string) {
    await this.getServiceById(id);
    return prisma.service.delete({ where: { id } });
  }

  async getPopularServices(limit = 10) {
    return prisma.service.findMany({
      where: { isActive: true, isPopular: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  // Packages
  async getPackages(query: { page?: number; limit?: number; eventId?: string; search?: string } = {}) {
    const { page = 1, limit = 12, eventId, search } = query;
    const where: Record<string, unknown> = { isActive: true };

    if (eventId) where.eventId = eventId;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [packages, total] = await Promise.all([
      prisma.package.findMany({
        where,
        orderBy: [{ isPopular: 'desc' }, { displayOrder: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
        include: {
          event: { select: { id: true, title: true, slug: true } },
          services: { include: { service: true } },
        },
      }),
      prisma.package.count({ where }),
    ]);

    return { data: packages, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async getPackageById(id: string) {
    const pkg = await prisma.package.findUnique({
      where: { id },
      include: {
        event: true,
        services: { include: { service: true } },
      },
    });

    if (!pkg) throw new NotFoundError('Package not found');
    return pkg;
  }

  async createPackage(data: CreatePackageInput) {
    return prisma.package.create({ data });
  }

  async updatePackage(id: string, data: UpdatePackageInput) {
    await this.getPackageById(id);
    return prisma.package.update({ where: { id }, data });
  }

  async deletePackage(id: string) {
    await this.getPackageById(id);
    return prisma.package.delete({ where: { id } });
  }

  async addPackageService(packageId: string, data: AddPackageServiceInput) {
    await this.getPackageById(packageId);
    return prisma.packageService.create({
      data: { packageId, ...data },
    });
  }

  async removePackageService(packageId: string, serviceId: string) {
    return prisma.packageService.delete({
      where: { packageId_serviceId: { packageId, serviceId } },
    });
  }

  async updatePackageService(packageId: string, serviceId: string, data: Partial<AddPackageServiceInput>) {
    return prisma.packageService.update({
      where: { packageId_serviceId: { packageId, serviceId } },
      data,
    });
  }
}

export const eventService = new EventService();