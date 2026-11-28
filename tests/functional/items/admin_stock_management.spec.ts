import { test } from '@japa/runner';
import { randomUUID } from 'node:crypto';
import { mock } from 'node:test';
import db from '@adonisjs/lucid/services/db';
import Stock from '#models/stock';
import AdminStockService from '#services/admin_stock_service';
import OrderService from '#services/order_service';
import SaveInvoice from '#services/save_invoice_service';
import TokenService from '#services/token_service';
import { CountryCode } from '#types/enum/country_code';
import { InvoiceCustomerTypeEnum } from '#types/invoice';
import { newItemWithoutItemId } from '#tests/data/items/new_item_without_item_id';
import { orderCreateWithAvailableStock } from '#tests/data/orders/order_create_with_available_stock';
import { CreateUser } from '#tests/data/users/user';
import { generateRoleAdmin } from '#tests/data/users/role_admin';
import { generateRoleUser } from '#tests/data/users/role_user';

test.group('Admin stock management', () => {
  async function setupStock(availableQty = 2) {
    const user = await new CreateUser(generateRoleAdmin()).create();
    const token = (await new TokenService().createToken(user)).token;
    const { itemId } = await new AdminStockService().createSingleItemStock({
      ...newItemWithoutItemId,
      itemId: randomUUID(),
      availableQty,
    });
    return { token, itemId };
  }

  test('updates only supplied fields and ignores immutable fields', async ({ assert, client }) => {
    const { token, itemId } = await setupStock();
    const before = (await client.get(`/api/admin/stocks/${itemId}`).bearerToken(token)).body();
    const response = await client
      .patch(`/api/admin/stocks/${itemId}`)
      .bearerToken(token)
      .header('If-Match', `"${before.version}"`)
      .json({
        name: 'Updated item',
        availableQty: 0,
        isVisible: false,
        itemId: null,
        sku: '',
        color: 'WHITE',
        size: 'L',
      });
    response.assertStatus(200);
    assert.equal(before.version, 1);
    assert.equal(response.body().version, 2);
    assert.equal(response.body().name, 'Updated item');
    assert.equal(response.body().availableQty, 0);
    assert.isFalse(response.body().isVisible);
    for (const field of ['itemId', 'sku', 'color', 'size', 'itemDescription', 'photos', 'prices']) {
      assert.deepEqual(response.body()[field], before[field]);
    }

    for (const payload of [{}, { itemId: null, sku: null, color: '', size: null }]) {
      const noOp = await client
        .patch(`/api/admin/stocks/${itemId}`)
        .bearerToken(token)
        .header('If-Match', `"${response.body().version}"`)
        .json(payload);
      noOp.assertStatus(200);
      assert.deepEqual(noOp.body(), response.body());
    }
    const mergePatch = await client
      .patch(`/api/admin/stocks/${itemId}`)
      .bearerToken(token)
      .header('If-Match', `"${response.body().version}"`)
      .header('content-type', 'application/merge-patch+json')
      .json({ name: 'Merge patch item' });
    mergePatch.assertStatus(200);
    assert.equal(mergePatch.body().name, 'Merge patch item');
  });

  test('replaces supplied arrays and validates empty values', async ({ assert, client }) => {
    const { token, itemId } = await setupStock();
    const photos = [{ url: '/new-photo.jpg' }];
    const prices = [newItemWithoutItemId.prices[0]];
    const response = await client
      .patch(`/api/admin/stocks/${itemId}`)
      .bearerToken(token)
      .header('If-Match', '"1"')
      .json({ photos, prices });
    response.assertStatus(200);
    assert.deepEqual(response.body().prices, prices);
    assert.equal(response.body().photos[0].url, photos[0].url);
    assert.lengthOf(response.body().photos, 1);

    const invalidPayloads = [
      { name: null },
      { name: '' },
      { itemDescription: null },
      { availableQty: null },
      { availableQty: -1 },
      { availableQty: 1.5 },
      { isVisible: null },
      { prices: null },
      { prices: [] },
      { photos: null },
      { photos: [] },
      { photos: [{ url: '/photo', name: null }] },
      { photos: [{ url: '/photo', name: '' }] },
      { photos: [{ name: 'missing url' }] },
      { photos: [{ url: '', name: 'empty url' }] },
      { prices: [{ ...prices[0], price: null }] },
    ];
    for (const payload of invalidPayloads) {
      const invalid = await client
        .patch(`/api/admin/stocks/${itemId}`)
        .bearerToken(token)
        .header('If-Match', `"${response.body().version}"`)
        .json(payload);
      invalid.assertStatus(422);
    }
    const after = await client.get(`/api/admin/stocks/${itemId}`).bearerToken(token);
    assert.deepEqual(after.body(), response.body());
  });

  test('restricts management and removes the old update route', async ({ client }) => {
    const { token, itemId } = await setupStock(0);
    const customer = await new CreateUser(generateRoleUser()).create();
    const customerToken = (await new TokenService().createToken(customer)).token;
    for (const method of ['patch', 'delete'] as const) {
      const anonymous = await client[method](`/api/admin/stocks/${itemId}`).json({});
      anonymous.assertStatus(401);
      const forbidden = await client[method](`/api/admin/stocks/${itemId}`)
        .bearerToken(customerToken)
        .json({});
      forbidden.assertStatus(403);
    }
    const oldPut = await client.put(`/api/stocks/${itemId}`).bearerToken(token).json({});
    oldPut.assertStatus(404);
    const oldPatch = await client.patch(`/api/stocks/${itemId}`).bearerToken(token).json({});
    oldPatch.assertStatus(404);
  });

  test('deletes only zero-quantity stock and rejects updates after deletion', async ({
    assert,
    client,
  }) => {
    const { token, itemId } = await setupStock();
    const conflict = await client.delete(`/api/admin/stocks/${itemId}`).bearerToken(token);
    conflict.assertStatus(409);
    assert.isNull((await Stock.findByOrFail('itemId', itemId)).deletedAt);
    const zero = await client
      .patch(`/api/admin/stocks/${itemId}`)
      .bearerToken(token)
      .header('If-Match', '"1"')
      .json({ availableQty: 0 });
    zero.assertStatus(200);
    const deleted = await client.delete(`/api/admin/stocks/${itemId}`).bearerToken(token);
    deleted.assertStatus(200);
    assert.equal(deleted.body().itemId, itemId);
    assert.isString(deleted.body().deletedAt);
    const stored = await client.get(`/api/admin/stocks/${itemId}`).bearerToken(token);
    assert.equal(Date.parse(stored.body().deletedAt), Date.parse(deleted.body().deletedAt));
    (await client.delete(`/api/admin/stocks/${itemId}`).bearerToken(token)).assertStatus(404);
    (
      await client
        .patch(`/api/admin/stocks/${itemId}`)
        .bearerToken(token)
        .header('If-Match', `"${zero.body().version}"`)
        .json({ isVisible: true, availableQty: 1 })
    ).assertStatus(404);
    (await client.delete(`/api/admin/stocks/${randomUUID()}`).bearerToken(token)).assertStatus(404);
    (
      await client
        .patch(`/api/admin/stocks/${randomUUID()}`)
        .bearerToken(token)
        .header('If-Match', '"1"')
        .json({})
    ).assertStatus(404);
  });

  test('hides stock from public reads after visibility changes and deletion', async ({
    assert,
    client,
  }) => {
    const { token, itemId } = await setupStock();
    const customer = await new CreateUser(generateRoleUser()).create();
    const customerToken = (await new TokenService().createToken(customer)).token;
    (await client.get(`/api/stocks/${itemId}`).bearerToken(customerToken)).assertStatus(200);
    assert.notProperty(
      (await client.get(`/api/stocks/${itemId}`).bearerToken(customerToken)).body(),
      'version'
    );
    (
      await client
        .patch(`/api/admin/stocks/${itemId}`)
        .bearerToken(token)
        .header('If-Match', '"1"')
        .json({ isVisible: false })
    ).assertStatus(200);
    (await client.get(`/api/stocks/${itemId}`).bearerToken(customerToken)).assertStatus(404);
    const list = await client.get('/api/stocks').bearerToken(customerToken);
    list.assertStatus(200);
    assert.notInclude(
      (list.body().data as Array<{ itemId: string }>).map((stock) => stock.itemId),
      itemId
    );
    (
      await client
        .patch(`/api/admin/stocks/${itemId}`)
        .bearerToken(token)
        .header('If-Match', '"2"')
        .json({ availableQty: 0 })
    ).assertStatus(200);
    (await client.delete(`/api/admin/stocks/${itemId}`).bearerToken(token)).assertStatus(200);
    (await client.get(`/api/stocks/${itemId}`).bearerToken(customerToken)).assertStatus(404);
  });

  test('rolls back stock and photos if replacing prices fails', async ({ assert }) => {
    const { itemId } = await setupStock();
    const service = new AdminStockService();
    const before = await service.fetchSingleStockItem(itemId);
    await assert.rejects(() =>
      service.updateSingleItemStock(
        itemId,
        {
          name: 'Must roll back',
          photos: [{ url: '/must-roll-back' }],
          prices: [newItemWithoutItemId.prices[0], newItemWithoutItemId.prices[0]],
        },
        before.version
      )
    );
    const after = await service.fetchSingleStockItem(itemId);
    assert.equal(after.name, before.name);
    assert.deepEqual(
      after.photos.map(({ url, name }) => ({ url, name })),
      before.photos.map(({ url, name }) => ({ url, name }))
    );
    assert.deepEqual(after.prices, before.prices);
    assert.equal(after.version, before.version);
  });

  test('enforces If-Match and preserves data on rejected and no-op updates', async ({
    assert,
    client,
  }) => {
    const { token, itemId } = await setupStock();
    const url = `/api/admin/stocks/${itemId}`;
    const before = (await client.get(url).bearerToken(token)).body();
    const change = {
      name: 'Changed name',
      photos: [{ url: '/changed.jpg' }],
      prices: [{ ...newItemWithoutItemId.prices[0], price: 99.99 }],
    };
    (await client.patch(url).bearerToken(token).json(change)).assertStatus(428);
    for (const header of ['1', 'W/"1"', '*', '"1", "2"', '"0"', '"01"', '"2147483648"', '""']) {
      (
        await client.patch(url).bearerToken(token).header('If-Match', header).json(change)
      ).assertStatus(422);
    }
    (
      await client.patch(`/api/admin/stocks/${randomUUID()}`).bearerToken(token).json({})
    ).assertStatus(428);
    (
      await client
        .patch(`/api/admin/stocks/${randomUUID()}`)
        .bearerToken(token)
        .header('If-Match', 'invalid')
        .json({})
    ).assertStatus(422);
    (
      await client.patch(url).bearerToken(token).header('If-Match', '"2"').json(change)
    ).assertStatus(412);
    assert.deepEqual((await client.get(url).bearerToken(token)).body(), before);

    const noOp = await client.patch(url).bearerToken(token).header('If-Match', '"1"').json({
      name: before.name,
      itemDescription: before.itemDescription,
      availableQty: before.availableQty,
      isVisible: before.isVisible,
      photos: before.photos,
      prices: before.prices,
    });
    noOp.assertStatus(200);
    assert.deepEqual(noOp.body(), before);
    const updated = await client
      .patch(url)
      .bearerToken(token)
      .header('If-Match', '"1"')
      .json(change);
    updated.assertStatus(200);
    assert.equal(updated.body().version, 2);
    (await client.patch(url).bearerToken(token).header('If-Match', '"1"').json({})).assertStatus(
      412
    );
    (
      await client.patch(url).bearerToken(token).header('If-Match', '"1"').json(change)
    ).assertStatus(412);
    assert.deepEqual((await client.get(url).bearerToken(token)).body(), updated.body());
    const arrayOnly = await client
      .patch(url)
      .bearerToken(token)
      .header('If-Match', '"2"')
      .json({ photos: [{ url: '/without-name.jpg' }] });
    arrayOnly.assertStatus(200);
    assert.equal(arrayOnly.body().version, 3);
    const samePhotos = await client
      .patch(url)
      .bearerToken(token)
      .header('If-Match', '"3"')
      .json({ photos: [{ url: '/without-name.jpg' }] });
    samePhotos.assertStatus(200);
    assert.deepEqual(samePhotos.body(), arrayOnly.body());
  });

  test('serializes competing PATCH requests using the same version', async ({ assert, client }) => {
    const { token, itemId } = await setupStock();
    let release!: () => void;
    let locked!: () => void;
    const firstLocked = new Promise<void>((resolve) => (locked = resolve));
    const gate = new Promise<void>((resolve) => (release = resolve));
    const originalSave = Stock.prototype.save;
    let paused = false;
    const saveMock = mock.method(Stock.prototype, 'save', async function (this: Stock) {
      if (this.itemId === itemId && !paused) {
        paused = true;
        locked();
        await gate;
      }
      return originalSave.call(this);
    });

    const url = `/api/admin/stocks/${itemId}`;
    const first = client
      .patch(url)
      .bearerToken(token)
      .header('If-Match', '"1"')
      .json({ name: 'First update', photos: [{ url: '/first.jpg' }] })
      .then((response) => response);
    let second: Promise<Awaited<typeof first>> | undefined;
    const knexClient = db.connection().getWriteClient().client;
    let onQuery: ((query: { sql: string; bindings?: unknown[] }) => void) | undefined;
    let watchdog: ReturnType<typeof setTimeout> | undefined;
    try {
      await firstLocked;
      const secondRequestedLock = new Promise<void>((resolve, reject) => {
        onQuery = (query) => {
          if (/for update/i.test(query.sql) && query.bindings?.includes(itemId)) resolve();
        };
        knexClient.on('query', onQuery);
        watchdog = setTimeout(() => reject(new Error('Second PATCH did not request a lock')), 5000);
      });
      second = client
        .patch(url)
        .bearerToken(token)
        .header('If-Match', '"1"')
        .json({ name: 'Second update', photos: [{ url: '/second.jpg' }] })
        .then((response) => response);
      await secondRequestedLock;
      release();
      const [winner, loser] = await Promise.all([first, second]);
      winner.assertStatus(200);
      loser.assertStatus(412);
      assert.equal(winner.body().version, 2);
      assert.deepEqual((await client.get(url).bearerToken(token)).body(), winner.body());
    } finally {
      if (onQuery) knexClient.off('query', onQuery);
      if (watchdog) clearTimeout(watchdog);
      release();
      await Promise.allSettled([first, ...(second ? [second] : [])]);
      saveMock.mock.restore();
    }
  });

  test('reads version and related data from the same snapshot', async ({ assert }) => {
    const { itemId } = await setupStock();
    const service = new AdminStockService();
    const before = await service.fetchSingleStockItem(itemId);
    let release!: () => void;
    let reachedRelations!: () => void;
    const waiting = new Promise<void>((resolve) => (reachedRelations = resolve));
    const gate = new Promise<void>((resolve) => (release = resolve));
    const originalLoad = Stock.prototype.load;
    let paused = false;
    const loadMock = mock.method(
      Stock.prototype,
      'load',
      async function (this: Stock, ...args: Parameters<typeof originalLoad>) {
        if (this.itemId === itemId && !paused) {
          paused = true;
          reachedRelations();
          await gate;
        }
        return originalLoad.apply(this, args);
      }
    );
    const read = service.fetchSingleStockItem(itemId);
    try {
      await waiting;
      const after = await service.updateSingleItemStock(
        itemId,
        {
          photos: [{ url: '/new-snapshot.jpg' }],
          prices: [{ ...newItemWithoutItemId.prices[0], price: 99.99 }],
        },
        before.version
      );
      release();
      const snapshot = await read;
      assert.equal(after.version, before.version + 1);
      assert.equal(snapshot.version, before.version);
      assert.deepEqual(
        snapshot.photos.map(({ url, name }) => ({ url, name })),
        before.photos.map(({ url, name }) => ({ url, name }))
      );
      assert.deepEqual(snapshot.prices, before.prices);
    } finally {
      release();
      await Promise.allSettled([read]);
      loadMock.mock.restore();
    }
  });

  for (const firstOperation of ['patch', 'delete'] as const) {
    test(`serializes ${firstOperation} before the other stock operation`, async ({ assert }) => {
      const { itemId } = await setupStock(0);
      const service = new AdminStockService();
      const before = await service.fetchSingleStockItem(itemId);
      const photos = [{ url: '/concurrent-photo.jpg', name: 'Concurrent' }];
      const prices = [newItemWithoutItemId.prices[0]];
      let releaseFirst!: () => void;
      let firstLocked!: () => void;
      const firstHasLock = new Promise<void>((resolve) => (firstLocked = resolve));
      const release = new Promise<void>((resolve) => (releaseFirst = resolve));
      const originalSave = Stock.prototype.save;
      let paused = false;
      const saveMock = mock.method(Stock.prototype, 'save', async function (this: Stock) {
        if (this.itemId === itemId && !paused) {
          paused = true;
          firstLocked();
          await release;
        }
        return originalSave.call(this);
      });

      const update = () =>
        service.updateSingleItemStock(
          itemId,
          { name: 'Concurrent update', photos, prices },
          before.version
        );
      const remove = () => service.deleteSingleItemStock(itemId);
      const first = firstOperation === 'patch' ? update() : remove();
      const knexClient = db.connection().getWriteClient().client;
      let onQuery: ((query: { sql: string; bindings?: unknown[] }) => void) | undefined;
      let watchdog: ReturnType<typeof setTimeout> | undefined;
      let second: Promise<unknown> | undefined;
      try {
        await firstHasLock;
        const probe = await db.transaction();
        try {
          await assert.rejects(() =>
            probe.rawQuery('SELECT id FROM stocks WHERE item_id = ? FOR UPDATE NOWAIT', [itemId])
          );
        } finally {
          await probe.rollback();
        }
        const secondRequestedLock = new Promise<void>((resolve, reject) => {
          onQuery = (query) => {
            if (/for update/i.test(query.sql) && query.bindings?.includes(itemId)) {
              resolve();
            }
          };
          knexClient.on('query', onQuery);
          watchdog = setTimeout(
            () => reject(new Error('Second operation did not request a lock')),
            5000
          );
        });
        second = firstOperation === 'patch' ? remove() : update();
        const result = second.then(
          (value) => ({ value, error: undefined }),
          (error: unknown) => ({ value: undefined, error })
        );
        await secondRequestedLock;
        releaseFirst();
        await first;
        const secondResult = await result;
        if (firstOperation === 'delete') {
          assert.instanceOf(secondResult.error, Error);
          assert.equal((secondResult.error as { status: number }).status, 404);
          const after = await service.fetchSingleStockItem(itemId);
          assert.equal(after.name, before.name);
          assert.deepEqual(
            after.photos.map(({ url, name }) => ({ url, name })),
            before.photos.map(({ url, name }) => ({ url, name }))
          );
          assert.deepEqual(after.prices, before.prices);
        } else {
          assert.isUndefined(secondResult.error);
          const after = await service.fetchSingleStockItem(itemId);
          assert.equal(after.name, 'Concurrent update');
          assert.equal(after.photos[0].url, photos[0].url);
          assert.deepEqual(after.prices, prices);
          assert.isNotNull(after.deletedAt);
        }
      } finally {
        if (onQuery) knexClient.off('query', onQuery);
        if (watchdog) clearTimeout(watchdog);
        releaseFirst();
        await Promise.allSettled([first, ...(second ? [second] : [])]);
        saveMock.mock.restore();
      }
    });
  }

  test('preserves order and invoice details after stock deletion', async ({ assert }) => {
    const { itemId } = await setupStock(1);
    const user = await new CreateUser(generateRoleUser()).create();
    const orderService = new OrderService();
    const item = { ...orderCreateWithAvailableStock.items[0], itemId };
    const order = await orderService.createOrder(
      { ...orderCreateWithAvailableStock, items: [item] },
      user.uuid
    );
    const invoiceNumber = await new SaveInvoice().save({
      orderId: order.orderId,
      userId: user.uuid,
      items: [
        {
          itemId,
          itemName: item.itemName,
          priceCurrency: item.currency,
          priceGross: item.itemPrice,
          qty: item.qty,
          vatAmount: item.vatAmount,
          vatRate: item.vatRate,
        },
      ],
      customer: {
        firstName: 'Test',
        lastName: 'Customer',
        customerType: InvoiceCustomerTypeEnum.PERSON,
        address: {
          city: 'Test city',
          countryCode: CountryCode.PL,
          postalCode: '01-234',
          streetName: 'Test street',
          streetNumber: '1',
        },
      },
    });
    const beforeOrder = await orderService.fetchUserSingleOrder(order.orderId, user.uuid);
    const beforeInvoice = await db.from('order_invoice_details').where('invoice_id', invoiceNumber);
    await new AdminStockService().deleteSingleItemStock(itemId);
    assert.deepEqual(
      await orderService.fetchUserSingleOrder(order.orderId, user.uuid),
      beforeOrder
    );
    assert.deepEqual(
      await db.from('order_invoice_details').where('invoice_id', invoiceNumber),
      beforeInvoice
    );
    await assert.rejects(() =>
      orderService.createOrder({ ...orderCreateWithAvailableStock, items: [item] }, user.uuid)
    );
  });
});
