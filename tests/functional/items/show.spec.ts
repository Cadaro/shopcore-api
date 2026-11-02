import { StockItemDataDto, StockItemSummaryDto } from '#types/stock';
import { test } from '@japa/runner';

test.group('Items show', () => {
  test('get list of items (stocks)', async ({ assert, client }) => {
    const response = await client.get('/api/stocks');
    const stocks: Array<StockItemSummaryDto> = response.body();
    response.assertStatus(200);
    assert.isArray(stocks);
    assert.onlyProperties(stocks[0], [
      'itemId',
      'sku',
      'name',
      'prices',
      'availableQty',
      'thumbnail',
    ]);
  });

  test('get detail of stock item', async ({ assert, client }) => {
    const responseStocks = await client.get('/api/stocks');
    const stocks: Array<StockItemSummaryDto> = responseStocks.body();
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
    const stocks: Array<StockItemSummaryDto> = (await client.get('/api/stocks')).body();
    const multi = stocks.find((stock) => stock.sku === 'TEST-ITEM');
    assert.isDefined(multi);
    assert.deepEqual(multi!.prices, [
      { currency: 'EUR', price: 9.99, vatAmount: 2.53, vatRate: 0.19 },
      { currency: 'PLN', price: 42.99, vatAmount: 2.53, vatRate: 0.19 },
    ]);
    const detail = (await client.get(`/api/stocks/${multi!.itemId}`)).body();
    assert.deepEqual(detail.prices, multi!.prices);
  });
});
