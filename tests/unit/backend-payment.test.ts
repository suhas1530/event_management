import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createHmac } from 'node:crypto';

/**
 * Payment integrity tests.
 *
 * These exercise the real PaymentService and the official Razorpay adapter with
 * the database and network mocked at their module boundaries. They pin down the
 * rules that a browser cannot bypass: server-derived amounts, ownership,
 * eligibility, signature verification, replay protection, safe booking state
 * transitions and refunds.
 */

const prismaMock = vi.hoisted(() => ({
  booking: {
    findUnique: vi.fn(),
    updateMany: vi.fn(),
  },
  bookingTimeline: { create: vi.fn() },
  technicianBooking: {
    findUnique: vi.fn(),
    updateMany: vi.fn(),
  },
  technicianBookingTimeline: { create: vi.fn() },
  eventRequest: {
    findUnique: vi.fn(),
    updateMany: vi.fn(),
  },
  payment: {
    create: vi.fn(),
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    updateMany: vi.fn(),
  },
  technicianPayment: {
    create: vi.fn(),
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    updateMany: vi.fn(),
  },
  eventRequestPayment: {
    create: vi.fn(),
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    updateMany: vi.fn(),
  },
  paymentWebhookEvent: {
    create: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  auditLog: { create: vi.fn() },
}));

const configMock = vi.hoisted(() => ({
  config: {
    env: 'test',
    payment: {
      provider: 'razorpay',
      mode: 'test',
      currency: 'INR',
      razorpay: {
        keyId: 'rzp_test_123456789',
        keySecret: 'test_key_secret_never_exposed',
        webhookSecret: 'test_webhook_secret_never_exposed',
      },
    },
  },
}));

vi.mock('../../backend/src/utils/database', () => ({ default: prismaMock }));
vi.mock('../../backend/src/config', () => configMock);

import { PaymentService } from '../../backend/src/services/payment';
import { RazorpayProvider } from '../../backend/src/payments/razorpay';
import type { PaymentProvider, ProviderPayment } from '../../backend/src/payments';

const USER_ID = '64b7f0c2a1b2c3d4e5f60701';
const BOOKING_ID = '64b7f0c2a1b2c3d4e5f60702';
const PAYMENT_ID = '64b7f0c2a1b2c3d4e5f60703';
const REQUEST_ID = '64b7f0c2a1b2c3d4e5f60704';
const TECH_BOOKING_ID = '64b7f0c2a1b2c3d4e5f60705';
const ORDER_ID = 'order_TEST1234567890';
const PROVIDER_PAYMENT_ID = 'pay_TEST1234567890';
const now = new Date('2026-10-29T10:00:00.000Z');

function paymentRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: PAYMENT_ID,
    bookingId: BOOKING_ID,
    amount: 5000,
    currency: 'INR',
    method: 'RAZORPAY',
    status: 'PENDING',
    provider: 'razorpay',
    idempotencyKey: null,
    gatewayOrderId: null,
    gatewayPaymentId: null,
    transactionId: null,
    gatewayResponse: null,
    failureCode: null,
    failureReason: null,
    paidAt: null,
    verifiedAt: null,
    appliedAt: null,
    refundId: null,
    refundStatus: null,
    refundAmount: 0,
    refundedAt: null,
    refundRequestedAt: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function bookingRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: BOOKING_ID,
    userId: USER_ID,
    bookingNumber: 'BK-2026-0001',
    status: 'PAYMENT_PENDING',
    paymentStatus: 'PENDING',
    currency: 'INR',
    totalAmount: 5000,
    balanceAmount: 5000,
    paidAmount: 0,
    appliedPaymentIds: [],
    user: { name: 'Asha Rao', email: 'asha@example.com', phone: '+919876543210' },
    event: { title: 'Wedding Reception' },
    quotes: [{ id: 'quote-1', status: 'APPROVED', version: 2 }],
    ...overrides,
  };
}

function eventRequestRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: REQUEST_ID,
    customerId: USER_ID,
    requestNumber: 'EV-2026-0001',
    status: 'ADVANCE_PAYMENT_PENDING',
    paymentStatus: 'PENDING',
    advancePaidAmount: 0,
    appliedPaymentIds: [],
    customer: { name: 'Asha Rao', email: 'asha@example.com', phone: '+919876543210' },
    proposals: [{ id: 'proposal-1', status: 'APPROVED', version: 1, totalAmount: 10000 }],
    ...overrides,
  };
}

function providerMock(): PaymentProvider {
  return {
    name: 'razorpay',
    isConfigured: vi.fn(() => true),
    createOrder: vi.fn(async input => ({
      id: ORDER_ID,
      amount: input.amountPaise,
      currency: input.currency,
      receipt: input.receipt,
      status: 'created',
    })),
    fetchPayment: vi.fn(async () => capturedPayment()),
    fetchOrderPayments: vi.fn(async () => [capturedPayment()]),
    capturePayment: vi.fn(async () => capturedPayment()),
    createRefund: vi.fn(async () => ({
      id: 'rfnd_TEST123',
      payment_id: PROVIDER_PAYMENT_ID,
      amount: 500000,
      currency: 'INR',
      status: 'processed',
    })),
    verifyPaymentSignature: vi.fn(() => true),
    verifyWebhookSignature: vi.fn(() => true),
  };
}

function capturedPayment(overrides: Partial<ProviderPayment> = {}): ProviderPayment {
  return {
    id: PROVIDER_PAYMENT_ID,
    order_id: ORDER_ID,
    amount: 500000,
    currency: 'INR',
    status: 'captured',
    captured: true,
    method: 'upi',
    ...overrides,
  };
}

function resetPrisma() {
  for (const model of Object.values(prismaMock)) {
    for (const fn of Object.values(model as Record<string, ReturnType<typeof vi.fn>>)) {
      fn.mockReset();
    }
  }
}

function setupOwnedEventBooking(record = paymentRecord({ gatewayOrderId: ORDER_ID })) {
  prismaMock.payment.findFirst.mockResolvedValue(record);
  prismaMock.technicianPayment.findFirst.mockResolvedValue(null);
  prismaMock.eventRequestPayment.findFirst.mockResolvedValue(null);
  prismaMock.booking.findUnique.mockImplementation(async (args: { select?: { userId?: boolean } }) => {
    if (args?.select?.userId) return { userId: USER_ID };
    return bookingRecord();
  });
  prismaMock.payment.findUnique.mockResolvedValue(record);
}

beforeEach(() => {
  resetPrisma();
  prismaMock.bookingTimeline.create.mockResolvedValue({});
  prismaMock.technicianBookingTimeline.create.mockResolvedValue({});
  prismaMock.paymentWebhookEvent.update.mockResolvedValue({});
  prismaMock.auditLog.create.mockResolvedValue({});
});

