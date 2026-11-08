'use client';

import { useEffect, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, CreditCard, Loader2, RefreshCw, ShieldCheck } from 'lucide-react';
import { paymentsApi, type PaymentStatusResponse, type PaymentTargetType } from '@/lib/api';
import { loadRazorpayScript, openRazorpayCheckout } from '@/lib/razorpay-checkout';

type UiState =
  | 'idle'
  | 'creating'
  | 'checkout'
  | 'verifying'
  | 'pending'
  | 'success'
  | 'failed'
  | 'cancelled'
  | 'review';

interface PaymentButtonProps {
  targetType: PaymentTargetType;
  targetId: string;
  amount: number;
  label?: string;
  className?: string;
  disabled?: boolean;
  onSuccess?: (payment: PaymentStatusResponse | null) => void;
  onStatusChange?: (state: UiState) => void;
}

function formatINR(value: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(value);
}

function newIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `pay-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return 'Something went wrong while starting the payment. Please try again.';
}

function isPending(status: string): boolean {
  return ['PENDING', 'PROCESSING', 'AUTHORIZED'].includes(status);
}

export default function PaymentButton({
  targetType,
  targetId,
  amount,
  label,
  className = '',
  disabled = false,
  onSuccess,
  onStatusChange,
}: PaymentButtonProps) {
  const [state, setState] = useState<UiState>('idle');
  const [message, setMessage] = useState('');
  const [orderId, setOrderId] = useState<string | null>(null);
  const mountedRef = useRef(true);
  const busyRef = useRef(false);
  const idempotencyKeyRef = useRef<string | null>(null);
  const pollRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      pollRef.current = false;
    };
  }, []);

  useEffect(() => {
    onStatusChange?.(state);
  }, [onStatusChange, state]);

  const update = (next: UiState, nextMessage = '') => {
    if (!mountedRef.current) return;
    setState(next);
    setMessage(nextMessage);
  };

  const finishSuccess = (payment: PaymentStatusResponse | null) => {
    busyRef.current = false;
    pollRef.current = false;
    idempotencyKeyRef.current = null;
    update('success', 'Payment verified. Your booking has been updated.');
    onSuccess?.(payment);
  };

  const handleStatus = async (status: PaymentStatusResponse, currentOrderId: string) => {
    setOrderId(currentOrderId);
    if (status.status === 'COMPLETED') {
      finishSuccess(status);
      return;
    }
    if (status.status === 'REVIEW_REQUIRED') {
      busyRef.current = false;
      pollRef.current = false;
      idempotencyKeyRef.current = null;
      update(
        'review',
        status.failureReason ||
          'Razorpay received a payment that needs a quick manual review. Our team will contact you.',
      );
      return;
    }
    if (status.status === 'FAILED' || status.status === 'CANCELLED') {
      busyRef.current = false;
      pollRef.current = false;
      idempotencyKeyRef.current = null;
      update(
        'failed',
        status.failureReason || 'The payment did not complete. You can try again with a different method.',
      );
      return;
    }
    if (isPending(status.status)) {
      busyRef.current = false;
      update('pending', 'Payment received. Confirming with Razorpay — this can take a few seconds.');
      void pollStatus(currentOrderId);
      return;
    }
    busyRef.current = false;
    update('failed', 'The payment could not be confirmed. Please check the status or try again.');
  };

  const pollStatus = async (currentOrderId: string) => {
    if (pollRef.current) return;
    pollRef.current = true;
    try {
      for (let attempt = 0; attempt < 8; attempt += 1) {
        await new Promise(resolve => window.setTimeout(resolve, 2000));
        if (!mountedRef.current || !pollRef.current) return;
        try {
          const status = await paymentsApi.status(currentOrderId);
          if (status.status === 'COMPLETED') {
            finishSuccess(status);
            return;
          }
          if (status.status === 'FAILED' || status.status === 'CANCELLED' || status.status === 'REVIEW_REQUIRED') {
            await handleStatus(status, currentOrderId);
            return;
          }
        } catch {
          // Keep polling; a transient status failure should not lose a payment.
        }
      }
      if (mountedRef.current) {
        busyRef.current = false;
        update('pending', 'Payment is still being confirmed. Use “Check status” in a moment.');
      }
    } finally {
      pollRef.current = false;
    }
  };

  const checkStatus = async (currentOrderId: string) => {
    if (busyRef.current) return;
    busyRef.current = true;
    update('verifying', 'Checking the payment with Razorpay…');
    try {
      const status = await paymentsApi.status(currentOrderId);
      await handleStatus(status, currentOrderId);
    } catch (error) {
      busyRef.current = false;
      update('pending', `We could not check the status yet. ${errorMessage(error)}`);
    }
  };

  const verifyResponse = async (
    currentOrderId: string,
    response: {
      razorpay_payment_id: string;
      razorpay_order_id: string;
      razorpay_signature: string;
    },
  ) => {
    update('verifying', 'Verifying the payment signature with Heptome…');
    try {
      const status = await paymentsApi.verify(response);
      await handleStatus(status, currentOrderId);
    } catch (error) {
      busyRef.current = false;
      idempotencyKeyRef.current = null;
      update('failed', errorMessage(error));
    }
  };

  const handleDismiss = async (currentOrderId: string) => {
    update('verifying', 'Checking whether the payment was completed…');
    try {
      const status = await paymentsApi.status(currentOrderId);
      if (status.status === 'COMPLETED') {
        finishSuccess(status);
        return;
      }
      if (status.status === 'REVIEW_REQUIRED' || isPending(status.status)) {
        await handleStatus(status, currentOrderId);
        return;
      }
    } catch {
      // Fall through to the cancellation state below.
    }
    busyRef.current = false;
    idempotencyKeyRef.current = null;
    update('cancelled', 'Payment was cancelled. No money was taken. You can try again whenever you are ready.');
  };

  const handlePay = async () => {
    if (busyRef.current || state === 'success' || state === 'review') return;
    if (state === 'pending' && orderId) {
      await checkStatus(orderId);
      return;
    }

    busyRef.current = true;
    const idempotencyKey = idempotencyKeyRef.current ?? newIdempotencyKey();
    idempotencyKeyRef.current = idempotencyKey;
    update('creating', 'Creating a secure Razorpay order…');

    try {
      const order = await paymentsApi.createOrder({ targetType, targetId, idempotencyKey });
      if (!mountedRef.current) return;

      if (order.alreadyPaid) {
        finishSuccess(null);
        return;
      }
      if (order.requiresReview) {
        busyRef.current = false;
        idempotencyKeyRef.current = null;
        update('review', 'A payment for this booking needs manual review. Our team will contact you.');
        return;
      }
      if (!order.checkout) {
        throw new Error('Online checkout is not available for this booking right now.');
      }

      setOrderId(order.checkout.orderId);
      await loadRazorpayScript();
      if (!mountedRef.current) return;

      update('checkout', 'Complete the payment in the Razorpay window.');
      openRazorpayCheckout({
        key: order.checkout.keyId,
        amount: order.checkout.amount,
        currency: order.checkout.currency,
        name: order.checkout.name,
        description: order.checkout.description,
        order_id: order.checkout.orderId,
        prefill: order.checkout.prefill,
        notes: order.checkout.notes,
        theme: { color: '#22382d' },
        handler: response => {
          void verifyResponse(order.checkout!.orderId, response);
        },
        modal: {
          ondismiss: () => {
            void handleDismiss(order.checkout!.orderId);
          },
        },
      });
    } catch (error) {
      busyRef.current = false;
      idempotencyKeyRef.current = null;
      update('failed', errorMessage(error));
    }
  };

  const busy = ['creating', 'checkout', 'verifying'].includes(state);
  const isSuccess = state === 'success';
  const isReview = state === 'review';
  const isPendingState = state === 'pending';
  const isDisabled = disabled || busy || isSuccess || isReview;

  const buttonLabel = (() => {
    if (state === 'creating') return 'Creating secure order…';
    if (state === 'checkout') return 'Complete payment in Razorpay…';
    if (state === 'verifying') return 'Verifying payment…';
    if (state === 'pending') return 'Check payment status';
    if (state === 'success') return 'Payment successful';
    if (state === 'review') return 'Payment under review';
    if (state === 'failed' || state === 'cancelled') return 'Try payment again';
    return label ?? `Pay ${formatINR(amount)}`;
  })();

  const icon = (() => {
    if (busy) return <Loader2 className="size-4 animate-spin" aria-hidden="true" />;
    if (isSuccess) return <CheckCircle2 className="size-4" aria-hidden="true" />;
    if (isReview) return <ShieldCheck className="size-4" aria-hidden="true" />;
    if (state === 'failed' || state === 'cancelled') return <RefreshCw className="size-4" aria-hidden="true" />;
    if (isPendingState) return <RefreshCw className="size-4" aria-hidden="true" />;
    return <CreditCard className="size-4" aria-hidden="true" />;
  })();

  const tone = (() => {
    if (isSuccess) return 'border-success/30 bg-success/10 text-success';
    if (isReview) return 'border-warning/30 bg-warning/10 text-warning';
    if (state === 'failed') return 'border-destructive/30 bg-destructive/10 text-destructive';
    if (state === 'cancelled' || isPendingState) return 'border-gold/35 bg-gold/8 text-foreground';
    return '';
  })();

  return (
    <div className={`w-full max-w-md ${className}`}>
      <button
        type="button"
        onClick={() => void handlePay()}
        disabled={isDisabled}
        aria-busy={busy}
        className={`flex w-full items-center justify-center gap-2 px-6 py-3 text-[10px] uppercase tracking-[0.2em] transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
          isSuccess
            ? 'bg-success text-success-foreground'
            : isReview
              ? 'bg-warning text-warning-foreground'
              : 'bg-gold text-gold-foreground hover:bg-gold-soft'
        }`}
      >
        {icon}
        {buttonLabel}
      </button>

      <div aria-live="polite" className="min-h-[1.25rem]">
        {message && (
          <p className={`mt-2 flex items-start gap-1.5 border px-3 py-2 text-xs leading-relaxed ${tone || 'border-border bg-muted/40 text-muted-foreground'}`}>
            {state === 'failed' ? (
              <AlertCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
            ) : isSuccess ? (
              <CheckCircle2 className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
            ) : (
              <ShieldCheck className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
            )}
            <span>{message}</span>
          </p>
        )}
      </div>

      <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">
        Amount is calculated by Heptome and verified with Razorpay on the server. Heptome never sees your card details.
      </p>
    </div>
  );
}
