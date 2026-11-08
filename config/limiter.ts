import env from '#start/env';
import { defineConfig, stores } from '@adonisjs/limiter';

const limiterConfig = defineConfig({
  default: env.get('LIMITER_STORE'),
  stores: {
    // Keep the database store available for a controlled rollback.
    database: stores.database({
      tableName: 'rate_limits',
    }),

    redis: stores.redis({
      connectionName: 'main',
      keyPrefix: env.get('LIMITER_KEY_PREFIX'),
      rejectIfRedisNotReady: true,
    }),

    memory: stores.memory({
      keyPrefix: env.get('LIMITER_KEY_PREFIX'),
    }),
  },
});

export default limiterConfig;

declare module '@adonisjs/limiter/types' {
  export interface LimitersList extends InferLimiters<typeof limiterConfig> {}
}
