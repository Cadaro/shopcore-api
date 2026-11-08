import { EventEmitter } from 'node:events';
import { test } from '@japa/runner';
import { waitForRedis } from '#tests/helpers/wait_for_redis';

class RedisClient extends EventEmitter {
  status = 'connecting';
  connectCalls = 0;

  async connect() {
    this.connectCalls++;
  }
}

test('waits for Redis to be ready before returning', async ({ assert }) => {
  const client = new RedisClient();
  let completed = false;
  const ready = waitForRedis(client).then(() => {
    completed = true;
  });

  await Promise.resolve();
  assert.isFalse(completed);
  client.status = 'ready';
  client.emit('ready');
  await ready;
  assert.isTrue(completed);
  assert.equal(client.listenerCount('error'), 0);
});

test('starts a lazy connection and accepts an already ready connection', async ({ assert }) => {
  const client = new RedisClient();
  client.status = 'wait';
  const ready = waitForRedis(client);
  assert.equal(client.connectCalls, 1);
  client.status = 'ready';
  client.emit('ready');
  await ready;
  await waitForRedis(client);
  assert.equal(client.connectCalls, 1);
});

test('reports connection errors and removes listeners', async ({ assert }) => {
  const client = new RedisClient();
  const ready = waitForRedis(client);
  const cause = new Error('authentication failed');
  client.emit('error', cause);
  try {
    await ready;
    assert.fail('Expected a Redis connection error');
  } catch (error) {
    assert.instanceOf(error, Error);
    if (!(error instanceof Error)) {
      throw error;
    }
    assert.strictEqual(error.cause, cause);
  }
  assert.equal(client.listenerCount('ready'), 0);
  assert.equal(client.listenerCount('end'), 0);
});

test('fails when Redis ends or does not become ready', async ({ assert }) => {
  const endedClient = new RedisClient();
  const ended = waitForRedis(endedClient);
  endedClient.emit('end');
  await assert.rejects(() => ended, 'Redis connection ended before becoming ready');

  const slowClient = new RedisClient();
  await assert.rejects(
    () => waitForRedis(slowClient, 10),
    'Redis did not become ready within 10ms (status: connecting)'
  );
  assert.equal(slowClient.listenerCount('ready'), 0);
  assert.equal(slowClient.listenerCount('error'), 0);
});
