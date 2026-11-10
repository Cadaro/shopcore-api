import { test } from '@japa/runner';
import TokenService from '#services/token_service';
import { CreateUser } from '#tests/data/users/user';
import { generateRoleUser } from '#tests/data/users/role_user';
import clearRateLimits from '#tests/helpers/clear_rate_limits';

test.group('Authentication hardening', (group) => {
  group.each.setup(async () => {
    await clearRateLimits();
  });

  test('limits repeated failed login attempts', async ({ client }) => {
    for (let attempt = 0; attempt < 10; attempt++) {
      const response = await client.post('/api/auth/token').json({
        email: `unknown-${attempt}@example.com`,
        password: 'invalid-password',
      });

      response.assertStatus(401);
    }

    const limitedResponse = await client.post('/api/auth/token').json({
      email: 'unknown-limited@example.com',
      password: 'invalid-password',
    });

    limitedResponse.assertStatus(429);
    limitedResponse.assertBodyContains({
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many requests',
    });
  });

  test('locks an account after failed attempts from different IP addresses', async ({ client }) => {
    const email = `distributed-${Date.now()}@example.com`;

    for (let attempt = 0; attempt < 5; attempt++) {
      const response = await client
        .post('/api/auth/token')
        .header('X-Forwarded-For', `198.51.100.${attempt + 1}`)
        .json({
          email: attempt % 2 === 0 ? email : email.toUpperCase(),
          password: 'invalid-password',
        });

      response.assertStatus(401);
    }

    const limitedResponse = await client
      .post('/api/auth/token')
      .header('X-Forwarded-For', '198.51.100.6')
      .json({ email, password: 'invalid-password' });

    limitedResponse.assertStatus(429);
    limitedResponse.assertBodyContains({
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many requests',
    });
  });

  test('successful login resets the account failed-attempt counter', async ({ client }) => {
    const userData = generateRoleUser();
    await new CreateUser(userData).create();

    for (let attempt = 0; attempt < 4; attempt++) {
      const response = await client
        .post('/api/auth/token')
        .header('X-Forwarded-For', `198.51.100.${attempt + 1}`)
        .json({ email: userData.email, password: 'invalid-password' });

      response.assertStatus(401);
    }

    const successfulResponse = await client
      .post('/api/auth/token')
      .header('X-Forwarded-For', '198.51.100.5')
      .json({ email: userData.email, password: userData.password });
    successfulResponse.assertStatus(200);

    for (let attempt = 0; attempt < 5; attempt++) {
      const response = await client
        .post('/api/auth/token')
        .header('X-Forwarded-For', `198.51.100.${attempt + 6}`)
        .json({ email: userData.email, password: 'invalid-password' });

      response.assertStatus(401);
    }

    const limitedResponse = await client
      .post('/api/auth/token')
      .header('X-Forwarded-For', '198.51.100.11')
      .json({ email: userData.email, password: 'invalid-password' });
    limitedResponse.assertStatus(429);
  });

  test('uses trusted forwarded client IPs for the IP login limiter', async ({ client }) => {
    for (let attempt = 0; attempt < 11; attempt++) {
      const response = await client
        .post('/api/auth/token')
        .header('X-Forwarded-For', `198.51.100.${attempt + 1}`)
        .json({
          email: `proxy-ip-${Date.now()}-${attempt}@example.com`,
          password: 'invalid-password',
        });

      response.assertStatus(401);
    }
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