describe('server-derived order amounts and ownership', () => {
  it('creates an order from the booking balance, ignoring any client amount', async () => {
    const provider = providerMock();
    const service = new PaymentService(() => provider);
    prismaMock.booking.findUnique.mockResolvedValue(bookingRecord());
    prismaMock.payment.findFirst.mockResolvedValue(null);
    prismaMock.payment.create.mockResolvedValue(paymentRecord());
    prismaMock.payment.updateMany.mockResolvedValue({ count: 1 });

    const result = await service.createOrder(USER_ID, {
      targetType: 'EVENT_BOOKING',
      targetId: BOOKING_ID,
      idempotencyKey: 'checkout-attempt-1',
    });

    expect(provider.createOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        amountPaise: 500000,
        currency: 'INR',
        notes: expect.objectContaining({ targetId: BOOKING_ID }),
      }),
    );
    expect(result.amount).toBe(5000);
    expect(result.checkout).toMatchObject({
      keyId: 'rzp_test_123456789',
      orderId: ORDER_ID,
      amount: 500000,
      currency: 'INR',
    });
  });

  it('rejects a booking owned by another customer before creating an order', async () => {
    const provider = providerMock();
    const service = new PaymentService(() => provider);
    prismaMock.booking.findUnique.mockResolvedValue(bookingRecord({ userId: 'another-user' }));

    await expect(
      service.createOrder(USER_ID, { targetType: 'EVENT_BOOKING', targetId: BOOKING_ID }),
    ).rejects.toThrow(/access denied/i);
    expect(provider.createOrder).not.toHaveBeenCalled();
    expect(prismaMock.payment.create).not.toHaveBeenCalled();
  });

  it('rejects payment when the booking is not in PAYMENT_PENDING', async () => {
    const provider = providerMock();
    const service = new PaymentService(() => provider);
    prismaMock.booking.findUnique.mockResolvedValue(bookingRecord({ status: 'CONFIRMED' }));

    await expect(
      service.createOrder(USER_ID, { targetType: 'EVENT_BOOKING', targetId: BOOKING_ID }),
    ).rejects.toThrow(/not due/i);
    expect(provider.createOrder).not.toHaveBeenCalled();
  });

  it('rejects an event booking without an approved quote', async () => {
    const provider = providerMock();
    const service = new PaymentService(() => provider);
    prismaMock.booking.findUnique.mockResolvedValue(bookingRecord({ quotes: [] }));

    await expect(
      service.createOrder(USER_ID, { targetType: 'EVENT_BOOKING', targetId: BOOKING_ID }),
    ).rejects.toThrow(/approved quote/i);
    expect(provider.createOrder).not.toHaveBeenCalled();
  });

  it('only allows home-service online payment after SERVICE_COMPLETED', async () => {
    const provider = providerMock();
    const service = new PaymentService(() => provider);
    prismaMock.technicianBooking.findUnique.mockResolvedValue({
      id: TECH_BOOKING_ID,
      customerId: USER_ID,
      bookingNumber: 'TECH-1',
      status: 'TECHNICIAN_ARRIVED',
      paymentStatus: 'PENDING',
      balanceAmount: 1200,
      service: { name: 'AC Deep Clean' },
      customer: { name: 'Asha', email: 'asha@example.com', phone: null },
    });

    await expect(
      service.createOrder(USER_ID, { targetType: 'TECHNICIAN_BOOKING', targetId: TECH_BOOKING_ID }),
    ).rejects.toThrow(/after the service is completed/i);
    expect(provider.createOrder).not.toHaveBeenCalled();
  });

  it('derives an inquiry advance from the approved proposal, never from the browser', async () => {
    const provider = providerMock();
    const service = new PaymentService(() => provider);
    prismaMock.eventRequest.findUnique.mockResolvedValue(eventRequestRecord({ advancePaidAmount: 2500 }));
    prismaMock.eventRequestPayment.findFirst.mockResolvedValue(null);
    prismaMock.eventRequestPayment.create.mockResolvedValue(
      paymentRecord({ bookingId: undefined, requestId: REQUEST_ID, amount: 7500 }),
    );
    prismaMock.eventRequestPayment.updateMany.mockResolvedValue({ count: 1 });

    const result = await service.createOrder(USER_ID, {
      targetType: 'EVENT_REQUEST',
      targetId: REQUEST_ID,
    });

    expect(provider.createOrder).toHaveBeenCalledWith(
      expect.objectContaining({ amountPaise: 750000 }),
    );
    expect(result.amount).toBe(7500);
  });

  it('never exposes the key secret or webhook secret in checkout configuration', async () => {
    const provider = providerMock();
    const service = new PaymentService(() => provider);
    prismaMock.booking.findUnique.mockResolvedValue(bookingRecord());
    prismaMock.payment.findFirst.mockResolvedValue(null);
    prismaMock.payment.create.mockResolvedValue(paymentRecord());
    prismaMock.payment.updateMany.mockResolvedValue({ count: 1 });

    const result = await service.createOrder(USER_ID, {
      targetType: 'EVENT_BOOKING',
      targetId: BOOKING_ID,
    });
    const serialised = JSON.stringify(result);

    expect(serialised).not.toContain('test_key_secret_never_exposed');
    expect(serialised).not.toContain('test_webhook_secret_never_exposed');
    expect(result.checkout).not.toHaveProperty('keySecret');
    expect(result.checkout).not.toHaveProperty('webhookSecret');
  });
});

