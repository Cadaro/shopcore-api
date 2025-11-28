import TokenService from '#services/token_service';
import { generateRoleUser } from '#tests/data/users/roleUser';
import { CreateUser } from '#tests/data/users/user';
import { IResponseError } from '#types/response';
import { Token } from '#types/token';
import { UserCreatedDto, UserData } from '#types/user';
import { test } from '@japa/runner';
import { randomUUID } from 'crypto';

test.group('UsersController store', () => {
  test('should create a new user successfully', async ({ client, assert }) => {
    const uniqueEmail = `${randomUUID()}@example.com`;
    const newUserData = {
      email: uniqueEmail,
      password: 'Test123!',
      firstName: 'John',
      lastName: 'Doe',
    };

    const response = await client.post('/api/auth/users').json(newUserData);

    response.assertStatus(201);
    const body: UserCreatedDto = response.body();
    assert.properties(body, ['userId']);
    assert.isString(body.userId);
  });

  test('should create a user without optional firstName and lastName', async ({
    client,
    assert,
  }) => {
    const uniqueEmail = `${randomUUID()}@example.com`;
    const newUserData = {
      email: uniqueEmail,
      password: 'Test123!',
    };

    const response = await client.post('/api/auth/users').json(newUserData);

    response.assertStatus(201);
    const body: UserCreatedDto = response.body();
    assert.properties(body, ['userId']);
    assert.isString(body.userId);
  });

  test('should return error when creating user with duplicate email', async ({ client, assert }) => {
    const uniqueEmail = `${randomUUID()}@example.com`;
    const userData = {
      email: uniqueEmail,
      password: 'Test123!',
      firstName: 'John',
      lastName: 'Doe',
    };

    // Create first user
    const firstResponse = await client.post('/api/auth/users').json(userData);
    firstResponse.assertStatus(201);

    // Try to create second user with the same email
    const secondResponse = await client.post('/api/auth/users').json(userData);
    secondResponse.assertStatus(400);

    const body: IResponseError = secondResponse.body();
    assert.properties(body, ['errors']);
    assert.isArray(body.errors);
    assert.isTrue(body.errors.length > 0);
    assert.include(body.errors[0].message, uniqueEmail);
    assert.include(body.errors[0].message, 'already exists');
  });

  test('should return validation error for invalid email format', async ({ client }) => {
    const userData = {
      email: 'invalid-email',
      password: 'Test123!',
    };

    const response = await client.post('/api/auth/users').json(userData);
    response.assertStatus(422);
  });

  test('should return validation error when email is missing', async ({ client }) => {
    const userData = {
      password: 'Test123!',
    };

    const response = await client.post('/api/auth/users').json(userData);
    response.assertStatus(422);
  });

  test('should return validation error when password is missing', async ({ client }) => {
    const userData = {
      email: `${randomUUID()}@example.com`,
    };

    const response = await client.post('/api/auth/users').json(userData);
    response.assertStatus(422);
  });

  test('should return validation error when firstName is too short', async ({ client }) => {
    const userData = {
      email: `${randomUUID()}@example.com`,
      password: 'Test123!',
      firstName: 'Jo', // minLength is 3
    };

    const response = await client.post('/api/auth/users').json(userData);
    response.assertStatus(422);
  });

  test('should return validation error when lastName is too short', async ({ client }) => {
    const userData = {
      email: `${randomUUID()}@example.com`,
      password: 'Test123!',
      lastName: 'D', // minLength is 2
    };

    const response = await client.post('/api/auth/users').json(userData);
    response.assertStatus(422);
  });
});

test.group('UsersController index', () => {
  test('should return user data for authenticated user', async ({ client, assert }) => {
    const user = await new CreateUser(generateRoleUser()).create();
    const tokenService = new TokenService();
    const token = await tokenService.createToken(user);

    const response = await client.get('/api/auth/users').bearerToken(token.token);

    response.assertStatus(200);
    const body: UserData = response.body();
    assert.properties(body, ['userId', 'email', 'createdAt', 'updatedAt']);
    assert.equal(body.userId, user.uuid);
    assert.equal(body.email, user.email);
  });

  test('should return 401 for unauthenticated request', async ({ client }) => {
    const response = await client.get('/api/auth/users');
    response.assertStatus(401);
  });

  test('should return 401 for invalid token', async ({ client }) => {
    const response = await client.get('/api/auth/users').bearerToken('invalid-token');
    response.assertStatus(401);
  });
});

