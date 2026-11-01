import OrderService from '#services/order_service';
import OrderStatusService from '#services/order_status_service';
import TokenService from '#services/token_service';
import { DateTime } from 'luxon';
import { OrderHistoryDto } from '#types/order_status';
import { OrderStatus } from '#types/enum/order_status';
import { test } from '@japa/runner';
import { orderCreatePickupPointCOD } from '#tests/data/orders/order_create_pickup_point_cod';
import { CreateUser } from '#tests/data/users/user';
import { generateRoleUser } from '#tests/data/users/role_user';

test.group('Order history', () => {
  const tokenService = new TokenService();
  const orderService = new OrderService();
  const statusService = new OrderStatusService();

  test('should store initial status and later updates in history', async ({ client, assert }) => {
    const user = await new CreateUser(generateRoleUser()).create();
    const token = await tokenService.createToken(user);
    const { orderId } = await orderService.createOrder(orderCreatePickupPointCOD, user.uuid);

    const initial = await client
      .get(`/api/orders/${orderId}/status-history`)
      .bearerToken(token.token);
    initial.assertStatus(200);
    const initialHistory: Array<OrderHistoryDto> = initial.body();
    assert.lengthOf(initialHistory, 1);

    const next = orderService
      ? (
          await import('#services/order_status_validator_service')
        ).OrderStatusValidatorService.getValidNextStatuses(initialHistory[0].status)[0]
      : OrderStatus.NEW;
    await statusService.updateStatus({
      orderId,
      status: next,
      statusDatetime: DateTime.now(),
      isVisibleToCustomer: true,
    });

    const response = await client
      .get(`/api/orders/${orderId}/status-history`)
      .bearerToken(token.token);
    const history: Array<OrderHistoryDto> = response.body();
    assert.deepEqual(
      history.map((h) => h.status),
      [initialHistory[0].status, next]
    );
  });

  test('should hide history entries not visible to customer', async ({ client, assert }) => {
    const user = await new CreateUser(generateRoleUser()).create();
    const token = await tokenService.createToken(user);
    const { orderId } = await orderService.createOrder(orderCreatePickupPointCOD, user.uuid);

    await statusService.updateStatus({
      orderId,
      status: OrderStatus.PROCESSING,
      statusDatetime: DateTime.now(),
      isVisibleToCustomer: false,
    });

    const response = await client
      .get(`/api/orders/${orderId}/status-history`)
      .bearerToken(token.token);
    response.assertStatus(200);
    const history: Array<OrderHistoryDto> = response.body();
    assert.deepEqual(
      history.map((h) => h.status),
      [OrderStatus.NEW]
    );
  });

  test('should reject invalid transition', async ({ assert }) => {
    const user = await new CreateUser(generateRoleUser()).create();
    const { orderId } = await orderService.createOrder(orderCreatePickupPointCOD, user.uuid);
    await assert.rejects(() =>
      statusService.updateStatus({
        orderId,
        status: OrderStatus.DELIVERED,
        statusDatetime: DateTime.now(),
        isVisibleToCustomer: true,
      })
    );
  });

  test('should not expose history of another user order', async ({ client }) => {
    const owner = await new CreateUser(generateRoleUser()).create();
    const other = await new CreateUser(generateRoleUser()).create();
    const token = await tokenService.createToken(other);
    const { orderId } = await orderService.createOrder(orderCreatePickupPointCOD, owner.uuid);
    const response = await client
      .get(`/api/orders/${orderId}/status-history`)
      .bearerToken(token.token);
    response.assertStatus(404);
  });
});
