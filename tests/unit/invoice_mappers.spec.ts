import { test } from '@japa/runner';
import { DomainRuleException } from '#exceptions/domain_exception';
import InvoiceCustomerMapper from '#mappers/invoice/invoice_customer_mapper';
import InvoiceDataMapper from '#mappers/invoice/invoice_data_mapper';
import InvoiceCustomers from '#models/invoice_customer';
import { CountryCode } from '#types/enum/country_code';
import { Currency } from '#types/enum/currency_code';
import { InvoiceCustomerTypeEnum } from '#types/invoice';

function captureError(callback: () => unknown): unknown {
  try {
    callback();
  } catch (error) {
    return error;
  }
  return undefined;
}

test.group('Invoice mappers', () => {
  test('maps invoice head and line details', ({ assert }) => {
    const mapper = new InvoiceDataMapper();
    const invoice = {
      orderId: 'order-1',
      userId: 'user-1',
      items: [],
      customer: {
        customerType: InvoiceCustomerTypeEnum.PERSON,
        firstName: 'Ada',
        lastName: 'Lovelace',
        address: {
          city: 'London',
          countryCode: CountryCode.GB,
          postalCode: 'SW1A',
          streetName: 'St James',
          streetNumber: '1',
          apartmentNumber: '2A',
          region: 'Greater London',
        },
      },
    };

    assert.deepEqual(mapper.mapInvoiceHead(invoice, 'INV/1'), {
      invoiceId: 'INV/1',
      orderId: 'order-1',
      firstName: 'Ada',
      lastName: 'Lovelace',
      city: 'London',
      countryCode: CountryCode.GB,
      postalCode: 'SW1A',
      streetName: 'St James',
      streetNumber: '1',
      apartmentNumber: '2A',
      region: 'Greater London',
    });
    assert.deepEqual(
      mapper.mapInvoiceDetails([
        {
          itemId: 'item-1',
          itemName: 'Book',
          qty: 2,
          itemPrice: 12.5,
          currency: Currency.GBP,
          vatAmount: 2.5,
          vatRate: 0.2,
        },
      ]),
      [
        {
          itemId: 'item-1',
          itemName: 'Book',
          qty: 2,
          priceGross: 12.5,
          priceCurrency: Currency.GBP,
          vatAmount: 2.5,
          vatRate: 0.2,
        },
      ]
    );
  });

  test('maps customer records and rejects incomplete person or company records', ({ assert }) => {
    const mapper = new InvoiceCustomerMapper();
    const person = Object.assign(new InvoiceCustomers(), {
      customerType: InvoiceCustomerTypeEnum.PERSON,
      firstName: 'Ada',
      lastName: 'Lovelace',
      city: 'London',
      countryCode: CountryCode.GB,
      streetName: 'St James',
      streetNumber: '1',
      postalCode: 'SW1A',
      apartmentNumber: '',
      region: '',
    });

    assert.deepEqual(mapper.mapInvoiceCustomerModelToInvoiceCustomerType(person), {
      customerType: InvoiceCustomerTypeEnum.PERSON,
      firstName: 'Ada',
      lastName: 'Lovelace',
      address: {
        city: 'London',
        countryCode: CountryCode.GB,
        streetName: 'St James',
        streetNumber: '1',
        postalCode: 'SW1A',
      },
    });

    const company = {
      userId: 'user-1',
      customerType: InvoiceCustomerTypeEnum.COMPANY,
      companyName: 'Analytical Engines Ltd',
      taxId: 'GB123',
      address: {
        city: 'London',
        countryCode: CountryCode.GB,
        streetName: 'St James',
        streetNumber: '1',
        postalCode: 'SW1A',
      },
    };
    assert.deepEqual(mapper.mapInvoiceCustomerTypeToInvoiceCustomerModel(company), {
      userId: 'user-1',
      firstName: undefined,
      lastName: undefined,
      companyName: 'Analytical Engines Ltd',
      taxId: 'GB123',
      city: 'London',
      streetName: 'St James',
      streetNumber: '1',
      apartmentNumber: '',
      region: '',
      countryCode: CountryCode.GB,
      postalCode: 'SW1A',
      customerType: InvoiceCustomerTypeEnum.COMPANY,
    });

    for (const customerType of [InvoiceCustomerTypeEnum.PERSON, InvoiceCustomerTypeEnum.COMPANY]) {
      const invalidCustomer = Object.assign(new InvoiceCustomers(), {
        customerType,
        city: 'London',
        countryCode: CountryCode.GB,
        streetName: 'St James',
        streetNumber: '1',
        postalCode: 'SW1A',
      });
      assert.instanceOf(
        captureError(() => mapper.mapInvoiceCustomerModelToInvoiceCustomerType(invalidCustomer)),
        DomainRuleException
      );
    }
  });
});
