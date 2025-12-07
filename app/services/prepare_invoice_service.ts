import InvoiceNumber from '#models/invoice_number';
import { DateSuffix, InvoiceNumberOptions, PreparedInvoiceNumber } from '#types/invoice';
import db from '@adonisjs/lucid/services/db';
import { DateTime } from 'luxon';
import string from '@adonisjs/core/helpers/string';
import { InvoiceUtil } from '#types/interfaces/invoice/InvoiceUtil';
/**
 * Service class for preparing invoice numbers based on specified options.
 * Generates new invoice numbers by incrementing the current sequence and formatting it with
 * optional prefix, separator, year, and month.
 */
export default class PrepareInvoice implements InvoiceUtil {
  private prefix: string;
  private separator: string;
  private useCurrentMonth: boolean;
  private currentYear: string;
  private currentMonth: string;
  constructor(options: InvoiceNumberOptions) {
    this.prefix = options.prefix;
    this.separator = options.separator;
    this.useCurrentMonth = options.useCurrentMonth;
    const { year, month } = this.buildDateSuffix(options);
    this.currentYear = year;
    this.currentMonth = month;
  }

  private buildDateSuffix(options: InvoiceNumberOptions): DateSuffix {
    const now = DateTime.now();
    return {
      year: now.get('year').toString(),
      month: options.useCurrentMonth ? now.get('month').toString() : '',
    };
  }
  private async getCurrentInvoiceNumber(): Promise<number> {
    return await db.transaction(async (trx) => {
      const currentInvoiceNumber = await InvoiceNumber.query({ client: trx }).forUpdate().first();
      if (!currentInvoiceNumber) {
        return 0;
      }
      return currentInvoiceNumber.invoiceNumberSequence;
    });
  }
  public async prepareNumber(): Promise<PreparedInvoiceNumber> {
    const currentInvoiceNumber = await this.getCurrentInvoiceNumber();
    const parts = [(currentInvoiceNumber + 1).toString()];
    if (this.useCurrentMonth) parts.push(this.currentMonth);
    parts.push(this.currentYear);

    return {
      newInvoiceNumber:
        this.prefix +
        ' ' +
        string.sentence(parts, {
          separator: this.separator,
          lastSeparator: this.separator,
          pairSeparator: this.separator,
        }),
      currentInvoiceNumberSequence: currentInvoiceNumber,
    };
  }
}
