import { DateTime } from 'luxon';
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm';
import Stock from '#models/stock';
import type { BelongsTo } from '@adonisjs/lucid/types/relations';

export default class StockPhoto extends BaseModel {
  @belongsTo(() => Stock, { foreignKey: 'stockId', localKey: 'id' })
  declare stock: BelongsTo<typeof Stock>;

  @column({ isPrimary: true, serializeAs: null })
  declare id: number;

  @column({ serializeAs: null })
  declare stockId: number;

  @column()
  declare url: string;

  @column()
  declare name: string;

  @column.dateTime({ autoCreate: true, serializeAs: null })
  declare createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true, serializeAs: null })
  declare updatedAt: DateTime;
}
