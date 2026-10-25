import CustomerInvoiceDataPolicy from '#policies/customer_invoice_data_policy';
import InvoiceCustomerService from '#services/invoice_customer_service';
import {
  createInvoiceCustomerValidator,
  updateInvoiceCustomerValidator,
} from '#validators/invoice_customer';
import { inject } from '@adonisjs/core';
import type { HttpContext } from '@adonisjs/core/http';
import { ForbiddenException } from '#exceptions/domain_exception';

@inject()
export default class InvoiceCustomersController {
  constructor(private invoiceCustomerService: InvoiceCustomerService) {}

  async index({ auth, response }: HttpContext) {
    // User middleware ensures authentication, so auth.user is guaranteed to exist
    const customerInvoiceData = await this.invoiceCustomerService.fetchCustomerData(
      auth.user!.uuid
    );
    return response.ok(customerInvoiceData);
  }

  async store({ auth, request, response, bouncer }: HttpContext) {
    // User middleware ensures authentication, so auth.user is guaranteed to exist
    if (await bouncer.with(CustomerInvoiceDataPolicy).denies('create')) {
      throw new ForbiddenException('You are not authorized to create this resource');
    }

    const validatedInvoiceCustomerData = await request.validateUsing(
      createInvoiceCustomerValidator
    );

    const customerInvoiceDataId = await this.invoiceCustomerService.saveCustomerData({
      userId: auth.user!.uuid,
      ...validatedInvoiceCustomerData,
    });
    return response.created({ id: customerInvoiceDataId });
  }

  async update({ auth, request, response }: HttpContext) {
    // User middleware ensures authentication, so auth.user is guaranteed to exist
    const validatedInvoiceCustomerData = await request.validateUsing(
      updateInvoiceCustomerValidator
    );

    await this.invoiceCustomerService.updateCustomerData({
      userId: auth.user!.uuid,
      ...validatedInvoiceCustomerData,
    });
    return response.noContent();
  }
}
