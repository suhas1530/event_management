'use client';

export interface RazorpaySuccessResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface RazorpayCheckoutOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill?: { name?: string; email?: string; contact?: string };
  notes?: Record<string, string>;
  theme?: { color?: string };
  handler: (response: RazorpaySuccessResponse) => void;
  modal?: { ondismiss?: () => void };
}

export interface RazorpayInstance {
  open(): void;
  close(): void;
  on(event: string, handler: () => void): void;
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayCheckoutOptions) => RazorpayInstance;
  }
}

const SCRIPT_ID = 'razorpay-checkout-script';
const SCRIPT_SRC = 'https://checkout.razorpay.com/v1/checkout.js';
const SCRIPT_TIMEOUT_MS = 15_000;

/**
 * Loads Razorpay's hosted Standard Checkout script. The public key id is passed
 * at checkout time by the backend; no secret ever reaches this module.
 */
export function loadRazorpayScript(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Razorpay Checkout can only load in a browser.'));
  }
  if (window.Razorpay) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    const script = existing ?? document.createElement('script');
    let settled = false;

    const finish = (error?: Error) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      script.onload = null;
      script.onerror = null;
      if (error) reject(error);
      else resolve();
    };

    const timer = window.setTimeout(
      () => finish(new Error('Razorpay Checkout took too long to load. Check your connection and try again.')),
      SCRIPT_TIMEOUT_MS,
    );

    script.onload = () => {
      if (window.Razorpay) finish();
      else finish(new Error('Razorpay Checkout loaded but did not initialise.'));
    };
    script.onerror = () => finish(new Error('Could not load Razorpay Checkout. Check your connection and try again.'));

    if (!existing) {
      script.id = SCRIPT_ID;
      script.src = SCRIPT_SRC;
      script.async = true;
      document.body.appendChild(script);
    }
  });
}

export function openRazorpayCheckout(options: RazorpayCheckoutOptions): RazorpayInstance {
  if (typeof window === 'undefined' || !window.Razorpay) {
    throw new Error('Razorpay Checkout is not available.');
  }
  const instance = new window.Razorpay(options);
  instance.open();
  return instance;
}
