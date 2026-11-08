import { createHash } from 'node:crypto';
import {
  BookingStatus,
  EventRequestPayment,
  Payment as PrismaPayment,
  PaymentMethod,
  PaymentMethodType,
  PaymentStatus,
  Prisma,
  TechnicianBookingStatus,
  TechnicianPayment,
} from '@prisma/client';
import { config } from '../config';
import prisma from '../utils/database';
import {
  AppError,
  AuthorizationError,
  ConflictError,
  NotFoundError,
} from '../middleware/errorHandler';
import {
  CreateProviderOrderInput,
  PaymentConfigurationError,
  PaymentProvider,
  PaymentProviderError,
  ProviderOrder,
  ProviderPayment,
  ProviderRefund,
  getPaymentProvider,
} from '../payments';
import type {
  AdminRefundInput,
  CreatePaymentOrderInput,
  PaymentTargetType,
  VerifyPaymentInput,
} from '../validators/payment';

const OPEN_PAYMENT_STATUSES: PaymentStatus[] = [
  PaymentStatus.PENDING,
  PaymentStatus.PROCESSING,
  PaymentStatus.AUTHORIZED,
];

const IDEMPOTENCY_WINDOW_MS = 15 * 60 * 1000;

type AnyPaymentRecord = PrismaPayment | TechnicianPayment | EventRequestPayment;

interface PaymentRef {
  targetType: PaymentTargetType;
  targetId: string;
  record: AnyPaymentRecord;
}

interface ResolvedTarget {
  targetType: PaymentTargetType;
  targetId: string;
  amount: number;
  currency: string;
  description: string;
  prefill: {
    name?: string;
    email?: string;
    contact?: string;
  };
}

interface PaymentUpdateData {
  status?: PaymentStatus;
  gatewayOrderId?: string | null;
  gatewayPaymentId?: string | null;
  transactionId?: string | null;
  gatewayResponse?: Prisma.InputJsonValue;
  idempotencyKey?: string | null;
  failureCode?: string | null;
  failureReason?: string | null;
  paidAt?: Date | null;
  verifiedAt?: Date | null;
  appliedAt?: Date | null;
  refundId?: string | null;
  refundStatus?: string | null;
  refundAmount?: number;
  refundedAt?: Date | null;
  refundRequestedAt?: Date | null;
}

export interface NormalizedPayment {
  id: string;
  targetType: PaymentTargetType;
  targetId: string;
  amount: number;
  amountPaise: number;
  currency: string;
  status: PaymentStatus;
  provider: string;
  providerOrderId: string | null;
  providerPaymentId: string | null;
  paidAt: string | null;
  verifiedAt: string | null;
  failureCode: string | null;
  failureReason: string | null;
  refundAmount: number;
  refundStatus: string | null;
  refundedAt: string | null;
  checkoutAllowed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentOrderResponse {
  paymentId: string;
  targetType: PaymentTargetType;
  targetId: string;
  amount: number;
  amountPaise: number;
  currency: string;
  status: PaymentStatus;
  alreadyPaid: boolean;
  requiresReview: boolean;
  checkout?: {
    provider: 'razorpay';
    keyId: string;
    orderId: string;
    amount: number;
    currency: string;
    name: string;
    description: string;
    prefill: ResolvedTarget['prefill'];
    notes: Record<string, string>;
  };
}

export interface WebhookResult {
  duplicate: boolean;
  ignored: boolean;
  eventType?: string;
  paymentId?: string;
}

interface RazorpayWebhookPayload {
  event?: string;
  created_at?: number;
  payload?: {
    payment?: {
      entity?: ProviderPayment & {
        email?: string;
        contact?: string;
        error_code?: string | null;
        error_description?: string | null;
      };
    };
    order?: {
      entity?: {
        id?: string;
        amount?: number;
        currency?: string;
        status?: string;
      };
    };
    refund?: {
      entity?: {
        id?: string;
        payment_id?: string;
        amount?: number;
        currency?: string;
        status?: string;
        created_at?: number;
      };
    };
  };
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function toPaise(value: number): number {
  const paise = Math.round(value * 100);
  if (!Number.isSafeInteger(paise) || paise < 100) {
    throw new AppError(400, 'The payment amount is not valid for online checkout.', 'INVALID_PAYMENT_AMOUNT');
  }
  return paise;
}

function safeFailure(value?: string | null): string | null {
  if (!value) return null;
  return value.replace(/[\r\n]+/g, ' ').trim().slice(0, 240) || null;
}

function safeFailureCode(value?: string | null): string | null {
  if (!value) return null;
  return value.replace(/[^A-Za-z0-9_.:-]/g, '').slice(0, 80) || null;
}

function safeOrder(order: ProviderOrder): Prisma.InputJsonValue {
  return {
    id: order.id,
    amount: order.amount,
    currency: order.currency,
    receipt: order.receipt ?? null,
    status: order.status,
  };
}

function safePayment(payment: ProviderPayment): Prisma.InputJsonValue {
  return {
    id: payment.id,
    order_id: payment.order_id,
    amount: payment.amount,
    currency: payment.currency,
    status: payment.status,
    captured: payment.captured ?? null,
    method: payment.method ?? null,
    created_at: payment.created_at ?? null,
    error_code: safeFailureCode(payment.error_code),
    error_description: safeFailure(payment.error_description),
  };
}

function providerMethod(method?: string | null): PaymentMethodType {
  switch ((method ?? '').toLowerCase()) {
    case 'card':
      return PaymentMethodType.CARD;
    case 'upi':
      return PaymentMethodType.UPI;
    case 'netbanking':
    case 'wallet':
    case 'emi':
    case 'paylater':
      return PaymentMethodType.ONLINE;
    default:
      return PaymentMethodType.ONLINE;
  }
}

function paymentStatusForRefund(refunded: number, total: number): PaymentStatus {
  return refunded >= total - 0.01 ? PaymentStatus.REFUNDED : PaymentStatus.PARTIALLY_REFUNDED;
}

function receiptFor(paymentId: string): string {
  // Razorpay receipts are limited to 40 characters and should be unique.
  return `PAY-${paymentId.slice(-24)}`;
}

/**
 * Domain-facing payment orchestration.
 *
 * Every method re-resolves ownership and eligibility on the server. The client
 * never sends an amount, currency, customer identity or success flag.
 */
export class PaymentService {
  constructor(
    private readonly providerFactory: () => PaymentProvider = getPaymentProvider,
  ) {}

