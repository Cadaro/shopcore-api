import { test } from '@japa/runner';
import StockDataMapper from '#mappers/stock/stock_data_mapper';
import Stock from '#models/stock';
import { Currency } from '#types/enum/currency_code';

test.group('Stock mappers', () => {
  test('maps stock create, update, summary and detail values', ({ assert }) => {
    const mapper = new StockDataMapper();
    const createDto = {
      itemId: 'item-1',
      name: 'Book',
      itemDescription: 'A book',
      size: 'M',
      color: 'BLACK',
      availableQty: 4,
      photos: [{ url: '/book.jpg', name: 'front' }],
      prices: [{ currency: Currency.GBP, price: 12.5, vatAmount: 2.5, vatRate: 0.2 }],
    };
    assert.deepEqual(mapper.mapStockItemCreateDtoToStockModel(createDto, 'SKU-1'), {
      itemId: 'item-1',
      sku: 'SKU-1',
      name: 'Book',
      itemDescription: 'A book',
      size: 'M',
      availableQty: 4,
      photos: [{ url: '/book.jpg', name: 'front' }],
      prices: createDto.prices,
    });
    const updateDto = {
      name: createDto.name,
      itemDescription: createDto.itemDescription,
      size: createDto.size,
      availableQty: createDto.availableQty,
      photos: createDto.photos,
      prices: createDto.prices,
    };
    assert.deepEqual(mapper.mapStockItemUpdateDtoToStockModel('item-1', updateDto, 'SKU-1'), {
      itemId: 'item-1',
      sku: 'SKU-1',
      ...updateDto,
    });

    const stock = Object.assign(new Stock(), {
      ...createDto,
      sku: 'SKU-1',
      createdAt: undefined,
      updatedAt: undefined,
    });
    assert.deepEqual(mapper.mapStockModelToStockItemSummary([stock])[0], {
      itemId: 'item-1',
      name: 'Book',
      sku: 'SKU-1',
      prices: createDto.prices,
      availableQty: 4,
      thumbnail: createDto.photos[0],
      createdAt: undefined,
      updatedAt: undefined,
    });
    assert.deepEqual(mapper.mapStockModelToSingleStockItemDto(stock), {
      itemId: 'item-1',
      sku: 'SKU-1',
      prices: createDto.prices,
      name: 'Book',
      itemDescription: 'A book',
      size: 'M',
      availableQty: 4,
      photos: createDto.photos,
    });
  });
});
