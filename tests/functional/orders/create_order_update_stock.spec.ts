import { OrderCreatedDto } from '#types/order';
import { test } from '@japa/runner';
import { orderCreateWithAvailableStock } from '#tests/data/orders/orderCreateWithAvailableStock';
import { orderCreateWithUnavailableStock } from '#tests/data/orders/orderCreateWithUnavailableStock';
import TokenService from '#services/token_service';
import { CreateUser } from '#tests/data/users/user';
import { generateRoleUser } from '#tests/data/users/roleUser';

test.group('Orders create for stock update', () => {
  const tokenService = new TokenService();
  test('should create order with available stock', async ({ client, assert }) => {
    const user = await new CreateUser(generateRoleUser()).create();
    const token = await tokenService.createToken(user);

    const response = await client
      .post('/api/orders')
      .bearerToken(token.token)
      .header('content-type', 'application/json')
      .json(orderCreateWithAvailableStock);
    const orderCreated: OrderCreatedDto = response.body();

    response.assertStatus(201);
    assert.onlyProperties(orderCreated, ['orderId', 'details']);
    assert.onlyProperties(orderCreated.details[0], [
      'itemId',
      'qty',
      'itemPrice',
      'currency',
      'itemName',
      'vatAmount',
      'vatRate',
    ]);
  });

  test('should fail to create order without available stock', async ({ client }) => {
    const user = await new CreateUser(generateRoleUser()).create();
    const token = await tokenService.createToken(user);

    const response = await client
      .post('/api/orders')
      .bearerToken(token.token)
      .header('content-type', 'application/json')
      .json(orderCreateWithUnavailableStock);

    response.assertStatus(400);
  });
});
