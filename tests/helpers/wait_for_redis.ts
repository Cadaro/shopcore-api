import type { EventEmitter } from 'node:events';

type RedisClient = EventEmitter & {
  status: string;
  connect(): Promise<void>;
};

export async function waitForRedis(client: RedisClient, timeoutMs = 5000): Promise<void> {
  if (client.status === 'ready') {
    return;
  }
  if (client.status === 'end' || client.status === 'disconnecting') {
    throw new Error(`Redis connection is ${client.status}`);
  }

  await new Promise<void>((resolve, reject) => {
    const cleanup = () => {
      clearTimeout(timer);
      client.off('ready', onReady);
      client.off('error', onError);
      client.off('end', onEnd);
    };
    const onReady = () => {
      cleanup();
      resolve();
    };
    const onError = (error: Error) => {
      cleanup();
      reject(new Error('Failed to connect to Redis for test setup', { cause: error }));
    };
    const onEnd = () => {
      cleanup();
      reject(new Error('Redis connection ended before becoming ready'));
    };
    const timer = setTimeout(() => {
      cleanup();
      reject(
        new Error(`Redis did not become ready within ${timeoutMs}ms (status: ${client.status})`)
      );
    }, timeoutMs);

    client.once('ready', onReady);
    client.once('error', onError);
    client.once('end', onEnd);

    if (client.status === 'wait') {
      client.connect().catch(onError);
    }
  });
}
