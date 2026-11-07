import User from '#models/user';
import TokenService from '#services/token_service';
import { createAuthValidator } from '#validators/auth';
import { inject } from '@adonisjs/core';
import type { HttpContext } from '@adonisjs/core/http';
import { UnauthorizedException } from '#exceptions/domain_exception';

@inject()
export default class TokenController {
  constructor(private tokenService: TokenService) {}
  /**
   * create access token
   * POST /token
   */
  async store({ request, response }: HttpContext) {
    const { email, password } = await request.validateUsing(createAuthValidator);

    const user = await User.verifyCredentials(email, password);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = await this.tokenService.createToken(user);

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
