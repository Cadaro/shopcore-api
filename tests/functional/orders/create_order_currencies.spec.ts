import { test } from '@japa/runner';
import { orderCreateDifferentItemAndDeliveryCurrency } from '#tests/data/orders/order_create_different_item_and_delivery_currency';
import TokenService from '#services/token_service';
import { orderCreateDifferentItemsCurrency } from '#tests/data/orders/order_create_different_items_currency';
import { CreateUser } from '#tests/data/users/user';
import { generateRoleUser } from '#tests/data/users/role_user';

test.group('Orders create', () => {
  const tokenService = new TokenService();

  test('should fail create order with different currency between items and delivery', async ({
    client,
  }) => {
    const user = await new CreateUser(generateRoleUser()).create();
    const token = await tokenService.createToken(user);

    const response = await client
      .post('/api/orders')
      .bearerToken(token.token)
      .header('content-type', 'application/json')
      .json(orderCreateDifferentItemAndDeliveryCurrency);

    response.assertStatus(422);
  });

  test('should fail create order with different currency between items', async ({ client }) => {
    const user = await new CreateUser(generateRoleUser()).create();
    const token = await tokenService.createToken(user);

    const response = await client
      .post('/api/orders')
      .bearerToken(token.token)
      .header('content-type', 'application/json')
      .json(orderCreateDifferentItemsCurrency);

    response.assertStatus(422);
  });
});
