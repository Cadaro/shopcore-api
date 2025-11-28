import OrderService from '#services/order_service';
import TokenService from '#services/token_service';
import { OrderDataDto, OrderSummaryDto } from '#types/order';
import { test } from '@japa/runner';
import { orderCreatePickupPointCOD } from '#tests/data/orders/orderCreatePickupPointCOD';
import { CreateUser } from '#tests/data/users/user';
import { generateRoleUser } from '#tests/data/users/roleUser';

test.group('Show Order Details', () => {
  const tokenService = new TokenService();
  const orderService = new OrderService();

  test("should return order's details", async ({ client, assert }) => {
    const user = await new CreateUser(generateRoleUser()).create();
    const token = await tokenService.createToken(user);
    await orderService.createOrder(orderCreatePickupPointCOD, user.uuid);

    const responseOrderList = await client
      .get('/api/orders')
      .bearerToken(token.token)
      .header('content-type', 'application/json');

    const orderSummaries: Array<OrderSummaryDto> = responseOrderList.body();

    const responseSingleOrderData = await client
      .get(`/api/orders/${orderSummaries[0].orderId}`)
      .bearerToken(token.token)
      .header('content-type', 'application/json');

    responseSingleOrderData.assertStatus(200);

    const orderDataDto: OrderDataDto = responseSingleOrderData.body();

    assert.onlyProperties(orderDataDto, [
      'orderId',
      'firstName',
      'lastName',
      'email',
      'phoneNumber',
      'paymentMethod',
      'status',
      'delivery',
      'details',
      'createdAt',
    ]);
    assert.onlyProperties(orderDataDto.delivery, [
      'courier',
      'pickupPointId',
      'method',
      'deliveryPrice',
      'deliveryCurrency',
      'deliveryVatRate',
    ]);
    assert.isArray(orderDataDto.details);
    assert.onlyProperties(orderDataDto.details[0], [
      'itemId',
      'qty',
      'itemPrice',
      'currency',
      'itemName',
      'vatAmount',
      'vatRate',
    ]);
  });
});
