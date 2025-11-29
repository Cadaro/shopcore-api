import { DateTime } from 'luxon';
import { BaseModel, column } from '@adonisjs/lucid/orm';
import { CountryCode } from '#types/enum/countryCode';

export default class OrderDeliveryAddress extends BaseModel {
  @column({ isPrimary: true, serializeAs: null })
  declare id: number;

  @column({ serializeAs: null })
  declare orderId: string;

  @column()
  declare streetName: string;

  @column()
  declare streetNumber: string;

  @column()
  declare apartmentNumber?: string;

  @column()
  declare city: string;

  @column()
  declare postalCode: string;

  @column()
  declare region?: string;

  @column()
  declare countryCode: CountryCode;

  @column.dateTime({ autoCreate: true, serializeAs: null })
  declare createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true, serializeAs: null })
  declare updatedAt: DateTime;
}
