import { test } from '@japa/runner';
import { assertSafeTestServices } from '#tests/helpers/test_service_safety';

const local = {
  nodeEnv: 'test',
  databaseHost: '127.0.0.1',
  databasePort: 3307,
  databaseName: 'shopcore_test',
  redisHost: '127.0.0.1',
  redisPort: 6380,
  redisDatabase: 1,
  ci: false,
};

test('allows only the dedicated local and CI test services', ({ assert }) => {
  assert.doesNotThrow(() => assertSafeTestServices(local));
  assert.doesNotThrow(() =>
    assertSafeTestServices({ ...local, ci: true, databasePort: 3306, redisPort: 6379 })
  );
});

test('refuses to reset unsafe database or Redis configurations', ({ assert }) => {
  for (const change of [
    { nodeEnv: 'development' },
    { databaseHost: 'example.com' },
    { databasePort: 3306 },
    { databaseName: 'shopcore' },
    { redisHost: 'example.com' },
    { redisPort: 6379 },
    { redisDatabase: 0 },
  ]) {
    assert.throws(() => assertSafeTestServices({ ...local, ...change }));
  }
});
