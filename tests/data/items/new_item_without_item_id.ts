import { Currency } from '#types/enum/currency_code';
import { StockItemCreateDto } from '#types/stock';

export const newItemWithoutItemId: StockItemCreateDto = {
  itemDescription: 'It is a nice test item, very soft. Pls buy me.',
  name: 'Test item',
  vatAmount: 2.09,
  vatRate: 0.21,
  prices: [
    { currency: Currency.EUR, price: 9.99 },
    { currency: Currency.PLN, price: 42.99 },
  ],
  size: 'M',
  availableQty: 10,
  photos: [{ url: '../some/path/to/photo', name: 'photo of nice t-shirt' }],
};