describe('checkout verification', () => {
  it('rejects an invalid Razorpay signature without touching the booking', async () => {
    const provider = providerMock();
    provider.verifyPaymentSignature = vi.fn(() => false);
    const service = new PaymentService(() => provider);
    setupOwnedEventBooking();

    await expect(
      service.verifyPayment(USER_ID, {
        razorpay_order_id: ORDER_ID,
        razorpay_payment_id: PROVIDER_PAYMENT_ID,
        razorpay_signature: 'a'.repeat(64),
      }),
    ).rejects.toThrow(/signature verification failed/i);

    expect(provider.fetchPayment).not.toHaveBeenCalled();
    expect(prismaMock.booking.updateMany).not.toHaveBeenCalled();
  });

  it('confirms a booking only after the captured provider payment matches', async () => {
    const provider = providerMock();
    const service = new PaymentService(() => provider);
    let current = paymentRecord({ gatewayOrderId: ORDER_ID });
    setupOwnedEventBooking(current);
    prismaMock.payment.updateMany.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => {
      current = { ...current, ...data } as ReturnType<typeof paymentRecord>;
      return { count: 1 };
    });
    prismaMock.payment.findUnique.mockImplementation(async () => current);
    prismaMock.booking.findUnique.mockResolvedValue(bookingRecord());
    prismaMock.booking.updateMany.mockResolvedValue({ count: 1 });

    const result = await service.verifyPayment(USER_ID, {
      razorpay_order_id: ORDER_ID,
      razorpay_payment_id: PROVIDER_PAYMENT_ID,
      razorpay_signature: 'b'.repeat(64),
    });

    expect(result.status).toBe('COMPLETED');
    expect(prismaMock.booking.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: BOOKING_ID, status: 'PAYMENT_PENDING' }),
        data: expect.objectContaining({
          status: 'CONFIRMED',
          paymentStatus: 'COMPLETED',
          paidAmount: 5000,
          balanceAmount: 0,
        }),
      }),
    );
  });

  it('marks a mismatched captured payment for review instead of confirming', async () => {
    const provider = providerMock();
    provider.fetchPayment = vi.fn(async () => capturedPayment({ amount: 100 }));
    const service = new PaymentService(() => provider);
    let current = paymentRecord({ gatewayOrderId: ORDER_ID });
    setupOwnedEventBooking(current);
    prismaMock.payment.updateMany.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => {
      current = { ...current, ...data } as ReturnType<typeof paymentRecord>;
      return { count: 1 };
    });
    prismaMock.payment.findUnique.mockImplementation(async () => current);

    const result = await service.verifyPayment(USER_ID, {
      razorpay_order_id: ORDER_ID,
      razorpay_payment_id: PROVIDER_PAYMENT_ID,
      razorpay_signature: 'c'.repeat(64),
    });

    expect(result.status).toBe('REVIEW_REQUIRED');
    expect(prismaMock.booking.updateMany).not.toHaveBeenCalled();
    expect(prismaMock.payment.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'REVIEW_REQUIRED' }),
      }),
    );
  });

  it('moves an inquiry to ADVANCE_PAYMENT_RECEIVED, never EVENT_CONFIRMED', async () => {
    const provider = providerMock();
    provider.fetchPayment = vi.fn(async () => capturedPayment({ amount: 1000000 }));
    const service = new PaymentService(() => provider);
    let current = paymentRecord({
      bookingId: undefined,
      requestId: REQUEST_ID,
      amount: 10000,
      gatewayOrderId: ORDER_ID,
    });
    prismaMock.payment.findFirst.mockResolvedValue(null);
    prismaMock.technicianPayment.findFirst.mockResolvedValue(null);
    prismaMock.eventRequestPayment.findFirst.mockResolvedValue(current);
    prismaMock.eventRequestPayment.findUnique.mockImplementation(async () => current);
    prismaMock.eventRequestPayment.updateMany.mockImplementation(
      async ({ data }: { data: Record<string, unknown> }) => {
        current = { ...current, ...data } as ReturnType<typeof paymentRecord>;
        return { count: 1 };
      },
    );
    prismaMock.eventRequest.findUnique.mockResolvedValue(eventRequestRecord());
    prismaMock.eventRequest.updateMany.mockResolvedValue({ count: 1 });

    const result = await service.verifyPayment(USER_ID, {
      razorpay_order_id: ORDER_ID,
      razorpay_payment_id: PROVIDER_PAYMENT_ID,
      razorpay_signature: 'd'.repeat(64),
    });

    expect(result.status).toBe('COMPLETED');
    expect(prismaMock.eventRequest.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'ADVANCE_PAYMENT_RECEIVED',
          paymentStatus: 'COMPLETED',
        }),
      }),
    );
    expect(prismaMock.eventRequest.updateMany).not.toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'EVENT_CONFIRMED' }) }),
    );
  });
});

