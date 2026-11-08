import env from '#start/env';
import { defineConfig } from '@adonisjs/redis';
import { InferConnections } from '@adonisjs/redis/types';

const redisConfig = defineConfig({
  connection: 'main',
  connections: {
    main: {
      host: env.get('REDIS_HOST'),
      port: env.get('REDIS_PORT'),
      password: env.get('REDIS_PASSWORD', ''),
      db: env.get('REDIS_DB'),
      keyPrefix: env.get('REDIS_KEY_PREFIX'),
      connectTimeout: 1000,
      enableOfflineQueue: false,
      maxRetriesPerRequest: 1,
      retryStrategy(times) {
        return Math.min(250 * 2 ** (times - 1), 30000);
      },
    },
  },
});

export default redisConfig;

declare module '@adonisjs/redis/types' {
  export interface RedisConnections extends InferConnections<typeof redisConfig> {}
}
