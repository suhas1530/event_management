/**
 * Typed API client for the avān backend.
 * Uses fetch (no axios dependency needed). Handles auth tokens, refresh, and error normalisation.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api/v1';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ApiError {
  error: string;
  code?: string;
  details?: unknown;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  avatar?: string;
  role: 'CUSTOMER' | 'EVENT_MANAGER' | 'ADMIN' | 'SUPER_ADMIN' | 'VENDOR' | 'TECHNICIAN';
  isActive?: boolean;
  isEmailVerified?: boolean;
  lastLoginAt?: string;
  createdAt?: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface AdminAuthResponse {
  admin: User;
  accessToken: string;
  refreshToken: string;
}

export interface Event {
  id: string;
  title: string;
  slug: string;
  description: string;
  shortDescription?: string;
  type: string;
  theme?: string;
  colorPalette: string[];
  heroImages: string[];
  galleryImages: string[];
  videoUrl?: string;
  category?: EventCategory;
  venue?: Venue;
  minGuests: number;
  maxGuests: number;
  startingPrice: number;
  currency: string;
  location: string;
  city: string;
  state?: string;
  isIndoor: boolean;
  isOutdoor: boolean;
  isLuxury: boolean;
  isActive: boolean;
  isFeatured: boolean;
  averageRating: number;
  totalReviews: number;
  viewCount: number;
  services?: Service[];
  packages?: Package[];
  reviews?: Review[];
  createdAt: string;
}

export interface EventCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  icon?: string;
  displayOrder: number;
  _count?: { events: number };
}

export interface Venue {
  id: string;
  name: string;
  slug: string;
  description?: string;
  address: string;
  city: string;
  state?: string;
  capacity: number;
  pricePerHour?: number;
  pricePerDay?: number;
  images: string[];
  amenities: string[];
}

export interface Service {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  images: string[];
  basePrice: number;
  pricingType: 'FIXED' | 'PER_GUEST' | 'PER_HOUR' | 'CUSTOM_QUOTE';
  pricePerGuest?: number;
  pricePerHour?: number;
  city?: string;
  isActive: boolean;
  isPopular: boolean;
  tags: string[];
}

export interface Package {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  originalPrice?: number;
  guestLimit: number;
  images: string[];
  highlights: string[];
  includes: string[];
  excludes: string[];
  isPopular: boolean;
  services?: { service: Service; quantity: number }[];
}

export interface Booking {
  id: string;
  bookingNumber: string;
  userId: string;
  user?: User;
  eventId: string;
  event?: Event;
  packageId?: string;
  package?: Package;
  venueId?: string;
  venue?: Venue;
  aiDesignId?: string;
  aiDesign?: AIDesign;
  assignedAdmin?: User;
  status: BookingStatus;
  eventDate: string;
  eventEndDate?: string;
  guestCount: number;
  budget?: number;
  notes?: string;
  specialRequests?: string;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  paymentStatus: string;
  items?: BookingItem[];
  quotes?: Quote[];
  payments?: Payment[];
  timeline?: TimelineEntry[];
  /** Admin-only note, never exposed on customer-facing endpoints. */
  internalNotes?: string | null;
  documents?: BookingDocument[];
  createdAt: string;
}

export interface BookingDocument {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedBy: string;
  createdAt: string;
}

export interface EventRequest {
  id: string;
  requestNumber: string;
  customerId: string;
  eventType: string;
  eventDate?: string | null;
  guestCount?: number | null;
  city?: string | null;
  budgetLabel?: string | null;
  requirements?: Record<string, unknown>;
  referenceImages?: string[];
  status: string;
  assignedManagerId?: string | null;
  createdAt: string;
  updatedAt: string;
  customer?: Pick<User, 'id' | 'name' | 'email' | 'phone'>;
}

export interface EventProposal {
  id: string;
  requestId: string;
  version: number;
  items: Array<{ name: string; description?: string; quantity: number; unitPrice: number; totalPrice: number }>;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  notes?: string;
  validUntil?: string;
  status: string;
  changeRequests: string[];
  createdAt: string;
}

