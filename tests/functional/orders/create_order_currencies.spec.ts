import { test } from '@japa/runner';
import { orderCreateDifferentItemAndDeliveryCurrency } from '#tests/data/orders/orderCreateDifferentItemAndDeliveryCurrency';
import TokenService from '#services/token_service';
import { orderCreateDifferentItemsCurrency } from '#tests/data/orders/orderCreateDifferentItemsCurrency';
import { CreateUser } from '#tests/data/users/user';
import { generateRoleUser } from '#tests/data/users/roleUser';

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

    response.assertStatus(400);
  });

  test('should fail create order with different currency between items', async ({ client }) => {
    const user = await new CreateUser(generateRoleUser()).create();
    const token = await tokenService.createToken(user);

    const response = await client
      .post('/api/orders')
      .bearerToken(token.token)
      .header('content-type', 'application/json')
      .json(orderCreateDifferentItemsCurrency);

    response.assertStatus(400);
  });
});
