import Stock from '#models/stock';
import { Currency } from '#types/enum/currency_code';
import { BaseSeeder } from '@adonisjs/lucid/seeders';
import { randomUUID } from 'crypto';

export default class extends BaseSeeder {
  static environment: string[] = ['test', 'development'];
  async run() {
    const first = await Stock.create({
      itemId: randomUUID(),
      sku: 'TEST-ITEM',
      itemDescription: 'It is a nice test item, very soft. Pls buy me.',
      name: 'Test item',
      availableQty: 99,
    });
    await first.related('prices').createMany([
      { currency: Currency.EUR, price: 9.99, vatAmount: 2.53, vatRate: 0.19 },
      { currency: Currency.PLN, price: 42.99, vatAmount: 2.53, vatRate: 0.19 },
    ]);
    await first.related('photos').createMany([{ url: '/path/to/photo.jpg', name: 'photo' }]);

    const second = await Stock.create({
      itemId: 'test-stock-item',
      sku: 'BLUE-TSHIRT-M',
      itemDescription: 'Blue t-shirt in M size. Unisex.',
      name: 'blue t-shirt',
      size: 'M',
      availableQty: 72,
    });
    await second
      .related('prices')
      .createMany([{ currency: Currency.EUR, price: 7.99, vatAmount: 2.21, vatRate: 0.19 }]);
    await second
      .related('photos')
      .createMany([{ url: '/path/to/photo1.jpg', name: 'photo1' }, { url: '/path/to/photo2.jpg' }]);

    const third = await Stock.create({
      itemId: 'test-stock-item-chf',
      sku: 'BLUE-TSHIRT-M-CHF',
      itemDescription: 'Blue t-shirt in M size. Unisex.',
      name: 'blue t-shirt',
      size: 'M',
      availableQty: 72,
    });
    await third
      .related('prices')
      .createMany([{ currency: Currency.CHF, price: 7.99, vatAmount: 2.21, vatRate: 0.19 }]);
    await third
      .related('photos')
      .createMany([{ url: '/path/to/photo1.jpg', name: 'photo1' }, { url: '/path/to/photo2.jpg' }]);
  }
}
