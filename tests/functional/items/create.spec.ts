import User from '#models/user';
import TokenService from '#services/token_service';
import { test } from '@japa/runner';
import { newItemWithoutItemId } from '../../data/items/newItemWithoutItemId.js';
import { newItemWithItemId } from '../../data/items/newItemWithItemId.js';
import { generateRoleUser } from '#tests/data/users/roleUser';
import { generateRoleAdmin } from '#tests/data/users/roleAdmin';
import { CreateUser } from '#tests/data/users/user';
import { StockItemCreatedDto } from '#types/stock';
import db from '@adonisjs/lucid/services/db';

test.group('Items create', () => {
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

  test('rejects fractional minor-unit VAT amounts', async ({ client }) => {
    const admin = await new CreateUser(generateRoleAdmin()).create();
    const token = await createTokenForUser(admin);
    const response = await client
      .post('/api/stocks')
      .json({ ...newItemWithoutItemId, vatAmount: 0.001 })
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
    assert.equal(Number(stored.price), 999);
    assert.equal(Number(stored.vat_amount), 209);
    const show = await client.get(`/api/stocks/${body.itemId}`);
    show.assertStatus(200);
    assert.equal(show.body().price, 9.99);
    assert.equal(show.body().vatAmount, 2.09);
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
});