  private getProvider(): PaymentProvider {
    try {
      return this.providerFactory();
    } catch (error) {
      if (error instanceof PaymentConfigurationError) {
        throw new AppError(503, error.message, error.code);
      }
      throw error;
    }
  }

  private toProviderAppError(error: unknown): AppError {
    if (error instanceof AppError) return error;
    if (error instanceof PaymentConfigurationError) {
      return new AppError(503, error.message, error.code);
    }
    if (error instanceof PaymentProviderError) {
      return new AppError(502, error.message, 'PAYMENT_PROVIDER_ERROR');
    }
    return new AppError(502, 'The payment provider could not complete this request.', 'PAYMENT_PROVIDER_ERROR');
  }

  // ─── Target resolution ─────────────────────────────────────────────────────

  private async resolveTarget(
    userId: string,
    targetType: PaymentTargetType,
    targetId: string,
  ): Promise<ResolvedTarget> {
    if (targetType === 'EVENT_BOOKING') {
      const booking = await prisma.booking.findUnique({
        where: { id: targetId },
        include: {
          user: { select: { name: true, email: true, phone: true } },
          event: { select: { title: true } },
          quotes: {
            where: { status: 'APPROVED' },
            orderBy: { version: 'desc' },
            take: 1,
          },
        },
      });
      if (!booking) throw new NotFoundError('Booking not found');
      if (booking.userId !== userId) throw new AuthorizationError('Access denied');
      if (booking.paymentStatus === PaymentStatus.COMPLETED || booking.balanceAmount <= 0) {
        throw new AppError(409, 'This booking is already paid.', 'ALREADY_PAID');
      }
      if (booking.status !== BookingStatus.PAYMENT_PENDING) {
        throw new AppError(400, 'Payment is not due for this booking.', 'PAYMENT_NOT_DUE');
      }
      if (booking.quotes.length === 0) {
        throw new AppError(400, 'An approved quote is required before payment.', 'QUOTE_NOT_APPROVED');
      }
      this.assertCurrency(booking.currency);
      const amount = roundMoney(booking.balanceAmount);
      toPaise(amount);
      return {
        targetType,
        targetId,
        amount,
        currency: config.payment.currency,
        description: `Booking ${booking.bookingNumber} · ${booking.event.title}`,
        prefill: {
          name: booking.user.name,
          email: booking.user.email,
          contact: booking.user.phone ?? undefined,
        },
      };
    }

    if (targetType === 'TECHNICIAN_BOOKING') {
      const booking = await prisma.technicianBooking.findUnique({
        where: { id: targetId },
        include: {
          customer: { select: { name: true, email: true, phone: true } },
          service: { select: { name: true } },
        },
      });
      if (!booking) throw new NotFoundError('Booking not found');
      if (booking.customerId !== userId) throw new AuthorizationError('Access denied');
      if (booking.paymentStatus === PaymentStatus.COMPLETED || booking.balanceAmount <= 0) {
        throw new AppError(409, 'This booking is already paid.', 'ALREADY_PAID');
      }
      // Home-service policy is pay-after-service. Online payment is available
      // only once the professional has completed the work.
      if (booking.status !== TechnicianBookingStatus.SERVICE_COMPLETED) {
        throw new AppError(400, 'Online payment is available after the service is completed.', 'PAYMENT_NOT_DUE');
      }
      this.assertCurrency('INR');
      const amount = roundMoney(booking.balanceAmount);
      toPaise(amount);
      return {
        targetType,
        targetId,
        amount,
        currency: config.payment.currency,
        description: `Home service ${booking.bookingNumber} · ${booking.service.name}`,
        prefill: {
          name: booking.customer.name,
          email: booking.customer.email,
          contact: booking.customer.phone ?? undefined,
        },
      };
    }

    const request = await prisma.eventRequest.findUnique({
      where: { id: targetId },
      include: {
        customer: { select: { name: true, email: true, phone: true } },
        proposals: {
          where: { status: 'APPROVED' },
          orderBy: { version: 'desc' },
          take: 1,
        },
      },
    });
    if (!request) throw new NotFoundError('Event request not found');
    if (request.customerId !== userId) throw new AuthorizationError('Access denied');
    if (request.paymentStatus === PaymentStatus.COMPLETED) {
      throw new AppError(409, 'This proposal is already paid.', 'ALREADY_PAID');
    }
    if (request.status !== 'ADVANCE_PAYMENT_PENDING') {
      throw new AppError(400, 'Payment is not due for this event request.', 'PAYMENT_NOT_DUE');
    }
    const proposal = request.proposals[0];
    if (!proposal) {
      throw new AppError(400, 'An approved proposal is required before payment.', 'PROPOSAL_NOT_APPROVED');
    }
    const alreadyPaid = roundMoney(request.advancePaidAmount ?? 0);
    const amount = roundMoney(proposal.totalAmount - alreadyPaid);
    if (amount <= 0) {
      throw new AppError(409, 'This proposal is already paid.', 'ALREADY_PAID');
    }
    this.assertCurrency('INR');
    toPaise(amount);
    return {
      targetType,
      targetId,
      amount,
      currency: config.payment.currency,
      description: `Event proposal ${request.requestNumber}`,
      prefill: {
        name: request.customer.name,
        email: request.customer.email,
        contact: request.customer.phone ?? undefined,
      },
    };
  }

  private assertCurrency(currency: string): void {
    if ((currency || 'INR').toUpperCase() !== config.payment.currency) {
      throw new AppError(400, `Only ${config.payment.currency} payments are supported.`, 'CURRENCY_MISMATCH');
    }
  }

  // ─── Create order ──────────────────────────────────────────────────────────

