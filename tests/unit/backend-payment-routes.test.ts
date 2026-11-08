import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * HTTP boundary tests for the payment routes. The service is mocked so these
 * focus on what reaches it: authentication, admin separation, validation and
 * the raw webhook body. They complement the service-level integrity tests.
 */

const mocks = vi.hoisted(() => ({
  createOrder: vi.fn(),
  verifyPayment: vi.fn(),
  getOrderStatus: vi.fn(),
  createRefund: vi.fn(),
  handleWebhook: vi.fn(),
}));

vi.mock('../../backend/src/services/payment', () => ({
  paymentService: {
    createOrder: mocks.createOrder,
    verifyPayment: mocks.verifyPayment,
    getOrderStatus: mocks.getOrderStatus,
    createRefund: mocks.createRefund,
    handleWebhook: mocks.handleWebhook,
  },
}));

vi.mock('../../backend/src/middleware/auth', () => ({
  authMiddleware: (req: express.Request, _res: express.Response, next: express.NextFunction) => {
    req.user = { id: 'user-1' } as express.Request['user'];
    next();
  },
}));

vi.mock('../../backend/src/middleware/adminAuth', () => ({
  adminMiddleware: (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (req.header('x-test-admin') !== 'yes') {
      res.status(403).json({ error: 'Admin access required' });
      return;
    }
    req.admin = { id: 'admin-1' } as express.Request['admin'];
    next();
  },
}));

import paymentsRouter from '../../backend/src/routes/payments';
import webhookRouter from '../../backend/src/routes/paymentsWebhook';
import { errorHandler } from '../../backend/src/middleware/errorHandler';

function buildApp() {
  const app = express();
  // Webhook is mounted first, exactly as in app.ts, so it receives raw bytes.
  app.use('/api/v1/payments/webhook', webhookRouter);
  app.use(express.json());
  app.use('/api/v1/payments', paymentsRouter);
  app.use(errorHandler);
  return app;
}

const TARGET_ID = '64b7f0c2a1b2c3d4e5f60701';

beforeEach(() => {
  for (const fn of Object.values(mocks)) fn.mockReset();
  mocks.createOrder.mockResolvedValue({ paymentId: 'p1' });
  mocks.verifyPayment.mockResolvedValue({ id: 'p1', status: 'COMPLETED' });
  mocks.getOrderStatus.mockResolvedValue({ id: 'p1', status: 'COMPLETED' });
  mocks.createRefund.mockResolvedValue({ id: 'p1', status: 'REFUNDED' });
  mocks.handleWebhook.mockResolvedValue({ duplicate: false, ignored: false });
});

describe('payment route access and validation', () => {
  it('passes only server-relevant fields to createOrder, dropping client amount and currency', async () => {
    const response = await request(buildApp())
      .post('/api/v1/payments/orders')
      .send({
        targetType: 'EVENT_BOOKING',
        targetId: TARGET_ID,
        amount: 1,
        currency: 'USD',
        customerId: 'attacker',
        status: 'COMPLETED',
      });

    expect(response.status).toBe(200);
    expect(mocks.createOrder).toHaveBeenCalledWith('user-1', {
      targetType: 'EVENT_BOOKING',
      targetId: TARGET_ID,
    });
  });

  it('rejects an invalid target ID before reaching the service', async () => {
    const response = await request(buildApp())
      .post('/api/v1/payments/orders')
      .send({ targetType: 'EVENT_BOOKING', targetId: 'not-an-object-id' });

    expect(response.status).toBe(400);
    expect(mocks.createOrder).not.toHaveBeenCalled();
  });

  it('rejects a malformed checkout signature before reaching the service', async () => {
    const response = await request(buildApp())
      .post('/api/v1/payments/verify')
      .send({
        razorpay_order_id: 'order_TEST123',
        razorpay_payment_id: 'pay_TEST123',
        razorpay_signature: 'not-a-signature',
      });

    expect(response.status).toBe(400);
    expect(mocks.verifyPayment).not.toHaveBeenCalled();
  });

  it('keeps refunds behind admin authentication', async () => {
    const denied = await request(buildApp())
      .post('/api/v1/payments/admin/refund')
      .send({ targetType: 'EVENT_BOOKING', paymentId: TARGET_ID });

    expect(denied.status).toBe(403);
    expect(mocks.createRefund).not.toHaveBeenCalled();

    const allowed = await request(buildApp())
      .post('/api/v1/payments/admin/refund')
      .set('x-test-admin', 'yes')
      .send({ targetType: 'EVENT_BOOKING', paymentId: TARGET_ID });

    expect(allowed.status).toBe(200);
    expect(mocks.createRefund).toHaveBeenCalledWith('admin-1', {
      targetType: 'EVENT_BOOKING',
      paymentId: TARGET_ID,
    });
  });

  it('requires a webhook signature and forwards the exact raw body', async () => {
    const missing = await request(buildApp())
      .post('/api/v1/payments/webhook')
      .set('content-type', 'application/json')
      .send('{"event":"payment.captured"}');

    expect(missing.status).toBe(400);
    expect(mocks.handleWebhook).not.toHaveBeenCalled();

    const raw = '{"event":"payment.captured","payload":{}}';
    const accepted = await request(buildApp())
      .post('/api/v1/payments/webhook')
      .set('content-type', 'application/json')
      .set('x-razorpay-signature', 'a'.repeat(64))
      .send(raw);

    expect(accepted.status).toBe(200);
    const [body, signature] = mocks.handleWebhook.mock.calls[0] as [Buffer, string];
    expect(Buffer.isBuffer(body)).toBe(true);
    expect(body.toString('utf8')).toBe(raw);
    expect(signature).toBe('a'.repeat(64));
  });
});
