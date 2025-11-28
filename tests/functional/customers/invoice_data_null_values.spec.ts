import InvoiceCustomers from '#models/invoice_customer';
import User from '#models/user';
import TokenService from '#services/token_service';
import { generateRoleUser } from '#tests/data/users/roleUser';
import { CreateUser } from '#tests/data/users/user';
import { CountryCode } from '#types/enum/countryCode';
import { InvoiceCustomerData, InvoiceCustomerTypeEnum } from '#types/invoice';
import { test } from '@japa/runner';

test.group('Customers invoice data null values handling', (group) => {
  let user: User;

  group.setup(async () => {
    user = await new CreateUser(generateRoleUser()).create();

    // Create initial invoice data with optional fields
    await InvoiceCustomers.create({
      userId: user.uuid,
      customerType: InvoiceCustomerTypeEnum.PERSON,
      firstName: 'John',
      lastName: 'Doe',
      streetName: 'Main Street',
      streetNumber: '123',
      apartmentNumber: '5A', // Initially has apartment number
      city: 'Test City',
      postalCode: '12-345',
      region: 'Test Region', // Initially has region
      countryCode: CountryCode.PL,
    });
  });

  test('should remove optional fields when not provided in update', async ({ client, assert }) => {
    const tokenService = new TokenService();
    const token = await tokenService.createToken(user);

    // First, verify the initial data has optional fields
    const initialResponse = await client
      .get('/api/customers/invoice-data')
      .bearerToken(token.token);

    initialResponse.assertStatus(200);
    const initialData = initialResponse.body();
    assert.equal(initialData.address.apartmentNumber, '5A');
    assert.equal(initialData.address.region, 'Test Region');

    // Update without providing optional fields
    const updateData: InvoiceCustomerData = {
      customerType: InvoiceCustomerTypeEnum.PERSON,
      firstName: 'John',
      lastName: 'Doe',
      address: {
        streetName: 'Main Street',
        streetNumber: '123',
        city: 'Test City',
        postalCode: '12-345',
        countryCode: CountryCode.PL,
        // Note: apartmentNumber and region are NOT provided
      },
    };

    const updateResponse = await client
      .put('/api/customers/invoice-data')
      .json(updateData)
      .bearerToken(token.token);

    updateResponse.assertStatus(204);

    // Verify the optional fields are now null/undefined
    const updatedResponse = await client
      .get('/api/customers/invoice-data')
      .bearerToken(token.token);

    updatedResponse.assertStatus(200);
    const updatedData: InvoiceCustomerData = updatedResponse.body();

    // Optional fields should not be present in the response when they are null
    assert.isUndefined(updatedData.address.apartmentNumber);
    assert.isUndefined(updatedData.address.region);

    // Verify in database that the fields are actually null
    const dbRecord = await InvoiceCustomers.findBy('userId', user.uuid);
    assert.isEmpty(dbRecord!.apartmentNumber);
    assert.isEmpty(dbRecord!.region);
  });

  test('should preserve optional fields when provided in update', async ({ client, assert }) => {
    const tokenService = new TokenService();
    const token = await tokenService.createToken(user);

    // Update with new optional field values
    const updateData: InvoiceCustomerData = {
      customerType: InvoiceCustomerTypeEnum.PERSON,
      firstName: 'John',
      lastName: 'Doe',
      address: {
        streetName: 'New Street',
        streetNumber: '456',
        apartmentNumber: '10B', // New apartment number
        city: 'New City',
        postalCode: '54-321',
        region: 'New Region', // New region
        countryCode: CountryCode.PL,
      },
    };

    const updateResponse = await client
      .put('/api/customers/invoice-data')
      .json(updateData)
      .bearerToken(token.token);

    updateResponse.assertStatus(204);

    // Verify the optional fields are updated
    const updatedResponse = await client
      .get('/api/customers/invoice-data')
      .bearerToken(token.token);

    updatedResponse.assertStatus(200);
    const updatedData = updatedResponse.body();

    assert.equal(updatedData.address.apartmentNumber, '10B');
    assert.equal(updatedData.address.region, 'New Region');

    // Verify in database
    const dbRecord = await InvoiceCustomers.findBy('userId', user.uuid);
    assert.equal(dbRecord!.apartmentNumber, '10B');
    assert.equal(dbRecord!.region, 'New Region');
  });
});