  async createOrder(userId: string, input: CreatePaymentOrderInput): Promise<PaymentOrderResponse> {
    const provider = this.getProvider();
    const target = await this.resolveTarget(userId, input.targetType, input.targetId);

    const existing = await this.findReusablePayment(target, input.idempotencyKey);
    if (existing) {
      const ensured = await this.ensureProviderOrder(existing, target, provider);
      return this.toOrderResponse(ensured.ref, target, ensured.order);
    }

    const created = await this.createPaymentRecord(target, input.idempotencyKey);
    try {
      const order = await provider.createOrder(this.providerOrderInput(created, target));
      await this.updatePaymentFields(created, {
        gatewayOrderId: order.id,
        gatewayResponse: safeOrder(order),
      });
      return this.toOrderResponse(created, target, order);
    } catch (error) {
      await this.updatePaymentFields(created, {
        status: PaymentStatus.FAILED,
        failureCode: 'ORDER_CREATION_FAILED',
        failureReason: safeFailure(error instanceof Error ? error.message : 'Order creation failed'),
      }).catch(() => undefined);
      throw this.toProviderAppError(error);
    }
  }

  private providerOrderInput(ref: PaymentRef, target: ResolvedTarget): CreateProviderOrderInput {
    return {
      amountPaise: toPaise(ref.record.amount),
      currency: ref.record.currency,
      receipt: receiptFor(ref.record.id),
      notes: {
        targetType: target.targetType,
        targetId: target.targetId,
        paymentId: ref.record.id,
      },
    };
  }

  private async ensureProviderOrder(
    ref: PaymentRef,
    target: ResolvedTarget,
    provider: PaymentProvider,
  ): Promise<{ ref: PaymentRef; order?: ProviderOrder }> {
    if (ref.record.status === PaymentStatus.COMPLETED) {
      return { ref };
    }
    if (ref.record.gatewayOrderId) {
      return { ref };
    }
    try {
      const order = await provider.createOrder(this.providerOrderInput(ref, target));
      await this.updatePaymentFields(ref, {
        gatewayOrderId: order.id,
        gatewayResponse: safeOrder(order),
      });
      return {
        ref: { ...ref, record: { ...ref.record, gatewayOrderId: order.id } as AnyPaymentRecord },
        order,
      };
    } catch (error) {
      await this.updatePaymentFields(ref, {
        status: PaymentStatus.FAILED,
        failureCode: 'ORDER_CREATION_FAILED',
        failureReason: safeFailure(error instanceof Error ? error.message : 'Order creation failed'),
      }).catch(() => undefined);
      throw this.toProviderAppError(error);
    }
  }

  private async findReusablePayment(
    target: ResolvedTarget,
    idempotencyKey?: string,
  ): Promise<PaymentRef | null> {
    if (idempotencyKey) {
      const byKey = await this.findPaymentByIdempotencyKey(target.targetType, target.targetId, idempotencyKey);
      if (byKey) {
        if (byKey.record.status === PaymentStatus.COMPLETED) return byKey;
        if (OPEN_PAYMENT_STATUSES.includes(byKey.record.status)) return byKey;
      }
    }

    return this.findRecentOpenPayment(target.targetType, target.targetId, target.amount);
  }

  private async createPaymentRecord(
    target: ResolvedTarget,
    idempotencyKey?: string,
  ): Promise<PaymentRef> {
    if (target.targetType === 'EVENT_BOOKING') {
      const record = await prisma.payment.create({
        data: {
          bookingId: target.targetId,
          amount: target.amount,
          currency: target.currency,
          method: PaymentMethod.RAZORPAY,
          status: PaymentStatus.PENDING,
          provider: 'razorpay',
          idempotencyKey: idempotencyKey ?? null,
        },
      });
      return { targetType: target.targetType, targetId: target.targetId, record };
    }

    if (target.targetType === 'TECHNICIAN_BOOKING') {
      const record = await prisma.technicianPayment.create({
        data: {
          bookingId: target.targetId,
          amount: target.amount,
          currency: target.currency,
          method: PaymentMethodType.ONLINE,
          status: PaymentStatus.PENDING,
          provider: 'razorpay',
          idempotencyKey: idempotencyKey ?? null,
        },
      });
      return { targetType: target.targetType, targetId: target.targetId, record };
    }

    const record = await prisma.eventRequestPayment.create({
      data: {
        requestId: target.targetId,
        amount: target.amount,
        currency: target.currency,
        method: PaymentMethod.RAZORPAY,
        status: PaymentStatus.PENDING,
        provider: 'razorpay',
        idempotencyKey: idempotencyKey ?? null,
      },
    });
    return { targetType: target.targetType, targetId: target.targetId, record };
  }

  private toOrderResponse(
    ref: PaymentRef,
    target: ResolvedTarget,
    order?: ProviderOrder,
  ): PaymentOrderResponse {
    const record = ref.record;
    const orderId = order?.id ?? record.gatewayOrderId ?? undefined;
    const alreadyPaid = record.status === PaymentStatus.COMPLETED;
    const requiresReview = record.status === PaymentStatus.REVIEW_REQUIRED;
    return {
      paymentId: record.id,
      targetType: ref.targetType,
      targetId: ref.targetId,
      amount: record.amount,
      amountPaise: toPaise(record.amount),
      currency: record.currency,
      status: record.status,
      alreadyPaid,
      requiresReview,
      checkout:
        orderId && !alreadyPaid && !requiresReview
          ? {
              provider: 'razorpay',
              keyId: config.payment.razorpay.keyId,
              orderId,
              amount: toPaise(record.amount),
              currency: record.currency,
              name: 'Heptome',
              description: target.description,
              prefill: target.prefill,
              notes: {
                targetType: target.targetType,
                targetId: target.targetId,
                paymentId: record.id,
              },
            }
          : undefined,
    };
  }

  // ─── Verify checkout response ──────────────────────────────────────────────

