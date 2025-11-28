import Stock from '#models/stock';
import { Currency } from '#types/enum/currencyCode';
import { BaseSeeder } from '@adonisjs/lucid/seeders';
import { randomUUID } from 'crypto';

export default class extends BaseSeeder {
  static environment: string[] = ['test', 'development'];
  async run() {
    await new Stock()
      .fill({
        itemId: randomUUID(),
        itemDescription: 'It is a nice test item, very soft. Pls buy me.',
        name: 'Test item',
        price: 9.99,
        priceCurrency: Currency.EUR,
        availableQty: 99,
        vatAmount: 2.53,
        vatRate: 0.19,
      })
      .related('photos')
      .createMany([{ url: '/path/to/photo.jpg', name: 'photo' }]);
    await new Stock()
      .fill({
        itemId: 'test-stock-item',
        itemDescription: 'Blue t-shirt in M size. Unisex.',
        name: 'blue t-shirt',
        price: 7.99,
        priceCurrency: Currency.EUR,
        size: 'M',
        availableQty: 72,
        vatAmount: 2.21,
        vatRate: 0.19,
      })
      .related('photos')
      .createMany([{ url: '/path/to/photo1.jpg', name: 'photo1' }, { url: '/path/to/photo2.jpg' }]);
    await new Stock()
      .fill({
        itemId: 'test-stock-item-chf',
        itemDescription: 'Blue t-shirt in M size. Unisex.',
        name: 'blue t-shirt',
        price: 7.99,
        priceCurrency: Currency.CHF,
        size: 'M',
        availableQty: 72,
        vatAmount: 2.21,
        vatRate: 0.19,
      })
      .related('photos')
      .createMany([{ url: '/path/to/photo1.jpg', name: 'photo1' }, { url: '/path/to/photo2.jpg' }]);
  }
}
