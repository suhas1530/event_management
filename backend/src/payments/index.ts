import { config } from '../config';
import { PaymentConfigurationError, PaymentProvider } from './provider';
import { razorpayProvider } from './razorpay';

export * from './provider';

/**
 * Single place that maps configured provider name -> implementation.
 * A future Stripe adapter is added here without touching booking services.
 */
export function getPaymentProvider(): PaymentProvider {
  if (config.payment.provider === 'disabled') {
    throw new PaymentConfigurationError('Online payments are disabled.');
  }
  if (config.payment.provider === 'razorpay') {
    if (!razorpayProvider.isConfigured()) throw new PaymentConfigurationError();
    return razorpayProvider;
  }
  throw new PaymentConfigurationError(`Unsupported payment provider: ${config.payment.provider}`);
}

export function isOnlinePaymentConfigured(): boolean {
  try {
    return getPaymentProvider().isConfigured();
  } catch {
    return false;
  }
}
