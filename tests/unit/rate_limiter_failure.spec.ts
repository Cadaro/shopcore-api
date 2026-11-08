import { HttpContextFactory } from '@adonisjs/core/factories/http';
import type { MiddlewareFn } from '@adonisjs/core/types/http';
import { test } from '@japa/runner';
import { rateLimiterWithFailurePolicy } from '#start/limiter';

test('allows requests when Redis is unavailable and idempotency is not required', async ({
  assert,
}) => {
  const ctx = new HttpContextFactory().create();
  let downstreamCalled = false;
  const failedLimiter: MiddlewareFn = async () => {
    throw Object.assign(new Error('connect ECONNREFUSED'), { code: 'ECONNREFUSED' });
  };

  await rateLimiterWithFailurePolicy('auth-login', failedLimiter)(ctx, async () => {
    downstreamCalled = true;
  });

  assert.isTrue(downstreamCalled);
  assert.notEqual(ctx.response.getStatus(), 503);
});

test('rejects requests with a 503 when idempotency is required and Redis is unavailable', async ({
  assert,
}) => {
  const ctx = new HttpContextFactory().create();
  let downstreamCalled = false;
  const failedLimiter: MiddlewareFn = async () => {
    throw Object.assign(new Error('connect ECONNREFUSED'), { code: 'ECONNREFUSED' });
  };

  await rateLimiterWithFailurePolicy('order-create', failedLimiter, {
    idempotencyKeyRequired: true,
  })(ctx, async () => {
    downstreamCalled = true;
  });

  assert.isFalse(downstreamCalled);
  assert.equal(ctx.response.getStatus(), 503);
  assert.deepEqual(ctx.response.getBody(), {
    code: 'SERVICE_UNAVAILABLE',
    message: 'Request could not be safely processed while Redis is unavailable',
  });
});

test('does not swallow errors unrelated to Redis connectivity', async ({ assert }) => {
  const ctx = new HttpContextFactory().create();
  const failedLimiter: MiddlewareFn = async () => {
    throw new Error('Invalid limiter configuration');
  };

  await assert.rejects(() =>
    rateLimiterWithFailurePolicy('auth-login', failedLimiter)(ctx, async () => {})
  );
});
