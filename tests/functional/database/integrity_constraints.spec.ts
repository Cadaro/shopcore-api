import { test } from '@japa/runner';
import { randomUUID } from 'node:crypto';
import Order from '#models/order';
import OrderDetail from '#models/order_detail';
import Stock from '#models/stock';
import db from '@adonisjs/lucid/services/db';
import { CreateUser } from '#tests/data/users/user';
import { generateRoleUser } from '#tests/data/users/role_user';
import { Currency } from '#types/enum/currency_code';
import { DeliveryMethod } from '#types/enum/delivery_method';
import { OrderStatus } from '#types/enum/order_status';
import { PaymentMethod } from '#types/enum/payment_method';

test.group('Database integrity constraints', () => {
  const orderAttributes = (orderId: string, userId: string | null) => ({
    orderId,
    status: OrderStatus.NEW,
    email: 'integrity-test@example.com',
    phoneNumber: '',
    courier: '',
    deliveryMethod: DeliveryMethod.PICKUP_POINT,
    deliveryPrice: 0,
    deliveryCurrency: Currency.EUR,
    deliveryVatRate: 0,
    paymentMethod: PaymentMethod.BANK_TRANSFER,
    userId,
  });

  test('keeps an order and clears its user reference when the user is deleted', async ({
    assert,
  }) => {
    const user = await new CreateUser(generateRoleUser()).create();
    const order = await Order.create(orderAttributes(randomUUID(), user.uuid));

    await user.delete();

    const persistedOrder = await Order.find(order.id);
    assert.isNotNull(persistedOrder);
    assert.isNull(persistedOrder!.userId);
    await persistedOrder!.delete();
  });

  test('rejects an order with a duplicate order id', async ({ assert }) => {
    const user = await new CreateUser(generateRoleUser()).create();
    const orderId = randomUUID();
    await Order.create(orderAttributes(orderId, user.uuid));

    await assert.rejects(() => Order.create(orderAttributes(orderId, user.uuid)));
  });

  test('rejects status updates for orders that do not exist', async ({ assert }) => {
    await assert.rejects(() =>
      db.table('order_status_updates').insert({
        order_id: randomUUID(),
        status: OrderStatus.NEW,
      })
    );
  });

  test('rejects duplicate items within an order', async ({ assert }) => {
    const user = await new CreateUser(generateRoleUser()).create();
    const order = await Order.create(orderAttributes(randomUUID(), user.uuid));
    const itemId = randomUUID();
    await Stock.create({
      itemId,
      itemDescription: 'Integrity constraint test item',
      price: 1,
      priceCurrency: Currency.EUR,
      name: 'Integrity constraint test item',
      size: 'M',
      availableQty: 1,
      vatAmount: 0,
      vatRate: 0,
    });
    const detail = {
      orderId: order.orderId,
      itemId,
      itemName: 'Integrity constraint test item',
      qty: 1,
      itemPrice: 1,
      currency: Currency.EUR,
      vatAmount: 0,
      vatRate: 0,
    };
    await OrderDetail.create(detail);

    await assert.rejects(() => OrderDetail.create(detail));
  });

  test('rejects negative stock quantities', async ({ assert }) => {
    await assert.rejects(() =>
      Stock.create({
        itemId: randomUUID(),
        itemDescription: 'Invalid integrity constraint test item',
        price: 1,
        priceCurrency: Currency.EUR,
        name: 'Invalid integrity constraint test item',
        size: 'M',
        availableQty: -1,
        vatAmount: 0,
        vatRate: 0,
      })
    );
  });
});
