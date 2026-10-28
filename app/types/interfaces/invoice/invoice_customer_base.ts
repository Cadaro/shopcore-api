import { InvoiceCustomerData, InvoiceCustomerWithUserId } from '#types/invoice';

/** Base interface for invoice customer operations */
export interface InvoiceCustomerBase {
  fetchCustomerData(userId: string): Promise<InvoiceCustomerData>;
  saveCustomerData(data: InvoiceCustomerWithUserId): Promise<number>;
  updateCustomerData(data: Partial<InvoiceCustomerWithUserId>): Promise<void>;
}
