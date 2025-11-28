import { test } from '@japa/runner';
import { orderCreateWithAvailableStock } from '#tests/data/orders/orderCreateWithAvailableStock';

test.group('Orders create', () => {
  test('should fail to create order for unauthenticated user', async ({ client }) => {
    const response = await client
      .post('/api/orders')
      .header('content-type', 'application/json')
      .json(orderCreateWithAvailableStock);

    response.assertStatus(401);
  });
});
