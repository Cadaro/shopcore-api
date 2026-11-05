import { StockItemDataDto, StockItemSummaryDto } from '#types/stock';
import { test } from '@japa/runner';

test.group('Items show', () => {
  test('get list of items (stocks)', async ({ assert, client }) => {
    const response = await client.get('/api/stocks');
    const stocks: Array<StockItemSummaryDto> = response.body().data;
    response.assertStatus(200);
    assert.isArray(stocks);
    assert.deepEqual(Object.keys(response.body().meta).sort(), [
      'lastPage',
      'page',
      'perPage',
      'total',
    ]);
    assert.equal(response.body().meta.page, 1);
    assert.equal(response.body().meta.perPage, 20);
    assert.onlyProperties(stocks[0], [
      'itemId',
      'sku',
      'name',
      'prices',
      'availableQty',
      'thumbnail',
      'createdAt',
      'updatedAt',
    ]);
    assert.isString(stocks[0].createdAt);
    assert.isString(stocks[0].updatedAt);
  });

  test('get detail of stock item', async ({ assert, client }) => {
    const responseStocks = await client.get('/api/stocks');
    const stocks: Array<StockItemSummaryDto> = responseStocks.body().data;
    const responseSingleStockItem = await client.get(`/api/stocks/${stocks[0].itemId}`);
    const singleStockItem: StockItemDataDto = responseSingleStockItem.body();
    responseSingleStockItem.assertStatus(200);
    assert.isObject(singleStockItem);
    assert.onlyProperties(singleStockItem, [
      'itemId',
      'sku',
      'itemDescription',
      'name',
      'prices',
      'size',
      'availableQty',
      'photos',
    ]);
    assert.isAtLeast(singleStockItem.prices.length, 1);
  });

  test('returns every currency price of a stock item', async ({ assert, client }) => {
    const stocks: Array<StockItemSummaryDto> = (await client.get('/api/stocks')).body().data;
    const multi = stocks.find((stock) => stock.sku === 'TEST-ITEM');
    assert.isDefined(multi);
    assert.deepEqual(multi!.prices, [
      { currency: 'EUR', price: 9.99, vatAmount: 2.53, vatRate: 0.19 },
      { currency: 'PLN', price: 42.99, vatAmount: 2.53, vatRate: 0.19 },
    ]);
    const detail = (await client.get(`/api/stocks/${multi!.itemId}`)).body();
    assert.deepEqual(detail.prices, multi!.prices);
  });

  test('paginates, sorts, and validates stock list parameters', async ({ assert, client }) => {
    const firstPage = await client.get('/api/stocks?page=1&perPage=2&sort=name:asc');
    firstPage.assertStatus(200);
    assert.lengthOf(firstPage.body().data, 2);
    assert.equal(firstPage.body().meta.page, 1);
    assert.equal(firstPage.body().meta.perPage, 2);
    assert.isAtLeast(firstPage.body().meta.total, 3);

    const secondPage = await client.get('/api/stocks?page=2&perPage=2&sort=name:asc');
    secondPage.assertStatus(200);
    assert.equal(secondPage.body().meta.total, firstPage.body().meta.total);
    assert.equal(secondPage.body().meta.lastPage, Math.ceil(firstPage.body().meta.total / 2));
    assert.isNotEmpty(secondPage.body().data);

    for (const query of [
      'page=0',
      'perPage=101',
      'sort=unknown:asc',
      'sort=itemId:asc',
      'sort=name:up',
    ]) {
      const invalid = await client.get(`/api/stocks?${query}`);
      invalid.assertStatus(422);
    }

    for (const sort of ['sku:desc', 'availableQty:asc', 'createdAt:desc', 'updatedAt:asc']) {
      const sorted = await client.get(`/api/stocks?sort=${sort}`);
      sorted.assertStatus(200);
    }
  });
});
