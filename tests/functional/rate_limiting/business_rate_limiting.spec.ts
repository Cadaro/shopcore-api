import { test } from '@japa/runner';
import redis from '@adonisjs/redis/services/main';
import env from '#start/env';
import { customerReadLimiter, customerWriteLimiter, guestReadLimiter } from '#start/limiter';
import User from '#models/user';
import { CreateUser } from '#tests/data/users/user';
import { generateRoleAdmin } from '#tests/data/users/role_admin';
import { generateRoleUser } from '#tests/data/users/role_user';
import TokenService from '#services/token_service';
import { orderCreateWithUnavailableStock } from '#tests/data/orders/order_create_with_unavailable_stock';
import clearRateLimits from '#tests/helpers/clear_rate_limits';

test.group('Customer and guest rate limiting', (group) => {
  group.each.setup(async () => {
    await clearRateLimits();
  });

  test('creates a Redis-backed guest session with the configured TTL', async ({
    assert,
    client,
  }) => {
    const response = await client.post('/api/v1/guests');
    response.assertStatus(201);
    assert.match(
      response.body().guest_token,
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
    assert.isString(response.body().expires_at);

    const ttl = await redis.ttl(`guest-session:${response.body().guest_token}`);
    const configuredTtl = env.get('GUEST_SESSION_TTL_SECONDS', 86400);
    assert.isAtMost(ttl, configuredTtl);
    assert.isAtLeast(ttl, configuredTtl - 2);
  });

  test('limits guest-session creation by client IP without disclosing retry timing', async ({
    client,
  }) => {
    const limit = env.get('GUEST_SESSION_CREATE_RATE_LIMIT', 10);
    let response;
    for (let request = 0; request < limit; request++) {
      response = await client.post('/api/v1/guests');
      response.assertStatus(201);
    }

    response = await client.post('/api/v1/guests');
    response.assertStatus(429);
    response.assertHeaderMissing('Retry-After');
  });

  test('uses the guest token bucket without disclosing retry timing', async ({ client }) => {
    const guestSession = await client.post('/api/v1/guests');
    const guestToken = guestSession.body().guest_token as string;
    const limit = env.get('GUEST_READ_RATE_LIMIT', 300);
    const windowSeconds = env.get('BUSINESS_RATE_LIMIT_WINDOW_SECONDS', 300);

    await guestReadLimiter.set(`guest:${guestToken}:read`, limit, windowSeconds);

    const response = await client.get('/api/stocks').header('X-Guest-Token', guestToken);
    response.assertStatus(429);
    response.assertHeaderMissing('Retry-After');
  });

  test('uses distinct customer read and write buckets', async ({ client }) => {
    const user = await new CreateUser(generateRoleUser()).create();
    const token = await new TokenService().createToken(user);
    const accessTokenId = (await User.accessTokens.all(user))[0].identifier;
    const readKey = `customer:${accessTokenId}:read`;
    const writeKey = `customer:${accessTokenId}:write`;
    const windowSeconds = env.get('BUSINESS_RATE_LIMIT_WINDOW_SECONDS', 300);

    await customerReadLimiter.set(readKey, env.get('CUSTOMER_READ_RATE_LIMIT', 600), windowSeconds);

    const readResponse = await client.get('/api/orders').bearerToken(token.token);
    readResponse.assertStatus(429);
    readResponse.assertHeaderMissing('Retry-After');

    const writeResponse = await client
      .post('/api/orders')
      .bearerToken(token.token)
      .json(orderCreateWithUnavailableStock);
    writeResponse.assertStatus(409);

    await customerWriteLimiter.set(
      writeKey,
      env.get('CUSTOMER_WRITE_RATE_LIMIT', 120),
      windowSeconds
    );
    const throttledWrite = await client
      .post('/api/orders')
      .bearerToken(token.token)
      .json(orderCreateWithUnavailableStock);
    throttledWrite.assertStatus(429);
  });

  test('does not apply the customer limiter to admin traffic', async ({ client }) => {
    const admin = await new CreateUser(generateRoleAdmin()).create();
    const token = await new TokenService().createToken(admin);
    const accessTokenId = (await User.accessTokens.all(admin))[0].identifier;

    await customerReadLimiter.set(
      `customer:${accessTokenId}:read`,
      env.get('CUSTOMER_READ_RATE_LIMIT', 600),
      env.get('BUSINESS_RATE_LIMIT_WINDOW_SECONDS', 300)
    );

    const response = await client.get('/api/orders').bearerToken(token.token);
    response.assertStatus(200);
  });
});
