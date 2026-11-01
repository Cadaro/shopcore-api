import { DateTime } from 'luxon';
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm';
import { Currency } from '#types/enum/currency_code';
import { moneyColumn } from '#models/types/money';
import Stock from '#models/stock';
import type { BelongsTo } from '@adonisjs/lucid/types/relations';

export default class StockPrice extends BaseModel {
  @belongsTo(() => Stock, { foreignKey: 'stockId', localKey: 'id' })
  declare stock: BelongsTo<typeof Stock>;

  @column({ isPrimary: true, serializeAs: null })
  declare id: number;

  @column({ serializeAs: null })
  declare stockId: number;

  @column()
  declare currency: Currency;

  @column(moneyColumn)
  declare price: number;

  @column.dateTime({ autoCreate: true, serializeAs: null })
  declare createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true, serializeAs: null })
  declare updatedAt: DateTime;
}
