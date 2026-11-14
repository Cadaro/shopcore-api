import { DateTime } from 'luxon';
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm';
import StockPhoto from '#models/stock_photo';
import type { HasMany } from '@adonisjs/lucid/types/relations';
import StockPrice from '#models/stock_price';

export default class Stock extends BaseModel {
  @hasMany(() => StockPhoto, { foreignKey: 'stockId', localKey: 'id' })
  declare photos: HasMany<typeof StockPhoto>;
  @hasMany(() => StockPrice, { foreignKey: 'stockId', localKey: 'id' })
  declare prices: HasMany<typeof StockPrice>;
  @column({ isPrimary: true, serializeAs: null })
  declare id: number;

  @column()
  declare itemId: string;

  @column()
  declare itemDescription: string;

  @column()
  declare sku: string;

  @column()
  declare name: string;

  @column()
  declare size: string;

  @column()
  declare availableQty: number;

  @column.dateTime({ autoCreate: true, serializeAs: null })
  declare createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true, serializeAs: null })
  declare updatedAt: DateTime;
}
