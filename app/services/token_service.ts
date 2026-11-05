import User from '#models/user';
import { Token, TokenProvider, TokenTypeEnum } from '#types/token';
import stringHelpers from '@adonisjs/core/helpers/string';

export default class TokenService implements TokenProvider {
  /**
   * Create token for user
   */
  public async createToken(user: User, expiresIn?: string): Promise<Token> {
    // Set token expiration time, default to 24h
    const tokenExpiresIn = expiresIn ?? '24h';

    const availableTokens = await User.accessTokens.all(user);

    if (availableTokens.length > 1) {
      /**
       * prevent multiple access tokens for one user
       */
      await User.accessTokens.delete(user, availableTokens[0].identifier);
    }

    const userAccessToken = await User.accessTokens.create(user, [], {
      expiresIn: tokenExpiresIn,
    });

    const token: Token = {
      type: TokenTypeEnum.BEARER,
      token: userAccessToken.value!.release(),
      expiresAt: new Date(
        userAccessToken.expiresAt!.getTime() + stringHelpers.seconds.parse(tokenExpiresIn)
      ),
    };
    return token;
  }
}
