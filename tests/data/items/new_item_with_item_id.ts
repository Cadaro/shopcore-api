import { Currency } from '#types/enum/currency_code';
import { StockItemCreateDto } from '#types/stock';

export const newItemWithItemId: StockItemCreateDto = {
  itemId: 'test-item-123',
  itemDescription: 'It is a nice test item, very soft. Pls buy me.',
  name: 'Test item',
  color: 'BLACK',
  prices: [
    { currency: Currency.EUR, price: 9.99, vatAmount: 2.09, vatRate: 0.21 },
    { currency: Currency.PLN, price: 42.99, vatAmount: 9.02, vatRate: 0.23 },
  ],
  size: 'M',
  availableQty: 10,
  photos: [{ url: '../some/path/to/photo', name: 'photo of nice t-shirt' }],
};
