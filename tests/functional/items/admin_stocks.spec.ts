import { test } from '@japa/runner';
import { randomUUID } from 'node:crypto';
import { DateTime } from 'luxon';
import Stock from '#models/stock';
import User from '#models/user';
import TokenService from '#services/token_service';
import { CreateUser } from '#tests/data/users/user';
import { generateRoleAdmin } from '#tests/data/users/role_admin';
import { generateRoleStaff } from '#tests/data/users/role_staff';
import { generateRoleUser } from '#tests/data/users/role_user';

test.group('Admin stocks', () => {
  async function createTokenForUser(user: InstanceType<typeof User>) {
    return new TokenService().createToken(user);
  }

  async function createStock(
    overrides: Partial<Pick<Stock, 'availableQty' | 'isVisible' | 'deletedAt'>> = {}
  ) {
    const itemId = randomUUID();
    return Stock.create({
      itemId,
      itemDescription: 'Admin stock test item',
      sku: `AS${itemId.slice(0, 3).toUpperCase()}-NC${itemId.slice(3, 5).toUpperCase()}-M`,
      name: `Admin stock test ${itemId}`,
      color: 'PURPLE',
      isVisible: true,
      size: 'M',
      availableQty: 1,
      ...overrides,
    });
  }

  test('allows admin and staff to list and retrieve stocks', async ({ assert, client }) => {
    const stock = await createStock({
      isVisible: false,
      deletedAt: DateTime.utc(),
      availableQty: 0,
    });

    for (const roleData of [generateRoleAdmin(), generateRoleStaff()]) {
      const user = await new CreateUser(roleData).create();
      const token = await createTokenForUser(user);
      const list = await client.get('/api/admin/stocks').bearerToken(token.token);
      list.assertStatus(200);
      const listedItemIds = (list.body().data as Array<{ itemId: string }>).map(
        (item) => item.itemId
      );
      if (!listedItemIds.includes(stock.itemId)) {
        throw new Error(`Admin stock list did not include ${stock.itemId}`);
      }
      assert.equal(
        list.body().data.find((item: { itemId: string }) => item.itemId === stock.itemId).version,
        1
      );

      const detail = await client.get(`/api/admin/stocks/${stock.itemId}`).bearerToken(token.token);
      detail.assertStatus(200);
      detail.assertBodyContains({ itemId: stock.itemId, availableQty: 0 });
      detail.assertBodyContains({ isVisible: false });
      assert.equal(detail.body().version, 1);
      assert.isString(detail.body().deletedAt);
    }
  });

  test('returns visible, hidden, soft-deleted, and zero-quantity stocks', async ({
    assert,
    client,
  }) => {
    const visible = await createStock({ availableQty: 0 });
    const hidden = await createStock({ isVisible: false, availableQty: 2 });
    const deleted = await createStock({ deletedAt: DateTime.utc() });
    const admin = await new CreateUser(generateRoleAdmin()).create();
    const token = await createTokenForUser(admin);

    const response = await client
      .get('/api/admin/stocks?page=1&perPage=100&sort=name:asc')
      .bearerToken(token.token);
    response.assertStatus(200);
    assert.equal(response.body().meta.page, 1);
    assert.equal(response.body().meta.perPage, 100);
    const stocks = response.body().data as Array<{
      itemId: string;
      availableQty: number;
      isVisible: boolean;
      deletedAt: string | null;
    }>;
    const visibleStock = stocks.find((item) => item.itemId === visible.itemId);
    const hiddenStock = stocks.find((item) => item.itemId === hidden.itemId);
    const deletedStock = stocks.find((item) => item.itemId === deleted.itemId);
    if (!visibleStock || !hiddenStock || !deletedStock) {
      throw new Error('Admin stock list omitted an expected stock');
    }
    assert.equal(visibleStock.isVisible, true);
    assert.isNull(visibleStock.deletedAt);
    assert.equal(hiddenStock.isVisible, false);
    assert.isNull(hiddenStock.deletedAt);
    assert.isNotNull(deletedStock.deletedAt);

    for (const stock of [visible, hidden, deleted]) {
      const detail = await client.get(`/api/admin/stocks/${stock.itemId}`).bearerToken(token.token);
      detail.assertStatus(200);
      assert.equal(detail.body().itemId, stock.itemId);
      assert.equal(detail.body().availableQty, stock.availableQty);
      assert.equal(detail.body().isVisible, stock.isVisible);
      if (stock.deletedAt) {
        assert.isString(detail.body().deletedAt);
      } else {
        assert.isNull(detail.body().deletedAt);
      }
    }
  });

  test('returns 403 for customers and 401 for anonymous requests', async ({ client }) => {
    const customer = await new CreateUser(generateRoleUser()).create();
    const token = await createTokenForUser(customer);

    const customerList = await client.get('/api/admin/stocks').bearerToken(token.token);
    customerList.assertStatus(403);
    const customerDetail = await client
      .get(`/api/admin/stocks/${randomUUID()}`)
      .bearerToken(token.token);
    customerDetail.assertStatus(403);

    const anonymousList = await client.get('/api/admin/stocks');
    anonymousList.assertStatus(401);
    const anonymousDetail = await client.get(`/api/admin/stocks/${randomUUID()}`);
    anonymousDetail.assertStatus(401);
  });
});