  async verifyPayment(userId: string, input: VerifyPaymentInput): Promise<NormalizedPayment> {
    const ref = await this.findPaymentByOrderId(input.razorpay_order_id);
    if (!ref) throw new NotFoundError('Payment not found');
    await this.assertPaymentAccess(ref, userId);

    const provider = this.getProvider();
    if (!provider.verifyPaymentSignature(
      input.razorpay_order_id,
      input.razorpay_payment_id,
      input.razorpay_signature,
    )) {
      throw new AppError(400, 'Payment signature verification failed.', 'PAYMENT_SIGNATURE_INVALID');
    }

    let providerPayment = await provider.fetchPayment(input.razorpay_payment_id);
    if (!this.providerMatches(ref, providerPayment)) {
      await this.markReviewRequired(ref, 'Provider payment does not match the internal order.');
      return this.normalize(await this.reloadPayment(ref));
    }

    if (providerPayment.status === 'authorized' && !providerPayment.captured) {
      try {
        await provider.capturePayment(
          providerPayment.id,
          toPaise(ref.record.amount),
          ref.record.currency,
        );
      } catch {
        // Capture can race with auto-capture. Re-fetch before deciding.
      }
      providerPayment = await provider.fetchPayment(providerPayment.id);
    }

    if (providerPayment.status === 'captured' || providerPayment.captured) {
      return this.finalizeCapturedPayment(ref, providerPayment);
    }

    if (providerPayment.status === 'failed') {
      await this.updatePaymentFields(ref, {
        status: PaymentStatus.FAILED,
        gatewayPaymentId: providerPayment.id,
        transactionId: providerPayment.id,
        gatewayResponse: safePayment(providerPayment),
        failureCode: safeFailureCode(providerPayment.error_code) ?? 'PAYMENT_FAILED',
        failureReason: safeFailure(providerPayment.error_description),
        verifiedAt: new Date(),
      });
      return this.normalize(await this.reloadPayment(ref));
    }

    await this.updatePaymentFields(ref, {
      status: PaymentStatus.AUTHORIZED,
      gatewayPaymentId: providerPayment.id,
      transactionId: providerPayment.id,
      gatewayResponse: safePayment(providerPayment),
      verifiedAt: new Date(),
    });
    return this.normalize(await this.reloadPayment(ref));
  }

  private providerMatches(ref: PaymentRef, payment: ProviderPayment): boolean {
    return (
      payment.order_id === ref.record.gatewayOrderId &&
      Number(payment.amount) === toPaise(ref.record.amount) &&
      payment.currency.toUpperCase() === ref.record.currency.toUpperCase()
    );
  }

  // ─── Status / reconciliation ───────────────────────────────────────────────

  async getOrderStatus(userId: string, orderId: string): Promise<NormalizedPayment> {
    const ref = await this.findPaymentByOrderId(orderId);
    if (!ref) throw new NotFoundError('Payment not found');
    await this.assertPaymentAccess(ref, userId);

    if (OPEN_PAYMENT_STATUSES.includes(ref.record.status)) {
      await this.reconcileOrder(ref, orderId).catch(() => undefined);
    }
    return this.normalize(await this.reloadPayment(ref));
  }

  private async reconcileOrder(ref: PaymentRef, orderId: string): Promise<void> {
    const provider = this.getProvider();
    const payments = await provider.fetchOrderPayments(orderId);
    const captured = payments.find(payment => payment.status === 'captured' || payment.captured);
    if (captured && this.providerMatches(ref, captured)) {
      await this.finalizeCapturedPayment(ref, captured);
      return;
    }

    const authorized = payments.find(payment => payment.status === 'authorized');
    if (authorized && this.providerMatches(ref, authorized)) {
      try {
        await provider.capturePayment(
          authorized.id,
          toPaise(ref.record.amount),
          ref.record.currency,
        );
        const refreshed = await provider.fetchPayment(authorized.id);
        if (refreshed.status === 'captured' || refreshed.captured) {
          await this.finalizeCapturedPayment(ref, refreshed);
          return;
        }
      } catch {
        // Leave the payment authorized; the webhook or a later poll can finish.
      }
      await this.updatePaymentFields(ref, {
        status: PaymentStatus.AUTHORIZED,
        gatewayPaymentId: authorized.id,
        transactionId: authorized.id,
        gatewayResponse: safePayment(authorized),
        verifiedAt: new Date(),
      });
      return;
    }

    const failed = payments.find(payment => payment.status === 'failed');
    if (failed && ref.record.status !== PaymentStatus.COMPLETED) {
      await this.updatePaymentFields(ref, {
        status: PaymentStatus.FAILED,
        gatewayPaymentId: failed.id,
        transactionId: failed.id,
        gatewayResponse: safePayment(failed),
        failureCode: safeFailureCode(failed.error_code) ?? 'PAYMENT_FAILED',
        failureReason: safeFailure(failed.error_description),
        verifiedAt: new Date(),
      });
    }
  }

  // ─── Finalization ──────────────────────────────────────────────────────────

  private async finalizeCapturedPayment(
    ref: PaymentRef,
    providerPayment: ProviderPayment,
  ): Promise<NormalizedPayment> {
    if (!this.providerMatches(ref, providerPayment)) {
      await this.markReviewRequired(ref, 'Captured provider payment does not match the internal order.');
      return this.normalize(await this.reloadPayment(ref));
    }

    await this.updatePaymentFields(ref, {
      status: PaymentStatus.COMPLETED,
      gatewayPaymentId: providerPayment.id,
      transactionId: providerPayment.id,
      gatewayResponse: safePayment(providerPayment),
      paidAt: ref.record.paidAt ?? new Date(),
      verifiedAt: new Date(),
      failureCode: null,
      failureReason: null,
    });

    const applied = await this.applyCapturedPayment(ref, providerPayment);
    if (!applied.applied) {
      await this.markReviewRequired(ref, applied.reason ?? 'The booking is no longer eligible for this payment.');
      return this.normalize(await this.reloadPayment(ref));
    }

    await this.updatePaymentFields(ref, { appliedAt: new Date() });
    return this.normalize(await this.reloadPayment(ref));
  }

