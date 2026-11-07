import { test } from '@japa/runner';
import db from '@adonisjs/lucid/services/db';
import TokenService from '#services/token_service';
import { CreateUser } from '#tests/data/users/user';
import { generateRoleUser } from '#tests/data/users/role_user';

test.group('Authentication hardening', (group) => {
  group.each.setup(async () => {
    await db.from('rate_limits').delete();
  });

  test('limits repeated failed login attempts', async ({ client }) => {
    for (let attempt = 0; attempt < 10; attempt++) {
      const response = await client.post('/api/auth/token').json({
        email: 'unknown@example.com',
        password: 'invalid-password',
      });

      response.assertStatus(401);
    }

    const limitedResponse = await client.post('/api/auth/token').json({
      email: 'unknown@example.com',
      password: 'invalid-password',
    });

    limitedResponse.assertStatus(429);
    limitedResponse.assertBodyContains({
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many requests',
    });
  });

  test('limits public registration', async ({ client }) => {
    const uniqueId = Date.now();

    for (let attempt = 0; attempt < 10; attempt++) {
      const response = await client.post('/api/auth/users').json({
        email: `rate-limit-${uniqueId}-${attempt}@example.com`,
        password: 'user123',
      });

      response.assertStatus(201);
    }

    const limitedResponse = await client.post('/api/auth/users').json({
      email: `rate-limit-${uniqueId}-limited@example.com`,
      password: 'user123',
    });

    limitedResponse.assertStatus(429);
    limitedResponse.assertBodyContains({
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many requests',
    });
  });

  test('revokes the current token on logout', async ({ client }) => {
    const user = await new CreateUser(generateRoleUser()).create();
    const token = await new TokenService().createToken(user);

    const logoutResponse = await client.delete('/api/auth/token').bearerToken(token.token);
    logoutResponse.assertStatus(204);

    const profileResponse = await client.get('/api/auth/users').bearerToken(token.token);
    profileResponse.assertStatus(401);
  });

  test('returns only the authenticated user profile without sensitive fields', async ({
    client,
  }) => {
    const user = await new CreateUser(generateRoleUser()).create();
    const otherUser = await new CreateUser(generateRoleUser()).create();
    const token = await new TokenService().createToken(user);

    const response = await client.get('/api/auth/users').bearerToken(token.token);
    response.assertStatus(200);
    response.assertBodyContains({ userId: user.uuid, email: user.email });

    const profile = response.body();
    if (
      'password' in profile ||
      profile.userId === otherUser.uuid ||
      profile.email === otherUser.email
    ) {
      throw new Error('The profile response must not expose credentials or another user');
    }
  });
});
