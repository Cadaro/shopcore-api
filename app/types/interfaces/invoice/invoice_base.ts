import { InvoiceNumberOptions, OrderInvoiceData } from '#types/invoice';

/** Base interface for invoice operations */
export interface InvoiceBase {
  save(invoiceData: OrderInvoiceData, options?: InvoiceNumberOptions): Promise<string>;
}
