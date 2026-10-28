import TokenService from '#services/token_service';
import { generateRoleUser } from '#tests/data/users/role_user';
import { CreateUser } from '#tests/data/users/user';
import { orderCreateWithUnavailableStock } from '#tests/data/orders/order_create_with_unavailable_stock';
import { test } from '@japa/runner';

test.group('Unified error response', () => {
  test('returns a standard not-found error', async ({ client, assert }) => {
    const response = await client.get('/api/stocks/not-a-real-stock-item');
    const body = response.body();

    response.assertStatus(404);
    assert.onlyProperties(body, ['code', 'message']);
    assert.equal(body.code, 'NOT_FOUND');
  });

  test('returns a standard conflict error', async ({ client, assert }) => {
    const user = await new CreateUser(generateRoleUser()).create();
    const response = await client.post('/api/auth/users').json({
      email: user.email,
      password: 'user123',
    });
    const body = response.body();

    response.assertStatus(409);
    assert.onlyProperties(body, ['code', 'message']);
    assert.equal(body.code, 'CONFLICT');
  });

  test('returns a standard forbidden error', async ({ client, assert }) => {
    const user = await new CreateUser(generateRoleUser()).create();
    const token = await new TokenService().createToken(user);
    const response = await client.post('/api/stocks').bearerToken(token.token).json({});
    const body = response.body();

    response.assertStatus(403);
    assert.onlyProperties(body, ['code', 'message']);
    assert.equal(body.code, 'FORBIDDEN');
  });

  test('returns a stable insufficient-stock conflict', async ({ client, assert }) => {
    const user = await new CreateUser(generateRoleUser()).create();
    const token = await new TokenService().createToken(user);
    const response = await client
      .post('/api/orders')
      .bearerToken(token.token)
      .json(orderCreateWithUnavailableStock);
    const body = response.body();

    response.assertStatus(409);
    assert.onlyProperties(body, ['code', 'message']);
    assert.equal(body.code, 'INSUFFICIENT_STOCK');
  });

  test('returns Vine validation failures as error details', async ({ client, assert }) => {
    const response = await client.post('/api/auth/users').json({});
    const body = response.body();

    response.assertStatus(422);
    assert.onlyProperties(body, ['code', 'message', 'details']);
    assert.equal(body.code, 'VALIDATION_ERROR');
    assert.isArray(body.details);
    assert.isAtLeast(body.details.length, 1);
    assert.properties(body.details[0], ['field', 'message']);
  });
});