describe('webhook replay protection', () => {
  function webhookPayload() {
    return Buffer.from(
      JSON.stringify({
        event: 'payment.failed',
        payload: {
          payment: {
            entity: {
              id: PROVIDER_PAYMENT_ID,
              order_id: ORDER_ID,
              amount: 500000,
              currency: 'INR',
              status: 'failed',
              error_code: 'BAD_REQUEST',
              error_description: 'Card declined',
            },
          },
        },
      }),
    );
  }

  it('rejects an invalid webhook signature before claiming the event', async () => {
    const provider = providerMock();
    provider.verifyWebhookSignature = vi.fn(() => false);
    const service = new PaymentService(() => provider);

    await expect(service.handleWebhook(webhookPayload(), 'e'.repeat(64))).rejects.toThrow(
      /webhook signature verification failed/i,
    );
    expect(prismaMock.paymentWebhookEvent.create).not.toHaveBeenCalled();
  });

  it('processes a valid delivery once and acknowledges a replay as a duplicate', async () => {
    const provider = providerMock();
    const service = new PaymentService(() => provider);
    const record = paymentRecord({ gatewayOrderId: ORDER_ID });
    prismaMock.payment.findFirst.mockResolvedValue(record);
    prismaMock.technicianPayment.findFirst.mockResolvedValue(null);
    prismaMock.eventRequestPayment.findFirst.mockResolvedValue(null);
    prismaMock.paymentWebhookEvent.create
      .mockResolvedValueOnce({})
      .mockRejectedValueOnce(Object.assign(new Error('duplicate'), { code: 'P2002' }));
    prismaMock.paymentWebhookEvent.findUnique.mockResolvedValue({ status: 'PROCESSED' });
    prismaMock.payment.updateMany.mockResolvedValue({ count: 1 });
    prismaMock.payment.findUnique.mockResolvedValue(record);

    const first = await service.handleWebhook(webhookPayload(), 'f'.repeat(64));
    const second = await service.handleWebhook(webhookPayload(), 'f'.repeat(64));

    expect(first).toMatchObject({ duplicate: false, ignored: false });
    expect(second).toMatchObject({ duplicate: true });
    expect(prismaMock.payment.updateMany).toHaveBeenCalledTimes(1);
    expect(prismaMock.paymentWebhookEvent.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'PROCESSED' }) }),
    );
  });

  it('ignores a signed event for an order that is not ours', async () => {
    const provider = providerMock();
    const service = new PaymentService(() => provider);
    prismaMock.paymentWebhookEvent.create.mockResolvedValue({});
    prismaMock.payment.findFirst.mockResolvedValue(null);
    prismaMock.technicianPayment.findFirst.mockResolvedValue(null);
    prismaMock.eventRequestPayment.findFirst.mockResolvedValue(null);

    const result = await service.handleWebhook(webhookPayload(), 'a'.repeat(64));

    expect(result).toMatchObject({ duplicate: false, ignored: true });
    expect(prismaMock.payment.updateMany).not.toHaveBeenCalled();
  });
});

