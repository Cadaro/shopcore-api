import OrderService from '#services/order_service';
import TokenService from '#services/token_service';
import { OrderSummaryDto } from '#types/order';
import { test } from '@japa/runner';
import { orderCreatePickupPointCOD } from '#tests/data/orders/order_create_pickup_point_cod';
import { generateRoleUser } from '#tests/data/users/role_user';
import { CreateUser } from '#tests/data/users/user';
import db from '@adonisjs/lucid/services/db';

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

  test('stores minor units and returns exact item totals in major units', async ({
    client,
    assert,
  }) => {
    const user = await new CreateUser(generateRoleUser()).create();
    const token = await tokenService.createToken(user);
    const request = {
      ...orderCreatePickupPointCOD,
      delivery: { ...orderCreatePickupPointCOD.delivery, deliveryPrice: 0.29 },
      items: [{ ...orderCreatePickupPointCOD.items[0], itemPrice: 0.1, vatAmount: 0.02, qty: 3 }],
    };
    const created = await orderService.createOrder(request, user.uuid);
    assert.equal(created.details[0].itemPrice, 0.1);
    const storedOrder = await db.from('orders').where('order_id', created.orderId).first();
    const storedItem = await db.from('order_details').where('order_id', created.orderId).first();
    assert.equal(Number(storedOrder.delivery_price), 29);
    assert.equal(Number(storedItem.item_price), 10);
    assert.equal(Number(storedItem.vat_amount), 2);

    const response = await client.get('/api/orders').bearerToken(token.token);
    response.assertStatus(200);
    assert.equal(response.body()[0].totalAmount, 0.3);
    const details = await client.get(`/api/orders/${created.orderId}`).bearerToken(token.token);
    details.assertStatus(200);
    assert.equal(details.body().delivery.deliveryPrice, 0.29);
    assert.equal(details.body().details[0].itemPrice, 0.1);
  });

  test('rejects a delivery price with fractional minor units', async ({ client }) => {
    const user = await new CreateUser(generateRoleUser()).create();
    const token = await tokenService.createToken(user);
    const response = await client
      .post('/api/orders')
      .bearerToken(token.token)
      .json({
        ...orderCreatePickupPointCOD,
        delivery: { ...orderCreatePickupPointCOD.delivery, deliveryPrice: 0.001 },
      });
    response.assertStatus(422);
  });
});
