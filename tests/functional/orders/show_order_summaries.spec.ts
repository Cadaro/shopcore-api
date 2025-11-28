import OrderService from '#services/order_service';
import TokenService from '#services/token_service';
import { OrderSummaryDto } from '#types/order';
import { test } from '@japa/runner';
import { orderCreatePickupPointCOD } from '#tests/data/orders/orderCreatePickupPointCOD';
import { generateRoleUser } from '#tests/data/users/roleUser';
import { CreateUser } from '#tests/data/users/user';

test.group('Show Order Summaries', () => {
  const tokenService = new TokenService();
  const orderService = new OrderService();

  test("should return summaries of user's orders ", async ({ client, assert }) => {
    const user = await new CreateUser(generateRoleUser()).create();
    const token = await tokenService.createToken(user);

    await orderService.createOrder(orderCreatePickupPointCOD, user.uuid);

    const response = await client
      .get('/api/orders')
      .bearerToken(token.token)
      .header('content-type', 'application/json');
    response.assertStatus(200);

    const orderSummaries: Array<OrderSummaryDto> = response.body();

    assert.onlyProperties(orderSummaries[0], [
      'orderId',
      'status',
      'itemsCount',
      'totalAmount',
      'courier',
      'paymentMethod',
      'deliveryMethod',
      'currency',
      'createdAt',
      'updatedAt',
    ]);
  });
});
