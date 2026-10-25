import { UnauthorizedException } from '#exceptions/domain_exception';
import { Authenticators } from '@adonisjs/auth/types';
import type { HttpContext } from '@adonisjs/core/http';
import type { NextFn } from '@adonisjs/core/types/http';

/**
 * User middleware ensures the authenticated user has basic access.
 * This is for endpoints that require authentication but don't need admin privileges.
 * Accepts any authenticated user with a valid token.
 */
export default class UserMiddleware {
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

    // Allow any authenticated user with a valid token
    return next();
  }
}