export type BookingStatus =
  | 'DRAFT' | 'REQUESTED' | 'PENDING_REVIEW' | 'QUOTED'
  | 'CUSTOMER_APPROVAL' | 'PAYMENT_PENDING' | 'CONFIRMED'
  | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'REJECTED';

export interface BookingItem {
  id: string;
  serviceId: string;
  service?: Service;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Quote {
  id: string;
  bookingId: string;
  version: number;
  items: QuoteItem[];
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  validUntil: string;
  notes?: string;
  status: 'DRAFT' | 'SENT' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
  createdAt: string;
  approvedAt?: string;
  rejectedAt?: string;
}

export interface QuoteItem {
  serviceId: string;
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Payment {
  id: string;
  bookingId: string;
  amount: number;
  currency: string;
  method: string;
  status: string;
  transactionId?: string;
  gatewayOrderId?: string;
  paidAt?: string;
  createdAt: string;
}

export interface TimelineEntry {
  id: string;
  bookingId: string;
  status: BookingStatus;
  title: string;
  description?: string;
  createdAt: string;
}

export interface Message {
  id: string;
  bookingId: string;
  senderId: string;
  sender?: { id: string; name: string; avatar?: string; role: string };
  content: string;
  type: string;
  attachments: string[];
  isRead: boolean;
  createdAt: string;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

export interface AIDesign {
  id: string;
  userId: string;
  eventType: string;
  theme: string;
  mood?: string;
  colors: string[];
  guestCount: number;
  budget: number;
  location?: string;
  eventDate?: string;
  services: string[];
  decor: string[];
  food: string[];
  entertainment: string[];
  photography: { style: string; hours: number; deliverables: string[] };
  estimatedCost: number;
  designPrompt: string;
  aiResponse: Record<string, unknown>;
  isSaved: boolean;
  isBooked: boolean;
  bookingId?: string;
  createdAt: string;
}

export interface Review {
  id: string;
  userId: string;
  user?: { id: string; name: string; avatar?: string };
  eventId: string;
  rating: number;
  title?: string;
  comment?: string;
  images: string[];
  isVerified: boolean;
  createdAt: string;
}

export interface DashboardStats {
  bookings: { total: number; pending: number; confirmed: number; completed: number; cancelled: number };
  revenue: { total: number; thisMonth: number; lastMonth: number; growth: number };
  customers: { total: number; newThisMonth: number };
  upcomingEvents: number;
  aiDesigns: number;
}

// ─── Token storage (localStorage — works in browser only) ────────────────────

const TOKEN_KEY = 'avan_access_token';
const REFRESH_KEY = 'avan_refresh_token';
const ADMIN_TOKEN_KEY = 'avan_admin_token';
const ADMIN_REFRESH_KEY = 'avan_admin_refresh_token';

export const tokenStore = {
  get: () => (typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null),
  set: (t: string) => localStorage.setItem(TOKEN_KEY, t),
  getRefresh: () => (typeof window !== 'undefined' ? localStorage.getItem(REFRESH_KEY) : null),
  setRefresh: (t: string) => localStorage.setItem(REFRESH_KEY, t),
  clear: () => { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(REFRESH_KEY); },

  getAdmin: () => (typeof window !== 'undefined' ? localStorage.getItem(ADMIN_TOKEN_KEY) : null),
  setAdmin: (t: string) => localStorage.setItem(ADMIN_TOKEN_KEY, t),
  getAdminRefresh: () => (typeof window !== 'undefined' ? localStorage.getItem(ADMIN_REFRESH_KEY) : null),
  setAdminRefresh: (t: string) => localStorage.setItem(ADMIN_REFRESH_KEY, t),
  clearAdmin: () => { localStorage.removeItem(ADMIN_TOKEN_KEY); localStorage.removeItem(ADMIN_REFRESH_KEY); },
};

// ─── Core fetch wrapper ───────────────────────────────────────────────────────

type FetchOptions = RequestInit & { admin?: boolean; skipAuth?: boolean };

async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { admin = false, skipAuth = false, ...fetchOpts } = options;

