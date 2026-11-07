import { test } from '@japa/runner';
import User from '#models/user';
import TokenService from '#services/token_service';
import { CreateUser } from '#tests/data/users/user';
import { generateRoleAdmin } from '#tests/data/users/role_admin';
import { generateRoleUser } from '#tests/data/users/role_user';
import { Role } from '#types/enum/role';
import { newItemWithoutItemId } from '../../data/items/new_item_without_item_id.js';
import db from '@adonisjs/lucid/services/db';

test.group('Roles and permissions', (group) => {
  group.each.setup(async () => {
    await db.from('rate_limits').delete();
  });

  async function createToken(user: User) {
    return new TokenService().createToken(user);
  }

  test('only admins can assign roles, and the changed role applies to existing tokens', async ({
    client,
  }) => {
    const customer = await new CreateUser(generateRoleUser()).create();
    const customerToken = await createToken(customer);
    const denied = await client
      .patch(`/api/auth/users/${customer.uuid}/role`)
      .json({ role: Role.STAFF })
      .bearerToken(customerToken.token);
    denied.assertStatus(403);

    const admin = await new CreateUser(generateRoleAdmin()).create();
    const adminToken = await createToken(admin);
    const assigned = await client
      .patch(`/api/auth/users/${customer.uuid}/role`)
      .json({ role: Role.STAFF })
      .bearerToken(adminToken.token);
    assigned.assertStatus(204);

    const stock = await client
      .post('/api/stocks')
      .json(newItemWithoutItemId)
      .bearerToken(customerToken.token);
    stock.assertStatus(201);
  });

  test('registration cannot assign a privileged role', async ({ client }) => {
    const response = await client.post('/api/auth/users').json({
      email: `customer-${Date.now()}@example.com`,
      password: 'user123',
      role: Role.ADMIN,
    });
    response.assertStatus(201);
    const registeredUser = await User.findByOrFail({ uuid: response.body().userId });
    if (registeredUser.role !== Role.CUSTOMER) {
      throw new Error('Public registration must always create a customer');
    }
  });
});
