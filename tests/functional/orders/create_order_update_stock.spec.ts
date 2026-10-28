import { OrderCreatedDto } from '#types/order';
import { test } from '@japa/runner';
import { orderCreateWithAvailableStock } from '#tests/data/orders/order_create_with_available_stock';
import { orderCreateWithUnavailableStock } from '#tests/data/orders/order_create_with_unavailable_stock';
import TokenService from '#services/token_service';
import { CreateUser } from '#tests/data/users/user';
import { generateRoleUser } from '#tests/data/users/role_user';
import Order from '#models/order';
import Stock from '#models/stock';
import OrderService from '#services/order_service';
import { Currency } from '#types/enum/currency_code';
import { randomUUID } from 'crypto';

test.group('Orders create for stock update', () => {
  const tokenService = new TokenService();

  const createOrderRequest = (itemId: string) => ({
    ...orderCreateWithAvailableStock,
    items: [{ ...orderCreateWithAvailableStock.items[0], itemId, qty: 1 }],
  });

  const createStock = async (itemId: string, availableQty: number) =>
    Stock.create({
      itemId,
      itemDescription: 'Test item',
      price: 7.99,
      priceCurrency: Currency.EUR,
      name: 'Test item',
      size: 'M',
      availableQty,
      vatAmount: 1.43,
      vatRate: 0.19,
    });

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

  test('should roll back the order when stock is insufficient', async ({ client, assert }) => {
    const user = await new CreateUser(generateRoleUser()).create();
    const token = await tokenService.createToken(user);
    const orderCountBefore = (await Order.findManyBy({ userId: user.uuid })).length;
    const stockBefore = await Stock.findBy({ itemId: 'test-stock-item' });
    assert.isNotNull(stockBefore);

    const response = await client
      .post('/api/orders')
      .bearerToken(token.token)
      .header('content-type', 'application/json')
      .json(orderCreateWithUnavailableStock);

    response.assertStatus(409);
    assert.equal(response.body().code, 'INSUFFICIENT_STOCK');
    assert.equal((await Order.findManyBy({ userId: user.uuid })).length, orderCountBefore);
    const stockAfter = await Stock.findBy({ itemId: 'test-stock-item' });
    assert.equal(stockAfter?.availableQty, stockBefore!.availableQty);
  });

  test('should roll back the stock decrement when order persistence fails', async ({ assert }) => {
    const user = await new CreateUser(generateRoleUser()).create();
    const itemId = randomUUID();
    await createStock(itemId, 1);
    const orderCountBefore = (await Order.findManyBy({ userId: user.uuid })).length;
    const orderRequest = {
      ...createOrderRequest(itemId),
      email: 'a'.repeat(256),
    };

    await assert.rejects(() => new OrderService().createOrder(orderRequest, user.uuid));

    const savedStock = await Stock.findBy({ itemId });
    assert.equal(savedStock?.availableQty, 1);
    assert.equal((await Order.findManyBy({ userId: user.uuid })).length, orderCountBefore);
  });

  test('allows only one concurrent order for the last unit', async ({ client, assert }) => {
    const user = await new CreateUser(generateRoleUser()).create();
    const token = await tokenService.createToken(user);
    const itemId = randomUUID();
    await createStock(itemId, 1);

    const createOrder = () =>
      client
        .post('/api/orders')
        .bearerToken(token.token)
        .header('content-type', 'application/json')
        .json(createOrderRequest(itemId));
    const responses = await Promise.all([createOrder(), createOrder()]);

    assert.deepEqual(responses.map((response) => response.status()).sort(), [201, 409]);
    const failedResponse = responses.find((response) => response.status() === 409)!;
    assert.equal(failedResponse.body().code, 'INSUFFICIENT_STOCK');
    const savedStock = await Stock.findBy({ itemId });
    assert.equal(savedStock?.availableQty, 0);
    assert.equal((await Order.findManyBy({ userId: user.uuid })).length, 1);
  });
});
