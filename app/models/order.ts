import { DateTime } from 'luxon';
import { BaseModel, column, hasMany, hasOne } from '@adonisjs/lucid/orm';
import OrderDetail from '#models/order_detail';
import type { HasMany, HasOne } from '@adonisjs/lucid/types/relations';
import { DeliveryMethod } from '#types/enum/deliveryMethod';
import { Currency } from '#types/enum/currencyCode';
import { OrderStatus } from '#types/enum/orderStatus';
import { PaymentMethod } from '#types/enum/paymentMethod';
import OrderDeliveryAddress from '#models/order_delivery_address';

export default class Order extends BaseModel {
  @hasMany(() => OrderDetail, { foreignKey: 'orderId', localKey: 'orderId' })
  declare details: HasMany<typeof OrderDetail>;

  @hasOne(() => OrderDeliveryAddress, { foreignKey: 'orderId', localKey: 'orderId' })
  declare deliveryAddress: HasOne<typeof OrderDeliveryAddress>;

  @column({ isPrimary: true, serializeAs: null })
  declare id: number;

  @column()
  declare orderId: string;

  @column()
  declare status: OrderStatus;

  @column()
  declare firstName?: string;

  @column()
  declare lastName?: string;

  @column()
  declare companyName?: string;

  @column()
  declare email: string;

  @column()
  declare phoneNumber: string;

  @column()
  declare courier: string;

  @column()
  declare deliveryMethod: DeliveryMethod;

  @column()
  declare pickupPointId?: string;

  @column()
  declare additionalNote?: string;

  @column()
  declare deliveryPrice: number;

  @column()
  declare deliveryCurrency: Currency;

  @column()
  declare deliveryVatRate: number;

  @column()
  declare paymentMethod: PaymentMethod;

  @column({ serializeAs: null })
  declare userId: string;

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true, serializeAs: null })
  declare updatedAt: DateTime;
}