describe('refunds', () => {
  it('refunds a captured payment and reopens the booking balance', async () => {
    const provider = providerMock();
    const service = new PaymentService(() => provider);
    let current = paymentRecord({
      status: 'COMPLETED',
      gatewayOrderId: ORDER_ID,
      gatewayPaymentId: PROVIDER_PAYMENT_ID,
      paidAt: now,
    });
    prismaMock.payment.findUnique.mockImplementation(async () => current);
    prismaMock.payment.updateMany.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => {
      current = { ...current, ...data } as ReturnType<typeof paymentRecord>;
      return { count: 1 };
    });
    prismaMock.booking.updateMany.mockResolvedValue({ count: 1 });
    prismaMock.auditLog.create.mockResolvedValue({});

    const result = await service.createRefund('admin-1', {
      targetType: 'EVENT_BOOKING',
      paymentId: PAYMENT_ID,
    });

    expect(provider.createRefund).toHaveBeenCalledWith(
      PROVIDER_PAYMENT_ID,
      500000,
      expect.objectContaining({ paymentId: PAYMENT_ID }),
    );
    expect(result.status).toBe('REFUNDED');
    expect(prismaMock.booking.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          paidAmount: { decrement: 5000 },
          balanceAmount: { increment: 5000 },
          paymentStatus: 'REFUNDED',
        }),
      }),
    );
  });

  it('rejects a refund larger than the refundable balance before calling Razorpay', async () => {
    const provider = providerMock();
    const service = new PaymentService(() => provider);
    prismaMock.payment.findUnique.mockResolvedValue(
      paymentRecord({
        status: 'COMPLETED',
        gatewayPaymentId: PROVIDER_PAYMENT_ID,
        refundAmount: 4000,
      }),
    );

    await expect(
      service.createRefund('admin-1', {
        targetType: 'EVENT_BOOKING',
        paymentId: PAYMENT_ID,
        amount: 2000,
      }),
    ).rejects.toThrow(/refundable balance/i);
    expect(provider.createRefund).not.toHaveBeenCalled();
  });
});

describe('official Razorpay adapter signatures', () => {
  it('accepts a correct payment signature and rejects tampering or malformed values', () => {
    const provider = new RazorpayProvider();
    const signature = createHmac('sha256', 'test_key_secret_never_exposed')
      .update(`${ORDER_ID}|${PROVIDER_PAYMENT_ID}`)
      .digest('hex');

    expect(provider.verifyPaymentSignature(ORDER_ID, PROVIDER_PAYMENT_ID, signature)).toBe(true);
    expect(provider.verifyPaymentSignature(ORDER_ID, 'pay_OTHER', signature)).toBe(false);
    expect(provider.verifyPaymentSignature(ORDER_ID, PROVIDER_PAYMENT_ID, 'not-hex')).toBe(false);
  });

  it('verifies webhook HMACs against the exact raw body', () => {
    const provider = new RazorpayProvider();
    const rawBody = Buffer.from('{"event":"payment.captured"}');
    const signature = createHmac('sha256', 'test_webhook_secret_never_exposed')
      .update(rawBody)
      .digest('hex');

    expect(provider.verifyWebhookSignature(rawBody, signature)).toBe(true);
    expect(provider.verifyWebhookSignature(Buffer.from('{"event":"payment.failed"}'), signature)).toBe(
      false,
    );
  });
});
