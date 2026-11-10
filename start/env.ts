/*
|--------------------------------------------------------------------------
| Environment variables service
|--------------------------------------------------------------------------
|
| The `Env.create` method creates an instance of the Env service. The
| service validates the environment variables and also cast values
| to JavaScript data types.
|
*/

import { Env } from '@adonisjs/core/env';

export default await Env.create(new URL('../', import.meta.url), {
  NODE_ENV: Env.schema.enum(['development', 'production', 'test'] as const),
  PORT: Env.schema.number(),
  APP_KEY: Env.schema.string(),
  HOST: Env.schema.string({ format: 'host' }),
  LOG_LEVEL: Env.schema.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']),
  PROTOCOL: Env.schema.enum(['HTTPS', 'HTTP']),
  TRUSTED_PROXIES: Env.schema.string.optional(),

  /*
  |----------------------------------------------------------
  | Variables for configuring database connection
  |----------------------------------------------------------
  */
  DB_HOST: Env.schema.string({ format: 'host' }),
  DB_PORT: Env.schema.number(),
  DB_USER: Env.schema.string(),
  DB_PASSWORD: Env.schema.string.optional(),
  DB_DATABASE: Env.schema.string(),

  /*
  |----------------------------------------------------------
  | Variables for configuring Redis and the limiter package
  |----------------------------------------------------------
  */
  REDIS_HOST: Env.schema.string({ format: 'host' }),
  REDIS_PORT: Env.schema.number(),
  REDIS_PASSWORD: Env.schema.string.optional(),
  REDIS_DB: Env.schema.number(),
  REDIS_KEY_PREFIX: Env.schema.string(),
  LIMITER_STORE: Env.schema.enum(['redis', 'database', 'memory'] as const),
  LIMITER_KEY_PREFIX: Env.schema.string(),
  LIMITER_WINDOW_SECONDS: Env.schema.number(),
  BUSINESS_RATE_LIMIT_WINDOW_SECONDS: Env.schema.number.optional(),
  CUSTOMER_READ_RATE_LIMIT: Env.schema.number.optional(),
  CUSTOMER_WRITE_RATE_LIMIT: Env.schema.number.optional(),
  GUEST_READ_RATE_LIMIT: Env.schema.number.optional(),
  GUEST_WRITE_RATE_LIMIT: Env.schema.number.optional(),
  GUEST_SESSION_TTL_SECONDS: Env.schema.number.optional(),
  GUEST_SESSION_CREATE_RATE_LIMIT: Env.schema.number.optional(),
  GUEST_SESSION_CREATE_WINDOW_SECONDS: Env.schema.number.optional(),
  AUTH_LOGIN_ACCOUNT_LIMIT: Env.schema.number.optional(),
  AUTH_LOGIN_ACCOUNT_WINDOW_SECONDS: Env.schema.number.optional(),
});
