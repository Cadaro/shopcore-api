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
      'name',
      'price',
      'priceCurrency',
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
      'itemDescription',
      'name',
      'price',
      'priceCurrency',
      'vatAmount',
      'vatRate',
      'size',
      'availableQty',
      'photos',
    ]);
  });
});