  private async applyCapturedPayment(
    ref: PaymentRef,
    providerPayment: ProviderPayment,
  ): Promise<{ applied: boolean; reason?: string }> {
    const paymentId = ref.record.id;
    const amount = roundMoney(ref.record.amount);

    if (ref.targetType === 'EVENT_BOOKING') {
      const booking = await prisma.booking.findUnique({
        where: { id: ref.targetId },
        select: {
          id: true,
          status: true,
          totalAmount: true,
          balanceAmount: true,
          appliedPaymentIds: true,
          bookingNumber: true,
        },
      });
      if (!booking) return { applied: false, reason: 'The booking no longer exists.' };
      if (booking.appliedPaymentIds.includes(paymentId)) return { applied: true };
      if (booking.status !== BookingStatus.PAYMENT_PENDING) {
        return { applied: false, reason: 'The booking is no longer awaiting payment.' };
      }
      if (booking.balanceAmount + 0.01 < amount) {
        return { applied: false, reason: 'The payment amount exceeds the booking balance.' };
      }

      const updated = await prisma.booking.updateMany({
        where: {
          id: ref.targetId,
          status: BookingStatus.PAYMENT_PENDING,
          NOT: { appliedPaymentIds: { has: paymentId } },
          balanceAmount: { gte: amount - 0.01 },
        },
        data: {
          paidAmount: booking.totalAmount,
          balanceAmount: 0,
          appliedPaymentIds: { push: paymentId },
          paymentStatus: PaymentStatus.COMPLETED,
          status: BookingStatus.CONFIRMED,
          confirmedAt: new Date(),
        },
      });
      if (updated.count === 0) {
        const current = await prisma.booking.findUnique({
          where: { id: ref.targetId },
          select: { appliedPaymentIds: true },
        });
        return current?.appliedPaymentIds.includes(paymentId)
          ? { applied: true }
          : { applied: false, reason: 'The booking changed while the payment was being applied.' };
      }

      await prisma.bookingTimeline.create({
        data: {
          bookingId: ref.targetId,
          status: BookingStatus.CONFIRMED,
          title: 'Booking Confirmed',
          description: `Payment of ₹${amount.toLocaleString('en-IN')} received. Your booking is confirmed!`,
        },
      }).catch(() => undefined);
      return { applied: true };
    }

    if (ref.targetType === 'TECHNICIAN_BOOKING') {
      const booking = await prisma.technicianBooking.findUnique({
        where: { id: ref.targetId },
        select: {
          id: true,
          status: true,
          totalAmount: true,
          balanceAmount: true,
          appliedPaymentIds: true,
        },
      });
      if (!booking) return { applied: false, reason: 'The booking no longer exists.' };
      if (booking.appliedPaymentIds.includes(paymentId)) return { applied: true };
      if (booking.status !== TechnicianBookingStatus.SERVICE_COMPLETED) {
        return { applied: false, reason: 'The home-service job is no longer awaiting payment.' };
      }
      if (booking.balanceAmount + 0.01 < amount) {
        return { applied: false, reason: 'The payment amount exceeds the booking balance.' };
      }

      const updated = await prisma.technicianBooking.updateMany({
        where: {
          id: ref.targetId,
          status: TechnicianBookingStatus.SERVICE_COMPLETED,
          NOT: { appliedPaymentIds: { has: paymentId } },
          balanceAmount: { gte: amount - 0.01 },
        },
        data: {
          paidAmount: booking.totalAmount,
          balanceAmount: 0,
          appliedPaymentIds: { push: paymentId },
          paymentStatus: PaymentStatus.COMPLETED,
          status: TechnicianBookingStatus.PAYMENT_COMPLETED,
        },
      });
      if (updated.count === 0) {
        const current = await prisma.technicianBooking.findUnique({
          where: { id: ref.targetId },
          select: { appliedPaymentIds: true },
        });
        return current?.appliedPaymentIds.includes(paymentId)
          ? { applied: true }
          : { applied: false, reason: 'The booking changed while the payment was being applied.' };
      }

      await prisma.technicianBookingTimeline.create({
        data: {
          bookingId: ref.targetId,
          status: TechnicianBookingStatus.PAYMENT_COMPLETED,
          title: 'Payment Completed',
          description: `Online payment of ₹${amount.toLocaleString('en-IN')} received.`,
          metadata: { paymentId, provider: 'razorpay' } as Prisma.InputJsonValue,
        },
      }).catch(() => undefined);
      return { applied: true };
    }

    const request = await prisma.eventRequest.findUnique({
      where: { id: ref.targetId },
      include: {
        proposals: {
          where: { status: 'APPROVED' },
          orderBy: { version: 'desc' },
          take: 1,
        },
      },
    });
    if (!request) return { applied: false, reason: 'The event request no longer exists.' };
    if (request.appliedPaymentIds.includes(paymentId)) return { applied: true };
    if (request.status !== 'ADVANCE_PAYMENT_PENDING') {
      return { applied: false, reason: 'The event request is no longer awaiting payment.' };
    }
    const proposal = request.proposals[0];
    if (!proposal) return { applied: false, reason: 'The approved proposal is missing.' };
    const paid = roundMoney(request.advancePaidAmount ?? 0);
    if (paid + amount > proposal.totalAmount + 0.01) {
      return { applied: false, reason: 'The payment amount exceeds the approved proposal total.' };
    }

    const updated = await prisma.eventRequest.updateMany({
      where: {
        id: ref.targetId,
        status: 'ADVANCE_PAYMENT_PENDING',
        NOT: { appliedPaymentIds: { has: paymentId } },
        advancePaidAmount: { lte: proposal.totalAmount - amount + 0.01 },
      },
      data: {
        advancePaidAmount: proposal.totalAmount,
        appliedPaymentIds: { push: paymentId },
        paymentStatus: PaymentStatus.COMPLETED,
        // Deliberately not EVENT_CONFIRMED: an event manager must still
        // confirm availability and the event plan.
        status: 'ADVANCE_PAYMENT_RECEIVED',
      },
    });
    if (updated.count === 0) {
      const current = await prisma.eventRequest.findUnique({
        where: { id: ref.targetId },
        select: { appliedPaymentIds: true },
      });
      return current?.appliedPaymentIds.includes(paymentId)
        ? { applied: true }
        : { applied: false, reason: 'The event request changed while the payment was being applied.' };
    }
    return { applied: true };
  }

  private async markReviewRequired(ref: PaymentRef, reason: string): Promise<void> {
    await this.updatePaymentFields(ref, {
      status: PaymentStatus.REVIEW_REQUIRED,
      failureCode: 'PAYMENT_REVIEW_REQUIRED',
      failureReason: safeFailure(reason),
    });
  }

  // ─── Webhooks ──────────────────────────────────────────────────────────────

