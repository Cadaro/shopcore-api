import { Currency } from '#types/enum/currencyCode';
import { StockItemCreateDto } from '#types/stock';

export const newItemWithoutItemId: StockItemCreateDto = {
  itemDescription: 'It is a nice test item, very soft. Pls buy me.',
  name: 'Test item',
  price: 9.99,
  vatAmount: 2.09,
  vatRate: 0.21,
  priceCurrency: Currency.EUR,
  size: 'M',
  availableQty: 10,
  photos: [{ url: '../some/path/to/photo', name: 'photo of nice t-shirt' }],
};
