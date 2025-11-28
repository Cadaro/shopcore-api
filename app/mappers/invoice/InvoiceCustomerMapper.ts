import InvoiceCustomers from '#models/invoice_customer';
import {
  InvoiceCustomerData,
  InvoiceCustomerTypeEnum,
  InvoiceCustomerWithUserId,
} from '#types/invoice';

export default class InvoiceCustomerMapper {
  mapInvoiceCustomerModelToInvoiceCustomerType(
    invoiceCustomersModel: InvoiceCustomers
  ): InvoiceCustomerData {
    const result: InvoiceCustomerData = {
      customerType: invoiceCustomersModel.customerType,
      address: {
        city: invoiceCustomersModel.city,
        countryCode: invoiceCustomersModel.countryCode,
        streetName: invoiceCustomersModel.streetName,
        streetNumber: invoiceCustomersModel.streetNumber,
        postalCode: invoiceCustomersModel.postalCode,
      },
    };

    if (
      invoiceCustomersModel.customerType === InvoiceCustomerTypeEnum.PERSON &&
      (!invoiceCustomersModel.firstName || !invoiceCustomersModel.lastName)
    ) {
      throw new Error('Missing firstName or lastName for customer of type PERSON');
    }

    if (
      invoiceCustomersModel.customerType === InvoiceCustomerTypeEnum.COMPANY &&
      (!invoiceCustomersModel.companyName || !invoiceCustomersModel.taxId)
    ) {
      throw new Error('Missing companyName or taxId for customer of type COMPANY');
    }

    if (invoiceCustomersModel.customerType === InvoiceCustomerTypeEnum.COMPANY) {
      result.companyName = invoiceCustomersModel.companyName;
      result.taxId = invoiceCustomersModel.taxId;
    }

    if (invoiceCustomersModel.customerType === InvoiceCustomerTypeEnum.PERSON) {
      result.firstName = invoiceCustomersModel.firstName;
      result.lastName = invoiceCustomersModel.lastName;
    }

    if (invoiceCustomersModel.apartmentNumber) {
      result.address!.apartmentNumber = invoiceCustomersModel.apartmentNumber;
    }

    if (invoiceCustomersModel.region) {
      result.address!.region = invoiceCustomersModel.region;
    }

    return result as InvoiceCustomerData;
  }
  mapInvoiceCustomerTypeToInvoiceCustomerModel(
    invoiceCustomerData: InvoiceCustomerWithUserId
  ): Partial<InvoiceCustomers> {
    const result: Partial<InvoiceCustomers> = {
      userId: invoiceCustomerData.userId,
      firstName: invoiceCustomerData.firstName,
      lastName: invoiceCustomerData.lastName,
      companyName: invoiceCustomerData.companyName,
      taxId: invoiceCustomerData.taxId,
      city: invoiceCustomerData.address!.city,
      streetName: invoiceCustomerData.address!.streetName,
      streetNumber: invoiceCustomerData.address!.streetNumber,
      apartmentNumber: invoiceCustomerData.address?.apartmentNumber ?? '',
      region: invoiceCustomerData.address?.region ?? '',
      countryCode: invoiceCustomerData.address!.countryCode,
      postalCode: invoiceCustomerData.address!.postalCode,
      customerType: invoiceCustomerData.customerType,
    };

    return result;
  }
}