  async handleWebhook(rawBody: Buffer, signature: string): Promise<WebhookResult> {
    const provider = this.getProvider();
    if (!provider.verifyWebhookSignature(rawBody, signature)) {
      throw new AppError(400, 'Webhook signature verification failed.', 'WEBHOOK_SIGNATURE_INVALID');
    }

    let payload: RazorpayWebhookPayload;
    try {
      payload = JSON.parse(rawBody.toString('utf8')) as RazorpayWebhookPayload;
    } catch {
      throw new AppError(400, 'Invalid webhook payload.', 'INVALID_WEBHOOK_PAYLOAD');
    }

    const eventType = payload.event ?? 'unknown';
    const paymentEntity = payload.payload?.payment?.entity;
    const orderEntity = payload.payload?.order?.entity;
    const refundEntity = payload.payload?.refund?.entity;
    const orderId = paymentEntity?.order_id ?? orderEntity?.id;
    const providerPaymentId = paymentEntity?.id ?? refundEntity?.payment_id;

    // Hash the signed body rather than trusting the unsigned event-id header.
    // Retries of the same event produce the same hash; a replayed body cannot
    // be given a new identity by changing a header.
    const eventId = createHash('sha256').update(rawBody).digest('hex');
    const claimed = await this.claimWebhookEvent(eventId, eventType, orderId, providerPaymentId);
    if (claimed.duplicate) {
      return { duplicate: true, ignored: false, eventType };
    }

    try {
      if (!orderId) {
        await this.completeWebhookEvent(eventId, 'IGNORED');
        return { duplicate: false, ignored: true, eventType };
      }

      const ref = await this.findPaymentByOrderId(orderId);
      if (!ref) {
        await this.completeWebhookEvent(eventId, 'IGNORED');
        return { duplicate: false, ignored: true, eventType };
      }

      if (eventType === 'payment.failed') {
        if (ref.record.status !== PaymentStatus.COMPLETED) {
          await this.updatePaymentFields(ref, {
            status: PaymentStatus.FAILED,
            gatewayPaymentId: providerPaymentId ?? ref.record.gatewayPaymentId,
            transactionId: providerPaymentId ?? ref.record.transactionId,
            gatewayResponse: paymentEntity ? safePayment(paymentEntity) : undefined,
            failureCode: safeFailureCode(paymentEntity?.error_code) ?? 'PAYMENT_FAILED',
            failureReason: safeFailure(paymentEntity?.error_description),
            verifiedAt: new Date(),
          });
        }
      } else if (eventType === 'payment.authorized') {
        if (ref.record.status !== PaymentStatus.COMPLETED) {
          await this.updatePaymentFields(ref, {
            status: PaymentStatus.AUTHORIZED,
            gatewayPaymentId: providerPaymentId ?? ref.record.gatewayPaymentId,
            transactionId: providerPaymentId ?? ref.record.transactionId,
            gatewayResponse: paymentEntity ? safePayment(paymentEntity) : undefined,
            verifiedAt: new Date(),
          });
        }
      } else if (eventType === 'payment.captured' || eventType === 'order.paid') {
        let captured: ProviderPayment | undefined;
        if (providerPaymentId) {
          captured = await provider.fetchPayment(providerPaymentId);
        } else {
          const payments = await provider.fetchOrderPayments(orderId);
          captured = payments.find(payment => payment.status === 'captured' || payment.captured);
        }
        if (captured && this.providerMatches(ref, captured)) {
          await this.finalizeCapturedPayment(ref, captured);
        } else {
          await this.markReviewRequired(ref, 'Webhook payment does not match the internal order.');
        }
      } else if (eventType === 'refund.processed' || eventType === 'refund.failed') {
        await this.handleRefundWebhook(ref, eventType, refundEntity, providerPaymentId);
      } else {
        await this.completeWebhookEvent(eventId, 'IGNORED');
        return { duplicate: false, ignored: true, eventType };
      }

      await this.completeWebhookEvent(eventId, 'PROCESSED');
      return {
        duplicate: false,
        ignored: false,
        eventType,
        paymentId: ref.record.id,
      };
    } catch (error) {
      await this.completeWebhookEvent(
        eventId,
        'FAILED',
        safeFailure(error instanceof Error ? error.message : 'Webhook processing failed'),
      ).catch(() => undefined);
      throw error;
    }
  }

  private async claimWebhookEvent(
    eventId: string,
    eventType: string,
    orderId?: string,
    paymentId?: string,
  ): Promise<{ duplicate: boolean }> {
    try {
      await prisma.paymentWebhookEvent.create({
        data: {
          eventId,
          eventType,
          providerOrderId: orderId ?? null,
          providerPaymentId: paymentId ?? null,
          status: 'RECEIVED',
        },
      });
      return { duplicate: false };
    } catch (error) {
      // Duck-type the unique-constraint code rather than relying on `instanceof`:
      // the backend and a test/runtime may load different copies of the Prisma
      // client, but the provider error code is stable.
      if ((error as { code?: string }).code !== 'P2002') {
        throw error;
      }
      const existing = await prisma.paymentWebhookEvent.findUnique({ where: { eventId } });
      if (!existing) return { duplicate: false };
      if (existing.status === 'FAILED') {
        await prisma.paymentWebhookEvent.update({
          where: { eventId },
          data: { status: 'RECEIVED', error: null },
        });
        return { duplicate: false };
      }
      return { duplicate: true };
    }
  }

  private async completeWebhookEvent(
    eventId: string,
    status: 'PROCESSED' | 'IGNORED' | 'FAILED',
    error?: string | null,
  ): Promise<void> {
    await prisma.paymentWebhookEvent.update({
      where: { eventId },
      data: {
        status,
        error: error ?? null,
        processedAt: status === 'PROCESSED' || status === 'IGNORED' ? new Date() : null,
      },
    });
  }

