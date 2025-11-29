import { Token } from '#types/token';
import { test } from '@japa/runner';

const userAuthData = { email: 'test@example.com', password: 'Test123' };
test.group('Edit user', () => {
  test('edit user data with given firstName and lastName', async ({ client }) => {
    const responseAuth = await client.post('/api/auth/token').json(userAuthData);
    const authToken: Token = responseAuth.body();

    const userDataToEdit = { firstName: 'testName', lastName: 'testLastName' };

    const responseEdit = await client
      .patch(`/api/auth/users/`)
      .bearerToken(authToken.token)
      .header('content-type', 'application/json')
      .json(userDataToEdit);
    responseEdit.assertStatus(204);
  });
  test('edit user data without given firstName and lastName', async ({ client }) => {
    const responseAuth = await client.post('/api/auth/token').json(userAuthData);
    const authToken: Token = responseAuth.body();

    const responseEdit = await client
      .patch(`/api/auth/users/`)
      .bearerToken(authToken.token)
      .header('content-type', 'application/json');
    responseEdit.assertStatus(400);
  });
});
