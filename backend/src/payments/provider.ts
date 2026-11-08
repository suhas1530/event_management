/**
 * Provider boundary for online payments.
 *
 * Booking and inquiry services never talk to a gateway SDK directly. Adding a
 * second provider later means implementing this interface and returning it from
 * `getPaymentProvider`; the booking rules and API contract stay unchanged.
 */

export interface ProviderOrder {
  id: string;
  amount: number;
  currency: string;
  receipt?: string | null;
  status: string;
  notes?: Record<string, string | number>;
}

export interface ProviderPayment {
  id: string;
  order_id: string;
  amount: number;
  currency: string;
  status: 'created' | 'authorized' | 'captured' | 'refunded' | 'failed' | string;
  captured?: boolean;
  method?: string | null;
  created_at?: number;
  error_code?: string | null;
  error_description?: string | null;
}

export interface ProviderRefund {
  id: string;
  payment_id: string;
  amount: number;
  currency: string;
  status: string;
  created_at?: number;
}

export interface CreateProviderOrderInput {
  amountPaise: number;
  currency: string;
  receipt: string;
  notes: Record<string, string>;
}

export interface PaymentProvider {
  readonly name: string;
  isConfigured(): boolean;
  createOrder(input: CreateProviderOrderInput): Promise<ProviderOrder>;
  fetchPayment(paymentId: string): Promise<ProviderPayment>;
  fetchOrderPayments(orderId: string): Promise<ProviderPayment[]>;
  capturePayment(paymentId: string, amountPaise: number, currency: string): Promise<ProviderPayment>;
  createRefund(paymentId: string, amountPaise: number, notes: Record<string, string>): Promise<ProviderRefund>;
  verifyPaymentSignature(orderId: string, paymentId: string, signature: string): boolean;
  verifyWebhookSignature(rawBody: Buffer | string, signature: string): boolean;
}

export class PaymentConfigurationError extends Error {
  readonly code = 'PAYMENT_NOT_CONFIGURED';

  constructor(message = 'Online payments are not configured on this server.') {
    super(message);
    this.name = 'PaymentConfigurationError';
  }
}

export class PaymentProviderError extends Error {
  constructor(
    message: string,
    public readonly providerCode?: string,
    public readonly statusCode?: number,
  ) {
    super(message);
    this.name = 'PaymentProviderError';
  }
}
