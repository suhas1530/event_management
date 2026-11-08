import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * HTTP boundary tests for the public newsletter endpoint.
 *
 * The database call is mocked so these pin the visitor-facing contract:
 * validation happens before persistence, addresses are normalised, and the
 * endpoint stays idempotent through an upsert.
 */

const mocks = vi.hoisted(() => ({
  upsert: vi.fn(),
}));

vi.mock('../../backend/src/utils/database', () => ({
  prisma: {
    newsletterSubscriber: {
      upsert: mocks.upsert,
    },
  },
}));

import newsletterRouter from '../../backend/src/routes/newsletter';
import { errorHandler } from '../../backend/src/middleware/errorHandler';

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/v1/newsletter', newsletterRouter);
  app.use(errorHandler);
  return app;
}

beforeEach(() => {
  mocks.upsert.mockReset();
  mocks.upsert.mockImplementation(({ create }: { create: Record<string, unknown> }) =>
    Promise.resolve({ id: 'subscriber-1', ...create }),
  );
});

describe('POST /api/v1/newsletter', () => {
  it('normalises a valid address and upserts it', async () => {
    const response = await request(buildApp())
      .post('/api/v1/newsletter')
      .send({ email: '  Reader@Example.COM  ' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      subscribed: true,
      message: "You're on the list. Look out for the next Heptome edit.",
    });
    expect(mocks.upsert).toHaveBeenCalledWith({
      where: { email: 'reader@example.com' },
      update: { status: 'SUBSCRIBED' },
      create: { email: 'reader@example.com', status: 'SUBSCRIBED', source: 'footer' },
    });
  });

  it('rejects a malformed address before touching the database', async () => {
    const response = await request(buildApp())
      .post('/api/v1/newsletter')
      .send({ email: 'not-an-email' });

    expect(response.status).toBe(400);
    expect(response.body.code).toBe('VALIDATION_ERROR');
    expect(mocks.upsert).not.toHaveBeenCalled();
  });

  it('rejects a missing address before touching the database', async () => {
    const response = await request(buildApp()).post('/api/v1/newsletter').send({});

    expect(response.status).toBe(400);
    expect(mocks.upsert).not.toHaveBeenCalled();
  });

  it('keeps repeated submissions successful and idempotent', async () => {
    const first = await request(buildApp())
      .post('/api/v1/newsletter')
      .send({ email: 'reader@example.com' });
    const second = await request(buildApp())
      .post('/api/v1/newsletter')
      .send({ email: 'reader@example.com' });

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(mocks.upsert).toHaveBeenCalledTimes(2);
  });
});