test.group('UsersController update', () => {
  test('should update user data successfully with firstName and lastName', async ({ client }) => {
    const user = await new CreateUser(generateRoleUser()).create();
    const tokenService = new TokenService();
    const token = await tokenService.createToken(user);

    const updateData = {
      firstName: 'UpdatedFirst',
      lastName: 'UpdatedLast',
    };

    const response = await client
      .patch('/api/auth/users')
      .bearerToken(token.token)
      .json(updateData);

    response.assertStatus(204);
  });

  test('should update user data successfully with only firstName', async ({ client }) => {
    const user = await new CreateUser(generateRoleUser()).create();
    const tokenService = new TokenService();
    const token = await tokenService.createToken(user);

    const updateData = {
      firstName: 'UpdatedFirst',
    };

    const response = await client
      .patch('/api/auth/users')
      .bearerToken(token.token)
      .json(updateData);

    response.assertStatus(204);
  });

  test('should update user data successfully with only lastName', async ({ client }) => {
    const user = await new CreateUser(generateRoleUser()).create();
    const tokenService = new TokenService();
    const token = await tokenService.createToken(user);

    const updateData = {
      lastName: 'UpdatedLast',
    };

    const response = await client
      .patch('/api/auth/users')
      .bearerToken(token.token)
      .json(updateData);

    response.assertStatus(204);
  });

  test('should return error when neither firstName nor lastName is provided', async ({
    client,
    assert,
  }) => {
    const user = await new CreateUser(generateRoleUser()).create();
    const tokenService = new TokenService();
    const token = await tokenService.createToken(user);

    const response = await client.patch('/api/auth/users').bearerToken(token.token).json({});

    response.assertStatus(400);
    const body = response.body();
    assert.include(body.message, 'At least one of firstName or lastName must be provided');
  });

  test('should return 401 for unauthenticated request', async ({ client }) => {
    const updateData = {
      firstName: 'UpdatedFirst',
    };

    const response = await client.patch('/api/auth/users').json(updateData);
    response.assertStatus(401);
  });

  test('should return validation error when firstName is too short', async ({ client }) => {
    const user = await new CreateUser(generateRoleUser()).create();
    const tokenService = new TokenService();
    const token = await tokenService.createToken(user);

    const updateData = {
      firstName: 'Jo', // minLength is 3
    };

    const response = await client
      .patch('/api/auth/users')
      .bearerToken(token.token)
      .json(updateData);

    response.assertStatus(400);
  });

  test('should return validation error when lastName is too short', async ({ client }) => {
    const user = await new CreateUser(generateRoleUser()).create();
    const tokenService = new TokenService();
    const token = await tokenService.createToken(user);

    const updateData = {
      lastName: 'D', // minLength is 2
    };

    const response = await client
      .patch('/api/auth/users')
      .bearerToken(token.token)
      .json(updateData);

    response.assertStatus(400);
  });

  test('should return validation error when firstName is too long', async ({ client }) => {
    const user = await new CreateUser(generateRoleUser()).create();
    const tokenService = new TokenService();
    const token = await tokenService.createToken(user);

    const updateData = {
      firstName: 'A'.repeat(51), // maxLength is 50
    };

    const response = await client
      .patch('/api/auth/users')
      .bearerToken(token.token)
      .json(updateData);

    response.assertStatus(400);
  });

  test('should return validation error when lastName is too long', async ({ client }) => {
    const user = await new CreateUser(generateRoleUser()).create();
    const tokenService = new TokenService();
    const token = await tokenService.createToken(user);

    const updateData = {
      lastName: 'B'.repeat(51), // maxLength is 50
    };

    const response = await client
      .patch('/api/auth/users')
      .bearerToken(token.token)
      .json(updateData);

    response.assertStatus(400);
  });
});

test.group('UsersController token authentication', () => {
  test('should get token for existing user', async ({ client, assert }) => {
    const uniqueEmail = `${randomUUID()}@example.com`;
    const password = 'Test123!';
    const userData = {
      email: uniqueEmail,
      password: password,
    };

    // Create user first
    await client.post('/api/auth/users').json(userData);

    // Get token
    const response = await client.post('/api/auth/token').json({
      email: uniqueEmail,
      password: password,
    });

    response.assertStatus(200);
    const body: Token = response.body();
    assert.properties(body, ['token', 'type', 'expiresAt']);
    assert.isString(body.token);
  });
});
