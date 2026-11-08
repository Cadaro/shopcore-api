import { randomUUID } from 'node:crypto';
import { errors as limiterErrors } from '@adonisjs/limiter';
import limiter from '@adonisjs/limiter/services/main';
import { test } from '@japa/runner';

test.group('Redis rate limiter store', () => {
  test('atomically enforces a limit across concurrent requests', async ({ assert }) => {
    const key = `concurrent-${randomUUID()}`;
    const store = limiter.use('redis', { requests: 1, duration: 30 });

    const results = await Promise.allSettled(Array.from({ length: 10 }, () => store.consume(key)));

    const allowed = results.filter((result) => result.status === 'fulfilled');
    const rejected = results.filter((result) => result.status === 'rejected');
    assert.equal(allowed.length, 1);
    assert.equal(rejected.length, 9);
    for (const result of rejected) {
      if (result.status === 'rejected') {
        assert.instanceOf(result.reason, limiterErrors.E_TOO_MANY_REQUESTS);
      }
    }
  });

  test('expires counters when their configured window ends', async ({ assert }) => {
    const key = `expires-${randomUUID()}`;
    const store = limiter.use('redis', { requests: 1, duration: 1 });

    await store.consume(key);
    await new Promise((resolve) => setTimeout(resolve, 1100));

    const response = await store.consume(key);
    assert.equal(response.remaining, 0);
  });
});
