import { DateTime } from 'luxon';
import { BaseModel, beforeFetch, column } from '@adonisjs/lucid/orm';
import { type OrderStatus } from '#types/enum/orderStatus';
import { type ModelQueryBuilderContract } from '@adonisjs/lucid/types/model';

export default class OrderStatusUpdate extends BaseModel {
  @column({ isPrimary: true, serializeAs: null })
  declare id: number;

  @column()
  declare orderId: string;

  @column()
  declare status: OrderStatus;

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime;

  @beforeFetch()
  static async fetchLatestStatus(query: ModelQueryBuilderContract<typeof OrderStatusUpdate>) {
    query.max('created_at');
  }
}
