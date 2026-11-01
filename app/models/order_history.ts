import { DateTime } from 'luxon';
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm';
import type { BelongsTo } from '@adonisjs/lucid/types/relations';
import { type OrderStatus } from '#types/enum/order_status';
import Order from '#models/order';

export default class OrderHistory extends BaseModel {
  @belongsTo(() => Order)
  declare order: BelongsTo<typeof Order>;

  @column({ isPrimary: true, serializeAs: null })
  declare id: number;

  @column()
  declare orderId: string;

  @column()
  declare status: OrderStatus;

  @column()
  declare isVisibleToCustomer: boolean;

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime;

  @column.dateTime()
  declare statusDatetime: DateTime;
}
