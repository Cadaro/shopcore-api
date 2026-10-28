import { DateTime } from 'luxon';
import { BaseModel, column } from '@adonisjs/lucid/orm';
import { Currency } from '#types/enum/currencyCode';
import { moneyColumn } from '#models/types/money';

export default class OrderInvoiceDetail extends BaseModel {
  @column({ isPrimary: true, serializeAs: null })
  declare id: number;

  @column()
  declare invoiceId: string;

  @column()
  declare itemId: string;

  @column()
  declare itemName: string;

  @column()
  declare qty: number;

  @column(moneyColumn)
  declare priceGross: number;

  @column()
  declare priceCurrency: Currency;

  @column(moneyColumn)
  declare vatAmount: number;

  @column()
  declare vatRate: number;

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime;
}
