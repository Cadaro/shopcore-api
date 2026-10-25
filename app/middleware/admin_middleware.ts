import type { HttpContext } from '@adonisjs/core/http';
import type { NextFn } from '@adonisjs/core/types/http';
import { UserAbilitiesEnum } from '#types/user';
import { Authenticators } from '@adonisjs/auth/types';
import { ForbiddenException, UnauthorizedException } from '#exceptions/domain_exception';

/**
 * Admin middleware is used to ensure only admin users with '*' ability
 * can access specific routes. This provides an additional layer of security
 * for admin-only endpoints.
 */
export default class AdminMiddleware {
  async handle(
    ctx: HttpContext,
    next: NextFn,
    options: { guards?: (keyof Authenticators)[] } = { guards: ['api'] }
  ) {
    const { auth } = ctx;

    await ctx.auth.authenticateUsing(options.guards);

    // Check if user is authenticated
    if (!auth.isAuthenticated) {
      throw new UnauthorizedException('Authentication required');
    }

    const user = auth.user!;

    // Check if user has current access token
    if (!user.currentAccessToken) {
      throw new UnauthorizedException('Valid access token required');
    }

    // Check if user has admin privileges (wildcard ability)
    if (!user.currentAccessToken.allows(UserAbilitiesEnum.ADMIN)) {
      throw new ForbiddenException('Admin privileges required');
    }

    return next();
  }
}
