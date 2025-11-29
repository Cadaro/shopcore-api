import InvoiceCustomers from '#models/invoice_customer';
import TokenService from '#services/token_service';
import { generateRoleUser } from '#tests/data/users/roleUser';
import { CreateUser } from '#tests/data/users/user';
import { CountryCode } from '#types/enum/countryCode';
import {
  InvoiceCustomerData,
  InvoiceCustomerTypeEnum,
  InvoiceCustomerWithUserId,
} from '#types/invoice';
import { test } from '@japa/runner';
import { randomUUID } from 'crypto';

test.group('Customers invoice create', () => {
  test('create invoice data for customer of type person', async ({ client }) => {
    const user = await new CreateUser(generateRoleUser()).create();
    const invoiceCustomerData: InvoiceCustomerData = {
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

    // Use TokenService to create a proper token with correct abilities
    const tokenService = new TokenService();
    const token = await tokenService.createToken(user);

    const response = await client
      .post('/api/customers/invoice-data')
      .json(invoiceCustomerData)
      .bearerToken(token.token);

    response.assertStatus(201);
  });

  test('create invoice data for customer of type company', async ({ client }) => {
    const user = await new CreateUser(generateRoleUser()).create();
    const invoiceCustomerData: InvoiceCustomerData = {
      customerType: InvoiceCustomerTypeEnum.COMPANY,
      companyName: 'Acme Corp',
      taxId: '123-456-78-90',
      address: {
        streetName: 'Main Street',
        streetNumber: '123',
        postalCode: '12-345',
        city: 'Anytown',
        countryCode: CountryCode.PL,
      },
    };

    // Use TokenService to create a proper token with correct abilities
    const tokenService = new TokenService();
    const token = await tokenService.createToken(user);

    const response = await client
      .post('/api/customers/invoice-data')
      .json(invoiceCustomerData)
      .bearerToken(token.token);

    response.assertStatus(201);
  });

  test('create invoice data for customer of type company with missing tax ID and company name', async ({
    client,
  }) => {
    const user = await new CreateUser(generateRoleUser()).create();
    const invoiceCustomerData: InvoiceCustomerData = {
      customerType: InvoiceCustomerTypeEnum.COMPANY,
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

    // Use TokenService to create a proper token with correct abilities
    const tokenService = new TokenService();
    const token = await tokenService.createToken(user);

    const response = await client
      .post('/api/customers/invoice-data')
      .json(invoiceCustomerData)
      .bearerToken(token.token);
    response.assertStatus(422);
  });

  test('create invoice data for customer of type person with incorrect postal code', async ({
    client,
  }) => {
    const user = await new CreateUser(generateRoleUser()).create();
    const invoiceCustomerData: InvoiceCustomerData = {
      customerType: InvoiceCustomerTypeEnum.PERSON,
      firstName: 'John',
      lastName: 'Doe',
      address: {
        streetName: 'Main Street',
        streetNumber: '123',
        postalCode: '12345',
        city: 'Anytown',
        countryCode: CountryCode.PL,
      },
    };

    // Use TokenService to create a proper token with correct abilities
    const tokenService = new TokenService();
    const token = await tokenService.createToken(user);

    const response = await client
      .post('/api/customers/invoice-data')
      .json(invoiceCustomerData)
      .bearerToken(token.token);

    response.assertStatus(422);
  });
  test('invoice customer model to invoice customer type mapping - person type', async ({
    assert,
  }) => {
    const invoiceCustomersModel = await InvoiceCustomers.first();
    assert.isNotNull(invoiceCustomersModel, 'Invoice customer model should not be null');

    const mapper = new (await import('#mappers/invoice/InvoiceCustomerMapper')).default();
    const mappedData = mapper.mapInvoiceCustomerModelToInvoiceCustomerType(invoiceCustomersModel!);

    assert.equal(mappedData.firstName, invoiceCustomersModel!.firstName);
    assert.equal(mappedData.lastName, invoiceCustomersModel!.lastName);
    assert.equal(mappedData.customerType, invoiceCustomersModel!.customerType);
    assert.equal(mappedData.address.streetName, invoiceCustomersModel!.streetName);
    assert.equal(mappedData.address.streetNumber, invoiceCustomersModel!.streetNumber);
    assert.equal(mappedData.address.city, invoiceCustomersModel!.city);
    assert.equal(mappedData.address.postalCode, invoiceCustomersModel!.postalCode);
    assert.equal(mappedData.address.countryCode, invoiceCustomersModel!.countryCode);
    assert.isUndefined(mappedData.companyName, 'Company name should be undefined for person type');
    assert.isUndefined(mappedData.taxId, 'Tax ID should be undefined for person type');
  });

  test('invoice customer type to invoice customer model mapping for type person', async ({
    assert,
  }) => {
    const invoicePersonCustomerData: InvoiceCustomerWithUserId = {
      userId: randomUUID(),
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
    const mapper = new (await import('#mappers/invoice/InvoiceCustomerMapper')).default();

    // Test mapping for person type
    const personModelData =
      mapper.mapInvoiceCustomerTypeToInvoiceCustomerModel(invoicePersonCustomerData);
    assert.equal(personModelData.userId, invoicePersonCustomerData.userId);
    assert.equal(personModelData.firstName, invoicePersonCustomerData.firstName);
    assert.equal(personModelData.lastName, invoicePersonCustomerData.lastName);
    assert.equal(personModelData.customerType, invoicePersonCustomerData.customerType);
    assert.equal(personModelData.streetName, invoicePersonCustomerData.address.streetName);
    assert.equal(personModelData.streetNumber, invoicePersonCustomerData.address.streetNumber);
    assert.equal(personModelData.city, invoicePersonCustomerData.address.city);
    assert.equal(personModelData.postalCode, invoicePersonCustomerData.address.postalCode);
    assert.equal(personModelData.countryCode, invoicePersonCustomerData.address.countryCode);
    assert.isUndefined(
      personModelData.companyName,
      'Company name should be undefined for person type'
    );
    assert.isUndefined(personModelData.taxId, 'Tax ID should be undefined for person type');
  });
});
