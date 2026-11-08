import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Checkout UI behaviour. These tests never call Razorpay: the hosted script and
 * network are mocked. They prove that the UI reports success only after the
 * backend returns a verified COMPLETED payment, and that double clicks do not
 * create duplicate orders.
 */

const mocks = vi.hoisted(() => ({
  createOrder: vi.fn(),
  verify: vi.fn(),
  status: vi.fn(),
  loadScript: vi.fn(),
  openCheckout: vi.fn(),
}));

vi.mock('@/lib/api', () => ({
  paymentsApi: {
    createOrder: mocks.createOrder,
    verify: mocks.verify,
    status: mocks.status,
  },
}));

vi.mock('@/lib/razorpay-checkout', () => ({
  loadRazorpayScript: mocks.loadScript,
  openRazorpayCheckout: mocks.openCheckout,
}));

import PaymentButton from '@/components/payments/PaymentButton';

const checkout = {
  provider: 'razorpay' as const,
  keyId: 'rzp_test_public',
  orderId: 'order_TEST1234567890',
  amount: 500000,
  currency: 'INR',
  name: 'Heptome',
  description: 'Booking BK-1',
  prefill: { name: 'Asha', email: 'asha@example.com' },
  notes: { targetType: 'EVENT_BOOKING', targetId: 'b1', paymentId: 'p1' },
};

const completed = {
  id: 'p1',
  targetType: 'EVENT_BOOKING',
  targetId: 'b1',
  amount: 5000,
  amountPaise: 500000,
  currency: 'INR',
  status: 'COMPLETED',
  provider: 'razorpay',
  providerOrderId: checkout.orderId,
  providerPaymentId: 'pay_TEST1234567890',
  paidAt: new Date().toISOString(),
  verifiedAt: new Date().toISOString(),
  failureCode: null,
  failureReason: null,
  refundAmount: 0,
  refundStatus: null,
  refundedAt: null,
  checkoutAllowed: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

beforeEach(() => {
  mocks.createOrder.mockReset();
  mocks.verify.mockReset();
  mocks.status.mockReset();
  mocks.loadScript.mockReset().mockResolvedValue(undefined);
  mocks.openCheckout.mockReset();
});

function renderButton(onSuccess = vi.fn()) {
  render(
    <PaymentButton
      targetType="EVENT_BOOKING"
      targetId="b1"
      amount={5000}
      onSuccess={onSuccess}
    />,
  );
  return onSuccess;
}

describe('payment checkout UI', () => {
  it('creates only one order when the button is double-clicked', async () => {
    const user = userEvent.setup();
    let resolveOrder: (value: unknown) => void = () => {};
    mocks.createOrder.mockReturnValue(
      new Promise(resolve => {
        resolveOrder = resolve;
      }),
    );
    renderButton();

    const button = screen.getByRole('button', { name: /Pay ₹5,000/ });
    await user.dblClick(button);

    expect(mocks.createOrder).toHaveBeenCalledTimes(1);
    expect(button).toBeDisabled();
    await act(async () => {
      resolveOrder({ alreadyPaid: false, requiresReview: false, checkout });
    });
    await waitFor(() => expect(screen.getByRole('button', { name: /Complete payment/ })).toBeInTheDocument());
  });

  it('reports success only after backend verification completes', async () => {
    const user = userEvent.setup();
    const onSuccess = renderButton();
    mocks.createOrder.mockResolvedValue({
      paymentId: 'p1',
      alreadyPaid: false,
      requiresReview: false,
      checkout,
    });
    mocks.openCheckout.mockImplementation((options: { handler: (response: unknown) => void }) => {
      options.handler({
        razorpay_order_id: checkout.orderId,
        razorpay_payment_id: 'pay_TEST1234567890',
        razorpay_signature: 'a'.repeat(64),
      });
      return { open: vi.fn(), close: vi.fn(), on: vi.fn() };
    });
    mocks.verify.mockResolvedValue(completed);

    await user.click(screen.getByRole('button', { name: /Pay ₹5,000/ }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Payment successful/ })).toBeInTheDocument();
    });
    expect(mocks.verify).toHaveBeenCalledWith({
      razorpay_order_id: checkout.orderId,
      razorpay_payment_id: 'pay_TEST1234567890',
      razorpay_signature: 'a'.repeat(64),
    });
    expect(onSuccess).toHaveBeenCalledWith(completed);
  });

  it('does not claim success when the user closes checkout without paying', async () => {
    const user = userEvent.setup();
    const onSuccess = renderButton();
    mocks.createOrder.mockResolvedValue({
      paymentId: 'p1',
      alreadyPaid: false,
      requiresReview: false,
      checkout,
    });
    mocks.openCheckout.mockImplementation((options: { modal: { ondismiss: () => void } }) => {
      options.modal.ondismiss();
      return { open: vi.fn(), close: vi.fn(), on: vi.fn() };
    });
    mocks.status.mockResolvedValue({ ...completed, status: 'CANCELLED', paidAt: null });

    await user.click(screen.getByRole('button', { name: /Pay ₹5,000/ }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Try payment again/ })).toBeInTheDocument();
    });
    expect(screen.getByText(/Payment was cancelled/)).toBeInTheDocument();
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('shows a review state instead of success when the backend flags the payment', async () => {
    const user = userEvent.setup();
    const onSuccess = renderButton();
    mocks.createOrder.mockResolvedValue({
      paymentId: 'p1',
      alreadyPaid: false,
      requiresReview: false,
      checkout,
    });
    mocks.openCheckout.mockImplementation((options: { handler: (response: unknown) => void }) => {
      options.handler({
        razorpay_order_id: checkout.orderId,
        razorpay_payment_id: 'pay_TEST1234567890',
        razorpay_signature: 'b'.repeat(64),
      });
      return { open: vi.fn(), close: vi.fn(), on: vi.fn() };
    });
    mocks.verify.mockResolvedValue({
      ...completed,
      status: 'REVIEW_REQUIRED',
      failureReason: 'The captured amount did not match.',
    });

    await user.click(screen.getByRole('button', { name: /Pay ₹5,000/ }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Payment under review/ })).toBeInTheDocument();
    });
    expect(screen.getByText(/did not match/i)).toBeInTheDocument();
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('shows a safe retry state when order creation fails', async () => {
    const user = userEvent.setup();
    const onSuccess = renderButton();
    mocks.createOrder.mockRejectedValue(new Error('Online payments are not configured.'));

    await user.click(screen.getByRole('button', { name: /Pay ₹5,000/ }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Try payment again/ })).toBeInTheDocument();
    });
    expect(screen.getByText(/not configured/i)).toBeInTheDocument();
    expect(onSuccess).not.toHaveBeenCalled();
  });
});
