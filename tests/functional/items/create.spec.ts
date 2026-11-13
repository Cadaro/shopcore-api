import User from '#models/user';
import TokenService from '#services/token_service';
import { test } from '@japa/runner';
import { newItemWithoutItemId } from '../../data/items/new_item_without_item_id.js';
import { newItemWithItemId } from '../../data/items/new_item_with_item_id.js';
import { generateRoleUser } from '#tests/data/users/role_user';
import { generateRoleAdmin } from '#tests/data/users/role_admin';
import { generateRoleStaff } from '#tests/data/users/role_staff';
import { CreateUser } from '#tests/data/users/user';
import { StockItemCreatedDto } from '#types/stock';
import { randomUUID } from 'node:crypto';
import Stock from '#models/stock';
import StockPrice from '#models/stock_price';
import StockService from '#services/stock_service';
import { Currency } from '#types/enum/currency_code';
import db from '@adonisjs/lucid/services/db';
import redis from '@adonisjs/redis/services/main';
import env from '#start/env';

test.group('Items create', (group) => {
  let guestToken: string;

  group.each.setup(async () => {
    guestToken = randomUUID();
    await redis.set(
      `guest-session:${guestToken}`,
      '1',
      'EX',
      env.get('GUEST_SESSION_TTL_SECONDS', 86400)
    );
  });

  async function createTokenForUser(user: InstanceType<typeof User>) {
    const tokenService = new TokenService();
    return await tokenService.createToken(user);
  }

  test('should fail to create a new item by unauthenticated user', async ({ client }) => {
    const response = await client.post('/api/stocks').json(newItemWithoutItemId);
    response.assertStatus(401);
  });

  test('should fail to create a new item by role user', async ({ client }) => {
    const user = await new CreateUser(generateRoleUser()).create();

    const token = await createTokenForUser(user);

    const response = await client
      .post('/api/stocks')
      .json(newItemWithoutItemId)
      .bearerToken(token.token);
    response.assertStatus(403);
  });

  test('should allow staff to create and update stock', async ({ client }) => {
    const staff = await new CreateUser(generateRoleStaff()).create();
    const token = await createTokenForUser(staff);
    const created = await client
      .post('/api/stocks')
      .json(newItemWithoutItemId)
      .bearerToken(token.token);
    created.assertStatus(201);

    const updated = await client
      .put(`/api/stocks/${created.body().itemId}`)
      .json(newItemWithoutItemId)
      .bearerToken(token.token);
    updated.assertStatus(200);
  });

  test('rejects fractional minor-unit VAT amounts', async ({ client }) => {
    const admin = await new CreateUser(generateRoleAdmin()).create();
    const token = await createTokenForUser(admin);
    const response = await client
      .post('/api/stocks')
      .json({
        ...newItemWithoutItemId,
        prices: [
          { ...newItemWithoutItemId.prices[0], vatAmount: 0.001 },
          ...newItemWithoutItemId.prices.slice(1),
        ],
      })
      .bearerToken(token.token);
    response.assertStatus(422);
  });

  test('should create a new item by role admin without provided itemId', async ({
    assert,
    client,
  }) => {
    const admin = await new CreateUser(generateRoleAdmin()).create();

    const token = await createTokenForUser(admin);

    const response = await client
      .post('/api/stocks')
      .json(newItemWithoutItemId)
      .bearerToken(token.token);
    response.assertStatus(201);
    const body = response.body();
    assert.onlyProperties(body, ['itemId']);
    assert.isString(body.itemId, 'itemId should be a string');
    //check if itemId is a valid UUID v4
    const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    assert.match(body.itemId, uuidV4Regex, 'itemId should be a valid UUID v4');
    const stored = await db.from('stocks').where('item_id', body.itemId).first();
    const storedPhotos = await db.from('stock_photos').where('stock_id', stored.id);
    assert.deepEqual(
      storedPhotos.map((photo) => [photo.url, photo.name]),
      [['../some/path/to/photo', 'photo of nice t-shirt']]
    );
    const storedPrices = await db.from('stock_prices').where('stock_id', stored.id).orderBy('id');
    assert.deepEqual(
      storedPrices.map((row) => [row.currency, Number(row.price)]),
      [
        ['EUR', 999],
        ['PLN', 4299],
      ]
    );
    assert.deepEqual(
      storedPrices.map((row) => [row.currency, Number(row.vat_amount), Number(row.vat_rate)]),
      [
        ['EUR', 209, 0.21],
        ['PLN', 902, 0.23],
      ]
    );
    const show = await client.get(`/api/stocks/${body.itemId}`).header('X-Guest-Token', guestToken);
    show.assertStatus(200);
    assert.deepEqual(show.body().prices, [
      { currency: 'EUR', price: 9.99, vatAmount: 2.09, vatRate: 0.21 },
      { currency: 'PLN', price: 42.99, vatAmount: 9.02, vatRate: 0.23 },
    ]);
    assert.deepEqual(
      show
        .body()
        .prices.map((price: { currency: Currency; vatAmount: number; vatRate: number }) => [
          price.currency,
          price.vatAmount,
          price.vatRate,
        ]),
      [
        [Currency.EUR, 2.09, 0.21],
        [Currency.PLN, 9.02, 0.23],
      ]
    );
  });

  test('should create a new item by role admin with provided itemId', async ({
    assert,
    client,
  }) => {
    const admin = await new CreateUser(generateRoleAdmin()).create();

    const token = await createTokenForUser(admin);

    const response = await client
      .post('/api/stocks')
      .json(newItemWithItemId)
      .bearerToken(token.token);
    response.assertStatus(201);
    const createdStockItem: StockItemCreatedDto = response.body();
    assert.onlyProperties(createdStockItem, ['itemId']);
    assert.isString(createdStockItem.itemId, 'itemId should be a string');
    assert.equal(
      createdStockItem.itemId,
      newItemWithItemId.itemId,
      'itemId should match the provided one'
    );
  });

  test('rejects duplicate currencies and empty prices', async ({ assert, client }) => {
    const admin = await new CreateUser(generateRoleAdmin()).create();
    const token = await createTokenForUser(admin);
    const duplicate = await client
      .post('/api/stocks')
      .json({
        ...newItemWithoutItemId,
        prices: [
          { currency: Currency.EUR, price: 1 },
          { currency: Currency.EUR, price: 2 },
        ],
      })
      .bearerToken(token.token);
    duplicate.assertStatus(422);
    const empty = await client
      .post('/api/stocks')
      .json({ ...newItemWithoutItemId, prices: [] })
      .bearerToken(token.token);
    empty.assertStatus(422);
    assert.isTrue(true);
  });

  test('ignores a supplied sku and generates a fixed-length sku', async ({ assert, client }) => {
    const admin = await new CreateUser(generateRoleAdmin()).create();
    const token = await createTokenForUser(admin);
    const sku = `SKU-${randomUUID()}`;
    const first = await client
      .post('/api/stocks')
      .json({ ...newItemWithoutItemId, sku })
      .bearerToken(token.token);
    first.assertStatus(201);
    const show = await client
      .get(`/api/stocks/${first.body().itemId}`)
      .header('X-Guest-Token', guestToken);
    assert.notEqual(show.body().sku, sku);
    assert.match(show.body().sku, /^[A-Z0-9]{10}$/);
    const second = await client
      .post('/api/stocks')
      .json({ ...newItemWithoutItemId, sku })
      .bearerToken(token.token);
    second.assertStatus(201);
  });

  test('requires color when creating stock', async ({ client }) => {
    const admin = await new CreateUser(generateRoleAdmin()).create();
    const token = await createTokenForUser(admin);
    const { color: _color, ...stockWithoutColor } = newItemWithoutItemId;
    const response = await client
      .post('/api/stocks')
      .json(stockWithoutColor)
      .bearerToken(token.token);
    response.assertStatus(422);
  });

  test('replaces stock details and prices on update', async ({ assert, client }) => {
    const admin = await new CreateUser(generateRoleAdmin()).create();
    const token = await createTokenForUser(admin);
    const itemId = randomUUID();
    const initial = await client
      .post('/api/stocks')
      .json({ ...newItemWithoutItemId, itemId, sku: `SKU-${randomUUID()}` })
      .bearerToken(token.token);
    initial.assertStatus(201);
    const originalSku = (await db.from('stocks').where('item_id', itemId).first()).sku;
    assert.match(originalSku, /^[A-Z0-9]{10}$/);

    const replacement = {
      ...newItemWithoutItemId,
      sku: `SKU-${randomUUID()}`,
      prices: [
        { currency: Currency.DKK, price: 12.34, vatAmount: 2.34, vatRate: 0.19 },
        { currency: Currency.EUR, price: 8.76, vatAmount: 1.76, vatRate: 0.21 },
      ],
    };
    const updated = await client
      .put(`/api/stocks/${itemId}`)
      .json(replacement)
      .bearerToken(token.token);
    updated.assertStatus(200);
    assert.equal(updated.body().sku, originalSku);
    assert.deepEqual(updated.body().prices, replacement.prices);
    const storedStock = await db.from('stocks').where('item_id', itemId).first();
    const storedPhotos = await db.from('stock_photos').where('stock_id', storedStock.id);
    assert.deepEqual(
      storedPhotos.map((photo) => [photo.url, photo.name]),
      replacement.photos.map((photo) => [photo.url, photo.name])
    );

    const invalidUpdate = await client
      .put(`/api/stocks/${itemId}`)
      .json({
        ...replacement,
        prices: [
          { currency: Currency.DKK, price: 1 },
          { currency: Currency.DKK, price: 2 },
        ],
      })
      .bearerToken(token.token);
    invalidUpdate.assertStatus(422);
    const detail = await client.get(`/api/stocks/${itemId}`).header('X-Guest-Token', guestToken);
    assert.deepEqual(detail.body().prices, replacement.prices);
  });

  test('rolls back the stock when a price insert fails', async ({ assert }) => {
    const itemId = randomUUID();
    await assert.rejects(() =>
      new StockService().createSingleItemStock({
        ...newItemWithoutItemId,
        itemId,
        prices: [
          { currency: Currency.EUR, price: 1, vatAmount: 0, vatRate: 0 },
          { currency: Currency.EUR, price: 2, vatAmount: 0, vatRate: 0 },
        ],
      })
    );
    assert.isNull(await db.from('stocks').where('item_id', itemId).first());
  });

  test('enforces one price per currency per stock in the database', async ({ assert }) => {
    const itemId = randomUUID();
    const stock = await Stock.create({
      itemId,
      itemDescription: 'Unique price test',
      name: 'Unique price test',
      availableQty: 1,
    });
    await StockPrice.create({
      stockId: stock.id,
      currency: Currency.EUR,
      price: 1,
      vatAmount: 0,
      vatRate: 0,
    });
    await assert.rejects(() =>
      StockPrice.create({
        stockId: stock.id,
        currency: Currency.EUR,
        price: 2,
        vatAmount: 0,
        vatRate: 0,
      })
    );
    await StockPrice.create({
      stockId: stock.id,
      currency: Currency.PLN,
      price: 2,
      vatAmount: 0,
      vatRate: 0,
    });
  });
});
