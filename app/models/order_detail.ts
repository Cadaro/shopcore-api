import { DateTime } from 'luxon';
import { BaseModel, column } from '@adonisjs/lucid/orm';
import { Currency } from '#types/enum/currencyCode';

export default class OrderDetail extends BaseModel {
  @column({ isPrimary: true, serializeAs: null })
  declare id: number;

  @column({ serializeAs: null })
  declare orderId: string;

  @column()
  declare itemId: string;

  @column()
  declare itemName: string;

  @column()
  declare qty: number;

  @column()
  declare itemPrice: number;

  @column()
  declare currency: Currency;

  @column()
  declare vatAmount: number;

  @column()
  declare vatRate: number;

  @column.dateTime({ autoCreate: true, serializeAs: null })
  declare createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true, serializeAs: null })
  declare updatedAt: DateTime;
}
