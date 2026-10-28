import { DateTime } from 'luxon';
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm';
import StockPhoto from '#models/stock_photo';
import type { HasMany } from '@adonisjs/lucid/types/relations';
import { Currency } from '#types/enum/currencyCode';
import { moneyColumn } from '#models/types/money';

export default class Stock extends BaseModel {
  @hasMany(() => StockPhoto, { foreignKey: 'itemId', localKey: 'itemId' })
  declare photos: HasMany<typeof StockPhoto>;
  @column({ isPrimary: true, serializeAs: null })
  declare id: number;

  @column()
  declare itemId: string;

  @column()
  declare itemDescription: string;

  @column(moneyColumn)
  declare price: number;

  @column()
  declare priceCurrency: Currency;

  @column()
  declare name: string;

  @column()
  declare size: string;

  @column()
  declare availableQty: number;

  @column(moneyColumn)
  declare vatAmount: number;

  @column()
  declare vatRate: number;

  @column.dateTime({ autoCreate: true, serializeAs: null })
  declare createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true, serializeAs: null })
  declare updatedAt: DateTime;
}
