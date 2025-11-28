import { CountryCode } from '#types/enum/countryCode';
import { InvoiceCustomerTypeEnum } from '#types/invoice';
import vine, { SimpleMessagesProvider } from '@vinejs/vine';
import { Address } from '#validatorTypes/address';

/**
 * Validator to validate the payload when creating invoice customer data
 */
export const createInvoiceCustomerValidator = vine.compile(
  vine.object({
    firstName: vine
      .string()
      .minLength(3)
      .maxLength(50)
      .optional()
      .requiredWhen('customerType', '=', InvoiceCustomerTypeEnum.PERSON),
    lastName: vine
      .string()
      .minLength(2)
      .maxLength(50)
      .optional()
      .requiredWhen('customerType', '=', InvoiceCustomerTypeEnum.PERSON),
    companyName: vine
      .string()
      .minLength(2)
      .maxLength(100)
      .optional()
      .requiredWhen('customerType', '=', InvoiceCustomerTypeEnum.COMPANY),
    taxId: vine
      .string()
      .minLength(2)
      .maxLength(100)
      .optional()
      .requiredWhen('customerType', '=', InvoiceCustomerTypeEnum.COMPANY),
    customerType: vine.enum(InvoiceCustomerTypeEnum),
    address: Address,
  })
);
export const updateInvoiceCustomerValidator = vine.compile(
  vine.object({
    firstName: vine
      .string()
      .minLength(3)
      .maxLength(50)
      .optional()
      .requiredWhen('customerType', '=', InvoiceCustomerTypeEnum.PERSON),
    lastName: vine
      .string()
      .minLength(2)
      .maxLength(50)
      .optional()
      .requiredWhen('customerType', '=', InvoiceCustomerTypeEnum.PERSON),
    companyName: vine
      .string()
      .minLength(2)
      .maxLength(100)
      .optional()
      .requiredWhen('customerType', '=', InvoiceCustomerTypeEnum.COMPANY),
    taxId: vine
      .string()
      .minLength(2)
      .maxLength(100)
      .optional()
      .requiredWhen('customerType', '=', InvoiceCustomerTypeEnum.COMPANY),
    customerType: vine.enum(InvoiceCustomerTypeEnum),
    address: Address,
  })
);

const message = {
  required: 'The {{ field }} field is required',
  countryCodeOptions: `The selected country code is invalid. Supported country codes are: ${Object.values(CountryCode).join(', ')}`,
  postalCode: 'The {{ field }} field must be a valid postal code',
  postalCodeRequiresCountry: 'The country code must be provided to validate postal code',
  postalCodeInvalid: 'The postal code format is invalid for the specified country',
  postalCodeUnsupported: 'Postal code validation not supported for the specified country',
  minLength: 'The {{ field }} field must be at least {{ options.minLength }} characters',
  maxLength: 'The {{ field }} field must not exceed {{ options.maxLength }} characters',
  enum: 'The selected {{ field }} is invalid. Valid options are: {{ options.choices }}',
  requiredWhen:
    'The {{ field }} field is required when {{ options.otherField }} is {{ options.value }}',
};

const fields = {
  'firstName': 'firstName',
  'lastName': 'lastName',
  'companyName': 'companyName',
  'taxId': 'taxId',
  'customerType': 'customerType',
  'invoiceAddress.streetName': 'streetName',
  'invoiceAddress.streetNumber': 'streetNumber',
  'invoiceAddress.city': 'city',
  'invoiceAddress.postalCode': 'postalCode',
  'invoiceAddress.countryCode': 'countryCode',
};

createInvoiceCustomerValidator.messagesProvider = new SimpleMessagesProvider(message, fields);
