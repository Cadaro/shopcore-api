import { test } from '@japa/runner';
import TokenService from '#services/token_service';
import { orderCreatePickupPointWithoutPPId } from '#tests/data/orders/orderCreatePickupPointWithoutPPId';
import { orderCreateHomeDeliveryWithoutAddress } from '#tests/data/orders/orderCreateHomeDeliveryWithoutAddress';
import { CreateUser } from '#tests/data/users/user';
import { generateRoleUser } from '#tests/data/users/roleUser';

test.group('Orders create', () => {
  const tokenService = new TokenService();

  test('should fail create order without pickupPointId for pickup point delivery method', async ({
    client,
  }) => {
    const user = await new CreateUser(generateRoleUser()).create();
    const token = await tokenService.createToken(user);
    const response = await client
      .post('/api/orders')
      .bearerToken(token.token)
      .header('content-type', 'application/json')
      .json(orderCreatePickupPointWithoutPPId);

    response.assertStatus(422);
  });

  test('should fail create order without address for home delivery method', async ({ client }) => {
    const user = await new CreateUser(generateRoleUser()).create();
    const token = await tokenService.createToken(user);
    const response = await client
      .post('/api/orders')
      .bearerToken(token.token)
      .header('content-type', 'application/json')
      .json(orderCreateHomeDeliveryWithoutAddress);

    response.assertStatus(422);
  });
});