  private async handleRefundWebhook(
    ref: PaymentRef,
    eventType: string,
    refundEntity: NonNullable<NonNullable<RazorpayWebhookPayload['payload']>['refund']>['entity'],
    providerPaymentId?: string,
  ): Promise<void> {
    if (!refundEntity?.id) return;
    const refundAmount = roundMoney((refundEntity.amount ?? 0) / 100);
    if (refundAmount <= 0) return;

    if (eventType === 'refund.failed') {
      await this.updatePaymentFields(ref, {
        refundStatus: 'failed',
        refundId: refundEntity.id,
        status:
          ref.record.status === PaymentStatus.REFUND_PENDING
            ? PaymentStatus.COMPLETED
            : ref.record.status,
      });
      return;
    }

    if (ref.record.refundId === refundEntity.id && ref.record.refundedAt) {
      return;
    }

    const alreadyRefunded = roundMoney(ref.record.refundAmount ?? 0);
    const totalRefunded = roundMoney(alreadyRefunded + refundAmount);
    const newStatus = paymentStatusForRefund(totalRefunded, ref.record.amount);
    await this.updatePaymentFields(ref, {
      status: newStatus,
      refundId: refundEntity.id,
      refundStatus: refundEntity.status ?? 'processed',
      refundAmount: totalRefunded,
      refundedAt: new Date(),
      refundRequestedAt: ref.record.refundRequestedAt ?? new Date(),
      gatewayPaymentId: providerPaymentId ?? ref.record.gatewayPaymentId,
    });
    await this.applyRefundToTarget(ref, refundAmount, newStatus === PaymentStatus.REFUNDED);
  }

  // ─── Refunds (admin) ───────────────────────────────────────────────────────

  async createRefund(adminId: string, input: AdminRefundInput): Promise<NormalizedPayment> {
    const provider = this.getProvider();
    const ref = await this.findPaymentById(input.targetType, input.paymentId);
    if (!ref) throw new NotFoundError('Payment not found');
    const record = ref.record;

    const refundableStatuses: PaymentStatus[] = [
      PaymentStatus.COMPLETED,
      PaymentStatus.PARTIALLY_REFUNDED,
    ];
    if (!refundableStatuses.includes(record.status)) {
      throw new AppError(400, 'Only captured payments can be refunded.', 'REFUND_NOT_AVAILABLE');
    }
    if (!record.gatewayPaymentId) {
      throw new AppError(400, 'This payment has no captured Razorpay payment ID.', 'REFUND_NOT_AVAILABLE');
    }
    if (record.refundStatus === 'pending') {
      throw new ConflictError('A refund is already pending for this payment.');
    }

    const remaining = roundMoney(record.amount - (record.refundAmount ?? 0));
    const amount = roundMoney(input.amount ?? remaining);
    if (amount <= 0 || amount > remaining + 0.01) {
      throw new AppError(400, 'Refund amount exceeds the refundable balance.', 'REFUND_AMOUNT_INVALID');
    }

    let refund: ProviderRefund;
    try {
      refund = await provider.createRefund(
        record.gatewayPaymentId,
        toPaise(amount),
        {
          paymentId: record.id,
          targetType: ref.targetType,
          reason: (input.reason ?? 'Admin refund').slice(0, 200),
        },
      );
    } catch (error) {
      throw this.toProviderAppError(error);
    }

    if (refund.status === 'failed') {
      await this.updatePaymentFields(ref, {
        refundId: refund.id,
        refundStatus: 'failed',
        refundRequestedAt: new Date(),
      });
      throw new AppError(502, 'Razorpay rejected the refund.', 'REFUND_FAILED');
    }

    if (refund.status === 'pending') {
      await this.updatePaymentFields(ref, {
        status: PaymentStatus.REFUND_PENDING,
        refundId: refund.id,
        refundStatus: 'pending',
        refundRequestedAt: new Date(),
      });
    } else {
      const totalRefunded = roundMoney((record.refundAmount ?? 0) + amount);
      const newStatus = paymentStatusForRefund(totalRefunded, record.amount);
      await this.updatePaymentFields(ref, {
        status: newStatus,
        refundId: refund.id,
        refundStatus: refund.status ?? 'processed',
        refundAmount: totalRefunded,
        refundedAt: new Date(),
        refundRequestedAt: new Date(),
      });
      await this.applyRefundToTarget(ref, amount, newStatus === PaymentStatus.REFUNDED);
    }

    await prisma.auditLog.create({
      data: {
        adminId,
        action: 'PAYMENT_REFUND',
        entity: 'Payment',
        entityId: record.id,
        newData: {
          targetType: ref.targetType,
          targetId: ref.targetId,
          amount,
          refundId: refund.id,
          status: refund.status,
        } as Prisma.InputJsonValue,
      },
    }).catch(() => undefined);

    return this.normalize(await this.reloadPayment(ref));
  }

  private async applyRefundToTarget(
    ref: PaymentRef,
    amount: number,
    fullRefund: boolean,
  ): Promise<void> {
    if (ref.targetType === 'EVENT_BOOKING') {
      await prisma.booking.updateMany({
        where: { id: ref.targetId, paidAmount: { gte: amount - 0.01 } },
        data: {
          paidAmount: { decrement: amount },
          balanceAmount: { increment: amount },
          paymentStatus: fullRefund ? PaymentStatus.REFUNDED : PaymentStatus.PARTIALLY_REFUNDED,
        },
      });
      return;
    }
    if (ref.targetType === 'TECHNICIAN_BOOKING') {
      await prisma.technicianBooking.updateMany({
        where: { id: ref.targetId, paidAmount: { gte: amount - 0.01 } },
        data: {
          paidAmount: { decrement: amount },
          balanceAmount: { increment: amount },
          paymentStatus: fullRefund ? PaymentStatus.REFUNDED : PaymentStatus.PARTIALLY_REFUNDED,
        },
      });
      return;
    }
    await prisma.eventRequest.updateMany({
      where: { id: ref.targetId, advancePaidAmount: { gte: amount - 0.01 } },
      data: {
        advancePaidAmount: { decrement: amount },
        paymentStatus: fullRefund ? PaymentStatus.REFUNDED : PaymentStatus.PARTIALLY_REFUNDED,
      },
    });
  }

  // ─── Lookup / update helpers ───────────────────────────────────────────────

