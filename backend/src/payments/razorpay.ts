import { createHmac, timingSafeEqual } from 'node:crypto';
import Razorpay from 'razorpay';
import { config } from '../config';
import {
  CreateProviderOrderInput,
  PaymentConfigurationError,
  PaymentProvider,
  PaymentProviderError,
  ProviderOrder,
  ProviderPayment,
  ProviderRefund,
} from './provider';

function safeEqualHex(expectedHex: string, actualHex: string): boolean {
  if (!/^[a-f0-9]{64}$/i.test(actualHex)) return false;
  const expected = Buffer.from(expectedHex, 'hex');
  const actual = Buffer.from(actualHex, 'hex');
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

function hmacHex(secret: string, message: string | Buffer): string {
  return createHmac('sha256', secret).update(message).digest('hex');
}

/**
 * Official Razorpay server SDK implementation.
 *
 * The secret and webhook secret are read only from server-side config. The key
 * id is public checkout configuration and is returned to the browser by the
 * create-order endpoint; it is never read from a NEXT_PUBLIC_* variable.
 */
export class RazorpayProvider implements PaymentProvider {
  readonly name = 'razorpay';
  private client?: Razorpay;

  isConfigured(): boolean {
    return Boolean(config.payment.razorpay.keyId && config.payment.razorpay.keySecret);
  }

  private getClient(): Razorpay {
    if (!this.isConfigured()) throw new PaymentConfigurationError();
    if (!this.client) {
      this.client = new Razorpay({
        key_id: config.payment.razorpay.keyId,
        key_secret: config.payment.razorpay.keySecret,
      });
    }
    return this.client;
  }

  private providerError(error: unknown): PaymentProviderError {
    const candidate = error as {
      statusCode?: number;
      error?: { code?: string; description?: string };
      message?: string;
    };
    // Never surface the raw SDK error: it can contain request context. Keep the
    // provider code for support/debugging and a stable user-facing message.
    return new PaymentProviderError(
      'Razorpay could not process this payment request. Please try again.',
      candidate?.error?.code,
      candidate?.statusCode,
    );
  }

  async createOrder(input: CreateProviderOrderInput): Promise<ProviderOrder> {
    try {
      const order = await this.getClient().orders.create({
        amount: input.amountPaise,
        currency: input.currency,
        receipt: input.receipt,
        notes: input.notes,
      });
      return {
        id: order.id,
        amount: Number(order.amount),
        currency: order.currency,
        receipt: order.receipt,
        status: order.status,
        notes: order.notes as Record<string, string | number> | undefined,
      };
    } catch (error) {
      if (error instanceof PaymentConfigurationError) throw error;
      throw this.providerError(error);
    }
  }

  async fetchPayment(paymentId: string): Promise<ProviderPayment> {
    try {
      const payment = await this.getClient().payments.fetch(paymentId);
      return {
        id: payment.id,
        order_id: payment.order_id,
        amount: Number(payment.amount),
        currency: payment.currency,
        status: payment.status,
        captured: payment.captured,
        method: payment.method,
        created_at: payment.created_at,
        error_code: payment.error_code,
        error_description: payment.error_description,
      };
    } catch (error) {
      if (error instanceof PaymentConfigurationError) throw error;
      throw this.providerError(error);
    }
  }

  async fetchOrderPayments(orderId: string): Promise<ProviderPayment[]> {
    try {
      const result = await this.getClient().orders.fetchPayments(orderId);
      return result.items.map(payment => ({
        id: payment.id,
        order_id: payment.order_id,
        amount: Number(payment.amount),
        currency: payment.currency,
        status: payment.status,
        captured: payment.captured,
        method: payment.method,
        created_at: payment.created_at,
        error_code: payment.error_code,
        error_description: payment.error_description,
      }));
    } catch (error) {
      if (error instanceof PaymentConfigurationError) throw error;
      throw this.providerError(error);
    }
  }

  async capturePayment(paymentId: string, amountPaise: number, currency: string): Promise<ProviderPayment> {
    try {
      const payment = await this.getClient().payments.capture(paymentId, amountPaise, currency);
      return {
        id: payment.id,
        order_id: payment.order_id,
        amount: Number(payment.amount),
        currency: payment.currency,
        status: payment.status,
        captured: payment.captured,
        method: payment.method,
        created_at: payment.created_at,
        error_code: payment.error_code,
        error_description: payment.error_description,
      };
    } catch (error) {
      if (error instanceof PaymentConfigurationError) throw error;
      throw this.providerError(error);
    }
  }

  async createRefund(paymentId: string, amountPaise: number, notes: Record<string, string>): Promise<ProviderRefund> {
    try {
      const refund = await this.getClient().payments.refund(paymentId, {
        amount: amountPaise,
        notes,
      });
      return {
        id: refund.id,
        payment_id: refund.payment_id,
        amount: Number(refund.amount),
        currency: refund.currency,
        status: refund.status,
        created_at: refund.created_at,
      };
    } catch (error) {
      if (error instanceof PaymentConfigurationError) throw error;
      throw this.providerError(error);
    }
  }

  verifyPaymentSignature(orderId: string, paymentId: string, signature: string): boolean {
    const secret = config.payment.razorpay.keySecret;
    if (!secret) throw new PaymentConfigurationError();
    return safeEqualHex(hmacHex(secret, `${orderId}|${paymentId}`), signature);
  }

  verifyWebhookSignature(rawBody: Buffer | string, signature: string): boolean {
    const secret = config.payment.razorpay.webhookSecret;
    if (!secret) {
      throw new PaymentConfigurationError('Razorpay webhook verification is not configured.');
    }
    return safeEqualHex(hmacHex(secret, rawBody), signature);
  }
}

export const razorpayProvider = new RazorpayProvider();
