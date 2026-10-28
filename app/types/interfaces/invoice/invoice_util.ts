import { PreparedInvoiceNumber } from '#types/invoice';

/** Invoice number components structure */
export interface InvoiceUtil {
  prepareNumber(): Promise<PreparedInvoiceNumber>;
}
