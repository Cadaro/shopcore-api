import InvoiceCustomerMapper from '#mappers/invoice/InvoiceCustomerMapper';
import InvoiceCustomers from '#models/invoice_customer';
import { InvoiceCustomerBase } from '#types/interfaces/invoice/InvoiceCustomerBase';
import { InvoiceCustomerData, InvoiceCustomerWithUserId } from '#types/invoice';
import db from '@adonisjs/lucid/services/db';

/**
 * Service class for managing invoice customer data.
 * Provides methods to fetch, save, and update customer invoice information in the database.
 */
export default class InvoiceCustomer implements InvoiceCustomerBase {
  private invoiceCustomerMapper = new InvoiceCustomerMapper();
  async fetchCustomerData(userId: string): Promise<InvoiceCustomerData> {
    const invoiceCustomerData = await InvoiceCustomers.findBy({ userId });

    if (!invoiceCustomerData) {
      throw new Error(`Invoice data for user ${userId} not found`);
    }
    return this.invoiceCustomerMapper.mapInvoiceCustomerModelToInvoiceCustomerType(
      invoiceCustomerData
    ) as InvoiceCustomerData;
  }
  /**
   * Saves invoice customer data for the given user.
   * Throws an error if customer data already exists for the user.
   *
   * @param userId - The ID of the user.
   * @param data - The invoice customer data to save.
   * @throws Error if customer data already exists for the user.
   */
  async saveCustomerData(data: InvoiceCustomerWithUserId): Promise<number> {
    const invoiceDataId = await db.transaction(async (trx) => {
      const invoiceCustomer = await InvoiceCustomers.findBy(
        { userId: data.userId },
        { client: trx }
      );
      if (invoiceCustomer) {
        throw new Error(`Invoice customer data already exists for user ${data.userId}`);
      }

      const invoiceData = await InvoiceCustomers.create(
        this.invoiceCustomerMapper.mapInvoiceCustomerTypeToInvoiceCustomerModel(data)
      );
      return invoiceData.id;
    });
    return invoiceDataId;
  }

  /**
   * Updates the invoice customer data for the given user.
   * Throws an error if the user does not exist in the database.
   * @param userId - The ID of the user whose invoice data is to be updated.
   * @param data - The new invoice customer data.
   * @throws Error if invoice data for the user is not found.
   */
  async updateCustomerData(data: InvoiceCustomerWithUserId): Promise<void> {
    await db.transaction(async (trx) => {
      const invoiceCustomer = await InvoiceCustomers.findBy(
        { userId: data.userId },
        { client: trx }
      );
      if (!invoiceCustomer) {
        throw new Error(`Invoice data for user ${data.userId} not found`);
      }

      await invoiceCustomer
        .merge(this.invoiceCustomerMapper.mapInvoiceCustomerTypeToInvoiceCustomerModel(data))
        .save();
    });
  }
}
