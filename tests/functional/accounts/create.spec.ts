import { Token, TokenTypeEnum } from '#types/token';
import { UserData } from '#types/user';
import { test } from '@japa/runner';
import db from '@adonisjs/lucid/services/db';

const userAuthData = { email: 'test@example.com', password: 'Test123' };
test.group('Users create', (group) => {
  group.each.setup(async () => {
    await db.from('rate_limits').delete();
  });

  test('create new user', async ({ client, assert }) => {
    const response = await client.post('/api/auth/users').json(userAuthData);
    response.assertStatus(201);
    const user: UserData = response.body();
    assert.properties(user, ['userId']);
  });
  test('get user token', async ({ client, assert, expectTypeOf }) => {
    const response = await client.post('/api/auth/token').json(userAuthData);

    response.assertStatus(200);
    const token: Token = response.body();
    assert.onlyProperties(token, ['token', 'type', 'expiresAt']);
    expectTypeOf(token).toMatchObjectType<{
      type: TokenTypeEnum;
      token: string;
      expiresAt: Date;
    }>();
  });
});
