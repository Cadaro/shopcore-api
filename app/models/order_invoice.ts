import { DateTime } from 'luxon';
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm';
import { CountryCode } from '#types/enum/countryCode';
import type { HasMany } from '@adonisjs/lucid/types/relations';
import OrderInvoiceDetail from './order_invoice_detail.js';
import { InvoiceCustomerTypeEnum } from '#types/invoice';

export default class OrderInvoice extends BaseModel {
  @hasMany(() => OrderInvoiceDetail, { foreignKey: 'invoiceId', localKey: 'invoiceId' })
  declare invoiceDetails: HasMany<typeof OrderInvoiceDetail>;

  @column({ isPrimary: true, serializeAs: null })
  declare id: number;

  @column()
  declare invoiceId: string;

  @column()
  declare orderId: string;

  @column()
  declare firstName?: string;

  @column()
  declare lastName?: string;

  @column()
  declare companyName?: string;

  @column()
  declare taxId?: string;

  @column()
  declare streetName: string;

  @column()
  declare streetNumber: string;

  @column()
  declare apartmentNumber?: string;

  @column()
  declare postalCode: string;

  @column()
  declare city: string;

  @column()
  declare region?: string;

  @column()
  declare countryCode: CountryCode;

  @column()
  declare customerType: InvoiceCustomerTypeEnum;

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime;
}
