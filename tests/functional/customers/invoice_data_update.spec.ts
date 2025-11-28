import InvoiceCustomers from '#models/invoice_customer';
import User from '#models/user';
import TokenService from '#services/token_service';
import { generateRoleUser } from '#tests/data/users/roleUser';
import { CreateUser } from '#tests/data/users/user';
import { CountryCode } from '#types/enum/countryCode';
import { InvoiceCustomerData, InvoiceCustomerTypeEnum } from '#types/invoice';
import { test } from '@japa/runner';

test.group('Customers invoice data update', (group) => {
  let userWithPersonData: User;
  let userWithCompanyData: User;
  const invoicePersonCustomerData: InvoiceCustomerData = {
    customerType: InvoiceCustomerTypeEnum.PERSON,
    firstName: 'John',
    lastName: 'Doe',
    address: {
      streetName: 'Main Street',
      streetNumber: '123',
      postalCode: '12-345',
      city: 'Anytown',
      countryCode: CountryCode.PL,
    },
  };
  const invoiceCompanyCustomerData: InvoiceCustomerData = {
    customerType: InvoiceCustomerTypeEnum.COMPANY,
    companyName: 'Acme Corp',
    taxId: '123-456-78-90',
    address: {
      streetName: 'Business Avenue',
      streetNumber: '456',
      postalCode: '54-321',
      city: 'Corporate City',
      countryCode: CountryCode.PL,
    },
  };

  group.setup(async () => {
    // Create first user with person invoice data
    userWithPersonData = await new CreateUser(generateRoleUser()).create();
    await InvoiceCustomers.create({
      userId: userWithPersonData.uuid,
      customerType: invoicePersonCustomerData.customerType,
      firstName: invoicePersonCustomerData.firstName,
      lastName: invoicePersonCustomerData.lastName,
      streetName: invoicePersonCustomerData.address.streetName,
      streetNumber: invoicePersonCustomerData.address.streetNumber,
      city: invoicePersonCustomerData.address.city,
      postalCode: invoicePersonCustomerData.address.postalCode,
      countryCode: invoicePersonCustomerData.address.countryCode,
    });

    // Create second user with company invoice data
    userWithCompanyData = await new CreateUser(generateRoleUser()).create();
    await InvoiceCustomers.create({
      userId: userWithCompanyData.uuid,
      customerType: invoiceCompanyCustomerData.customerType,
      companyName: invoiceCompanyCustomerData.companyName,
      taxId: invoiceCompanyCustomerData.taxId,
      streetName: invoiceCompanyCustomerData.address.streetName,
      streetNumber: invoiceCompanyCustomerData.address.streetNumber,
      city: invoiceCompanyCustomerData.address.city,
      postalCode: invoiceCompanyCustomerData.address.postalCode,
      countryCode: invoiceCompanyCustomerData.address.countryCode,
    });
  });
  test('update invoice data for customer of type person', async ({ client, assert }) => {
    const invoiceDataToUpdate: InvoiceCustomerData = {
      customerType: InvoiceCustomerTypeEnum.PERSON,
      firstName: 'Jane',
      lastName: 'Doe',
      address: {
        streetName: 'Other Street',
        streetNumber: '456',
        postalCode: '12-345',
        city: 'Anytown',
        countryCode: CountryCode.PL,
      },
    };

    const tokenService = new TokenService();
    const token = await tokenService.createToken(userWithPersonData);

    const response = await client
      .put('/api/customers/invoice-data')
      .json(invoiceDataToUpdate)
      .bearerToken(token.token);

    response.assertStatus(204);
    const invoiceDataAfterUpdate = await InvoiceCustomers.findBy('userId', userWithPersonData.uuid);
    const mapper = new (await import('#mappers/invoice/InvoiceCustomerMapper')).default();
    const mappedData = mapper.mapInvoiceCustomerModelToInvoiceCustomerType(invoiceDataAfterUpdate!);
    assert.deepEqual(mappedData, invoiceDataToUpdate);
  });

  test('update invoice data for customer of type company', async ({ client, assert }) => {
    const invoiceDataToUpdate: InvoiceCustomerData = {
      customerType: InvoiceCustomerTypeEnum.COMPANY,
      companyName: 'Mole Corp',
      taxId: '123-456-78-AB',
      address: {
        streetName: 'Business Avenue',
        streetNumber: '456',
        postalCode: '12-345',
        city: 'Anytown',
        countryCode: CountryCode.PL,
      },
    };
    const tokenService = new TokenService();
    const token = await tokenService.createToken(userWithCompanyData);

    const response = await client
      .put('/api/customers/invoice-data')
      .json(invoiceDataToUpdate)
      .bearerToken(token.token);

    response.assertStatus(204);
    const invoiceDataAfterUpdate = await InvoiceCustomers.findBy(
      'userId',
      userWithCompanyData.uuid
    );

    const mapper = new (await import('#mappers/invoice/InvoiceCustomerMapper')).default();
    const mappedData = mapper.mapInvoiceCustomerModelToInvoiceCustomerType(invoiceDataAfterUpdate!);

    assert.deepEqual(mappedData, invoiceDataToUpdate);
  });
});