  const token = admin ? tokenStore.getAdmin() : tokenStore.get();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOpts.headers as Record<string, string>),
  };

  if (token && !skipAuth) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, { ...fetchOpts, headers });

  // Token expired — try refresh once
  if (res.status === 401 && !skipAuth) {
    const refreshToken = admin ? tokenStore.getAdminRefresh() : tokenStore.getRefresh();
    if (refreshToken) {
      try {
        const refreshPath = admin ? '/auth/admin/refresh' : '/auth/refresh';
        const refreshRes = await fetch(`${API_BASE}${refreshPath}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });

        if (refreshRes.ok) {
          const tokens = await refreshRes.json() as { accessToken: string; refreshToken: string };
          if (admin) {
            tokenStore.setAdmin(tokens.accessToken);
            tokenStore.setAdminRefresh(tokens.refreshToken);
          } else {
            tokenStore.set(tokens.accessToken);
            tokenStore.setRefresh(tokens.refreshToken);
          }
          // Retry original request with new token
          headers['Authorization'] = `Bearer ${tokens.accessToken}`;
          const retryRes = await fetch(`${API_BASE}${path}`, { ...fetchOpts, headers });
          if (!retryRes.ok) {
            const err = await retryRes.json().catch(() => ({ error: 'Request failed' }));
            throw err as ApiError;
          }
          return retryRes.json() as Promise<T>;
        }
      } catch {
        // Refresh failed — clear tokens
        admin ? tokenStore.clearAdmin() : tokenStore.clear();
      }
    }
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Network error', code: 'NETWORK_ERROR' }));
    throw err as ApiError;
  }

  // Handle 204 No Content
  if (res.status === 204) return {} as T;

  return res.json() as Promise<T>;
}

// ─── Auth API ─────────────────────────────────────────────────────────────────

export const authApi = {
  register: (data: { name: string; email: string; phone?: string; password: string }) =>
    apiFetch<AuthResponse>('/auth/register', { method: 'POST', body: JSON.stringify(data), skipAuth: true }),

  login: (data: { email: string; password: string }) =>
    apiFetch<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify(data), skipAuth: true }),

  adminLogin: (data: { email: string; password: string }) =>
    apiFetch<AdminAuthResponse>('/auth/admin/login', { method: 'POST', body: JSON.stringify(data), skipAuth: true }),

  logout: () => apiFetch<{ message: string }>('/auth/logout', { method: 'POST' }),

  me: () => apiFetch<User>('/auth/profile'),

  updateProfile: (data: { name?: string; phone?: string; avatar?: string }) =>
    apiFetch<User>('/auth/profile', { method: 'PATCH', body: JSON.stringify(data) }),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    apiFetch<{ message: string }>('/auth/change-password', { method: 'POST', body: JSON.stringify(data) }),

  forgotPassword: (email: string) =>
    apiFetch<{ message: string }>('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }), skipAuth: true }),

  resetPassword: (token: string, password: string) =>
    apiFetch<{ message: string }>('/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, password }), skipAuth: true }),
};

// ─── Events API ───────────────────────────────────────────────────────────────

export const eventsApi = {
  list: (params?: Record<string, string | number | boolean | undefined>) => {
    const q = params ? '?' + new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)])).toString() : '';
    return apiFetch<PaginatedResult<Event>>(`/events${q}`, { skipAuth: true });
  },

  featured: (limit = 6) =>
    apiFetch<Event[]>(`/events/featured?limit=${limit}`, { skipAuth: true }),

  bySlug: (slug: string) =>
    apiFetch<Event>(`/events/slug/${slug}`, { skipAuth: true }),

  byId: (id: string) =>
    apiFetch<Event>(`/events/${id}`, { skipAuth: true }),

  categories: () =>
    apiFetch<EventCategory[]>('/events/categories', { skipAuth: true }),

  venues: (params?: Record<string, string | number>) => {
    const q = params ? '?' + new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)])).toString() : '';
    return apiFetch<PaginatedResult<Venue>>(`/events/venues${q}`, { skipAuth: true });
  },

  services: (params?: Record<string, string | number>) => {
    const q = params ? '?' + new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)])).toString() : '';
    return apiFetch<PaginatedResult<Service>>(`/events/services${q}`, { skipAuth: true });
  },

  packages: (params?: Record<string, string | number>) => {
    const q = params ? '?' + new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)])).toString() : '';
    return apiFetch<PaginatedResult<Package>>(`/events/packages${q}`, { skipAuth: true });
  },
};

// ─── Bookings API ─────────────────────────────────────────────────────────────

export const bookingsApi = {
  create: (data: {
    eventId: string;
    packageId?: string;
    venueId?: string;
    aiDesignId?: string;
    eventDate: string;
    guestCount: number;
    budget?: number;
    notes?: string;
    specialRequests?: string;
    items?: { serviceId: string; quantity: number }[];
  }) => apiFetch<Booking>('/bookings', { method: 'POST', body: JSON.stringify(data) }),

  list: (params?: Record<string, string | number>) => {
    const q = params ? '?' + new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)])).toString() : '';
    return apiFetch<PaginatedResult<Booking>>(`/bookings${q}`);
  },

  byId: (id: string) => apiFetch<Booking>(`/bookings/${id}`),

  update: (id: string, data: Partial<Booking>) =>
    apiFetch<Booking>(`/bookings/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  cancel: (id: string) => apiFetch<{ message: string }>(`/bookings/${id}`, { method: 'DELETE' }),

  quotes: (id: string) => apiFetch<Quote[]>(`/bookings/${id}/quotes`),

  approveQuote: (bookingId: string, quoteId: string) =>
    apiFetch<Quote>(`/bookings/${bookingId}/quotes/${quoteId}/approve`, { method: 'POST' }),

  rejectQuote: (bookingId: string, quoteId: string) =>
    apiFetch<Quote>(`/bookings/${bookingId}/quotes/${quoteId}/reject`, { method: 'POST' }),

  initiatePayment: (id: string, data: { amount: number; method: string; currency?: string }) =>
    apiFetch<Payment>(`/bookings/${id}/payments`, { method: 'POST', body: JSON.stringify(data) }),

  payments: (id: string) => apiFetch<Payment[]>(`/bookings/${id}/payments`),

  timeline: (id: string) => apiFetch<TimelineEntry[]>(`/bookings/${id}/timeline`),

  messages: (id: string) => apiFetch<Message[]>(`/bookings/${id}/messages`),

  sendMessage: (id: string, data: { content: string; type?: string }) =>
    apiFetch<Message>(`/bookings/${id}/messages`, { method: 'POST', body: JSON.stringify(data) }),
};

export const eventRequestsApi = {
  list: () => apiFetch<EventRequest[]>('/event-requests'),

  byId: (id: string) => apiFetch<EventRequest>(`/event-requests/${id}`),

  create: (data: {
    eventType: string;
    eventDate?: string | null;
    guestCount?: number | null;
    city?: string;
    budgetLabel?: string;
    requirements: Record<string, unknown>;
    referenceImages?: string[];
    status?: 'DRAFT' | 'REQUIREMENT_SUBMITTED';
  }) => apiFetch<EventRequest>('/event-requests', { method: 'POST', body: JSON.stringify(data) }),

  updateDraft: (id: string, data: {
    eventType: string;
    eventDate?: string | null;
    guestCount?: number | null;
    city?: string;
    budgetLabel?: string;
    requirements: Record<string, unknown>;
    referenceImages?: string[];
  }) => apiFetch<EventRequest>(`/event-requests/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  submit: (id: string) => apiFetch<EventRequest>(`/event-requests/${id}/submit`, { method: 'POST' }),

  proposals: (id: string) => apiFetch<EventProposal[]>(`/event-requests/${id}/proposals`),

  approveProposal: (id: string, proposalId: string) =>
    apiFetch<EventProposal>(`/event-requests/${id}/proposals/${proposalId}/approve`, { method: 'POST' }),

  requestProposalChanges: (id: string, proposalId: string, message: string) =>
    apiFetch<EventProposal>(`/event-requests/${id}/proposals/${proposalId}/request-changes`, { method: 'POST', body: JSON.stringify({ message }) }),
};

// ─── AI API ───────────────────────────────────────────────────────────────────

export const aiApi = {
  generateDesign: (data: {
    prompt: string;
    eventType?: string;
    guestCount?: number;
    budget?: number;
    location?: string;
    services?: string[];
  }) => apiFetch<{ design: AIDesign; aiResponse: Record<string, unknown> }>('/ai/event-design', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  refineDesign: (data: {
    designId: string;
    prompt: string;
    changes?: { theme?: string; budget?: number; guestCount?: number; addServices?: string[]; removeServices?: string[] };
  }) => apiFetch<{ design: AIDesign; aiResponse: Record<string, unknown> }>('/ai/refine-design', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  estimate: (data: { eventType: string; guestCount: number; budget?: number; services: string[] }) =>
    apiFetch<{ estimatedCost: number; budgetBreakdown: Record<string, number>; recommendations: string[] }>('/ai/estimate', {
      method: 'POST',
      body: JSON.stringify(data),
      skipAuth: true,
    }),

  chat: (data: { message: string; context?: Record<string, unknown> }) =>
    apiFetch<{ reply: string; suggestions: string[] }>('/ai/chat', {
      method: 'POST',
      body: JSON.stringify(data),
      skipAuth: true,
    }),

  saveDesign: (id: string) =>
    apiFetch<AIDesign>(`/ai/designs/${id}/save`, { method: 'POST' }),

  myDesigns: () => apiFetch<AIDesign[]>('/ai/designs'),

  design: (id: string) => apiFetch<AIDesign>(`/ai/designs/${id}`),
};

// ─── Notifications API ────────────────────────────────────────────────────────

export const notificationsApi = {
  list: (params?: { page?: number; limit?: number; isRead?: boolean }) => {
    const q = params ? '?' + new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)])).toString() : '';
    return apiFetch<{ data: Notification[]; unreadCount: number; pagination: PaginatedResult<Notification>['pagination'] }>(`/notifications${q}`);
  },

  markRead: (id: string) => apiFetch<Notification>(`/notifications/${id}/read`, { method: 'PATCH' }),

  markAllRead: () => apiFetch<{ message: string }>('/notifications/read-all', { method: 'PATCH' }),
};

// ─── Favorites API ────────────────────────────────────────────────────────────

export const favoritesApi = {
  list: () => apiFetch<Array<{ id: string; event?: Event; createdAt: string }>>('/favorites'),

  toggle: (data: { eventId?: string; packageId?: string; serviceId?: string }) =>
    apiFetch<{ favorited: boolean }>('/favorites/toggle', { method: 'POST', body: JSON.stringify(data) }),

  remove: (id: string) => apiFetch<{ message: string }>(`/favorites/${id}`, { method: 'DELETE' }),
};

// ─── Reviews API ──────────────────────────────────────────────────────────────

export const reviewsApi = {
  list: (params?: { eventId?: string; page?: number; limit?: number }) => {
    const q = params ? '?' + new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)])).toString() : '';
    return apiFetch<PaginatedResult<Review>>(`/reviews${q}`, { skipAuth: true });
  },

  create: (data: { eventId: string; bookingId?: string; rating: number; title?: string; comment?: string }) =>
    apiFetch<Review>('/reviews', { method: 'POST', body: JSON.stringify(data) }),
};

// ─── Contact API ──────────────────────────────────────────────────────────────

export interface ContactEnquiry {
  id: string;
  message: string;
}

export interface ContactChannels {
  email: string;
  phone: string;
  supportHours: string;
}

export const contactApi = {
  send: (data: {
    name: string;
    email: string;
    phone?: string;
    topic: 'technician' | 'event' | 'billing' | 'partnership' | 'other';
    message: string;
  }) =>
    apiFetch<ContactEnquiry>('/contact', {
      method: 'POST',
      body: JSON.stringify(data),
      skipAuth: true,
    }),

  channels: () =>
    apiFetch<ContactChannels>('/contact/info', { skipAuth: true }),
};

// ─── Admin API ────────────────────────────────────────────────────────────────

export const adminApi = {
  dashboard: () => apiFetch<DashboardStats>('/admin/dashboard', { admin: true }),

  eventRequests: () => apiFetch<EventRequest[]>('/admin/event-requests', { admin: true }),

  eventRequest: (id: string) => apiFetch<EventRequest>(`/admin/event-requests/${id}`, { admin: true }),

  updateEventRequest: (id: string, data: { status?: string; assignedManagerId?: string | null }) =>
    apiFetch<EventRequest>(`/admin/event-requests/${id}`, { method: 'PATCH', body: JSON.stringify(data), admin: true }),

  eventProposals: (id: string) => apiFetch<EventProposal[]>(`/admin/event-requests/${id}/proposals`, { admin: true }),

  createEventProposal: (id: string, data: {
    items: Array<{ name: string; description?: string; quantity: number; unitPrice: number }>;
    taxRate?: number;
    discountAmount?: number;
    notes?: string;
    validUntil?: string;
  }) => apiFetch<EventProposal>(`/admin/event-requests/${id}/proposals`, { method: 'POST', body: JSON.stringify(data), admin: true }),

  revenueAnalytics: (period: string) =>
    apiFetch<Array<{ date: string; amount: number }>>(`/admin/analytics/revenue?period=${period}`, { admin: true }),

  bookingAnalytics: () =>
    apiFetch<{ byStatus: Array<{ status: string; count: number }>; byEventType: Array<{ type: string; count: number }>; recentBookings: Booking[] }>('/admin/analytics/bookings', { admin: true }),

  bookings: (params?: Record<string, string | number>) => {
    const q = params ? '?' + new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)])).toString() : '';
    return apiFetch<PaginatedResult<Booking>>(`/admin/bookings${q}`, { admin: true });
  },

  booking: (id: string) => apiFetch<Booking>(`/admin/bookings/${id}`, { admin: true }),

  updateBooking: (id: string, data: Record<string, unknown>) =>
    apiFetch<Booking>(`/admin/bookings/${id}`, { method: 'PATCH', body: JSON.stringify(data), admin: true }),

  createQuote: (bookingId: string, data: Record<string, unknown>) =>
    apiFetch<Quote>(`/admin/bookings/${bookingId}/quotes`, { method: 'POST', body: JSON.stringify(data), admin: true }),

  sendQuote: (bookingId: string, quoteId: string) =>
    apiFetch<Quote>(`/admin/bookings/${bookingId}/quotes/${quoteId}/send`, { method: 'POST', admin: true }),

  addTimeline: (bookingId: string, data: { status: string; title: string; description?: string }) =>
    apiFetch<TimelineEntry>(`/admin/bookings/${bookingId}/timeline`, { method: 'POST', body: JSON.stringify(data), admin: true }),

  messages: (bookingId: string) =>
    apiFetch<Message[]>(`/admin/bookings/${bookingId}/messages`, { admin: true }),

  sendMessage: (bookingId: string, content: string) =>
    apiFetch<Message>(`/admin/bookings/${bookingId}/messages`, { method: 'POST', body: JSON.stringify({ content }), admin: true }),

  customers: (params?: Record<string, string | number>) => {
    const q = params ? '?' + new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)])).toString() : '';
    return apiFetch<PaginatedResult<User>>(`/admin/customers${q}`, { admin: true });
  },

  customer: (id: string) => apiFetch<User>(`/admin/customers/${id}`, { admin: true }),
};

export default apiFetch;

// ─── Technician types ─────────────────────────────────────────────────────────

export type TechnicianCategory =
  | 'PLUMBING' | 'ELECTRICAL' | 'AC_SERVICE' | 'APPLIANCE_REPAIR'
  | 'CARPENTRY' | 'PAINTING' | 'CLEANING' | 'COMPUTER_REPAIR'
  | 'CCTV_INSTALLATION' | 'PEST_CONTROL' | 'OTHER';

export type TechnicianBookingStatus =
  | 'PENDING' | 'CONFIRMED' | 'TECHNICIAN_ASSIGNED' | 'TECHNICIAN_CONFIRMED'
  | 'TECHNICIAN_ON_THE_WAY' | 'TECHNICIAN_ARRIVED' | 'SERVICE_STARTED'
  | 'SERVICE_COMPLETED' | 'PAYMENT_COMPLETED' | 'REVIEW_SUBMITTED'
  | 'CANCELLED' | 'REJECTED';

export interface Technician {
  id: string;
  userId: string;
  user?: { id: string; name: string; email: string; avatar?: string };
  name: string;
  phone: string;
  email: string;
  avatar?: string;
  bio?: string;
  category: TechnicianCategory;
  experience: number;
  rating: number;
  totalReviews: number;
  completedJobs: number;
  isVerified: boolean;
  isActive: boolean;
  isAvailable: boolean;
  serviceAreas: string[];
  skills: string[];
  services?: TechnicianServiceItem[];
  availability?: TechnicianAvailability[];
  createdAt: string;
}

export interface TechnicianServiceItem {
  id: string;
  technicianId: string;
  name: string;
  slug: string;
  description: string;
  category: TechnicianCategory;
  subCategory?: string;
  basePrice: number;
  pricingType: string;
  pricePerHour?: number;
  estimatedDuration?: number;
  images: string[];
  isActive: boolean;
  isPopular: boolean;
  tags: string[];
}

export interface TechnicianAvailability {
  id: string;
  technicianId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

export interface TechnicianBooking {
  id: string;
  bookingNumber: string;
  customerId: string;
  customer?: { id: string; name: string; email: string; phone?: string; avatar?: string };
  technicianId?: string;
  technician?: Technician;
  serviceId: string;
  service?: TechnicianServiceItem;
  category: TechnicianCategory;
  serviceDescription?: string;
  requestType: string;
  // Address snapshot
  addressLine1: string;
  addressLine2?: string;
  addressCity: string;
  addressState?: string;
  addressPincode: string;
  addressLabel: string;
  // Scheduling
  scheduledDate: string;
  timeSlotStart: string;
  timeSlotEnd: string;
  // Pricing
  estimatedPrice: number;
  finalPrice?: number;
  visitCharge: number;
  materialCost: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  paymentStatus: string;
  paymentMethod?: string;
  // Status
  status: TechnicianBookingStatus;
  customerNotes?: string;
  technicianNotes?: string;
  attachments: string[];
  assignedAt?: string;
  confirmedAt?: string;
  startedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  createdAt: string;
  timeline?: TechnicianTimelineEntry[];
  review?: TechnicianReview;
}

export interface TechnicianTimelineEntry {
  id: string;
  bookingId: string;
  status: TechnicianBookingStatus;
  title: string;
  description?: string;
  createdAt: string;
}

export interface TechnicianReview {
  id: string;
  bookingId: string;
  technicianId: string;
  customerId: string;
  customer?: { id: string; name: string; avatar?: string };
  rating: number;
  title?: string;
  comment?: string;
  images: string[];
  isVerified: boolean;
  createdAt: string;
}

export interface TechnicianStats {
  total: number;
  pending: number;
  confirmed: number;
  completed: number;
  cancelled: number;
  revenue: number;
}

// ─── Technician API ───────────────────────────────────────────────────────────

function qs(params?: Record<string, string | number | boolean | undefined>): string {
  if (!params) return '';
  const filtered = Object.entries(params).filter(([, v]) => v !== undefined);
  return filtered.length ? '?' + new URLSearchParams(filtered.map(([k, v]) => [k, String(v)])).toString() : '';
}

export const technicianApi = {
  // Public
  list: (params?: Record<string, string | number | boolean>) =>
    apiFetch<PaginatedResult<Technician>>(`/technicians${qs(params)}`, { skipAuth: true }),

  byId: (id: string) =>
    apiFetch<Technician>(`/technicians/${id}`, { skipAuth: true }),

  byCategory: (category: string, params?: Record<string, string | number>) =>
    apiFetch<PaginatedResult<Technician>>(`/technicians/category/${category}${qs(params)}`, { skipAuth: true }),

  available: (category: string, date?: string) =>
    apiFetch<Technician[]>(`/technicians/available?category=${category}${date ? `&date=${date}` : ''}`, { skipAuth: true }),

  servicesByCategory: (category: string) =>
    apiFetch<TechnicianServiceItem[]>(`/technicians/services/category/${category}`, { skipAuth: true }),

  serviceById: (id: string) =>
    apiFetch<TechnicianServiceItem>(`/technicians/services/${id}`, { skipAuth: true }),

  // Customer bookings
  createBooking: (data: {
    serviceId: string;
    category: string;
    serviceDescription?: string;
    technicianId?: string;
    addressLine1: string;
    addressLine2?: string;
    addressCity: string;
    addressState?: string;
    addressPincode: string;
    addressLabel?: string;
    scheduledDate: string;
    timeSlotStart: string;
    timeSlotEnd: string;
    paymentMethod?: string;
    customerNotes?: string;
  }) =>
    apiFetch<TechnicianBooking>('/technicians/bookings', { method: 'POST', body: JSON.stringify(data) }),

  myBookings: (params?: Record<string, string | number>) =>
    apiFetch<PaginatedResult<TechnicianBooking>>(`/technicians/bookings/my${qs(params)}`),

  bookingById: (id: string) =>
    apiFetch<TechnicianBooking>(`/technicians/bookings/${id}`),

  cancelBooking: (id: string, reason?: string) =>
    apiFetch<{ message: string }>(`/technicians/bookings/${id}`, {
      method: 'DELETE',
      body: JSON.stringify({ reason }),
    }),

  submitReview: (bookingId: string, data: { rating: number; title?: string; comment?: string }) =>
    apiFetch<TechnicianReview>(`/technicians/bookings/${bookingId}/review`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Technician-role
  myJobs: (params?: Record<string, string | number>) =>
    apiFetch<PaginatedResult<TechnicianBooking>>(`/technicians/my-jobs${qs(params)}`),

  updateJobStatus: (id: string, status: string, note?: string) =>
    apiFetch<TechnicianBooking>(`/technicians/my-jobs/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, note }),
    }),

  // Admin
  adminAllBookings: (params?: Record<string, string | number>) =>
    apiFetch<PaginatedResult<TechnicianBooking>>(`/technicians/admin/bookings${qs(params)}`, { admin: true }),

  adminBookingById: (id: string) =>
    apiFetch<TechnicianBooking>(`/technicians/admin/bookings/${id}`, { admin: true }),

  adminUpdateStatus: (id: string, status: string, note?: string) =>
    apiFetch<TechnicianBooking>(`/technicians/admin/bookings/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, note }),
      admin: true,
    }),

  adminAssignTechnician: (bookingId: string, technicianId: string) =>
    apiFetch<TechnicianBooking>(`/technicians/admin/bookings/${bookingId}/assign`, {
      method: 'POST',
      body: JSON.stringify({ technicianId }),
      admin: true,
    }),

  adminStats: () =>
    apiFetch<TechnicianStats>('/technicians/admin/stats', { admin: true }),
};
