import limiter from '@adonisjs/limiter/services/main';
import { errors as limiterErrors } from '@adonisjs/limiter';
import type { MiddlewareFn } from '@adonisjs/core/types/http';
import logger from '@adonisjs/core/services/logger';
import env from '#start/env';

interface RateLimiterFailureOptions {
  idempotencyKeyRequired?: boolean;
}

const redisConnectionErrorCodes = new Set([
  'ECONNREFUSED',
  'ECONNRESET',
  'ETIMEDOUT',
  'EHOSTUNREACH',
  'ENETUNREACH',
  'EAI_AGAIN',
]);

export function rateLimiterWithFailurePolicy(
  name: string,
  middleware: MiddlewareFn,
  { idempotencyKeyRequired = false }: RateLimiterFailureOptions = {}
): MiddlewareFn {
  return async (ctx, next) => {
    let limiterPassed = false;

    try {
      return await middleware(ctx, async () => {
        limiterPassed = true;
        return next();
      });
    } catch (error) {
      if (limiterPassed) {
        throw error;
      }

      if (error instanceof limiterErrors.E_TOO_MANY_REQUESTS) {
        logger.warn({ limiter: name }, 'Request rate limit exceeded');
        throw error;
      }

      if (!isRedisConnectionError(error)) {
        throw error;
      }

      logger.fatal(
        { err: error, limiter: name, idempotencyKeyRequired },
        idempotencyKeyRequired
          ? 'Redis rate limiter unavailable; rejecting idempotent request'
          : 'Redis rate limiter unavailable; allowing request'
      );

      if (!idempotencyKeyRequired) {
        return next();
      }

      return ctx.response.status(503).json({
        code: 'SERVICE_UNAVAILABLE',
        message: 'Request could not be safely processed while Redis is unavailable',
      });
    }
  };
}

function isRedisConnectionError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  if ('code' in error && typeof error.code === 'string') {
    return redisConnectionErrorCodes.has(error.code);
  }

  if ('name' in error && error.name === 'RedisConnectionException') {
    return true;
  }

  if (
    'message' in error &&
    typeof error.message === 'string' &&
    /redis connection is not ready|redis connection failed|redis connection failure/i.test(
      error.message
    )
  ) {
    return true;
  }

  return 'cause' in error && isRedisConnectionError(error.cause);
}

// Limit login attempts per IP address.
export const loginThrottle = rateLimiterWithFailurePolicy(
  'auth-login',
  limiter.define('auth-login', () => {
    return limiter.allowRequests(10).every(env.get('LIMITER_WINDOW_SECONDS'));
  })
);

export const accountLoginWindowSeconds = env.get('AUTH_LOGIN_ACCOUNT_WINDOW_SECONDS', 900);
export const accountLoginLimiter = limiter.use('redis', {
  requests: env.get('AUTH_LOGIN_ACCOUNT_LIMIT', 5),
  duration: accountLoginWindowSeconds,
});

// Limit registrations per IP address.
export const registrationThrottle = rateLimiterWithFailurePolicy(
  'auth-registration',
  limiter.define('auth-registration', () => {
    return limiter.allowRequests(10).every(env.get('LIMITER_WINDOW_SECONDS'));
  })
);
