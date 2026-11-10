import { createHash } from 'node:crypto';
import { errors as authErrors } from '@adonisjs/auth';
import User from '#models/user';
import TokenService from '#services/token_service';
import { createAuthValidator } from '#validators/auth';
import { inject } from '@adonisjs/core';
import type { HttpContext } from '@adonisjs/core/http';
import { TooManyRequestsException, UnauthorizedException } from '#exceptions/domain_exception';
import { accountLoginLimiter, accountLoginWindowSeconds } from '#start/limiter';

@inject()
export default class TokenController {
  constructor(private tokenService: TokenService) {}
  /**
   * create access token
   * POST /token
   */
  async store({ request, response }: HttpContext) {
    const { email, password } = await request.validateUsing(createAuthValidator);
    const accountKey = createHash('sha256').update(email.trim().toLowerCase()).digest('hex');

    if (await accountLoginLimiter.isBlocked(accountKey)) {
      throw new TooManyRequestsException();
    }

    let user: User;
    try {
      user = await User.verifyCredentials(email, password);
    } catch (error) {
      if (!(error instanceof authErrors.E_INVALID_CREDENTIALS)) {
        throw error;
      }

      const attempts = await accountLoginLimiter.increment(accountKey);
      if (attempts.consumed >= attempts.limit) {
        await accountLoginLimiter.block(accountKey, accountLoginWindowSeconds);
      }
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = await this.tokenService.createToken(user);
    await accountLoginLimiter.delete(accountKey);

    return response.ok(token);
  }

  /**
   * Revoke the current access token
   * DELETE /token
   */
  async destroy({ auth, response }: HttpContext) {
    const user = auth.user!;
    const currentAccessToken = user.currentAccessToken!;

    await User.accessTokens.delete(user, currentAccessToken.identifier);

    return response.noContent();
  }
}
