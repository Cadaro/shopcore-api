import type { HttpContext } from '@adonisjs/core/http';
import type { NextFn } from '@adonisjs/core/types/http';
import redis from '@adonisjs/redis/services/main';
import {
  customerReadLimiter,
  customerWriteLimiter,
  guestReadLimiter,
  guestWriteLimiter,
  rateLimiterWithFailurePolicy,
} from '#start/limiter';
import { PreconditionRequiredException, UnauthorizedException } from '#exceptions/domain_exception';
import { Role } from '#types/enum/role';
import type { BusinessRateLimitOptions } from '#types/business_rate_limit';

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default class BusinessRateLimitMiddleware {
  async handle(
    ctx: HttpContext,
    next: NextFn,
    { group, allowGuests = false }: BusinessRateLimitOptions
  ) {
    const rateLimit = rateLimiterWithFailurePolicy(
      `business-${group}`,
      async (_ctx, limiterNext) => {
        if (allowGuests && !ctx.auth.isAuthenticated && ctx.request.header('authorization')) {
          await ctx.auth.authenticateUsing(['api']);
        }

        const user = ctx.auth.user;
        if (user) {
          if (user.role !== Role.CUSTOMER) {
            return limiterNext();
          }

          const accessTokenId = user.currentAccessToken?.identifier;
          if (!accessTokenId) {
            throw new UnauthorizedException('Valid access token required');
          }

          const store = group === 'read' ? customerReadLimiter : customerWriteLimiter;
          await store.consume(`customer:${accessTokenId}:${group}`);
          return limiterNext();
        }

        if (!allowGuests) {
          return limiterNext();
        }

        const guestToken = ctx.request.header('x-guest-token');
        if (!guestToken || !uuidPattern.test(guestToken)) {
          throw new PreconditionRequiredException(
            'Guest session is required. Initialize one with POST /api/v1/guests.'
          );
        }

        const exists = await redis.get(`guest-session:${guestToken}`);
        if (!exists) {
          throw new PreconditionRequiredException(
            'Guest session is invalid or expired. Initialize one with POST /api/v1/guests.'
          );
        }

        const store = group === 'read' ? guestReadLimiter : guestWriteLimiter;
        await store.consume(`guest:${guestToken}:${group}`);
        return limiterNext();
      },
      { failClosed: true }
    );

    return rateLimit(ctx, next);
  }
}
