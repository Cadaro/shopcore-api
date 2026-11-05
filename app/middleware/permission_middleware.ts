import type { HttpContext } from '@adonisjs/core/http';
import type { NextFn } from '@adonisjs/core/types/http';
import { Authenticators } from '@adonisjs/auth/types';
import { ForbiddenException, UnauthorizedException } from '#exceptions/domain_exception';
import { Permission } from '#types/enum/permission';

export default class PermissionMiddleware {
  async handle(
    ctx: HttpContext,
    next: NextFn,
    options: {
      guards?: (keyof Authenticators)[];
      permission: Permission;
    } = { guards: ['api'], permission: Permission.ROLES_ASSIGN }
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

    if (!(await ctx.bouncer.allows('can', options.permission))) {
      throw new ForbiddenException(`Permission required: ${options.permission}`);
    }

    return next();
  }
}