  private async assertPaymentAccess(ref: PaymentRef, userId: string): Promise<void> {
    if (ref.targetType === 'EVENT_BOOKING') {
      const booking = await prisma.booking.findUnique({
        where: { id: ref.targetId },
        select: { userId: true },
      });
      if (!booking) throw new NotFoundError('Booking not found');
      if (booking.userId !== userId) throw new AuthorizationError('Access denied');
      return;
    }
    if (ref.targetType === 'TECHNICIAN_BOOKING') {
      const booking = await prisma.technicianBooking.findUnique({
        where: { id: ref.targetId },
        select: { customerId: true },
      });
      if (!booking) throw new NotFoundError('Booking not found');
      if (booking.customerId !== userId) throw new AuthorizationError('Access denied');
      return;
    }
    const request = await prisma.eventRequest.findUnique({
      where: { id: ref.targetId },
      select: { customerId: true },
    });
    if (!request) throw new NotFoundError('Event request not found');
    if (request.customerId !== userId) throw new AuthorizationError('Access denied');
  }

  private async findPaymentByOrderId(orderId: string): Promise<PaymentRef | null> {
    const [eventPayment, technicianPayment, requestPayment] = await Promise.all([
      prisma.payment.findFirst({ where: { gatewayOrderId: orderId } }),
      prisma.technicianPayment.findFirst({ where: { gatewayOrderId: orderId } }),
      prisma.eventRequestPayment.findFirst({ where: { gatewayOrderId: orderId } }),
    ]);
    if (eventPayment) {
      return { targetType: 'EVENT_BOOKING', targetId: eventPayment.bookingId, record: eventPayment };
    }
    if (technicianPayment) {
      return { targetType: 'TECHNICIAN_BOOKING', targetId: technicianPayment.bookingId, record: technicianPayment };
    }
    if (requestPayment) {
      return { targetType: 'EVENT_REQUEST', targetId: requestPayment.requestId, record: requestPayment };
    }
    return null;
  }

  private async findPaymentById(targetType: PaymentTargetType, paymentId: string): Promise<PaymentRef | null> {
    if (targetType === 'EVENT_BOOKING') {
      const record = await prisma.payment.findUnique({ where: { id: paymentId } });
      return record ? { targetType, targetId: record.bookingId, record } : null;
    }
    if (targetType === 'TECHNICIAN_BOOKING') {
      const record = await prisma.technicianPayment.findUnique({ where: { id: paymentId } });
      return record ? { targetType, targetId: record.bookingId, record } : null;
    }
    const record = await prisma.eventRequestPayment.findUnique({ where: { id: paymentId } });
    return record ? { targetType, targetId: record.requestId, record } : null;
  }

  private async findPaymentByIdempotencyKey(
    targetType: PaymentTargetType,
    targetId: string,
    idempotencyKey: string,
  ): Promise<PaymentRef | null> {
    if (targetType === 'EVENT_BOOKING') {
      const record = await prisma.payment.findFirst({
        where: { bookingId: targetId, idempotencyKey },
        orderBy: { createdAt: 'desc' },
      });
      return record ? { targetType, targetId, record } : null;
    }
    if (targetType === 'TECHNICIAN_BOOKING') {
      const record = await prisma.technicianPayment.findFirst({
        where: { bookingId: targetId, idempotencyKey },
        orderBy: { createdAt: 'desc' },
      });
      return record ? { targetType, targetId, record } : null;
    }
    const record = await prisma.eventRequestPayment.findFirst({
      where: { requestId: targetId, idempotencyKey },
      orderBy: { createdAt: 'desc' },
    });
    return record ? { targetType, targetId, record } : null;
  }

  private async findRecentOpenPayment(
    targetType: PaymentTargetType,
    targetId: string,
    amount: number,
  ): Promise<PaymentRef | null> {
    const since = new Date(Date.now() - IDEMPOTENCY_WINDOW_MS);
    const where = {
      amount,
      status: { in: OPEN_PAYMENT_STATUSES },
      createdAt: { gte: since },
    };
    if (targetType === 'EVENT_BOOKING') {
      const record = await prisma.payment.findFirst({
        where: { ...where, bookingId: targetId },
        orderBy: { createdAt: 'desc' },
      });
      return record ? { targetType, targetId, record } : null;
    }
    if (targetType === 'TECHNICIAN_BOOKING') {
      const record = await prisma.technicianPayment.findFirst({
        where: { ...where, bookingId: targetId },
        orderBy: { createdAt: 'desc' },
      });
      return record ? { targetType, targetId, record } : null;
    }
    const record = await prisma.eventRequestPayment.findFirst({
      where: { ...where, requestId: targetId },
      orderBy: { createdAt: 'desc' },
    });
    return record ? { targetType, targetId, record } : null;
  }

  private async reloadPayment(ref: PaymentRef): Promise<PaymentRef> {
    const fresh = await this.findPaymentById(ref.targetType, ref.record.id);
    return fresh ?? ref;
  }

  private async updatePaymentFields(ref: PaymentRef, data: PaymentUpdateData): Promise<void> {
    const payload = data as Prisma.PaymentUpdateManyMutationInput;
    if (ref.targetType === 'EVENT_BOOKING') {
      await prisma.payment.updateMany({ where: { id: ref.record.id }, data: payload });
      return;
    }
    if (ref.targetType === 'TECHNICIAN_BOOKING') {
      await prisma.technicianPayment.updateMany({
        where: { id: ref.record.id },
        data: payload as Prisma.TechnicianPaymentUpdateManyMutationInput,
      });
      return;
    }
    await prisma.eventRequestPayment.updateMany({
      where: { id: ref.record.id },
      data: payload as Prisma.EventRequestPaymentUpdateManyMutationInput,
    });
  }

  private normalize(ref: PaymentRef): NormalizedPayment {
    const record = ref.record;
    return {
      id: record.id,
      targetType: ref.targetType,
      targetId: ref.targetId,
      amount: record.amount,
      amountPaise: Math.round(record.amount * 100),
      currency: record.currency,
      status: record.status,
      provider: record.provider,
      providerOrderId: record.gatewayOrderId,
      providerPaymentId: record.gatewayPaymentId,
      paidAt: record.paidAt?.toISOString() ?? null,
      verifiedAt: record.verifiedAt?.toISOString() ?? null,
      failureCode: record.failureCode,
      failureReason: record.failureReason,
      refundAmount: record.refundAmount,
      refundStatus: record.refundStatus,
      refundedAt: record.refundedAt?.toISOString() ?? null,
      checkoutAllowed:
        OPEN_PAYMENT_STATUSES.includes(record.status) && Boolean(record.gatewayOrderId),
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    };
  }
}

export const paymentService = new PaymentService();
