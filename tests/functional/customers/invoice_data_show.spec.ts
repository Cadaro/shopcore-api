import InvoiceCustomers from '#models/invoice_customer';
import User from '#models/user';
import TokenService from '#services/token_service';
import { generateRoleUser } from '#tests/data/users/roleUser';
import { CreateUser } from '#tests/data/users/user';
import { CountryCode } from '#types/enum/countryCode';
import { InvoiceCustomerData, InvoiceCustomerTypeEnum } from '#types/invoice';
import { test } from '@japa/runner';

test.group('Customers invoice data show', (group) => {
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
  test('get invoice data for customer of type person', async ({ client, assert }) => {
    // Use TokenService to create a proper token with correct abilities
    const tokenService = new TokenService();
    const token = await tokenService.createToken(userWithPersonData);
    const response = await client.get('/api/customers/invoice-data').bearerToken(token.token);

    response.assertStatus(200);

    const body = response.body() as InvoiceCustomerData;

    // For person type, firstName and lastName should be present
    assert.exists(body.firstName, 'First name should be present for person type');
    assert.isString(body.firstName, 'First name should be a string');
    assert.equal(body.firstName, 'John', 'First name should match expected value');
    assert.exists(body.lastName, 'Last name should be present for person type');
    assert.isString(body.lastName, 'Last name should be a string');
    assert.equal(body.lastName, 'Doe', 'Last name should match expected value');

    // Customer type should be person
    assert.equal(
      body.customerType,
      InvoiceCustomerTypeEnum.PERSON,
      'Customer type should be person'
    );

    // Address is required
    assert.exists(body.address, 'Address should be present');
    assert.isObject(body.address, 'Address should be an object');
    assert.exists(body.address.streetName, 'Street name should be present');
    assert.exists(body.address.streetNumber, 'Street number should be present');
    assert.exists(body.address.city, 'City should be present');
    assert.exists(body.address.postalCode, 'Postal code should be present');
    assert.exists(body.address.countryCode, 'Country code should be present');

    // Company fields should not be present for person type
    assert.isUndefined(body.companyName, 'Company name should not be present for person type');
    assert.isUndefined(body.taxId, 'Tax ID should not be present for person type');
  });

  test('get invoice data for customer of type company', async ({ client, assert }) => {
    // Use TokenService to create a proper token with correct abilities
    const tokenService = new TokenService();
    const token = await tokenService.createToken(userWithCompanyData);
    const response = await client.get('/api/customers/invoice-data').bearerToken(token.token);

    response.assertStatus(200);

    const body = response.body() as InvoiceCustomerData;

    // For company type, companyName and taxId should be present
    assert.exists(body.companyName, 'Company name should be present for company type');
    assert.isString(body.companyName, 'Company name should be a string');
    assert.equal(body.companyName, 'Acme Corp', 'Company name should match expected value');
    assert.exists(body.taxId, 'Tax ID should be present for company type');
    assert.isString(body.taxId, 'Tax ID should be a string');
    assert.equal(body.taxId, '123-456-78-90', 'Tax ID should match expected value');

    // Customer type should be company
    assert.equal(
      body.customerType,
      InvoiceCustomerTypeEnum.COMPANY,
      'Customer type should be company'
    );

    // Address is required
    assert.exists(body.address, 'Address should be present');
    assert.isObject(body.address, 'Address should be an object');
    assert.exists(body.address.streetName, 'Street name should be present');
    assert.exists(body.address.streetNumber, 'Street number should be present');
    assert.exists(body.address.city, 'City should be present');
    assert.exists(body.address.postalCode, 'Postal code should be present');
    assert.exists(body.address.countryCode, 'Country code should be present');

    // Person fields should not be present for company type
    assert.isUndefined(body.firstName, 'First name should not be present for company type');
    assert.isUndefined(body.lastName, 'Last name should not be present for company type');
  });

  test('users can only access their own invoice data', async ({ client, assert }) => {
    // Use TokenService to create a proper token with correct abilities
    const tokenService = new TokenService();
    const personToken = await tokenService.createToken(userWithPersonData);
    const companyToken = await tokenService.createToken(userWithCompanyData);

    // Test that person user gets their own data
    const personResponse = await client
      .get('/api/customers/invoice-data')
      .bearerToken(personToken.token);
    personResponse.assertStatus(200);
    const personBody = personResponse.body() as InvoiceCustomerData;
    assert.equal(personBody.customerType, InvoiceCustomerTypeEnum.PERSON);
    assert.equal(personBody.firstName, invoicePersonCustomerData.firstName);
    assert.equal(personBody.lastName, invoicePersonCustomerData.lastName);

    // Test that company user gets their own data
    const companyResponse = await client
      .get('/api/customers/invoice-data')
      .bearerToken(companyToken.token);
    companyResponse.assertStatus(200);
    const companyBody = companyResponse.body() as InvoiceCustomerData;
    assert.equal(companyBody.customerType, InvoiceCustomerTypeEnum.COMPANY);
    assert.equal(companyBody.companyName, invoiceCompanyCustomerData.companyName);
    assert.equal(companyBody.taxId, invoiceCompanyCustomerData.taxId);

    // Verify that the addresses are different (showing they're different users)
    assert.notEqual(personBody.address.streetName, companyBody.address.streetName);
    assert.notEqual(personBody.address.city, companyBody.address.city);
  });

  test('unauthenticated users cannot access invoice data', async ({ client }) => {
    const response = await client.get('/api/customers/invoice-data');
    response.assertStatus(401);
  });
});
